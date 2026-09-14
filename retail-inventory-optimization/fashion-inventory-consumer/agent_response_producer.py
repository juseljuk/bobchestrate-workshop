#!/usr/bin/env python3
"""
Kafka producer helpers for publishing inventory agent responses.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from confluent_kafka import Producer


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


def build_response_producer() -> Producer:
    return Producer(build_kafka_common_config())


def get_agent_response_topic() -> str:
    return os.getenv("AGENT_RESPONSE_TOPIC", "fashion.agent.responses")


def publish_agent_response(producer: Producer, payload: Dict[str, Any]) -> None:
    topic = get_agent_response_topic()
    key = payload.get("sku")
    producer.produce(
        topic=topic,
        key=str(key) if key is not None else None,
        value=json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"),
    )
    producer.flush()

# Made with Bob