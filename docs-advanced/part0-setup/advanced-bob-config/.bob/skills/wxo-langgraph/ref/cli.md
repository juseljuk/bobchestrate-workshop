# wxO LangGraph — Key CLI Commands

```bash
# ── Agent lifecycle ────────────────────────────────────────────────────────────

# Import a LangGraph agent package
orchestrate agents import \
  --package-root agents/my_agent \
  --config-file agents/my_agent/agent.yaml

# List all agents
orchestrate agents list

# Remove a LangGraph agent
orchestrate agents remove -n my_agent -k agent

# Export an agent (zip with all dependencies)
orchestrate agents export -n my_agent -k agent -o my_agent.zip

# ── Connections ────────────────────────────────────────────────────────────────

# Create a connection
orchestrate connections add -a my_connection

# Configure as key_value (supports arbitrary key=value credential pairs)
orchestrate connections configure -a my_connection --env draft -t team -k key_value

# Set credentials
orchestrate connections set-credentials -a my_connection --env draft -e api_key=$MY_KEY

# List connections
orchestrate connections list

# Manually associate a connection if not declared in agent.yaml
orchestrate agents connect -n my_agent -a my_connection

# ── Models ─────────────────────────────────────────────────────────────────────

# List available models (use IDs in ChatWxO and native agent YAML)
orchestrate models list
```
