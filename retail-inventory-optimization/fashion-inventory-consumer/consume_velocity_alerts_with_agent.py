#!/usr/bin/env python3
"""
Dedicated velocity alert consumer that synchronously calls a watsonx Orchestrate agent,
validates the response, publishes the enriched response, and then commits offsets.

Usage:
    python consume_velocity_alerts_with_agent.py
"""

from __future__ import annotations

import logging
import os
import sys
from typing import Any, Dict, cast

from confluent_kafka import Consumer, KafkaError, KafkaException
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.json_schema import JSONDeserializer
from confluent_kafka.serialization import MessageField, SerializationContext, StringDeserializer
from dotenv import load_dotenv

from agent_payload_builder import build_agent_request
from agent_response_producer import build_response_producer, get_agent_response_topic, publish_agent_response
from orchestrate_client import call_agent_sync
from response_validator import validate_agent_response

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)

LOGGER = logging.getLogger("velocity-alert-agent-consumer")


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def build_kafka_common_config() -> Dict[str, Any]:
    return {
        "bootstrap.servers": require_env("KAFKA_BOOTSTRAP_SERVERS"),
        "security.protocol": "SASL_SSL",
        "sasl.mechanism": "PLAIN",
        "sasl.username": require_env("KAFKA_API_KEY"),
        "sasl.password": require_env("KAFKA_API_SECRET"),
    }


def build_consumer() -> Consumer:
    config = build_kafka_common_config()
    config.update(
        {
            "group.id": os.getenv("ALERT_CONSUMER_GROUP_ID", "velocity-alert-agent-consumer-group"),
            "auto.offset.reset": os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest"),
            "enable.auto.commit": False,
        }
    )
    return Consumer(config)


def build_schema_registry_client() -> SchemaRegistryClient:
    return SchemaRegistryClient(
        {
            "url": require_env("SCHEMA_REGISTRY_URL"),
            "basic.auth.user.info": (
                f"{require_env('SCHEMA_REGISTRY_API_KEY')}:{require_env('SCHEMA_REGISTRY_API_SECRET')}"
            ),
        }
    )


def load_velocity_alert_schema() -> str:
    schema_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "../fashion-inventory-setup/schemas/velocity-anomaly-alert.schema.json")
    )
    with open(schema_path, encoding="utf-8") as schema_file:
        return schema_file.read()


def velocity_alert_from_dict(data: object, ctx: SerializationContext) -> Dict[str, Any]:
    return cast(Dict[str, Any], data)


def build_value_deserializer() -> JSONDeserializer:
    return JSONDeserializer(
        load_velocity_alert_schema(),
        from_dict=velocity_alert_from_dict,
    )


def format_banner(title: str, width: int = 72, fill: str = "=") -> str:
    return f" {title} ".center(width, fill)


def summarize_velocity(payload: Dict[str, Any]) -> str:
    velocity_ratio = payload.get("velocityAnalysis", {}).get("velocityRatio", 0)
    return f"{velocity_ratio:.1f}x baseline"


def summarize_stock_risk(payload: Dict[str, Any]) -> str:
    stock_analysis = payload.get("stockAnalysis", {}) or {}
    current_stock = stock_analysis.get("currentStock", 0)
    hours_to_stockout = stock_analysis.get("hoursToStockout", 0)
    return f"{current_stock} units ({hours_to_stockout:.1f} hours to stockout)"


def summarize_agent_decision(payload: Dict[str, Any]) -> str:
    decision = payload.get("agentDecision", {}) or {}
    urgency = decision.get("urgencyLevel", "UNKNOWN")
    actions = decision.get("recommendedActions", [])
    return f"{urgency} - {', '.join(actions) if actions else 'No actions'}"


def log_startup(input_topic: str, output_topic: str) -> None:
    LOGGER.info(
        "\n%s\nInput topic : %s\nOutput topic: %s\n%s",
        format_banner("VELOCITY ALERT AGENT CONSUMER"),
        input_topic,
        output_topic,
        "=" * 72,
    )


def log_processing_context(message: Any, payload: Dict[str, Any], agent_request: Dict[str, Any]) -> None:
    LOGGER.info(
        "\n%s\nAlert         : %s\nProduct       : %s\nStore         : %s\nSeverity      : %s\nVelocity      : %s\nStock         : %s\nKafka         : partition=%s offset=%s\n%s",
        format_banner("1. VELOCITY ALERT RECEIVED", fill="-"),
        payload.get("anomalyType"),
        payload.get("sku"),
        payload.get("storeId"),
        payload.get("severity"),
        summarize_velocity(agent_request),
        summarize_stock_risk(agent_request),
        message.partition(),
        message.offset(),
        "-" * 72,
    )


