#!/usr/bin/env python3
"""
HTTP client for synchronous watsonx Orchestrate agent calls.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional

import requests


DEFAULT_TOKEN_TTL_SECONDS = 300
TOKEN_EXPIRY_SKEW_SECONDS = 30

_cached_bearer_token: Optional[str] = None
_cached_bearer_token_expires_at: float = 0.0


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_timeout_seconds() -> float:
    return float(os.getenv("WXO_TIMEOUT_SECONDS", "60"))


def build_agent_url() -> str:
    base_url = require_env("WXO_INSTANCE_URL").rstrip("/")
    agent_ref = require_env("WXO_AGENT_ID_OR_NAME")
    return f"{base_url}/v1/orchestrate/{agent_ref}/chat/completions"


def is_cached_token_valid() -> bool:
    return bool(_cached_bearer_token) and time.time() < _cached_bearer_token_expires_at


def exchange_api_key_for_bearer_token() -> str:
    """Obtain bearer token from API key"""
    API_KEY = require_env("WXO_API_KEY")
    WXO_INSTANCE_CLOUD = require_env("WXO_INSTANCE_CLOUD")
    if WXO_INSTANCE_CLOUD == "aws":
        url = "https://iam.platform.saas.ibm.com/siusermgr/api/1.0/apikeys/token"

        headers = {
            "accept": "application/json",
            "content-type": "application/json"
        }
        data = {
            "apikey": API_KEY
        }
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response_json = response.json()
        token = response_json.get("token")
    elif WXO_INSTANCE_CLOUD =="ibmcloud":
        api_url_token = 'https://iam.cloud.ibm.com/identity/token'
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        payload = f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={API_KEY}"
        response = requests.post(url=api_url_token, headers=headers, data=payload)
        if response.status_code != 200:
            raise Exception("Non-200 response: " + str(response.text))
        response_json = response.json()
        token = response_json["access_token"]
    expires_in = response_json.get("expires_in")
    ttl_seconds = DEFAULT_TOKEN_TTL_SECONDS
    if expires_in is not None:
        ttl_seconds = max(int(expires_in) - TOKEN_EXPIRY_SKEW_SECONDS, 1)

    global _cached_bearer_token, _cached_bearer_token_expires_at
    _cached_bearer_token = token
    _cached_bearer_token_expires_at = time.time() + ttl_seconds
    return token

    
def get_bearer_token() -> str:
    if is_cached_token_valid():
        return _cached_bearer_token  # type: ignore[return-value]
    return exchange_api_key_for_bearer_token()


def build_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {get_bearer_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def build_chat_request(agent_payload: Dict[str, Any], thread_id: Optional[str] = None) -> Dict[str, Any]:
    request_body: Dict[str, Any] = {
        "messages": [
            {
                "role": "user",
                "content": json.dumps(agent_payload, separators=(",", ":"), ensure_ascii=False),
            }
        ],
        "stream": False,
    }

    if thread_id:
        request_body["thread_id"] = thread_id

    return request_body


def _strip_markdown_fence(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```") and stripped.endswith("```"):
        stripped = "\n".join(stripped.splitlines()[1:-1]).strip()
        if stripped.lower().startswith("json"):
            stripped = stripped[4:].strip()
    return stripped


def _extract_first_json_object(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False

    for index in range(start, len(text)):
        char = text[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]

    return None


def _parse_agent_content(content: str) -> Dict[str, Any]:
    stripped = _strip_markdown_fence(content)

    candidates = [stripped]
    extracted = _extract_first_json_object(stripped)
    if extracted and extracted != stripped:
        candidates.append(extracted)

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed

    preview = " ".join(stripped.split())[:240]
    raise ValueError(f"Agent returned non-JSON content: {preview}")


def extract_agent_payload(response_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize likely watsonx Orchestrate response shapes to the final inventory payload.
    """
    choices = response_json.get("choices")
    if isinstance(choices, list) and choices:
        first_choice = choices[0]
        if isinstance(first_choice, dict):
            message = first_choice.get("message")
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, dict):
                    return content
                if isinstance(content, str):
                    return _parse_agent_content(content)

    if isinstance(response_json.get("response"), dict):
        return response_json["response"]

    if isinstance(response_json.get("result"), dict):
        return response_json["result"]

    if isinstance(response_json.get("output"), dict):
        return response_json["output"]

    if isinstance(response_json.get("message"), dict):
        return response_json["message"]

    if isinstance(response_json.get("data"), dict):
        return response_json["data"]

    return response_json


def call_agent_sync(agent_payload: Dict[str, Any], thread_id: Optional[str] = None) -> Dict[str, Any]:
    response = requests.post(
        build_agent_url(),
        headers=build_headers(),
        json=build_chat_request(agent_payload, thread_id=thread_id),
        timeout=get_timeout_seconds(),
    )
    response.raise_for_status()
    response_json = response.json()
    return extract_agent_payload(response_json)

# Made with Bob