# Advanced Part 1: Building Custom LangGraph Agents for watsonx Orchestrate

**Duration:** 60–75 minutes  
**Difficulty:** ⭐⭐⭐ Advanced  
**Prerequisites:** wxO SaaS account, ADK CLI (`pip install ibm-watsonx-orchestrate`), Python 3.11+, `uv`, IBM Bob IDE, basic Python knowledge

---

## Overview

This part teaches you to build **fully custom LangGraph agents** that run natively inside watsonx Orchestrate. You'll go from a minimal "Hello World" graph to a production-ready agent with LLM tool-calling, external API credentials, in-session state persistence, and cross-session user memory.

### What You'll Build

A **Product Research Agent** that:

- Uses a wxO-managed LLM via `ChatWxO` to reason and respond
- Calls tools (product search + live news headlines) using LangChain's tool-calling interface
- Reads API credentials securely from a wxO Connection (no hardcoded secrets)
- Persists conversation state within a session using a checkpointer
- Remembers user preferences across completely separate sessions using the Agentic SDK memory API
- Compresses long conversation histories to stay within model token limits

### Why LangGraph on wxO?

| Use LangGraph when... | Use a native wxO agent when... |
|---|---|
| You need custom graph topology (loops, complex branching, parallel nodes) | The task is simple tool-calling |
| You're bringing an existing LangGraph codebase to wxO | You want YAML-first authoring |
| You need fine-grained control over the reasoning loop | Speed and cost matter most |
| You have custom state logic within a session | The built-in agent styles work fine |

> **Don't over-engineer:** A native wxO agent with `react_core` style handles the majority of tool-calling use cases better, cheaper, and faster than a custom LangGraph agent. Use LangGraph when you genuinely need what it provides.

---

## wxO LangGraph Limitations (Read First)

These are hard platform constraints — not bugs, not things to work around with hacks.

| Limitation | Detail |
|---|---|
| **Python only** | TypeScript/JavaScript LangGraph is not supported |
| **Only `messages` persists between turns** | Custom state fields reset every turn — only `messages: Annotated[List[BaseMessage], add_messages]` survives |
| **Package size ≤ 50 MB compressed** | Exclude `.venv/` from the package root |
| **Runs inside wxO runtime** | Outbound calls require wxO Connections for credentials |
| **No direct database access** | Persistent state across restarts needs PostgreSQL via a wxO connection |
| **SQLite resets on pod restart** | Use PostgreSQL for production persistence |

---

## Architecture

```
wxO Chat UI
    │
    ▼  (A2A protocol — handled by wxO automatically)
wxO Runtime
    │
    ▼  create_agent(config: RunnableConfig) ← your factory function
StateGraph.compile().invoke({"messages": [...]})
    │
    ├─ agent_node  ──── ChatWxO ──── wxO AI Gateway ──── LLM
    │                │
    │                └─ ibm_watsonx_orchestrate_sdk
    │                       ├─ client.memory.search()   (cross-session memory)
    │                       └─ client.context.compress() (context compression)
    │
    └─ tool_node  ──── search_products()
                  └─── get_news_headlines()  ──── news_api connection (env var)
```

---

## Section 0 — What is LangGraph? (10 min)

LangGraph is an open-source Python (and TypeScript) library for building **stateful, graph-based agent workflows**. It models agent logic as a directed graph of nodes and edges:

- **Node:** A Python function that receives the current `state` and returns an updated `state`
- **Edge:** A directed connection from one node to another
- **Conditional edge:** A function that inspects state and dynamically chooses the next node
- **`AgentState`:** A typed dictionary (`TypedDict`) that flows through the graph
- **`START` / `END`:** Special sentinels marking graph entry and exit points

### The minimal pattern

```python
from typing import Annotated, List, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.runnables.config import RunnableConfig

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

def my_node(state: AgentState) -> AgentState:
    # read state, do work, return updated state
    return {"messages": [...]}

def create_agent(config: RunnableConfig) -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("my_node", my_node)
    graph.add_edge(START, "my_node")
    graph.add_edge("my_node", END)
    return graph   # ← return UNCOMPILED; wxO compiles it
```

The `create_agent(config: RunnableConfig) -> StateGraph` function is the **required entry point** for all wxO LangGraph agents. wxO calls it at startup with a `RunnableConfig` containing the runtime execution context.

---

## Section 1 — Architecture & the RunnableConfig Contract (10 min)

### How wxO runs a LangGraph agent

1. You package your agent directory and import it with `orchestrate agents import --package-root`
2. wxO uploads, zips, and deploys the package inside its runtime environment
3. At agent startup, wxO calls your `create_agent(config)` factory
4. wxO injects a `RunnableConfig` with an `execution_context` containing:
   - `access_token` — for authenticating SDK calls back to wxO
   - `thread_id` — identifies the current conversation thread
   - `api_proxy_url` — the full base URL the SDK uses for API calls
