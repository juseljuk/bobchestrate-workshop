"""
Product Research Agent — Sections 3–7 progressive build.

This single file shows the fully-built agent with all features enabled:
  - ChatWxO  (Section 3): routes LLM calls through the wxO AI gateway
  - LangChain tools (Section 4): tool-calling with ToolNode
  - wxO Connections (Section 5): API key injected as env var at runtime
  - Memory checkpointer (Section 6): state persists within a session
  - SDK persistent memory (Section 7): user preferences survive across sessions
  - Context compression (bonus): trims long histories to stay within token limits

Build it incrementally — each section adds the next block of code.
"""

import os
from typing import Annotated, List, Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_core.tools import tool as lc_tool      # LangChain @tool, NOT wxO @tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from ibm_watsonx_orchestrate_sdk import Client
from ibm_watsonx_orchestrate_sdk.langchain import ChatWxO


# ── Agent State ───────────────────────────────────────────────────────────────
# CRITICAL wxO limitation:
# Only the `messages` field survives between separate chat turns.
# All other fields reset at the start of each new invocation from wxO.
# Use the SDK memory API (Section 7) for data that must persist across turns.

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]


# ── Tools (Section 4) ─────────────────────────────────────────────────────────
# Use LangChain's @tool decorator here — NOT the wxO @tool from agent_builder.
# These tools live inside the graph and are called by the LLM via tool-calling.

@lc_tool
def search_products(query: str) -> str:
    """
    Search for products matching the query.
    Returns a list of matching products with name, price, and description.
    """
    # In the workshop this calls the product catalog MCP server from Part 6.
    # Here we return a stub so the agent compiles and tests locally.
    products = [
        {"name": "UltraBook Pro 15", "price": "$1,899", "category": "Laptops"},
        {"name": "ErgoPro Standing Desk", "price": "$899", "category": "Furniture"},
        {"name": "NoiseCanceller X1", "price": "$349", "category": "Audio"},
    ]
    matches = [p for p in products if query.lower() in p["name"].lower()
               or query.lower() in p["category"].lower()]
    if not matches:
        return f"No products found matching '{query}'."
    return "\n".join(f"- {p['name']} ({p['category']}): {p['price']}" for p in matches)


@lc_tool
def get_news_headlines(topic: str) -> str:
    """
    Fetch the latest news headlines for a given topic.
    Requires the `news_api` connection with an `api_key` credential.
    """
    # The wxO runtime injects the api key as: {app_id}_{credential_type}
    # i.e. news_api_api_key — resolved from the `news_api` key_value connection.
    api_key = os.environ.get("news_api_api_key", "")
    if not api_key:
        return "News API key not configured. Set up the `news_api` connection first."

    # Real implementation would call e.g. newsapi.org here.
    # Stub response for workshop:
    return (
        f"Latest headlines for '{topic}':\n"
        f"1. AI adoption accelerating in enterprise software (2h ago)\n"
        f"2. New product launches expected at upcoming tech conference (4h ago)\n"
        f"3. Industry analysts revise market forecasts upward (6h ago)"
    )


# ── Graph nodes ───────────────────────────────────────────────────────────────

TOOLS = [search_products, get_news_headlines]


def agent_node(state: AgentState, config: RunnableConfig) -> AgentState:
    """
    Main reasoning node.
    - Recalls user memory from previous sessions (Section 7)
    - Compresses long conversation history (bonus)
    - Calls the wxO-managed LLM via ChatWxO (Section 3)
    """
    client = Client.from_runnable_config(config)

    messages = state.get("messages", [])

    # ── Section 7: Recall persistent user memory ─────────────────────────────
    user_text = ""
    for msg in reversed(messages):
        if getattr(msg, "type", "") == "human":
            user_text = getattr(msg, "content", "")
            break

    memory_context = ""
    if user_text:
        memory_results = client.memory.search(query=user_text, limit=3)
        if memory_results.results:
            memory_context = "User preferences from previous sessions:\n" + "\n".join(
                f"- {item.content}" for item in memory_results.results
            )

    # ── Bonus: Context compression ────────────────────────────────────────────
    # Compress when conversation grows long to stay within model token limits.
    try:
        from langchain_core.messages.utils import count_tokens_approximately
        if count_tokens_approximately(messages) > 20000:
            compressed = client.context.compress(messages=messages)
            messages = [SystemMessage(content=compressed.summary)] + messages[-4:]
    except Exception:
        pass  # Compression is best-effort; never block the agent

    # ── Build system prompt ───────────────────────────────────────────────────
    system_content = (
        "You are a helpful product research agent. "
        "Use search_products to find relevant products and get_news_headlines for market context. "
        "Be concise and specific. Format product lists as bullet points with prices."
    )
    if memory_context:
        system_content += f"\n\n{memory_context}"

    # Insert system message before the conversation history
    full_messages = [SystemMessage(content=system_content)] + messages

    # ── Section 3: Call LLM via ChatWxO ──────────────────────────────────────
    llm = ChatWxO.from_runnable_config(
        config=config,
        model="groq/openai/gpt-oss-120b",
    )
    llm_with_tools = llm.bind_tools(TOOLS)
    response = llm_with_tools.invoke(full_messages)

    # ── Section 7: Persist new preferences mentioned in the response ──────────
    if user_text and any(kw in user_text.lower() for kw in ["prefer", "like", "want", "budget", "looking for"]):
        try:
            client.memory.add_messages(
                messages=[{"role": "user", "content": user_text}],
                memory_type="preference",
                infer=True,   # Let the platform extract the preference fact
            )
        except Exception:
            pass  # Memory writes are best-effort; never block the agent

    return {"messages": [response]}


def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """Route to tools if the LLM made tool calls, otherwise end."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"


# ── Graph factory (required entry point for wxO) ──────────────────────────────

def create_agent(config: RunnableConfig) -> StateGraph:
    """
    Factory function required by watsonx Orchestrate.

    Must return an UNCOMPILED StateGraph. wxO compiles it and manages
    the checkpointer lifecycle automatically based on agent.yaml config.

    Args:
        config: Runtime configuration injected by wxO (access_token, thread_id, api_proxy_url).

    Returns:
        StateGraph: The uncompiled agent graph.
    """
    tool_node = ToolNode(TOOLS)

    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("agent", lambda state: agent_node(state, config))
    graph.add_node("tools", tool_node)

    # Edges
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
    graph.add_edge("tools", "agent")   # Loop back after tool execution

    return graph


# ── Local testing helper ───────────────────────────────────────────────────────

if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    # Test without wxO runtime — ChatWxO will use local/dev credentials from env
    app = create_agent({}).compile()

    result = app.invoke({
        "messages": [HumanMessage(content="I'm looking for a laptop under $2000")]
    })
    print(result["messages"][-1].content)
