#!/bin/bash

echo "🧪 測試發送郵件到 vichuang56@hotmail.com"
echo "======================================"
echo ""

# 從 wrangler 環境獲取 API Key
echo "請輸入 RESEND_API_KEY (或按 Ctrl+C 取消):"
read -s RESEND_API_KEY

if [ -z "$RESEND_API_KEY" ]; then
  echo "❌ 錯誤: 未提供 API Key"
  exit 1
fi

echo ""
echo "測試 1: 發送到 vichuang56@hotmail.com (測試域名)"
echo "--------------------------------------"

curl -X POST 'https://api.resend.com/emails' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -d '{
    "from": "CoachRocks AI <onboarding@resend.dev>",
    "to": ["vichuang56@hotmail.com"],
    "subject": "✅ CoachRocks AI - 郵件測試",
    "html": "<h1>測試成功！</h1><p>如果您收到這封郵件，表示系統可以正常發送到 vichuang56@hotmail.com</p><p>測試時間: '"$(date)"'</p>"
  }'

echo ""
echo ""
echo "測試 2: 發送到 gamepig1976@gmail.com (對照組)"
echo "--------------------------------------"

curl -X POST 'https://api.resend.com/emails' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -d '{
    "from": "CoachRocks AI <onboarding@resend.dev>",
    "to": ["gamepig1976@gmail.com"],
    "subject": "✅ CoachRocks AI - 郵件測試 (對照組)",
    "html": "<h1>測試成功！</h1><p>這是對照組測試郵件</p><p>測試時間: '"$(date)"'</p>"
  }'

echo ""
echo ""
echo "======================================"
echo "測試完成！請檢查兩個郵箱。"
echo "======================================"