5. The graph processes user messages turn by turn

### The Agentic SDK

`ibm_watsonx_orchestrate_sdk` is the bridge from your LangGraph code to wxO platform services:

```python
from ibm_watsonx_orchestrate_sdk import Client

def create_agent(config: RunnableConfig) -> StateGraph:
    client = Client.from_runnable_config(config)  # ← standard entry point
    # client.memory    → cross-session user memory
    # client.context   → conversation compression
```

```python
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO

llm = ChatWxO.from_runnable_config(config=config, model="groq/openai/gpt-oss-120b")
```

### The three execution modes

| Mode | When | Client initialisation |
|---|---|---|
| `runs-on` | Inside wxO runtime (package import) | `Client.from_runnable_config(config)` |
| `runs-elsewhere` | External service calling wxO APIs | `Client(api_key=..., instance_url=...)` |
| `local` | Developer Edition testing | `Client(instance_url="http://localhost:4321", local=True)` |

---

## Section 2 — Hello World: Minimal LangGraph Agent (15 min)

Build the simplest possible agent to verify the end-to-end pipeline before adding any complexity.

### Project structure

```
agents/echo_agent/
├── agent.py          ← create_agent() factory + graph
├── agent.yaml        ← wxO agent specification
└── requirements.txt  ← pinned Python dependencies
```

> 📂 The files are in `agents/echo_agent/`.

### The agent.yaml — key fields explained

```yaml
spec_version: v1
kind: agent               # not "native" — "agent" for LangGraph package imports
framework: langgraph      # required: tells wxO this is a LangGraph agent

deployment:
  code_bundle:
    entrypoint: "agent:create_agent"
    # Format: "python_module_name:factory_function_name"
    # "agent" = agent.py (without .py extension)
    # "create_agent" = the factory function inside that file
```

### Test locally first

```bash
cd agents/echo_agent
python agent.py
# Expected: [Echo @ HH:MM:SS UTC] You said: "Hello from local test!"
```

### Import to wxO

From the `advanced/part1-langgraph/` directory:

```bash
orchestrate agents import \
  --package-root agents/echo_agent \
  --config-file agents/echo_agent/agent.yaml
```

Verify:

```bash
orchestrate agents list | grep echo_agent
```

Then open the wxO Chat UI and send any message to `echo_agent`. You should see a timestamped echo.

### What you learned

- The `create_agent(config)` factory signature is **non-negotiable** — wxO will not find your agent without it
- The graph must be returned **uncompiled** — wxO compiles and manages it
- `agent.yaml` uses `kind: agent` + `framework: langgraph` (not `kind: native`)
- The `entrypoint` format is `"module:function"`

---

## Section 3 — Calling wxO LLMs with ChatWxO (10 min)

Replace the static echo with a real LLM call routed through the wxO AI Gateway.

### Why ChatWxO, not ChatOpenAI directly?

- Routes through the wxO AI Gateway — all platform models available by name
- Uses the runtime's `execution_context` for authentication — no hardcoded API keys
- Tracks token usage and costs in wxO observability
- Drop-in replacement for `ChatOpenAI` — identical API surface

### Add to your agent node

```python
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO

def agent_node(state: AgentState, config: RunnableConfig) -> AgentState:
    llm = ChatWxO.from_runnable_config(
        config=config,
        model="groq/openai/gpt-oss-120b",   # model ID from orchestrate models list
    )
    response = llm.invoke(state["messages"])
    return {"messages": [response]}
```

### ChatWxO supported operations

```python
llm.invoke(messages)           # single synchronous call
llm.stream(messages)           # streaming response
llm.bind_tools([tool1, tool2]) # enable tool-calling
llm.with_structured_output(Schema)  # structured JSON output
llm.batch([msg1, msg2])        # parallel batch
```

### Model IDs

Use the same format as in native agent YAML files:

```
groq/openai/gpt-oss-120b
watsonx/meta-llama/llama-3-2-90b-vision-instruct
watsonx/ibm/granite-3-8b-instruct
```

Run `orchestrate models list` to see all available models in your environment.

---

## Section 4 — Adding Tools to the Graph (10 min)

### LangChain `@tool` vs wxO `@tool`

| | LangChain `@tool` | wxO `@tool` |
|---|---|---|
| Import | `from langchain_core.tools import tool` | `from ibm_watsonx_orchestrate.agent_builder.tools import tool` |
| Purpose | Defines a tool callable by an LLM inside a LangGraph graph | Defines a standalone tool imported into wxO for native agents |
| Lives | Inside your agent package, called by the graph | Imported separately with `orchestrate tools import` |

