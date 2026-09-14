#!/usr/bin/env python3
"""
Validation helpers for inventory agent responses.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from jsonschema import Draft7Validator


def load_json_file(path: str) -> Dict[str, Any]:
    with open(path, encoding="utf-8") as file_handle:
        return json.load(file_handle)


def schema_path(filename: str) -> str:
    return os.path.normpath(
        os.path.join(os.path.dirname(__file__), f"../fashion-inventory-setup/schemas/{filename}")
    )


def load_response_schema() -> Dict[str, Any]:
    return load_json_file(schema_path("agent-response.schema.json"))


def validate_agent_response(payload: Dict[str, Any]) -> Dict[str, Any]:
    validator = Draft7Validator(load_response_schema())
    errors = sorted(validator.iter_errors(payload), key=lambda err: list(err.path))

    if errors:
        formatted_errors = []
        for error in errors:
            json_path = ".".join(str(part) for part in error.path) or "<root>"
            formatted_errors.append(f"{json_path}: {error.message}")
        joined_errors = "; ".join(formatted_errors)
        raise ValueError(f"Agent response failed schema validation: {joined_errors}")

    return payload

# Made with Bob