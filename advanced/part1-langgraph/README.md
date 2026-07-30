# Advanced Part 1: Building Custom LangGraph Agents for watsonx Orchestrate

**Duration:** 75–90 minutes
**Difficulty:** ⭐⭐⭐ Advanced
**Prerequisites:** wxO SaaS account, ADK CLI (`pip install ibm-watsonx-orchestrate`), Python 3.11+, `uv`, IBM Bob IDE, basic Python knowledge

---

## Overview

This part teaches you to build **fully custom LangGraph agents** that run natively inside watsonx Orchestrate. You'll go from a minimal "Hello World" graph to a production-ready agent with LLM tool-calling, external API credentials, in-session state persistence, and cross-session user memory.

### What You'll Build

| Agent                          | What it demonstrates                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **`echo_agent`**       | Minimal pipeline verification — no LLM, no SDK, pure LangGraph skeleton      |
| **`simple_llm_agent`** | Pure LangGraph with`ChatOpenAI` — no Agentic SDK at all, built with Bob    |
| **`research_agent`**   | Full production agent —`ChatWxO`, tools, connections, checkpointer, memory |

### Why LangGraph on wxO?

| Use LangGraph when...                                                     | Use a native wxO agent when...                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| You need custom graph topology (loops, complex branching, parallel nodes) | You want YAML-first authoring with tools, knowledge bases, and guidelines |
| You're bringing an **existing LangGraph codebase** to wxO          | You need multi-agent orchestration with collaborator agents               |
| You need fine-grained control over the reasoning loop                     | Speed and cost matter — native agents are faster and cheaper             |
| You have custom in-graph state logic that can't live in message history   | Agentic workflows cover your orchestration needs                          |

> **Native wxO agents are not just for simple tasks.** They support multi-agent collaboration, knowledge bases, guardrail plugins, agentic workflows, scheduling, and deployment to channels — all without writing Python. Use LangGraph when you genuinely need custom graph topology or are porting an existing LangGraph codebase.

---

## wxO LangGraph Limitations (Read First)

These are hard platform constraints — not bugs, not things to work around with hacks.

| Limitation                                         | Detail                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Python only**                              | TypeScript/JavaScript LangGraph is not supported                                                              |
| **Only `messages` persists between turns** | Custom state fields reset every turn — only`messages: Annotated[List[BaseMessage], add_messages]` survives |
| **Package size ≤ 50 MB compressed**         | Exclude`.venv/` from the package root                                                                       |
| **Runs inside wxO runtime**                  | Outbound calls require wxO Connections for credentials                                                        |
| **No direct database access**                | Persistent state across restarts needs PostgreSQL via a wxO connection                                        |
| **SQLite resets on pod restart**             | Use PostgreSQL for production persistence                                                                     |

---

## Architecture

### Minimal — what wxO actually requires (Sections 2–3)

The only thing wxO needs from your code is the `create_agent` entry point. Everything inside the graph is plain LangGraph:

```
wxO Chat UI
    │
    ▼  (A2A protocol — handled by wxO automatically)
wxO Runtime
    │
    ▼  create_agent(config: RunnableConfig) ← the one required contract
StateGraph.compile().invoke({"messages": [...]})
    │
    └─ your_node  ──── any Python logic
                  └─── any LLM (ChatOpenAI, ChatAnthropic, …)
```

### Full integration — what Sections 4–8 build toward

Once you add wxO platform services, the graph gains access to managed LLMs, secure credentials, persistent memory, and more:

```
wxO Chat UI
    │
    ▼  (A2A protocol — handled by wxO automatically)
wxO Runtime
    │
    ▼  create_agent(config: RunnableConfig)
StateGraph.compile().invoke({"messages": [...]})
    │
    ├─ agent_node  ──── ChatWxO ──── wxO AI Gateway ──── LLM    (Section 4)
    │                │
    │                └─ ibm_watsonx_orchestrate_sdk
    │                       ├─ client.memory.search()            (Section 8)
    │                       └─ client.context.compress()         (Section 8)
    │
    └─ tool_node  ──── my_tool()                                 (Section 5)
                  └─── get_news_headlines() ── news_api env var  (Section 6)
```

---

## Section 0 — What is LangGraph? (15 min)

### Background

LangGraph is an open-source library built by the **LangChain team** (released January 2024) for building **stateful, graph-based agent workflows** in Python and TypeScript. It has quickly become one of the most widely adopted agent frameworks, used by companies including LinkedIn, Uber, GitLab, and Elastic.