Use **LangChain** `@tool` for tools inside your LangGraph agent.

### The standard ReAct node pattern

```python
from langchain_core.tools import tool as lc_tool
from langgraph.prebuilt import ToolNode

@lc_tool
def my_tool(query: str) -> str:
    """Tool description — the LLM reads this to decide when to call it."""
    return "result"

TOOLS = [my_tool]

def agent_node(state, config):
    llm = ChatWxO.from_runnable_config(config=config, model="groq/openai/gpt-oss-120b")
    llm_with_tools = llm.bind_tools(TOOLS)
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state) -> Literal["tools", "end"]:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"

# In create_agent():
graph.add_node("agent", lambda state: agent_node(state, config))
graph.add_node("tools", ToolNode(TOOLS))
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")   # Loop back after tool execution
```

> See the full implementation in [`agents/research_agent/agent.py`](agents/research_agent/agent.py).

---

## Section 5 — Injecting Credentials with wxO Connections (10 min)

Never hardcode API keys in agent code. Use wxO Connections — credentials are injected as environment variables at runtime.

### The credential environment variable format

```
{app_id}_{credential_type}
```

Example: connection `app_id = news_api`, `credential_type = api_key` → env var: `news_api_api_key`

### Set up the connection

```bash
# 1. Create the connection
orchestrate connections add -a news_api

# 2. Configure it as key_value (supports arbitrary key=value pairs)
orchestrate connections configure -a news_api --env draft -t team -k key_value

# 3. Set the credential (reads from your local env var)
orchestrate connections set-credentials -a news_api --env draft -e api_key=$NEWS_API_KEY
```

### Declare it in agent.yaml (auto-maps on import, ADK 2.11.0+)

```yaml
connections:
  global_requirements:
    required_app_ids:
      - news_api
```

### Read it inside the agent

```python
import os

api_key = os.environ.get("news_api_api_key", "")
if not api_key:
    return "Connection not configured."
```

### Manual association (if not declared in agent.yaml)

```bash
orchestrate agents connect -n research_agent -a news_api
```

---

## Section 6 — State Persistence with Checkpointers (10 min)

Checkpointers persist the `messages` state between turns **within a single session**. Without a checkpointer, the agent has no memory of the previous turn.

### Choose the right checkpointer

| Type | Persists across pod restart? | Extra dependency | Best for |
|---|---|---|---|
| `memory` | ❌ No | None | Development, testing |
| `sqlite` | ❌ No | `langgraph-checkpoint-sqlite` | Single-instance staging |
| `postgres` | ✅ Yes | `langgraph-checkpoint-postgres` | Production |
| *(none)* | ❌ | None | Fully stateless agents |

### Configure in agent.yaml

```yaml
# Memory (development)
checkpointer:
  type: memory

# SQLite (add langgraph-checkpoint-sqlite to requirements.txt)
checkpointer:
  type: sqlite

# PostgreSQL (add langgraph-checkpoint-postgres to requirements.txt)
checkpointer:
  type: postgres
  connection_string_key: db_connection_string
```

### PostgreSQL setup

```bash
# Create a key_value connection for the DB connection string
orchestrate connections add -a pg_db
orchestrate connections configure -a pg_db --env draft -t team -k key_value
orchestrate connections set-credentials -a pg_db --env draft \
  -e db_connection_string="postgresql://user:password@host:5432/dbname"
```

Then reference it in `agent.yaml`:
```yaml
checkpointer:
  type: postgres
  connection_string_key: db_connection_string

connections:
  global_requirements:
    required_app_ids:
      - pg_db
```

> ⚠️ **Reminder:** The `messages`-only limitation still applies. Checkpointers persist `messages` across turns, but your own custom state fields still reset on every new invocation from wxO.

---

## Section 7 — Cross-Session Memory with the Agentic SDK (10 min)

Checkpointers handle within-session state. For facts that must survive across completely separate conversations, use the **Agentic SDK memory API**. This is user-scoped semantic memory — not graph state.

### How it works

```
Session 1: User says "I prefer laptops under $1500"
  → client.memory.add_messages(memory_type="preference", infer=True)

... days later ...

Session 2: User asks "What should I buy?"
  → client.memory.search(query="what to buy", limit=3)
  → returns ["User prefers laptops under $1500"]
  → injected into system prompt → personalised response
```

### Write a memory

```python
client = Client.from_runnable_config(config)

client.memory.add_messages(
    messages=[{"role": "user", "content": "I'm looking for laptops under $1500"}],
    memory_type="preference",
    infer=True,     # platform extracts the preference fact automatically
)
```

### Search memories

```python
results = client.memory.search(query=user_text, limit=3)
if results.results:
    context = "\n".join(item.content for item in results.results)
```

### Memory types

