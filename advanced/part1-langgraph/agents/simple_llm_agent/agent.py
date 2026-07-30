"""
Simple LLM Agent — Section 3: Pure LangGraph with ChatOpenAI + Groq backend

Demonstrates that an existing LangGraph agent built with standard LangChain
components can be imported into watsonx Orchestrate with zero platform-specific
code. The only wxO requirement is the create_agent(config) factory signature.

Pedagogical note: This agent uses ChatOpenAI pointed at Groq's OpenAI-compatible
API via base_url. The package is still langchain-openai — no Groq-specific library
is needed. This shows that LangChain's provider coupling is shallow: base_url is
all it takes to swap the backend. The same pattern applies to Ollama, Azure,
and wxO's own AI Gateway (Section 4).

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

# Groq OpenAI-compatible endpoint — same interface as api.openai.com
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Model available on Groq's free tier. Fast and capable.
GROQ_MODEL = "llama-3.3-70b-versatile"


# ── Node ──────────────────────────────────────────────────────────────────────

def llm_node(state: AgentState, config: RunnableConfig) -> AgentState:
    """Call the LLM with the current message history.

    Uses ChatOpenAI with base_url pointed at Groq's API.
    Connection app_id = "groq_connection", credential key = "api_key"
    → injected by wxO as env var: groq_connection_api_key
    """
    # Read the API key from the wxO Connection environment variable.
    api_key = os.environ.get("groq_connection_api_key", "")
    if not api_key:
        from langchain_core.messages import AIMessage
        return {"messages": [AIMessage(
            content="⚠️ Groq API key not found. "
                    "Make sure the 'groq_connection' wxO Connection is configured."
        )]}

    # ChatOpenAI with base_url → talks to Groq instead of api.openai.com.
    # requirements.txt is still langchain-openai — no Groq-specific package needed.
    # This is the "provider coupling is shallow" pattern: swap base_url, keep the class.
    llm = ChatOpenAI(
        model=GROQ_MODEL,
        base_url=GROQ_BASE_URL,
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

    # For local testing, set GROQ_API_KEY env var and map it to the
    # connection variable name the agent expects inside wxO.
    raw_key = os.environ.get("GROQ_API_KEY", "")
    if not raw_key:
        print("Set GROQ_API_KEY to run local test.")
        sys.exit(1)
    os.environ["groq_connection_api_key"] = raw_key

    app = create_agent({}).compile()
    result = app.invoke({
        "messages": [HumanMessage(content="What is LangGraph in one sentence?")]
    })
    print(result["messages"][-1].content)
