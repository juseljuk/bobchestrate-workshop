"""
Hello World — Minimal LangGraph agent for wxO (§3)

Verifies the full pipeline (package → import → chat) with no LLM, no SDK,
no external calls. Use this to confirm end-to-end wiring before adding complexity.

Key rules:
  - create_agent() must return an UNCOMPILED graph
  - AgentState uses add_messages reducer — only messages persists between wxO turns
  - .compile() is called only in __main__ for local testing, never in create_agent()
"""
from datetime import datetime, timezone
from typing import Annotated, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


def echo_node(state: AgentState) -> AgentState:
    user_text = getattr(state["messages"][-1], "content", "") if state["messages"] else ""
    timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    response = AIMessage(content=f"[Echo @ {timestamp}] You said: \"{user_text}\"")
    return {"messages": [response]}


def create_agent(config: RunnableConfig) -> StateGraph:
    """
    Required wxO entry point. Must return UNCOMPILED StateGraph.
    wxO calls this at startup and injects RunnableConfig with execution context.
    """
    graph = StateGraph(AgentState)
    graph.add_node("echo", echo_node)
    graph.add_edge(START, "echo")
    graph.add_edge("echo", END)
    return graph   # ← UNCOMPILED always


if __name__ == "__main__":
    from langchain_core.messages import HumanMessage
    app = create_agent({}).compile()
    result = app.invoke({"messages": [HumanMessage(content="Hello!")]})
    print(result["messages"][-1].content)
