# wxO LangGraph — agent.yaml, requirements.txt & Project Layout

## Directory layout

Simple flat layout (minimal):
```
agents/my_agent/
├── agent.py          ← create_agent() factory + graph logic
├── agent.yaml        ← wxO agent specification
└── requirements.txt  ← pinned Python dependencies
```

Multi-module layout (complex agents):
```
agents/my_agent/
├── agent.yaml
├── agent.py           ← create_agent() entry point
├── requirements.txt
├── core/
│   ├── __init__.py
│   ├── state.py       ← AgentState definition
│   └── config.py
├── tools/
│   ├── __init__.py
│   └── api_tools.py   ← @lc_tool definitions
└── utils/
    ├── __init__.py
    └── logging.py
```

> The `agent.yaml` must be at the root of the package. If a ZIP contains a single top-level directory, the import process flattens it automatically.

Import command (run from project root):

```bash
orchestrate agents import \
  --package-root agents/my_agent \
  --config-file agents/my_agent/agent.yaml
```

## agent.yaml — full annotated reference

```yaml
spec_version: v1
kind: agent               # NOT "native" — always "agent" for LangGraph imports
name: my_agent            # snake_case — used in orchestrate agents list
title: My Agent           # human-readable display name
description: |
  Clear description of what this agent does.
  Used by supervisor/orchestrator agents for routing — write it well.

framework: langgraph      # required: tells wxO this is a LangGraph agent

deployment:
  code_bundle:
    entrypoint: "agent:create_agent"
    # Format: "python_module_name:factory_function_name"
    # "agent" = agent.py (without .py extension)
    # "create_agent" = the factory function name inside that file

# Checkpointer — choose one (omit entirely for fully stateless agent):
checkpointer:
  type: memory            # dev/testing — resets when pod restarts
  # type: sqlite          # add langgraph-checkpoint-sqlite to requirements.txt
  # type: postgres        # production — add langgraph-checkpoint-postgres==3.0.5
  # connection_string_key: db_connection_string   # postgres only

# Connections — auto-mapped on import (ADK 2.11.0+)
# Credentials injected as env vars: {app_id}_{credential_key}
connections:
  global_requirements:
    required_app_ids:
      - my_api_connection
```

## requirements.txt rules

```
# Minimum platform version: langgraph>=0.6.0 (required for native async streaming).
# Pin exact versions for reproducibility — wxO validates against a tenant allowlist.
# NEVER include ibm-watsonx-orchestrate (platform-managed).
# NEVER include .venv or any local path.

langgraph==1.1.10          # must be >=0.6.0
langgraph-checkpoint==4.0.3
langchain-core==1.3.3

# Add as needed:
# langchain-openai==0.3.22              ← ChatOpenAI / any OpenAI-compatible API
# langchain==1.2.17                     ← ToolNode and prebuilt utilities
# ibm-watsonx-orchestrate-sdk           ← ChatWxO, memory, context compression
# langgraph-checkpoint-sqlite           ← sqlite checkpointer
# langgraph-checkpoint-postgres         ← postgres checkpointer (production)
```

## The required entry point

```python
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph

def create_agent(config: RunnableConfig) -> StateGraph:
    """
    wxO calls this at agent startup and injects a RunnableConfig containing:
      - execution_context.access_token   — for authenticating SDK calls to wxO
      - execution_context.thread_id      — identifies the current conversation thread
      - execution_context.api_proxy_url  — base URL for Agentic SDK API calls

    Must return an UNCOMPILED StateGraph — wxO compiles and manages it.
    """
    graph = StateGraph(AgentState)
    # ... add nodes and edges ...
    return graph   # ← UNCOMPILED, always
```

## The minimal AgentState

Only `messages` is guaranteed to persist between turns in wxO.

```python
from typing import Annotated, List, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    # add_messages reducer APPENDS new messages — returning {"messages": [msg]}
    # appends msg rather than replacing the whole list.
```

