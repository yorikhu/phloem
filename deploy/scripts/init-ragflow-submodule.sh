#!/usr/bin/env bash
# ============================================================
# Phloem — Initialize RAGFlow Submodule
#
# 用途：从 GitHub Fork 添加 RAGFlow 为 Git Submodule，
#       用于需要修改 RAGFlow 内部逻辑的场景。
#
#       如果只需运行官方功能，直接用 docker compose 即可
#       （默认使用预构建镜像，无需此脚本）。
#
# 用法：
#   cd /path/to/Phloem/Phloem
#   ./deploy/scripts/init-ragflow-submodule.sh <YOUR_GITHUB_USERNAME>
#
# 示例：
#   ./deploy/scripts/init-ragflow-submodule.sh mycompany
# ============================================================

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <YOUR_GITHUB_USERNAME>"
  echo "示例: $0 mycompany"
  exit 1
fi

GITHUB_USER="$1"
FORK_URL="https://github.com/${GITHUB_USER}/ragflow.git"
VENDOR_DIR="$(cd "$(dirname "$0")/../.." && pwd)/vendor/ragflow"

echo "============================================"
echo "Phloem — RAGFlow Submodule Init"
echo "============================================"
echo "Fork URL : $FORK_URL"
echo "Target   : $VENDOR_DIR"
echo ""

# 检查是否已是 submodule
if [[ -d "$VENDOR_DIR/.git" ]]; then
  echo "[SKIP] vendor/ragflow 已是 submodule，跳过。"
  exit 0
fi

# 检查目录是否为空（只有占位 README）
if [[ -n "$(ls -A "$VENDOR_DIR" 2>/dev/null)" ]]; then
  README_COUNT=$(find "$VENDOR_DIR" -maxdepth 1 -name 'README.md' | wc -l | tr -d ' ')
  if [[ "$README_COUNT" -eq 1 ]]; then
    echo "[OK] 目录仅含 README，占位有效，继续..."
  else
    echo "[WARN] vendor/ragflow 非空且非 submodule，请先手动处理。"
    exit 1
  fi
fi

echo "[1/3] 添加 Git Submodule..."
git submodule add \
  --name ragflow \
  "$FORK_URL" \
  vendor/ragflow

echo "[2/3] 初始化 Submodule..."
git submodule update --init --recursive

echo "[3/3] 验证..."
if [[ -f "$VENDOR_DIR/Dockerfile" ]]; then
  echo "  ✓ Dockerfile 存在"
else
  echo "  ✗ Dockerfile 未找到，请检查 Fork 是否包含完整历史"
  exit 1
fi

echo ""
echo "============================================"
echo "Submodule 初始化完成！"
echo ""
echo "切换到源码构建模式："
echo "  1. 编辑 .env，注释掉或清空 RAGFLOW_IMAGE"
echo "  2. 运行: docker compose build ragflow-server"
echo "  3. 运行: docker compose up -d --wait"
echo "============================================"
