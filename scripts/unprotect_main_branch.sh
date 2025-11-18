#!/bin/bash
# 使用 GitLab API 取消 main 分支保護

set -e

PROJECT_PATH="coach-rocks/coach-rocks"
PROJECT_ID="${PROJECT_PATH//\//%2F}"

echo "=========================================="
echo "取消 GitLab main 分支保護"
echo "=========================================="
echo ""

# 從環境變數或提示取得 Token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "請輸入 GitLab Personal Access Token（需要 api scope）:"
  read -s GITLAB_TOKEN
  echo ""
fi

echo "📋 檢查當前保護分支..."
PROTECTED_BRANCHES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/protected_branches")

if echo "$PROTECTED_BRANCHES" | grep -q "main"; then
  echo "✅ 找到 main 分支保護設定"
  echo ""
  
  echo "⚠️  準備取消 main 分支保護..."
  echo "   這將允許強制推送"
  echo ""
  read -p "確認繼續？(y/N): " confirm
  
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
  fi
  
  echo ""
  echo "🔄 取消保護..."
  RESPONSE=$(curl -s -X DELETE \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://gitlab.com/api/v4/projects/$PROJECT_ID/protected_branches/main")
  
  if [ $? -eq 0 ]; then
    echo "✅ main 分支保護已取消"
    echo ""
    echo "現在可以執行強制推送："
    echo "  cd /Users/gamepig/projects/coach-rocks-main/gitlab-upload"
    echo "  git push -u origin main --force"
  else
    echo "❌ 取消保護失敗"
    echo "可能原因："
    echo "  1. Token 沒有 api scope"
    echo "  2. Token 沒有足夠的專案權限"
    echo "  3. 專案設定不允許取消保護"
    echo ""
    echo "建議："
    echo "  1. 建立新 Token（包含 api scope）"
    echo "  2. 或在 GitLab 網頁中取消保護："
    echo "     https://gitlab.com/$PROJECT_PATH/-/settings/repository"
  fi
else
  echo "❌ 無法找到 main 分支保護設定"
  echo "可能原因："
  echo "  1. Token 沒有 api scope"
  echo "  2. main 分支未受保護"
fi

echo ""

