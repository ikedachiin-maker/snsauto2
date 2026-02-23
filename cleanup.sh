#!/bin/bash
# ============================================
# snsauto リポジトリ クリーンアップスクリプト
# Git Bash で実行: bash cleanup.sh
# ============================================

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== クリーンアップ開始: $REPO_DIR ==="
echo ""

# --- 1. クリーンアップ前のサイズ確認 ---
echo "[1/5] 現在のディスク使用量を確認中..."
BEFORE=$(du -sm "$REPO_DIR" | awk '{print $1}')
GIT_BEFORE=$(du -sm "$REPO_DIR/.git" 2>/dev/null | awk '{print $1}')
echo "  全体: ${BEFORE}MB"
echo "  .git: ${GIT_BEFORE}MB"
echo ""

# --- 2. Git履歴から大きなファイル(mp4等)を除去 ---
echo "[2/5] Git履歴から不要な大容量ファイルを除去中..."
FILTER_BRANCH_SQUELCH_WARNING=1 git -C "$REPO_DIR" filter-branch --force \
  --index-filter 'git rm --cached --ignore-unmatch "*.mp4" "*.avi" "*.mov" "*.mkv" "*.zip" "*.rar"' \
  --prune-empty -- --all 2>/dev/null || true

# filter-branchのバックアップrefを削除
git -C "$REPO_DIR" for-each-ref --format='%(refname)' refs/original/ 2>/dev/null | \
  while read ref; do git -C "$REPO_DIR" update-ref -d "$ref"; done
echo "  完了"
echo ""

# --- 3. Reflog期限切れ + ガベージコレクション ---
echo "[3/5] Gitオブジェクトをガベージコレクション中..."
git -C "$REPO_DIR" reflog expire --expire=now --all 2>/dev/null
git -C "$REPO_DIR" gc --prune=now --aggressive 2>/dev/null
echo "  完了"
echo ""

# --- 4. node_modules 削除 ---
echo "[4/5] node_modules を検索・削除中..."
NODE_COUNT=0
while IFS= read -r -d '' dir; do
  SIZE=$(du -sm "$dir" | awk '{print $1}')
  echo "  削除: $dir (${SIZE}MB)"
  rm -rf "$dir"
  NODE_COUNT=$((NODE_COUNT + 1))
done < <(find "$REPO_DIR" -type d -name "node_modules" -print0 2>/dev/null)

if [ "$NODE_COUNT" -eq 0 ]; then
  echo "  node_modules は見つかりませんでした"
fi
echo ""

# --- 5. クリーンアップ後のサイズ確認 ---
echo "[5/5] クリーンアップ後のディスク使用量..."
AFTER=$(du -sm "$REPO_DIR" | awk '{print $1}')
GIT_AFTER=$(du -sm "$REPO_DIR/.git" 2>/dev/null | awk '{print $1}')
SAVED=$((BEFORE - AFTER))
echo "  全体: ${AFTER}MB (削減: ${SAVED}MB)"
echo "  .git: ${GIT_AFTER}MB (削減: $((GIT_BEFORE - GIT_AFTER))MB)"
echo ""
echo "=== クリーンアップ完了 ==="
echo "※ node_modules は必要な時に npm install で復元できます"
