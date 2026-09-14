#!/usr/bin/env bash
# import-all.sh — Advanced Part 2: Event-Driven AI Agents with Confluent Cloud
# Run from the advanced/part2-confluent/ directory.
# Usage: bash import-all.sh
#
# NOTE: This script verifies the watsonx Orchestrate side of the lab.
# The agent, tools, and knowledge base are created by Bob during the lab (Section 4).
# Run this after completing Section 4 to confirm everything is in place.

set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Advanced Part 2 — Event-Driven AI Agents        ║"
echo "║  watsonx Orchestrate verification script         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Check tools ───────────────────────────────────────────────────────────────
echo "🔍 Checking tools..."
TOOLS=$(orchestrate tools list 2>/dev/null || echo "")

if echo "$TOOLS" | grep -q "get_store_location"; then
  echo "✅ get_store_location — found"
else
  echo "❌ get_store_location — NOT found (complete Section 4.1 in the lab)"
fi

if echo "$TOOLS" | grep -q "get_weather_forecast"; then
  echo "✅ get_weather_forecast — found"
else
  echo "❌ get_weather_forecast — NOT found (complete Section 4.2 in the lab)"
fi
echo ""

# ── Check knowledge base ──────────────────────────────────────────────────────
echo "🔍 Checking knowledge base..."
KBS=$(orchestrate knowledge-bases list 2>/dev/null || echo "")

if echo "$KBS" | grep -q "inventory-alert-knowledge"; then
  echo "✅ inventory-alert-knowledge — found"
else
  echo "❌ inventory-alert-knowledge — NOT found (complete Section 4.4 in the lab)"
fi
echo ""

# ── Check agent ───────────────────────────────────────────────────────────────
echo "🔍 Checking agent..."
AGENTS=$(orchestrate agents list 2>/dev/null || echo "")

if echo "$AGENTS" | grep -qi "fashion.*inventory\|Fashion_Inventory_Alert_Processor"; then
  echo "✅ Fashion_Inventory_Alert_Processor — found"
else
  echo "❌ Fashion_Inventory_Alert_Processor — NOT found (complete Section 4.5 in the lab)"
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────────────"
echo "If all items show ✅, your wxO setup is complete."
echo "Continue to Section 5 to configure the Python consumer."
echo ""
echo "If any items show ❌, return to the relevant section"
echo "in the lab guide and use Bob to create the missing artifact."
echo "────────────────────────────────────────────────────"
echo ""
