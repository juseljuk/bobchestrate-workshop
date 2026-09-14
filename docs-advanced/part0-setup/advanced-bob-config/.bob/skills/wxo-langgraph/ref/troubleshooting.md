# wxO LangGraph — Troubleshooting Reference

| Problem | Cause | Fix |
|---|---|---|
| `Missing api_proxy_url` | Wrong client init | Use `Client.from_runnable_config(config)` not `Client()` |
| Custom state resets each turn | wxO only persists `messages` | Use SDK memory API for cross-turn data |
| Import fails: package too large | Package > 50 MB | Never include `.venv/` in `--package-root` |
| Import fails: entrypoint not found | Wrong format | Must be `"module_name:function_name"` — no `.py` extension |
| Credentials missing at runtime | Connection not mapped | Declare in `connections:` in `agent.yaml` or run `orchestrate agents connect -n agent -a connection` |
| `Invalid memory_type` | Wrong type string | Use: `preference`, `profile_fact`, `conversational`, `outcome`, `tool` |
| SQLite state lost after redeploy | Pod restart clears SQLite | Switch to PostgreSQL checkpointer for production |
| `ChatWxO` authentication error | Wrong SDK mode | Inside `runs-on`: use `from_runnable_config(config)`; outside wxO: use `Client(api_key=..., instance_url=...)` |
| LLM not calling tools | Unclear tool descriptions | Write crisp, specific docstrings — the LLM reads them to decide when to call each tool |
| Connection env var not found | App ID mismatch | Env var format: `{app_id}_{credential_key}` — verify app_id matches the connection exactly |
| Import fails: `kind: native` | Wrong YAML kind | LangGraph package imports must use `kind: agent` not `kind: native` |
| Compiled graph returned | `.compile()` called in factory | `create_agent()` must return the builder — `.compile()` only in `__main__` |
| Agent not found as collaborator | Name mismatch | The `collaborators:` entry must match the `name:` field in the LangGraph `agent.yaml` exactly |
