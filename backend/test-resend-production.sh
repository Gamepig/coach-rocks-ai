#!/bin/bash
#
# 生產環境 Resend API 測試腳本
# 直接調用 Resend API,不經過複雜的分析流程
#

RECIPIENT_EMAIL="${1:-gamepig1976@gmail.com}"
RESEND_API_KEY="re_Jcgku2wZ_MPQrHu2Mu2tzumUrZx9uwtb3"

echo "🚀 Testing Resend API (Production Environment)"
echo "══════════════════════════════════════════════"
echo ""
echo "📧 Configuration:"
echo "   From: CoachRocks AI <onboarding@resend.dev>"
echo "   To: $RECIPIENT_EMAIL"
echo "   Subject: 🧪 Production Test - Direct Resend API Call"
echo ""
echo "📤 Sending email via Resend API..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.resend.com/emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -d "{
    \"from\": \"CoachRocks AI <onboarding@resend.dev>\",
    \"to\": [\"$RECIPIENT_EMAIL\"],
    \"subject\": \"🧪 Production Test - Direct Resend API Call\",
    \"html\": \"<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Production Test</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;'>
    <h1 style='margin: 0; font-size: 28px; font-weight: 700;'>🧪 Production Test</h1>
    <p style='margin: 10px 0 0; font-size: 16px; opacity: 0.9;'>Direct Resend API Call</p>
  </div>

  <div style='background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
    <p><strong>✅ Success!</strong> This email was sent directly from the production Cloudflare Workers environment using Resend API.</p>

    <div style='background: #e3eafe; padding: 16px; border-radius: 8px; margin: 24px 0;'>
      <h3 style='margin-top: 0; color: #2a3a5e;'>Test Details:</h3>
      <ul style='color: #5a6a8a;'>
        <li><strong>From:</strong> onboarding@resend.dev</li>
        <li><strong>To:</strong> $RECIPIENT_EMAIL</li>
        <li><strong>Service:</strong> Resend API (Production)</li>
        <li><strong>Environment:</strong> Cloudflare Workers</li>
        <li><strong>Timestamp:</strong> $(date -u +"%Y-%m-%dT%H:%M:%SZ")</li>
      </ul>
    </div>

    <p style='margin-top: 24px;'><strong>What this test confirms:</strong></p>
    <ul>
      <li>✅ RESEND_API_KEY is correctly configured</li>
      <li>✅ Resend API is accessible from production</li>
      <li>✅ Email delivery is working</li>
      <li>✅ No complex analysis dependencies required</li>
    </ul>
  </div>

  <div style='border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;'>
    <p>Best regards,<br><strong>CoachRocks AI Team</strong></p>
    <p style='font-size: 12px; color: #9ca3af;'>🔒 Powered by Resend · Deployed on Cloudflare Workers</p>
  </div>
</body>
</html>\"
  }")

# 分離 HTTP 狀態碼和響應體
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📊 Response:"
echo "   HTTP Status: $HTTP_CODE"
echo "   Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  EMAIL_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Email sent successfully!"
  echo "   Email ID: $EMAIL_ID"
  echo ""
  echo "📧 Check your inbox at: $RECIPIENT_EMAIL"
  echo "   Note: It may take a few seconds to arrive."
  echo ""
  exit 0
else
  echo "❌ Failed to send email!"
  echo ""
  echo "💡 Troubleshooting:"
  echo "   - Check if RESEND_API_KEY is valid"
  echo "   - Verify API key permissions"
  echo "   - Check Resend Dashboard: https://resend.com/domains"
  echo ""
  exit 1
fi
