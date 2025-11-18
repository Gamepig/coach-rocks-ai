#!/bin/bash

# Resend 域名驗證監控腳本
# 每 60 秒檢查一次驗證狀態，最多檢查 30 次（30 分鐘）

DOMAIN_ID="8c318035-0073-4a0d-a4c1-093b0a59486b"
API_KEY="re_Jcgku2wZ_MPQrHu2Mu2tzumUrZx9uwtb3"
MAX_CHECKS=30
CHECK_INTERVAL=60

echo "🔍 開始監控 Resend 域名驗證狀態"
echo "域名: coachrocks.com"
echo "檢查間隔: ${CHECK_INTERVAL} 秒"
echo "最大檢查次數: ${MAX_CHECKS}"
echo "預估最大時間: $((MAX_CHECKS * CHECK_INTERVAL / 60)) 分鐘"
echo "================================================"
echo ""

for i in $(seq 1 $MAX_CHECKS); do
  echo "[$i/$MAX_CHECKS] $(date '+%Y-%m-%d %H:%M:%S') - 檢查中..."

  # 獲取域名狀態
  RESPONSE=$(curl -s -X GET "https://api.resend.com/domains/${DOMAIN_ID}" \
    -H "Authorization: Bearer ${API_KEY}")

  # 提取狀態
  DOMAIN_STATUS=$(echo "$RESPONSE" | jq -r '.status')
  DKIM_STATUS=$(echo "$RESPONSE" | jq -r '.records[] | select(.record=="DKIM") | .status')
  SPF_MX_STATUS=$(echo "$RESPONSE" | jq -r '.records[] | select(.record=="SPF" and .type=="MX") | .status')
  SPF_TXT_STATUS=$(echo "$RESPONSE" | jq -r '.records[] | select(.record=="SPF" and .type=="TXT") | .status')

  # 顯示狀態
  echo "  域名狀態: $DOMAIN_STATUS"
  echo "  DKIM: $DKIM_STATUS"
  echo "  SPF MX: $SPF_MX_STATUS"
  echo "  SPF TXT: $SPF_TXT_STATUS"

  # 檢查是否全部驗證完成
  if [ "$DOMAIN_STATUS" = "verified" ]; then
    echo ""
    echo "================================================"
    echo "🎉 成功！域名已完全驗證！"
    echo "================================================"
    echo ""
    echo "✅ 下一步："
    echo "1. 測試郵件發送到 vichuang56@hotmail.com"
    echo "2. 執行: export RESEND_API_KEY=${API_KEY} && node test-vichuang-email.js"
    exit 0
  fi

  # 如果還在 pending，繼續等待
  if [ $i -lt $MAX_CHECKS ]; then
    echo "  ⏰ 等待 ${CHECK_INTERVAL} 秒後再次檢查..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo ""
echo "================================================"
echo "⚠️  已達最大檢查次數 (${MAX_CHECKS} 次)"
echo "================================================"
echo ""
echo "當前狀態:"
echo "  域名: $DOMAIN_STATUS"
echo "  DKIM: $DKIM_STATUS"
echo "  SPF MX: $SPF_MX_STATUS"
echo "  SPF TXT: $SPF_TXT_STATUS"
echo ""
echo "📋 建議："
echo "1. 手動檢查 Resend Dashboard: https://resend.com/domains"
echo "2. 如果 24 小時後仍未驗證，聯繫 Resend 支援"
echo "3. Email: support@resend.com"
echo "4. 域名 ID: ${DOMAIN_ID}"
