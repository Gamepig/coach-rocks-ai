#!/bin/bash
# 檢查 GitLab Token 權限和專案存取等級

set -e

echo "=========================================="
echo "GitLab Token 權限檢查"
echo "=========================================="
echo ""

# 從環境變數或提示取得 Token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "請輸入 GitLab Personal Access Token:"
  read -s GITLAB_TOKEN
  echo ""
fi

PROJECT_PATH="coach-rocks/coach-rocks"

echo "📋 檢查專案資訊..."
echo ""

# 檢查專案資訊（需要 read_api 或 api scope）
echo "1. 檢查專案存取等級..."
PROJECT_INFO=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/${PROJECT_PATH//\//%2F}")

if [ $? -eq 0 ]; then
  echo "$PROJECT_INFO" | jq -r '.permissions.project_access // .permissions.group_access // "無法取得權限資訊"'
  echo ""
  echo "專案資訊："
  echo "$PROJECT_INFO" | jq -r '{
    name: .name,
    path_with_namespace: .path_with_namespace,
    default_branch: .default_branch,
    visibility: .visibility
  }'
else
  echo "❌ 無法取得專案資訊（可能需要 api scope）"
fi

echo ""
echo "=========================================="
echo "2. 檢查分支保護設定..."
echo "=========================================="
echo ""

# 檢查保護分支（需要 api scope）
PROTECTED_BRANCHES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/${PROJECT_PATH//\//%2F}/protected_branches")

if [ $? -eq 0 ] && [ "$PROTECTED_BRANCHES" != "[]" ]; then
  echo "保護分支列表："
  echo "$PROTECTED_BRANCHES" | jq -r '.[] | "  - \(.name) (允許強制推送: \(.allow_force_push))"'
else
  echo "❌ 無法取得保護分支資訊（可能需要 api scope）"
fi

echo ""
echo "=========================================="
echo "3. Token 權限建議"
echo "=========================================="
echo ""

echo "當前 Token scopes: write_repository, read_repository"
echo ""
echo "如果需要取消分支保護，需要："
echo "  - api scope（可以透過 API 取消保護）"
echo "  或"
echo "  - 專案權限：Maintainer 或 Owner（可以在網頁取消保護）"
echo ""
echo "建立新 Token（包含 api scope）："
echo "  1. 前往: https://gitlab.com/-/profile/personal_access_tokens"
echo "  2. Token name: coach-rocks-admin"
echo "  3. Scopes: 勾選 api, write_repository"
echo "  4. 建立後使用新 Token 執行此腳本"
echo ""

