#!/usr/bin/env bash
# Phloem health check script
# Checks gateway, web, and RAGFlow (if enabled)

set -euo pipefail

GATEWAY_URL="${PHLOEM_GATEWAY_URL:-http://localhost:3000}"
WEB_URL="${PHLOEM_WEB_URL:-http://localhost:5173}"
RAGFLOW_URL="${PHLOEM_RAGFLOW_URL:-http://localhost:9380}"

check() {
  local name="$1"
  local url="$2"
  if curl -sf "$url" >/dev/null 2>&1; then
    echo "  [OK] $name — $url"
    return 0
  else
    echo "  [FAIL] $name — $url"
    return 1
  fi
}

echo "Phloem Health Check"
echo "==================="
check "Gateway" "$GATEWAY_URL/api/v1/health" || true
check "Web" "$WEB_URL" || true

if [ "${PHLOEM_ADAPTER_TYPE:-mock}" = "ragflow" ]; then
  check "RAGFlow" "$RAGFLOW_URL" || true
fi
