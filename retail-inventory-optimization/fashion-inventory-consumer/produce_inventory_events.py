#!/usr/bin/env python3
"""
Producer script for fashion inventory events.
Reads CSV data and produces to Kafka with current timestamps.

Usage:
    python produce_inventory_events.py --csv-file ../fashion-inventory-setup/data/test_winter_jacket_spike.csv
"""

import argparse
import csv
import logging
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, cast

from confluent_kafka.serialization import MessageField, SerializationContext, StringSerializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.json_schema import JSONSerializer
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)

LOGGER = logging.getLogger("inventory-producer")


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def format_banner(title: str, width: int = 72, fill: str = "=") -> str:
    return f" {title} ".center(width, fill)


def build_producer() -> Producer:
    return Producer(
        {
            "bootstrap.servers": require_env("KAFKA_BOOTSTRAP_SERVERS"),
            "security.protocol": "SASL_SSL",
            "sasl.mechanism": "PLAIN",
            "sasl.username": require_env("KAFKA_API_KEY"),
            "sasl.password": require_env("KAFKA_API_SECRET"),
        }
    )


def build_schema_registry_client() -> SchemaRegistryClient:
    return SchemaRegistryClient(
        {
            "url": require_env("SCHEMA_REGISTRY_URL"),
            "basic.auth.user.info": (
                f"{require_env('SCHEMA_REGISTRY_API_KEY')}:{require_env('SCHEMA_REGISTRY_API_SECRET')}"
            ),
        }
    )


def load_inventory_event_schema() -> str:
    schema_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "../fashion-inventory-setup/schemas/fashion-inventory-event.schema.json")
    )
    with open(schema_path, encoding="utf-8") as schema_file:
        return schema_file.read()


def event_to_dict(event: object, ctx: SerializationContext) -> Dict[str, Any]:
    return cast(Dict[str, Any], event)


