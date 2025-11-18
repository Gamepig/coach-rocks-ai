#!/bin/bash
# 測試 CORS 預檢請求（OPTIONS）

echo "🧪 測試 CORS 預檢請求（OPTIONS）"
echo ""

BACKEND_URL="https://coach-backend.gamepig1976.workers.dev"
API_URL="${BACKEND_URL}/api/analyze-authenticated-meeting"

echo "📋 測試配置:"
echo "  後端 URL: ${BACKEND_URL}"
echo "  API URL: ${API_URL}"
echo ""

echo "📡 發送 OPTIONS 預檢請求..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "${API_URL}" \
  -H "Origin: https://coach-rocks-frontend.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep -E "^< HTTP/[0-9]" | tail -1 | awk '{print $3}')
HEADERS=$(echo "$RESPONSE" | grep -E "^< ")

echo "📥 Response Status: ${HTTP_CODE}"
echo ""
echo "📥 Response Headers:"
echo "$HEADERS" | grep -E "^< " | sed 's/^< //'
echo ""

# 檢查關鍵 CORS headers（不區分大小寫）
if echo "$HEADERS" | grep -qi "access-control-allow-origin"; then
  ORIGIN_VALUE=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | head -1 | sed 's/.*access-control-allow-origin: //i' | tr -d '\r')
  echo "✅ Access-Control-Allow-Origin header 存在: ${ORIGIN_VALUE}"
else
  echo "❌ Access-Control-Allow-Origin header 缺失"
fi

if echo "$HEADERS" | grep -qi "access-control-allow-methods"; then
  METHODS_VALUE=$(echo "$HEADERS" | grep -i "access-control-allow-methods" | head -1 | sed 's/.*access-control-allow-methods: //i' | tr -d '\r')
  echo "✅ Access-Control-Allow-Methods header 存在: ${METHODS_VALUE}"
else
  echo "❌ Access-Control-Allow-Methods header 缺失"
fi

if echo "$HEADERS" | grep -qi "access-control-allow-headers"; then
  HEADERS_VALUE=$(echo "$HEADERS" | grep -i "access-control-allow-headers" | head -1 | sed 's/.*access-control-allow-headers: //i' | tr -d '\r')
  echo "✅ Access-Control-Allow-Headers header 存在: ${HEADERS_VALUE}"
else
  echo "❌ Access-Control-Allow-Headers header 缺失"
fi

if echo "$HEADERS" | grep -qi "access-control-allow-credentials"; then
  CREDENTIALS_VALUE=$(echo "$HEADERS" | grep -i "access-control-allow-credentials" | head -1 | sed 's/.*access-control-allow-credentials: //i' | tr -d '\r')
  echo "✅ Access-Control-Allow-Credentials header 存在: ${CREDENTIALS_VALUE}"
else
  echo "❌ Access-Control-Allow-Credentials header 缺失"
fi

if echo "$HEADERS" | grep -qi "access-control-max-age"; then
  MAX_AGE_VALUE=$(echo "$HEADERS" | grep -i "access-control-max-age" | head -1 | sed 's/.*access-control-max-age: //i' | tr -d '\r')
  echo "✅ Access-Control-Max-Age header 存在: ${MAX_AGE_VALUE}"
else
  echo "⚠️ Access-Control-Max-Age header 缺失（可選）"
fi

echo ""
# OPTIONS 請求通常返回 200 或 204
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "✅ OPTIONS 預檢請求成功 (Status: ${HTTP_CODE})"
else
  echo "❌ OPTIONS 預檢請求失敗 (Status: ${HTTP_CODE})"
fi