## Connections — credential access

### Env var naming convention

```
{connection_app_id}_{credential_type}
```

Examples:
- `app_id="news_api"`, credential type `api_key` → `news_api_api_key`
- `app_id="groq_connection"`, credential type `api_key` → `groq_connection_api_key`
- `app_id="my_db"`, credential type `bearer` → `my_db_bearer`

### Supported credential types

`api_key` · `basic` · `bearer` · `key_value` · `oauth_auth_client_credentials_flow` · `oauth_auth_code_flow` · `oauth_auth_implicit_flow` · `oauth_auth_on_behalf_of_flow` · `oauth_auth_password_flow`

### Two ways to read credentials in agent code

**Option A — via `os.environ` (simple, works for any credential type):**
```python
import os
api_key = os.environ.get("my_api_api_key", "")
if not api_key:
    return {"messages": [AIMessage(content="⚠️ my_api connection not configured.")]}
```

**Option B — via `config` (official IBM docs pattern, same values):**
```python
credentials = config.get("configurable", {}).get("credentials", {})
api_key = credentials.get("my_api_api_key")
if not api_key:
    raise ValueError("my_api connection not configured.")
```

Both patterns access the same injected values. Use whichever fits your code style.

### Setup commands (for `key_value` credential type)
```bash
orchestrate connections add -a my_api
orchestrate connections configure -a my_api --env draft -t team -k key_value
orchestrate connections set-credentials -a my_api --env draft -e api_key=$MY_API_KEY
```

## Checkpointer reference

| Type | Survives pod restart | Extra dependency | Best for |
|---|---|---|---|
| *(omit)* | ❌ | None | Fully stateless |
| `memory` | ❌ | None | Dev / testing |
| `sqlite` | ❌ | `langgraph-checkpoint-sqlite` | Single-instance staging |
| `postgres` | ✅ | `langgraph-checkpoint-postgres` | Production |

PostgreSQL connection setup:
> ⚠️ Use credential type `api_key` (not `key_value`) — the PostgreSQL connection string is stored as the API key value.

```bash
orchestrate connections add -a pg_db
orchestrate connections configure -a pg_db --env draft -t team -k api_key
orchestrate connections set-credentials -a pg_db --env draft \
  -e api_key="postgresql://user:password@host:5432/dbname"
```

## Agentic SDK client modes

```python
from ibm_watsonx_orchestrate_sdk import Client

# Inside wxO runtime (runs-on) — always use this in package imports
client = Client.from_runnable_config(config)

# External service calling wxO APIs (runs-elsewhere)
client = Client(api_key="...", instance_url="https://your-instance.watson-orchestrate.ibm.com")

# Developer Edition local testing
client = Client(instance_url="http://localhost:4321", local=True)
```

## ChatWxO quick reference

```python
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO

llm = ChatWxO.from_runnable_config(config=config, model="groq/openai/gpt-oss-120b")

llm.invoke(messages)                 # single synchronous call
llm.stream(messages)                 # streaming response
llm.bind_tools([tool1, tool2])       # enable tool-calling
llm.with_structured_output(Schema)   # structured JSON output via Pydantic
llm.batch([msg1, msg2])              # parallel batch
```

Model IDs: `groq/openai/gpt-oss-120b`, `watsonx/meta-llama/llama-3-2-90b-vision-instruct`, `watsonx/ibm/granite-3-8b-instruct`
Run `orchestrate models list` to see all available models.

## Memory types (Agentic SDK)

| Type | Use for |
|---|---|
| `preference` | "I prefer X", "my budget is Y", "I like Z" |
| `profile_fact` | Name, role, company, location |
| `conversational` | General conversation history |
| `outcome` | Task results, decisions made |
| `tool` | Tool usage patterns, procedures |

> ⚠️ Memory is **user-scoped, not agent-scoped**. `delete_all()` deletes ALL memory for that user across all agents.