def build_value_serializer() -> JSONSerializer:
    return JSONSerializer(
        load_inventory_event_schema(),
        build_schema_registry_client(),
        event_to_dict,
        conf={
            "auto.register.schemas": False,
            "use.latest.version": True,
        },
    )


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse ISO 8601 timestamp string to datetime object."""
    if timestamp_str.endswith('Z'):
        timestamp_str = timestamp_str[:-1] + '+00:00'
    return datetime.fromisoformat(timestamp_str)


def adjust_timestamp_to_now(original_timestamp: str, base_time: datetime, time_offset_seconds: int) -> int:
    """
    Adjust timestamp to current time while preserving relative time differences.
    
    Returns:
        Timestamp as milliseconds since epoch (BIGINT for Flink)
    """
    adjusted_time = base_time + timedelta(seconds=time_offset_seconds)
    return int(adjusted_time.timestamp() * 1000)


def csv_row_to_event(row: Dict[str, str], base_time: datetime, time_offset: int) -> Dict[str, Any]:
    """Convert CSV row to inventory event dict with adjusted timestamp."""
    
    adjusted_event_time = adjust_timestamp_to_now(row.get("eventTime", ""), base_time, time_offset)
    
    event = {
        "eventId": row["eventId"],
        "eventType": row["eventType"],
        "eventTime": adjusted_event_time,
        "storeId": row["storeId"],
        "productId": row["productId"],
        "sku": row["sku"],
        "size": row["size"],
        "color": row["color"],
        "category": row["category"],
        "quantityBefore": int(row["quantityBefore"]),
        "quantityAfter": int(row["quantityAfter"]),
        "quantityChange": int(row["quantityChange"]),
        "unitPrice": float(row["unitPrice"]),
    }
    
    # Add optional fields if present
    if row.get("brand"):
        event["brand"] = row["brand"]
    if row.get("style"):
        event["style"] = row["style"]
    if row.get("transactionId"):
        event["transactionId"] = row["transactionId"]
    if row.get("customerId"):
        event["customerId"] = row["customerId"]
    
    return event


def read_events_from_csv(csv_path: str) -> List[Dict[str, Any]]:
    """Read inventory events from CSV and adjust timestamps to current time."""
    events: List[Dict[str, Any]] = []
    base_time = datetime.now(timezone.utc)
    
    with open(csv_path, newline="", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        required_columns = {
            "eventId",
            "eventType",
            "eventTime",
            "storeId",
            "productId",
            "sku",
            "size",
            "color",
            "category",
            "quantityBefore",
            "quantityAfter",
            "quantityChange",
            "unitPrice",
        }

        if reader.fieldnames is None:
            raise ValueError("CSV file has no header row")

        missing_columns = sorted(required_columns - set(reader.fieldnames))
        if missing_columns:
            raise ValueError(f"CSV file is missing required columns: {', '.join(missing_columns)}")

        # Parse events and preserve timing
        time_offset = 0
        prev_time = None
        
        for index, row in enumerate(reader, start=1):
            current_time = parse_timestamp(row.get("eventTime", ""))
            
            if prev_time is not None:
                time_diff_seconds = int((current_time - prev_time).total_seconds())
                time_offset += time_diff_seconds
            
            event = csv_row_to_event(row, base_time, time_offset)
            events.append(event)
            prev_time = current_time

    return events


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Produce fashion inventory events from CSV to Kafka."
    )
    parser.add_argument(
        "--csv-file",
        dest="csv_file",
        required=True,
        help="Path to a CSV file containing inventory events.",
    )
    parser.add_argument(
        "--topic",
        dest="topic",
        default=None,
        help="Kafka topic to produce to (overrides KAFKA_TOPIC env var).",
    )
    parser.add_argument(
        "--send-delay",
        dest="send_delay",
        type=float,
        default=0.0,
        help="Optional delay in seconds between produced messages.",
    )
    return parser.parse_args()


def delivery_report(err, msg) -> None:
    if err is not None:
        LOGGER.error("❌ Delivery failed: %s", err)
        return
    # Silent success - only log errors


def log_startup(topic: str, total_messages: int, csv_path: str) -> None:
    LOGGER.info(
        "\n%s\nProducing %s events to topic: %s\nSource: %s\n%s",
        format_banner("FASHION INVENTORY PRODUCER"),
        total_messages,
        topic,
        csv_path,
        "=" * 72,
    )


def log_event_preview(index: int, total_events: int, payload: Dict[str, Any]) -> None:
    LOGGER.info(
        "[%d/%d] Event: %s | SKU: %s | Qty: %d→%d | Store: %s",
        index,
        total_events,
        payload.get("eventId"),
        payload.get("sku"),
        payload.get("quantityBefore"),
        payload.get("quantityAfter"),
        payload.get("storeId"),
    )


def main() -> None:
    args = parse_args()
    topic = args.topic if args.topic else require_env("KAFKA_TOPIC")
    csv_path = args.csv_file
    send_delay_seconds = args.send_delay

    producer = build_producer()
    value_serializer = build_value_serializer()
    key_serializer = StringSerializer("utf_8")
    events = read_events_from_csv(csv_path)

    log_startup(topic, len(events), csv_path)

    for index, payload in enumerate(events, start=1):
        log_event_preview(index, len(events), payload)
        producer.produce(
            topic=topic,
            key=key_serializer(payload["sku"]),
            value=value_serializer(payload, SerializationContext(topic, MessageField.VALUE)),
            callback=delivery_report,
        )
        producer.poll(0)

        if send_delay_seconds > 0 and index < len(events):
            time.sleep(send_delay_seconds)

    producer.flush()
    
    LOGGER.info("\n%s\nMessages sent: %s\n%s", format_banner("PRODUCER COMPLETE"), len(events), "=" * 72)
    LOGGER.info("\nNext steps:")
    LOGGER.info("1. Wait 1-2 minutes for Flink processing")
    LOGGER.info("2. Run: python consume_velocity_alerts.py")
    LOGGER.info("3. Check for velocity spike alerts\n")


if __name__ == "__main__":
    main()

# Made with Bob