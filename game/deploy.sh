#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Bobchestrate Coins — deploy to IBM Cloud Code Engine (eu-de)
#
# Usage:
#   export IBMCLOUD_API_KEY=your-api-key
#   export ICR_NAMESPACE=your-icr-namespace
#   ./deploy.sh
#
# Optional overrides (env vars):
#   ICR_REGION    IBM Container Registry region  (default: de.icr.io)
#   IMAGE_NAME    Container image name           (default: bobchestrate-coins)
#   CE_PROJECT    Code Engine project name       (default: bobchestrate-workshop)
#   CE_APP_NAME   Code Engine app name           (default: bobchestrate-coins)
#   CE_REGION     IBM Cloud region               (default: eu-de)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
ICR_REGION="${ICR_REGION:-de.icr.io}"
ICR_NAMESPACE="${ICR_NAMESPACE:?ERROR: ICR_NAMESPACE env var is required}"
IMAGE_NAME="${IMAGE_NAME:-bobchestrate-coins}"
CE_PROJECT="${CE_PROJECT:-bobchestrate-workshop}"
CE_APP_NAME="${CE_APP_NAME:-bobchestrate-coins}"
CE_REGION="${CE_REGION:-eu-de}"
IBMCLOUD_API_KEY="${IBMCLOUD_API_KEY:?ERROR: IBMCLOUD_API_KEY env var is required}"

FULL_IMAGE="${ICR_REGION}/${ICR_NAMESPACE}/${IMAGE_NAME}:latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Bobchestrate Coins — Deploy to Code Engine     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Registry : ${ICR_REGION}/${ICR_NAMESPACE}"
echo "  Image    : ${IMAGE_NAME}:latest"
echo "  Project  : ${CE_PROJECT}"
echo "  App      : ${CE_APP_NAME}"
echo "  Region   : ${CE_REGION}"
echo ""

# ── Step 1: IBM Cloud login ───────────────────────────────────────────────────
echo "▶  Logging in to IBM Cloud (${CE_REGION})..."
ibmcloud login --apikey "${IBMCLOUD_API_KEY}" -r "${CE_REGION}" -q

# ── Step 2: Container Registry login ─────────────────────────────────────────
echo "▶  Setting Container Registry region to ${CE_REGION}..."
ibmcloud cr region-set "${CE_REGION}"
echo "▶  Logging in to Container Registry..."
ibmcloud cr login

# ── Step 3: Build and push image ──────────────────────────────────────────────
echo "▶  Building Docker image..."
docker build -t "${FULL_IMAGE}" "${SCRIPT_DIR}"

echo "▶  Pushing image to ${ICR_REGION}..."
docker push "${FULL_IMAGE}"

# ── Step 4: Target Code Engine project ────────────────────────────────────────
echo "▶  Targeting Code Engine project '${CE_PROJECT}'..."
ibmcloud ce project select --name "${CE_PROJECT}"

# ── Step 5: Create or update Code Engine application ─────────────────────────
echo "▶  Deploying application '${CE_APP_NAME}'..."

if ibmcloud ce application get --name "${CE_APP_NAME}" > /dev/null 2>&1; then
  echo "   Application exists — updating..."
  ibmcloud ce application update \
    --name "${CE_APP_NAME}" \
    --image "${FULL_IMAGE}" \
    --min-scale 0 \
    --max-scale 3 \
    --port 8080 \
    --wait
else
  echo "   Application does not exist — creating..."
  ibmcloud ce application create \
    --name "${CE_APP_NAME}" \
    --image "${FULL_IMAGE}" \
    --min-scale 0 \
    --max-scale 3 \
    --port 8080 \
    --wait
fi

# ── Step 6: Print the public URL ──────────────────────────────────────────────
echo ""
echo "✅  Deployment complete!"
echo ""
APP_URL=$(ibmcloud ce application get --name "${CE_APP_NAME}" --output json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',{}).get('url','(URL not found — check: ibmcloud ce application get --name ${CE_APP_NAME})'))" 2>/dev/null \
  || echo "(run: ibmcloud ce application get --name ${CE_APP_NAME})")
echo "   🎮  Game URL: ${APP_URL}"
echo ""
echo "   Share this URL with participants after they complete all advanced quizzes."
echo "   Update GAME_URL in docs-advanced/javascripts/quiz.js to reveal it in the dashboard."
echo ""
