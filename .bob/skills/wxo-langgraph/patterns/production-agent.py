"""
Production-grade LangGraph agent for wxO (§5–§10 combined)

Features:
  - ChatWxO  : wxO-managed LLM via Agentic SDK (no per-model credential setup)
  - Tools    : LangChain @lc_tool + ToolNode ReAct loop (§6)
  - Connections : API key from wxO Connection injected as env var (§7)
  - Checkpointer : configured in agent.yaml — memory/sqlite/postgres (§8)
  - Memory   : cross-session user preferences via Agentic SDK (§9)
  - Compression : token-count guard before LLM call (§10)

Adapt by:
  1. Replace my_tool with your real tools
  2. Update the system prompt
  3. Adjust the memory keyword list
  4. Set checkpointer type in agent.yaml
"""
import os
from typing import Annotated, List, Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool as lc_tool   # LangChain @tool — NOT wxO @tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from ibm_watsonx_orchestrate_sdk import Client
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO


# ── State ─────────────────────────────────────────────────────────────────────
# Only messages persists between wxO turns. All other fields reset each invocation.

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


# ── Tools ─────────────────────────────────────────────────────────────────────
# Use lc_tool (LangChain) — NOT the wxO @tool from agent_builder.tools.
# Write clear docstrings — the LLM reads them to decide when to call each tool.

@lc_tool
def my_tool(query: str) -> str:
    """
    Replace this with your real tool.
    Describe clearly what it does — the LLM uses this description for routing.
    """
    api_key = os.environ.get("my_api_api_key", "")
    if not api_key:
        return "my_api connection not configured."
    # your implementation here
    return f"Result for: {query}"


TOOLS = [my_tool]


# ── Nodes ─────────────────────────────────────────────────────────────────────

def agent_node(state: AgentState, config: RunnableConfig) -> AgentState:
    client = Client.from_runnable_config(config)   # always use this inside wxO runtime
    messages = list(state.get("messages", []))

    # Extract latest user message
    user_text = next(
        (getattr(m, "content", "") for m in reversed(messages) if getattr(m, "type", "") == "human"),
        ""
    )

    # §10 — Context compression (best-effort, never blocks agent)
    try:
        from langchain_core.messages.utils import count_tokens_approximately
        if count_tokens_approximately(messages) > 20000:
            compressed = client.context.compress(messages=messages)
            messages = [SystemMessage(content=compressed.summary)] + messages[-4:]
    except Exception:
        pass

    # §9 — Recall cross-session memories
    memory_context = ""
    if user_text:
        try:
            results = client.memory.search(query=user_text, limit=3)
            if results.results:
                memory_context = "Relevant user context:\n" + \
                    "\n".join(f"- {r.content}" for r in results.results)
        except Exception:
            pass

    # Build system prompt
    system_content = "You are a helpful assistant."
    if memory_context:
        system_content += f"\n\n{memory_context}"

    full_messages = [SystemMessage(content=system_content)] + messages

    # §5 — LLM call via ChatWxO (routes through wxO AI Gateway, no credential setup needed)
    llm = ChatWxO.from_runnable_config(config=config, model="groq/openai/gpt-oss-120b")
    llm_with_tools = llm.bind_tools(TOOLS)
    response = llm_with_tools.invoke(full_messages)

    # §9 — Store preferences mentioned by the user (best-effort)
    preference_keywords = ["prefer", "like", "want", "budget", "looking for"]
    if user_text and any(kw in user_text.lower() for kw in preference_keywords):
        try:
            client.memory.add_messages(
                messages=[{"role": "user", "content": user_text}],
                memory_type="preference",
                infer=True,   # platform extracts the preference fact automatically
            )
        except Exception:
            pass

    return {"messages": [response]}


def should_continue(state: AgentState) -> Literal["tools", "end"]:
    last = state["messages"][-1]
    return "tools" if hasattr(last, "tool_calls") and last.tool_calls else "end"


# ── Graph factory ─────────────────────────────────────────────────────────────

def create_agent(config: RunnableConfig) -> StateGraph:
    """Required wxO entry point. Returns UNCOMPILED graph."""
    graph = StateGraph(AgentState)
    graph.add_node("agent", lambda state: agent_node(state, config))
    graph.add_node("tools", ToolNode(TOOLS))
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
    graph.add_edge("tools", "agent")   # ReAct loop — returns to agent after tool execution
    return graph


if __name__ == "__main__":
    from langchain_core.messages import HumanMessage
    app = create_agent({}).compile()
    result = app.invoke({"messages": [HumanMessage(content="Test message")]})
    print(result["messages"][-1].content)
