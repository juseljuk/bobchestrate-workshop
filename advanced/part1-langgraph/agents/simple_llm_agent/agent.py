"""
Simple LLM Agent — Section 3: Pure LangGraph with ChatOpenAI (No Agentic SDK)

Demonstrates that an existing LangGraph agent built with standard LangChain
components can be imported into watsonx Orchestrate with zero platform-specific
code. The only wxO requirement is the create_agent(config) factory signature.

The API key is injected at runtime via a wxO Connection — no hardcoded secrets.
"""
import os
from typing import Annotated, List, TypedDict

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


# ── Agent State ──────────────────────────────────────────────────────────────
# Only `messages` persists between turns inside wxO.
# All other fields reset at the start of each new invocation.

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a helpful assistant. Answer questions concisely and accurately.
If you don't know something, say so clearly rather than guessing."""


# ── Node ──────────────────────────────────────────────────────────────────────

def llm_node(state: AgentState, config: RunnableConfig) -> AgentState:
    """Call the LLM with the current message history."""
    # Read the API key from the wxO Connection environment variable.
    # Connection app_id = "openai_connection", credential = "api_key"
    # → injected as env var: openai_connection_api_key
    api_key = os.environ.get("openai_connection_api_key", "")
    if not api_key:
        from langchain_core.messages import AIMessage
        return {"messages": [AIMessage(
            content="⚠️ OpenAI API key not found. "
                    "Make sure the 'openai_connection' wxO Connection is configured."
        )]}

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=api_key,
        temperature=0.7,
    )

    # Prepend system message if not already present
    messages = state["messages"]
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)

    response = llm.invoke(messages)
    return {"messages": [response]}


# ── Graph factory (required entry point for wxO) ──────────────────────────────

def create_agent(config: RunnableConfig) -> StateGraph:
    """
    Factory function required by watsonx Orchestrate.

    This is a plain LangGraph agent — it uses no Agentic SDK code.
    The only wxO-specific element is this function signature itself.

    Args:
        config: Runtime configuration injected by the wxO runtime.
                Not used here — credentials come from env vars instead.

    Returns:
        StateGraph: The uncompiled agent graph.
    """
    graph = StateGraph(AgentState)

    # Wrap the node to pass config through
    graph.add_node("llm", lambda state: llm_node(state, config))
    graph.add_edge(START, "llm")
    graph.add_edge("llm", END)

    return graph


# ── Local testing helper ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from langchain_core.messages import HumanMessage

    # For local testing, set OPENAI_API_KEY env var and map it to the
    # connection variable name the agent expects.
    raw_key = os.environ.get("OPENAI_API_KEY", "")
    if not raw_key:
        print("Set OPENAI_API_KEY to run local test.")
        sys.exit(1)
    os.environ["openai_connection_api_key"] = raw_key

    app = create_agent({}).compile()
    result = app.invoke({
        "messages": [HumanMessage(content="What is LangGraph in one sentence?")]
    })
    print(result["messages"][-1].content)
