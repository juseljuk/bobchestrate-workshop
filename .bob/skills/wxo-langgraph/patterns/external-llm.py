"""
External LLM pattern — pure LangGraph, no Agentic SDK (§4)

Uses ChatOpenAI pointed at any OpenAI-compatible API (here: Groq's free tier).
Demonstrates that existing LangGraph code works on wxO with zero platform-specific
imports — only the create_agent() entry point signature is required.

Key insight: ChatOpenAI is just an HTTP client. Swap base_url to point at Groq,
Ollama, Azure, or wxO's AI Gateway — no library change needed.

Credential convention:
  wxO Connection app_id="groq_connection", key="api_key"
  → injected at runtime as env var: groq_connection_api_key

Local test: export GROQ_API_KEY=gsk_... then run: python external-llm.py
"""
import os
from typing import Annotated, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


SYSTEM_PROMPT = "You are a helpful assistant. Answer concisely and accurately."
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"


def llm_node(state: AgentState, config: RunnableConfig) -> AgentState:
    # Two equivalent ways to read injected credentials:
    #
    # Option A — os.environ (simple):
    api_key = os.environ.get("groq_connection_api_key", "")
    #
    # Option B — via config (official IBM docs pattern):
    # credentials = config.get("configurable", {}).get("credentials", {})
    # api_key = credentials.get("groq_connection_api_key")
    #
    # Convention: {app_id}_{credential_type}
    # e.g. app_id="groq_connection", credential_type="api_key" → "groq_connection_api_key"

    if not api_key:
        return {"messages": [AIMessage(
            content="⚠️ Groq API key not found. Configure the 'groq_connection' wxO Connection."
        )]}

    llm = ChatOpenAI(
        model=GROQ_MODEL,
        base_url=GROQ_BASE_URL,
        api_key=api_key,
        temperature=0.7,
    )

    messages = list(state["messages"])
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    response = llm.invoke(messages)
    return {"messages": [response]}


def create_agent(config: RunnableConfig) -> StateGraph:
    """Required wxO entry point. Returns UNCOMPILED graph."""
    graph = StateGraph(AgentState)
    graph.add_node("llm", lambda state: llm_node(state, config))
    graph.add_edge(START, "llm")
    graph.add_edge("llm", END)
    return graph


if __name__ == "__main__":
    import sys
    from langchain_core.messages import HumanMessage

    raw_key = os.environ.get("GROQ_API_KEY", "")
    if not raw_key:
        print("Set GROQ_API_KEY to run local test.")
        sys.exit(1)
    os.environ["groq_connection_api_key"] = raw_key   # simulate wxO Connection injection

    app = create_agent({}).compile()
    result = app.invoke({"messages": [HumanMessage(content="What is LangGraph in one sentence?")]})
    print(result["messages"][-1].content)
