---
name: wxo-langgraph
description: Use when the user wants to build, create, package, import, configure, or deploy a LangGraph agent for watsonx Orchestrate (wxO) — covers the entry point contract, agent structure, pure LangGraph usage, ChatWxO, tool-calling, wxO Connections for credentials, checkpointers, cross-session memory, context compression, and registering as a collaborator.
---

# Building LangGraph Agents for watsonx Orchestrate

<Steps>

<Step>
**Read `constraints.md` first — always.**
These are hard runtime limits that apply to every answer. Never generate code or YAML that violates them.
</Step>

<Step>
**Identify the user's need and read only the relevant companion file(s).**

| User is asking about… | Read |
|---|---|
| Entry point, `create_agent`, `RunnableConfig`, what wxO requires | `ref/agent-yaml.md` §entry-point |
| Project layout, `agent.yaml` fields, `requirements.txt`, packaging | `ref/agent-yaml.md` |
| Building a first / minimal agent from scratch | `ref/agent-yaml.md` + show `patterns/hello-world.py` |
| Using Groq, Ollama, Azure, or any OpenAI-compatible API (no SDK) | show `patterns/external-llm.py` |
| wxO-managed LLMs via `ChatWxO` | `ref/agent-yaml.md` §ChatWxO |
| Adding tools, tool-calling, ReAct loop, `ToolNode`, `lc_tool` | `ref/agent-yaml.md` + `patterns/production-agent.py` (tools section) |
| API keys, credentials, connections, `os.environ` | `ref/agent-yaml.md` §connections |
| In-session state persistence, checkpointers, SQLite, PostgreSQL | `ref/agent-yaml.md` §checkpointer |
| Cross-session memory, `client.memory`, personalisation | `ref/agent-yaml.md` §memory + `patterns/production-agent.py` (memory section) |
| Token limits, context compression, `client.context.compress` | `patterns/production-agent.py` (compression section) |
| Agentic SDK `Client` init modes, auth errors, local dev | `ref/agent-yaml.md` §sdk-modes |
| Wiring agent as collaborator of a native wxO agent | show `patterns/orchestrator-agent.yaml` |
| Complete production agent, full end-to-end example | `ref/agent-yaml.md` + show `patterns/production-agent.py` in full |
| Debugging, errors, unexpected behaviour | `ref/troubleshooting.md` |
| CLI commands for import, export, connections | `ref/cli.md` |

**Do not read files not relevant to the request.**
</Step>

<Step>
**Generate or explain based only on what the relevant file(s) contain.**

- Adapt patterns from the `patterns/` files to the user's specific use case.
- When showing code, always note which constraints from `constraints.md` apply.
- For targeted questions (credentials, checkpointers, memory, etc.) show only the relevant snippet — not the full production agent.
- Only show `patterns/production-agent.py` in full when the user explicitly asks for a complete agent.
</Step>

<Step>
**Validate the output against `constraints.md` before finishing.**

Check that generated code and YAML do not violate any constraint. Common mistakes to catch:
- `.compile()` called inside `create_agent()` instead of only in `__main__`
- `kind: native` instead of `kind: agent` in agent.yaml
- Hardcoded API keys instead of `os.environ.get()`
- wxO `@tool` imported instead of `lc_tool` from `langchain_core.tools`
- `ibm-watsonx-orchestrate` included in `requirements.txt`
</Step>

</Steps>