The core insight behind LangGraph is that most non-trivial agent behaviour can be modelled as a **directed graph** — where each node does some work on a shared state, and edges (including conditional ones) control the flow between nodes. This is fundamentally different from a linear chain of prompts.

### Core concepts

| Concept                       | What it is                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| **`StateGraph`**      | The graph container — defines nodes, edges, and the state schema                             |
| **`AgentState`**      | A`TypedDict` that flows through the graph — every node reads from and writes to it         |
| **Node**                | A Python function`(state: AgentState) -> AgentState` — does work and returns updated state |
| **Edge**                | A directed connection:`graph.add_edge("node_a", "node_b")`                                  |
| **Conditional edge**    | A routing function that inspects state and returns the next node name                         |
| **`START` / `END`** | Sentinels marking the graph's entry and exit points                                           |
| **Checkpointer**        | Persists state between invocations (memory, SQLite, PostgreSQL)                               |

### How state flows

Every node receives the **full current state** and returns a **partial state update**. The reducer for each field controls how updates are merged:

```python
from typing import Annotated, List, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # add_messages is the reducer — it appends new messages rather than replacing
    messages: Annotated[List[BaseMessage], add_messages]
```

The `add_messages` reducer is the most important one to understand — it means returning `{"messages": [new_msg]}` **appends** `new_msg` to the history, rather than replacing the whole list.

### The ReAct loop pattern

The most common LangGraph agent pattern is a **ReAct loop** (Reason + Act):

```
START
  │
  ▼
agent_node ──── calls LLM ────► if tool_calls: ──► tool_node ──┐
  ▲                              else: END                       │
  └───────────────────────────────────────────────────────────────┘
```

```python
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode

def agent_node(state, config):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state) -> str:
    last = state["messages"][-1]
    return "tools" if last.tool_calls else "end"

graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")   # loop back after tool execution
```

### LangGraph vs alternatives

|                             | LangGraph                                           | LangChain LCEL  | Native wxO agent                               |
| --------------------------- | --------------------------------------------------- | --------------- | ---------------------------------------------- |
| **Model**             | Explicit graph (nodes + edges)                      | Linear pipeline | YAML-configured LLM loop                       |
| **State**             | Typed, persistent across nodes                      | None            | Conversation history only                      |
| **Branching**         | Conditional edges                                   | Not built-in    | Guidelines + collaborator routing              |
| **Multi-agent**       | Manual (call other agents as tools)                 | Not built-in    | First-class (collaborators, agentic workflows) |
| **Human-in-the-loop** | Native (`interrupt`)                              | Not supported   | Agentic workflow user activity nodes           |
| **Complexity**        | Medium–High                                        | Low             | Low–Medium                                    |
| **Best for**          | Custom graph logic, porting existing LangGraph code | Simple chains   | Most production agent use cases                |

### Why LangGraph became popular

- **Deterministic control flow** — you know exactly which nodes can be reached from which
- **Streaming** — built-in support for streaming partial results node by node
- **First-class persistence** — checkpointer abstraction works with any backend
- **Visualisation** — `graph.get_graph().draw_mermaid()` renders the graph as a diagram
- **Ecosystem** — integrates with every LangChain tool, embeddings, and retriever

### The wxO entry point contract

Every wxO LangGraph agent must expose exactly one function:

```python
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph

def create_agent(config: RunnableConfig) -> StateGraph:
    # Build and return an UNCOMPILED graph
    # wxO compiles it internally
    graph = StateGraph(AgentState)
    # ... add nodes and edges ...
    return graph
```

The function name **must** be `create_agent` (or whatever you declare in `agent.yaml` under `entrypoint`). wxO calls it at agent startup, passing a `RunnableConfig` that contains the runtime execution context. The graph must be returned **uncompiled** — wxO handles compilation.

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

### The Agentic SDK (optional)

`ibm_watsonx_orchestrate_sdk` is the optional bridge from your LangGraph code to wxO platform services. You only need it when you want wxO-specific features:

```python
from ibm_watsonx_orchestrate_sdk import Client

client = Client.from_runnable_config(config)  # ← standard entry point
# client.memory    → cross-session user memory
# client.context   → conversation compression
```

```python
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO

llm = ChatWxO.from_runnable_config(config=config, model="groq/openai/gpt-oss-120b")
```

> **You don't need the Agentic SDK to deploy a LangGraph agent on wxO.** Sections 2 and 3 demonstrate this explicitly. The SDK becomes valuable in Sections 5–7 when you want wxO-managed LLMs, cross-session memory, or context compression.

### The three execution modes

