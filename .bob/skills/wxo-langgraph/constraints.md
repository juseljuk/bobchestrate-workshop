# wxO LangGraph — Platform Constraints

Hard runtime limits. Never generate code or YAML that violates these.

| Constraint | Detail |
|---|---|
| **Python only** | TypeScript/JavaScript LangGraph is not supported |
| **Only `messages` persists between turns** | Custom state fields reset every turn — only `messages: Annotated[List[BaseMessage], add_messages]` survives across separate chat turns |
| **Return UNCOMPILED graph** | `create_agent()` must return the `StateGraph` builder — never call `.compile()` before returning |
| **Package size ≤ 50 MB compressed** | Never include `.venv/` in `--package-root` |
| **Credentials via wxO Connections** | No hardcoded API keys — credentials are injected at runtime; read via `os.environ.get("{app_id}_{credential_type}")` or `config.get("configurable", {}).get("credentials", {}).get("{app_id}_{credential_type}")` |
| **No direct DB access** | For persistence across pod restarts, use PostgreSQL via a wxO Connection |
| **SQLite resets on pod restart** | Use PostgreSQL checkpointer for production persistence |
| **`kind: agent` not `kind: native`** | LangGraph package imports use `kind: agent` + `framework: langgraph` in YAML |
| **`@tool` decorators differ** | Inside LangGraph agents use `from langchain_core.tools import tool as lc_tool` — NOT the wxO `@tool` from `agent_builder.tools` |
| **Agentic SDK is optional** | The SDK adds wxO platform features (ChatWxO, memory, context compression) — a plain LangGraph agent with no SDK code works on wxO |
| **ADK v2.13+ native agent style** | For native wxO orchestrator agents, use `style: react_core` — `style: default/react/planner` are deprecated |
