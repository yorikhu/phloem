#!/usr/bin/env bash
# ============================================================
# Phloem Health Check Script
#
# 用法：
#   ./healthcheck.sh              # 检查所有服务
#   ./healthcheck.sh --rfonly    # 仅检查 RAGFlow + 基础设施
#   ./healthcheck.sh --quick     # 仅 HTTP 探活，不做业务冒烟
# ============================================================

set -euo pipefail

MODE="${1:-full}"

GATEWAY_URL="${PHLOEM_GATEWAY_URL:-http://localhost:3000}"
WEB_URL="${PHLOEM_WEB_URL:-http://localhost:5173}"
RAGFLOW_URL="${RAGFLOW_URL:-http://localhost:9380}"
RAGFLOW_API_KEY="${PHLOEM_RAGFLOW_API_KEY:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

http_check() {
  local name="$1" url="$2"
  if curl -sf "$url" >/dev/null 2>&1; then
    pass "$name — $url"
    return 0
  else
    fail "$name — $url"
    return 1
  fi
}

echo "============================================"
echo "Phloem Health Check"
echo "============================================"

errors=0

# ── 1. HTTP 探活 ───────────────────────────────────────
echo ""
echo "[ 基础探活 ]"
http_check "Gateway"   "$GATEWAY_URL/api/v1/health"  || ((errors++))
http_check "Web UI"    "$WEB_URL"                       || ((errors++))
http_check "RAGFlow"   "$RAGFLOW_URL/health"             || ((errors++))

# ── 2. RAGFlow API 冒烟测试（需要 API Key）─────────────
if [[ "$MODE" != "quick" ]]; then
  echo ""
  echo "[ RAGFlow API 冒烟测试 ]"

  if [[ -z "$RAGFLOW_API_KEY" ]]; then
    warn "PHLOEM_RAGFLOW_API_KEY 未设置，跳过业务冒烟测试"
    warn "设置方式：在 .env 中填入 RAGFlow Web UI → Settings → API Keys"
  else
    # 2a. 创建测试知识库
    test_dataset_id=$(curl -sf -X POST \
      -H "Authorization: Bearer $RAGFLOW_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"name":"__phloem_health_check__","description":"Phloem health check temp dataset"}' \
      "$RAGFLOW_URL/api/v1/datasets" \
      --max-time 10 \
      -w "\n%{http_code}" | tail -1)

    http_code="${test_dataset_id##*$'\n'}"
    dataset_id="${test_dataset_id%$http_code*}"

    if [[ "$http_code" == "200" ]] && [[ -n "$dataset_id" ]]; then
      pass "创建知识库 — HTTP $http_code, ID: $dataset_id"

      # 2b. 列出知识库（验证读权限）
      list_code=$(curl -sf -H "Authorization: Bearer $RAGFLOW_API_KEY" \
        "$RAGFLOW_URL/api/v1/datasets?page=1&size=20" \
        --max-time 10 -o /dev/null -w "%{http_code}")

      if [[ "$list_code" == "200" ]]; then
        pass "列出知识库 — HTTP $list_code"
      else
        fail "列出知识库 — HTTP $list_code"
        ((errors++))
      fi

      # 2c. 删除测试知识库（清理）
      del_code=$(curl -sf -X DELETE \
        -H "Authorization: Bearer $RAGFLOW_API_KEY" \
        "$RAGFLOW_URL/api/v1/datasets/$dataset_id" \
        --max-time 10 -o /dev/null -w "%{http_code}")

      if [[ "$del_code" == "200" || "$del_code" == "204" ]]; then
        pass "删除知识库 — HTTP $del_code（清理完成）"
      else
        warn "删除知识库 — HTTP $del_code（可能残留，请手动清理知识库 ID: $dataset_id）"
      fi
    else
      fail "创建知识库 — HTTP $http_code"
      ((errors++))
    fi
  fi
fi

# ── 3. 总结 ────────────────────────────────────────────
echo ""
echo "============================================"
if [[ $errors -eq 0 ]]; then
  echo -e "${GREEN}全部检查通过${NC}"
  exit 0
else
  echo -e "${RED}有 $errors 项检查失败${NC}"
  exit 1
fi
