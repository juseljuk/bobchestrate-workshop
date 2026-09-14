"""
Echo Agent — Section 2: Minimal LangGraph Agent (Hello World)

Demonstrates the required create_agent() factory pattern for watsonx Orchestrate.
No LLM involved — simply echoes the user's message with a timestamp to verify
the full pipeline (packaging → import → chat) works end to end.
"""
from datetime import datetime, timezone
from typing import Annotated, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


# ── Agent State ──────────────────────────────────────────────────────────────
# IMPORTANT: Only the `messages` field is persisted between turns by wxO.
# Any other state fields you add here are reset at the start of each new turn.

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


# ── Nodes ─────────────────────────────────────────────────────────────────────

def echo_node(state: AgentState) -> AgentState:
    """Return a timestamped echo of the last user message."""
    last_message = state["messages"][-1] if state["messages"] else None
    user_text = getattr(last_message, "content", "") if last_message else ""

    timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    response = AIMessage(
        content=f"[Echo @ {timestamp}] You said: \"{user_text}\"\n\n"
                f"✅ The LangGraph pipeline is working! Replace this node with real logic."
    )
    return {"messages": [response]}


# ── Graph factory (required entry point for wxO) ──────────────────────────────

def create_agent(config: RunnableConfig) -> StateGraph:
    """
    Factory function required by watsonx Orchestrate.

    wxO calls this function at agent startup, passing a RunnableConfig that
    contains the runtime execution context (access token, thread id, api proxy url).
    The function must return an UNCOMPILED StateGraph — wxO compiles it internally.

    Args:
        config: Runtime configuration injected by the wxO runtime.

    Returns:
        StateGraph: The uncompiled agent graph.
    """
    graph = StateGraph(AgentState)
    graph.add_node("echo", echo_node)
    graph.add_edge(START, "echo")
    graph.add_edge("echo", END)
    return graph


# ── Local testing helper ───────────────────────────────────────────────────────

if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    app = create_agent({}).compile()
    result = app.invoke({"messages": [HumanMessage(content="Hello from local test!")]})
    print(result["messages"][-1].content)