| Mode               | When                                | Client initialisation                                        |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| `runs-on`        | Inside wxO runtime (package import) | `Client.from_runnable_config(config)`                      |
| `runs-elsewhere` | External service calling wxO APIs   | `Client(api_key=..., instance_url=...)`                    |
| `local`          | Developer Edition testing           | `Client(instance_url="http://localhost:4321", local=True)` |

---

## Section 2 — Hello World: Minimal LangGraph Agent (10 min)

Build the simplest possible agent to verify the end-to-end pipeline before adding any complexity. **No LLM, no SDK, no external calls** — just the scaffolding.

> 💡 **Bob prompt to get started:**
>
> ```
> Bob, create a minimal LangGraph agent that echoes the user's message
> with a UTC timestamp. It must use the create_agent(config: RunnableConfig)
> factory pattern required by watsonx Orchestrate. No LLM involved.
> ```

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
- **No Agentic SDK needed** for a working wxO LangGraph agent

---

## Section 3 — Pure LangGraph Agent with Bob (20 min)

Now build a real LLM-powered agent using **standard LangChain components only** — no Agentic SDK, no wxO-specific imports in the agent logic. This demonstrates that existing LangGraph code you've already written can be brought to wxO with minimal changes.

> 💡 **The key insight:** wxO only requires the `create_agent(config: RunnableConfig) -> StateGraph` entry point. Everything inside can be plain LangGraph/LangChain code.

### What to build

A conversational assistant using `ChatOpenAI` that:

- Has a persistent system prompt
- Maintains conversation history across turns (via `add_messages`)
- Gets its API key from a wxO Connection — not hardcoded

### Use IBM Bob to build it

Open Bob and use this prompt:

```
Bob, create a LangGraph agent for watsonx Orchestrate with these requirements:

1. File: agents/simple_llm_agent/agent.py
2. Use ChatOpenAI (langchain-openai) — NOT the Agentic SDK ChatWxO
3. Read the OpenAI API key from os.environ.get("openai_connection_api_key")
   (injected at runtime by a wxO Connection named "openai_connection")
4. If the key is missing, return a helpful error message as an AIMessage
5. System prompt: "You are a helpful assistant. Answer concisely and accurately."
6. Prepend the system prompt only if not already present in messages
7. Required entry point: create_agent(config: RunnableConfig) -> StateGraph
8. Include a local test block (if __name__ == "__main__") that maps
   OPENAI_API_KEY → openai_connection_api_key for local testing
9. Also create agent.yaml with kind: agent, framework: langgraph,
   entrypoint: "agent:create_agent", and the openai_connection declared
   under connections.global_requirements.required_app_ids
10. Create requirements.txt with: langgraph==1.1.10, langchain-core==1.3.3,
    langchain-openai==0.3.22, langgraph-checkpoint==4.0.3
```

> 📂 The completed reference files are in `agents/simple_llm_agent/`.

### What Bob will generate

Bob will produce `agent.py` — the only wxO-specific element is the function signature:

```python
def create_agent(config: RunnableConfig) -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("llm", lambda state: llm_node(state, config))
    graph.add_edge(START, "llm")
    graph.add_edge("llm", END)
    return graph   # ← return UNCOMPILED
```

Everything else (`ChatOpenAI`, `AgentState`, the `llm_node` function) is standard LangGraph — the exact same code would run in any LangGraph environment.

### Set up the wxO Connection

The agent reads its API key from the env var `openai_connection_api_key`. This is injected at runtime by a wxO Connection:

```bash
orchestrate connections add -a openai_connection
orchestrate connections configure -a openai_connection --env draft -t team -k key_value
orchestrate connections set-credentials -a openai_connection --env draft \
  -e api_key=$OPENAI_API_KEY
```

### Test locally

```bash
cd agents/simple_llm_agent
export OPENAI_API_KEY=sk-...
python agent.py
# Expected: "LangGraph is a library for building stateful, graph-based agent workflows..."
```

### Import to wxO

```bash
orchestrate agents import \
  --package-root agents/simple_llm_agent \
  --config-file agents/simple_llm_agent/agent.yaml
```

Chat with it in the wxO UI — it will hold a multi-turn conversation using `ChatOpenAI` with no wxO-specific LLM infrastructure.

### What you learned

- Existing LangGraph code works on wxO **as-is** — only the entry point function signature needs to be correct
- The Agentic SDK (`ibm_watsonx_orchestrate_sdk`) is **optional** — use it for wxO-managed LLMs and platform features, not for basic operation
- wxO Connections inject credentials as env vars — your agent code just reads `os.environ`
- IBM Bob can generate the complete agent, YAML, and requirements from a single prompt

