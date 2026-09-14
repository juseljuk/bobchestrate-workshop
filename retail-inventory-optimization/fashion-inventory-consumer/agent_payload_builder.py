#!/usr/bin/env python3
"""
Helpers to convert velocity anomaly alerts into watsonx Orchestrate agent requests.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict


def epoch_millis_to_iso8601(value: Any) -> str:
    """
    Convert epoch milliseconds or passthrough ISO timestamps into ISO 8601 UTC format.
    """
    if value is None or value == "":
        return ""

    if isinstance(value, str):
        return value

    if isinstance(value, (int, float)):
        dt = datetime.fromtimestamp(float(value) / 1000.0, tz=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")

    return str(value)


def coalesce(*values: Any) -> Any:
    for value in values:
        if value is not None and value != "":
            return value
    return None


def string_or_empty(*values: Any) -> str:
    value = coalesce(*values)
    return "" if value is None else str(value)


def number_or_zero(*values: Any) -> float:
    value = coalesce(*values)
    if value is None:
        return 0.0
    return float(value)


def int_or_zero(*values: Any) -> int:
    value = coalesce(*values)
    if value is None:
        return 0
    return int(value)


def build_product_details(alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract product details from the alert.
    """
    return {
        "productName": string_or_empty(alert.get("productName"), f"{alert.get('brand', '')} {alert.get('category', '')}".strip()),
        "category": string_or_empty(alert.get("category")),
        "brand": string_or_empty(alert.get("brand")),
        "size": string_or_empty(alert.get("size")),
        "color": string_or_empty(alert.get("color")),
        "unitPrice": number_or_zero(alert.get("unitPrice")),
    }


def build_velocity_analysis(alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build the velocity analysis block for the agent.
    """
    return {
        "baselineVelocity": number_or_zero(alert.get("baselineVelocity")),
        "currentVelocity": number_or_zero(alert.get("currentVelocity")),
        "velocityRatio": number_or_zero(alert.get("velocityRatio")),
        "velocityTrend": "ACCELERATING",  # Default, agent will refine
        "durationHours": 1,  # Default, agent will calculate
        "triggerType": "UNKNOWN",  # Agent will determine
    }


def build_stock_analysis(alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build the stock analysis block for the agent.
    """
    current_stock = int_or_zero(alert.get("currentStock"))
    hours_to_stockout = number_or_zero(alert.get("hoursToStockout"))
    
    return {
        "currentStock": current_stock,
        "hoursToStockout": hours_to_stockout,
        "estimatedValue": number_or_zero(alert.get("estimatedValue")),
        "reorderPoint": None,  # Agent will determine
        "typicalStock": None,  # Agent will determine from history
    }


def build_agent_request(alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build the structured inventory alert payload to send to the watsonx Orchestrate agent.

    The consumer sends this payload as JSON text inside the agent message for a
    synchronous request/response pattern.
    """
    return {
        "alertId": string_or_empty(alert.get("alertId")),
        "anomalyType": string_or_empty(alert.get("anomalyType"), "VELOCITY_SPIKE"),
        "severity": string_or_empty(alert.get("severity"), "HIGH"),
        "timestamp": epoch_millis_to_iso8601(coalesce(alert.get("timestamp"), alert.get("eventTime"))),
        "storeId": string_or_empty(alert.get("storeId")),
        "productId": string_or_empty(alert.get("productId")),
        "sku": string_or_empty(alert.get("sku")),
        "productDetails": build_product_details(alert),
        "velocityAnalysis": build_velocity_analysis(alert),
        "stockAnalysis": build_stock_analysis(alert),
    }

# Made with Bob