#!/usr/bin/env bash
# 列出 GitLab Pipeline Schedules
# 用途: 快速查看所有排程狀態

set -euo pipefail

PROJECT_PATH="coach-rocks/coach-rocks"
PROJECT_ID="${PROJECT_PATH//\//%2F}"
GITLAB_URL="https://gitlab.com"

# 取得 GitLab Token
if [ -z "${GITLAB_TOKEN:-}" ]; then
  echo "請輸入 GitLab Personal Access Token（需要 api scope）:"
  read -s GITLAB_TOKEN
  echo ""
  export GITLAB_TOKEN
fi

# 取得所有排程
SCHEDULES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_URL/api/v4/projects/$PROJECT_ID/pipeline_schedules")

SCHEDULE_COUNT=$(echo "$SCHEDULES" | jq -r '. | length')

if [ "$SCHEDULE_COUNT" -eq 0 ]; then
  echo "✅ 沒有找到任何排程"
  exit 0
fi

echo "找到 $SCHEDULE_COUNT 個排程："
echo ""
echo "$SCHEDULES" | jq -r '.[] | "ID: \(.id) | 描述: \(.description // "無描述") | 啟用: \(.active) | 下次執行: \(.next_run_at // "無")"'