def log_agent_pitstop(agent_name: str) -> None:
    LOGGER.info(
        "\n%s\nAgent         : %s\nStatus        : Invoking watsonx Orchestrate and waiting for response\n%s",
        format_banner("2. AGENT REVIEWING CASE", fill="-"),
        agent_name,
        "-" * 72,
    )


def log_agent_response_received() -> None:
    LOGGER.info(
        "\n%s\nStatus        : Agent response received and schema validated\n%s",
        format_banner("3. AGENT DECISION READY", fill="-"),
        "-" * 72,
    )


def log_agent_result(payload: Dict[str, Any]) -> None:
    decision = payload.get("agentDecision", {}) or {}
    reorder = payload.get("reorderRecommendation", {}) or {}
    pricing = payload.get("pricingRecommendation", {}) or {}
    
    LOGGER.info(
        "Decision       : %s\n"
        "Urgency        : %s (score: %s)\n"
        "Actions        : %s\n"
        "Reorder        : %s units (%s priority)\n"
        "Pricing        : %s%% adjustment\n"
        "Summary        : %s",
        decision.get("urgencyLevel"),
        decision.get("urgencyLevel"),
        decision.get("urgencyScore"),
        ", ".join(decision.get("recommendedActions", [])),
        reorder.get("reorderQuantity", 0),
        reorder.get("reorderPriority", "N/A"),
        pricing.get("priceAdjustmentPercent", 0),
        decision.get("analystSummary", "No summary provided"),
    )


def log_publish_success(payload: Dict[str, Any], topic: str) -> None:
    LOGGER.info(
        "\n%s\nProduct       : %s\nOutput topic  : %s\nStatus        : Published successfully\n%s",
        format_banner("4. RESULT PUBLISHED", fill="-"),
        payload.get("sku"),
        topic,
        "-" * 72,
    )


def main() -> None:
    input_topic = os.getenv("ALERT_TOPIC", "fashion.velocity.anomalies")
    output_topic = get_agent_response_topic()
    agent_name = os.getenv("WXO_AGENT_ID_OR_NAME", "fashion-inventory-agent")

    consumer = build_consumer()
    producer = build_response_producer()
    _schema_registry_client = build_schema_registry_client()
    value_deserializer = build_value_deserializer()
    key_deserializer = StringDeserializer("utf_8")

    consumer.subscribe([input_topic])
    log_startup(input_topic, output_topic)

    try:
        while True:
            message = consumer.poll(1.0)

            if message is None:
                continue

            if message.error():
                if message.error().code() == KafkaError._PARTITION_EOF:
                    continue
                raise KafkaException(message.error())

            raw_value = message.value()
            if raw_value is None:
                LOGGER.warning("Skipping empty message at offset=%s", message.offset())
                consumer.commit(message=message)
                continue

            try:
                _message_key = key_deserializer(
                    message.key(),
                    SerializationContext(input_topic, MessageField.KEY),
                )

                payload = value_deserializer(
                    raw_value,
                    SerializationContext(input_topic, MessageField.VALUE),
                )

                if payload is None:
                    LOGGER.warning("Skipping null-deserialized message at offset=%s", message.offset())
                    consumer.commit(message=message)
                    continue

                typed_payload = cast(Dict[str, Any], payload)
                agent_request = build_agent_request(typed_payload)
                log_processing_context(message, typed_payload, agent_request)

                log_agent_pitstop(agent_name)
                agent_response = call_agent_sync(agent_request)
                validated_response = validate_agent_response(agent_response)
                log_agent_response_received()

                log_agent_result(validated_response)
                publish_agent_response(producer, validated_response)
                log_publish_success(validated_response, output_topic)

                consumer.commit(message=message)
            except Exception as exc:
                LOGGER.error(
                    "\n%s\nKafka         : partition=%s offset=%s\nStatus        : Processing failed\nReason        : %s\n%s",
                    format_banner("PROCESSING ERROR", fill="!"),
                    message.partition(),
                    message.offset(),
                    str(exc),
                    "!" * 72,
                )
    except KeyboardInterrupt:
        LOGGER.info("\n%s", format_banner("SHUTDOWN", fill="-"))
    finally:
        producer.flush()
        consumer.close()


if __name__ == "__main__":
    main()

# Made with Bob