---

## Section 4 — Calling wxO LLMs with ChatWxO (10 min)

Replace `ChatOpenAI` with `ChatWxO` to route LLM calls through the wxO AI Gateway instead of directly to OpenAI. This gives you access to all platform-managed models with zero credential management.

### Why ChatWxO, not ChatOpenAI directly?

- Routes through the wxO AI Gateway — all platform models available by name
- Uses the runtime's `execution_context` for authentication — no hardcoded API keys or connections needed
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

## Section 5 — Adding Tools to the Graph (10 min)

### LangChain `@tool` vs wxO `@tool`

|         | LangChain`@tool`                                         | wxO`@tool`                                                     |
| ------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Import  | `from langchain_core.tools import tool`                  | `from ibm_watsonx_orchestrate.agent_builder.tools import tool` |
| Purpose | Defines a tool callable by an LLM inside a LangGraph graph | Defines a standalone tool imported into wxO for native agents    |
| Lives   | Inside your agent package, called by the graph             | Imported separately with`orchestrate tools import`             |

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

## Section 6 — Injecting Credentials with wxO Connections (10 min)

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

## Section 7 — State Persistence with Checkpointers (10 min)

Checkpointers persist the `messages` state between turns **within a single session**. Without a checkpointer, the agent has no memory of the previous turn.

### Choose the right checkpointer

| Type         | Persists across pod restart? | Extra dependency                  | Best for                |
| ------------ | ---------------------------- | --------------------------------- | ----------------------- |
| `memory`   | ❌ No                        | None                              | Development, testing    |
| `sqlite`   | ❌ No                        | `langgraph-checkpoint-sqlite`   | Single-instance staging |
| `postgres` | ✅ Yes                       | `langgraph-checkpoint-postgres` | Production              |
| *(none)*   | ❌                           | None                              | Fully stateless agents  |

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

## Section 8 — Cross-Session Memory with the Agentic SDK (10 min)

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

| Type               | Use for                                    |
| ------------------ | ------------------------------------------ |
| `preference`     | "I prefer X", "I like Y", "my budget is Z" |
| `profile_fact`   | Name, role, company, location              |
| `conversational` | General conversation history               |
| `outcome`        | Task results, decisions made               |
| `tool`           | Tool usage patterns, procedures            |

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

## Section 9 — Register as a Collaborator (5 min)

Your LangGraph agent is now registered in wxO. Add it as a collaborator to any existing native agent.

1. Open the YAML of a native agent you already have deployed
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

## Section 10 — Troubleshooting Reference

| Problem                                 | Cause                         | Fix                                                                                              |
| --------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `Missing api_proxy_url`               | Wrong client initialisation   | Use`Client.from_runnable_config(config)` not `Client()`                                      |
| Custom state resets each turn           | wxO only persists`messages` | Use SDK memory for cross-turn data                                                               |
| Import fails: package too large         | Package > 50 MB               | Add`.venv/` to `.gitignore`, never include it in `--package-root`                          |
| Import fails: entrypoint not found      | Wrong format                  | Must be`"module_name:function_name"` — no `.py` extension                                   |
| Credentials missing in agent            | Connection not mapped         | Declare in`connections:` in `agent.yaml` or run `orchestrate agents connect`               |
| `Invalid memory_type` error           | Wrong type string             | Use:`preference`, `profile_fact`, `conversational`, `outcome`, `tool`                  |
| SQLite state lost after redeploy        | Pod restart clears SQLite     | Switch to PostgreSQL checkpointer for production                                                 |
| `ChatWxO` authentication error        | Wrong SDK mode                | Inside`runs-on`: use `from_runnable_config`; outside wxO: use `from_instance_credentials`  |
| LLM not calling tools                   | Tool descriptions unclear     | Write crisp, specific docstrings — the LLM reads them to decide when to call each tool          |
| `openai_connection_api_key` not found | Connection not configured     | Run`orchestrate connections set-credentials` and verify `agent.yaml` declares the connection |

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

# List agents
orchestrate agents list

# Export an agent (for backup or promotion)
orchestrate agents export -n research_agent -k agent -o research_agent.zip

# Remove an agent
orchestrate agents remove -n echo_agent -k agent

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
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [LangGraph — a2a-samples (external LangGraph agent reference)](https://github.com/a2aproject/a2a-samples/tree/main/samples/python/agents/langgraph)

---

[← Back to Advanced Workshop Home](../index.md){ .md-button }