| Type | Use for |
|---|---|
| `preference` | "I prefer X", "I like Y", "my budget is Z" |
| `profile_fact` | Name, role, company, location |
| `conversational` | General conversation history |
| `outcome` | Task results, decisions made |
| `tool` | Tool usage patterns, procedures |

> ⚠️ **Memory is user-scoped, not agent-scoped.** One user's memories are shared across all agents. `delete_all()` deletes ALL memory for that user.

### Context compression (bonus)

For very long conversations that approach the model's token limit:

```python
from langchain_core.messages.utils import count_tokens_approximately

if count_tokens_approximately(messages) > 20000:
    compressed = client.context.compress(messages=messages)
    messages = [SystemMessage(content=compressed.summary)] + messages[-4:]
```

---

## Section 8 — Register as a Collaborator (5 min)

Your LangGraph agent is now registered in wxO. Add it as a collaborator to any existing native agent.

1. Open the YAML of a native agent you already have deployed (e.g. a customer support agent or an orchestrator)
2. Add the research agent as a collaborator:

```yaml
collaborators:
  - existing_agent_1
  - research_agent    # ← add this
```

3. Update the instructions to explain when to delegate to it:

```
When the user asks about product research, market trends, or tech comparisons,
delegate to the research_agent collaborator.
```

4. Re-import the agent:

```bash
orchestrate agents import -f agents/your-orchestrator-agent.yaml
```

From the orchestrator's perspective, the LangGraph agent is indistinguishable from a native agent — this is the power of the A2A abstraction.

---

## Section 9 — Troubleshooting Reference

| Problem | Cause | Fix |
|---|---|---|
| `Missing api_proxy_url` | Wrong client initialisation | Use `Client.from_runnable_config(config)` not `Client()` |
| Custom state resets each turn | wxO only persists `messages` | Use SDK memory for cross-turn data |
| Import fails: package too large | Package > 50 MB | Add `.venv/` to `.gitignore`, never include it in `--package-root` |
| Import fails: entrypoint not found | Wrong format | Must be `"module_name:function_name"` — no `.py` extension |
| Credentials missing in agent | Connection not mapped | Declare in `connections:` in `agent.yaml` or run `orchestrate agents connect` |
| `Invalid memory_type` error | Wrong type string | Use: `preference`, `profile_fact`, `conversational`, `outcome`, `tool` |
| SQLite state lost after redeploy | Pod restart clears SQLite | Switch to PostgreSQL checkpointer for production |
| `ChatWxO` authentication error | Wrong SDK mode | Inside `runs-on`: use `from_runnable_config`; outside wxO: use `from_instance_credentials` |
| LLM not calling tools | Tool descriptions unclear | Write crisp, specific docstrings — the LLM reads them to decide when to call each tool |

---

## Exercises

See [`exercises.md`](exercises.md) for stretch challenges.

---

## Import Everything

```bash
cd advanced/part1-langgraph
bash import-all.sh
```

---

## Key Commands Reference

```bash
# Import a LangGraph agent package
orchestrate agents import \
  --package-root agents/my_agent \
  --config-file agents/my_agent/agent.yaml

# Create agent directly from CLI (shorthand)
orchestrate agents create \
  --style custom \
  --package-root agents/my_agent \
  --config-file agents/my_agent/agent.yaml

# List agents
orchestrate agents list

# Export an agent (for backup or promotion)
orchestrate agents export -n research_agent -k native -o research_agent.zip

# Remove an agent
orchestrate agents remove -n echo_agent -k native

# Connections
orchestrate connections add -a my_connection
orchestrate connections configure -a my_connection --env draft -t team -k key_value
orchestrate connections set-credentials -a my_connection --env draft -e key=$VALUE
orchestrate connections list
orchestrate agents connect -n my_agent -a my_connection
```

---

## Reference Links

- [IBM Docs — Importing LangGraph agents](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=agents-importing-langgraph)
- [IBM Docs — Creating connections for LangGraph](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=agents-creating-connections-langgraph)
- [IBM Docs — State persistence for LangGraph](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=agents-enabling-state-persistence-langgraph)
- [ADK Docs — Agentic SDK Introduction](https://developer.watson-orchestrate.ibm.com/sdk/sdk_intro)
- [ADK Docs — ChatWxO](https://developer.watson-orchestrate.ibm.com/sdk/chat_wxo)
- [ADK Docs — Memory API](https://developer.watson-orchestrate.ibm.com/sdk/memory)
- [ADK Docs — Context compression](https://developer.watson-orchestrate.ibm.com/sdk/context)
- [LangGraph — a2a-samples (external LangGraph agent reference)](https://github.com/a2aproject/a2a-samples/tree/main/samples/python/agents/langgraph)

---

[← Back to Advanced Workshop Home](../index.md){ .md-button }
