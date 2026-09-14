#!/usr/bin/env bash
# import-all.sh — Advanced Part 1: LangGraph Agents
# Run from the advanced/part1-langgraph/ directory.
# Usage: bash import-all.sh

set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Advanced Part 1 — LangGraph Agents              ║"
echo "║  Import script                                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Section 2: Echo Agent (Hello World, no LLM, no SDK) ──────────────────────
echo "📦 Importing echo_agent (Section 2 — Hello World)..."
orchestrate agents import \
  --package-root agents/echo_agent \
  --config-file agents/echo_agent/agent.yaml
echo "✅ echo_agent imported"
echo ""

# ── Section 3: Simple LLM Agent (pure LangGraph + Groq via ChatOpenAI base_url) ──
echo "🔑 Setting up groq_connection (Section 3)..."
echo "   (Skipping if GROQ_API_KEY is not set)"
if [ -n "${GROQ_API_KEY:-}" ]; then
  orchestrate connections add -a groq_connection 2>/dev/null || true
  orchestrate connections configure -a groq_connection --env draft -t team -k key_value
  orchestrate connections set-credentials -a groq_connection --env draft -e api_key="$GROQ_API_KEY"
  echo "✅ groq_connection configured"

  echo "📦 Importing simple_llm_agent (Section 3 — pure LangGraph, ChatOpenAI + Groq)..."
  orchestrate agents import \
    --package-root agents/simple_llm_agent \
    --config-file agents/simple_llm_agent/agent.yaml
  echo "✅ simple_llm_agent imported"
else
  echo "⚠️  GROQ_API_KEY not set — skipping simple_llm_agent."
fi
echo ""

# ── Section 6: Connections for research agent ─────────────────────────────────
echo "🔑 Setting up news_api connection (Section 6)..."
echo "   (Skipping if NEWS_API_KEY is not set — set it to enable the news tool)"
if [ -n "${NEWS_API_KEY:-}" ]; then
  orchestrate connections add -a news_api 2>/dev/null || true
  orchestrate connections configure -a news_api --env draft -t team -k key_value
  orchestrate connections set-credentials -a news_api --env draft -e api_key="$NEWS_API_KEY"
  echo "✅ news_api connection configured"
else
  echo "⚠️  NEWS_API_KEY not set — skipping. Agent will run without the news tool."
fi
echo ""

# ── Sections 4–8: Research Agent (full build) ─────────────────────────────────
echo "📦 Importing research_agent (Sections 4–8 — full build)..."
orchestrate agents import \
  --package-root agents/research_agent \
  --config-file agents/research_agent/agent.yaml
echo "✅ research_agent imported"
echo ""

# ── Verify ────────────────────────────────────────────────────────────────────
echo "📋 Imported agents:"
orchestrate agents list | grep -E "echo_agent|simple_llm_agent|research_agent" || true
echo ""
echo "🎉 Done! Chat with your agents in the wxO UI."
