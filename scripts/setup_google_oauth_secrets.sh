#!/bin/bash

# Google OAuth Secrets 設定腳本
# 用於設定生產環境的 Google OAuth 環境變數

set -e

echo "🔐 Google OAuth Secrets 設定"
echo "================================"
echo ""

# 進入 backend 目錄
cd "$(dirname "$0")/../backend" || exit 1

# 從 .dev.vars 讀取值（如果存在）
if [ -f ".dev.vars" ]; then
  echo "📖 從 .dev.vars 讀取設定值..."
  source <(grep "^GOOGLE_" .dev.vars | sed 's/^/export /')
fi

# 設定 GOOGLE_CLIENT_ID
if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "❌ 錯誤: GOOGLE_CLIENT_ID 未設定"
  echo "請在 .dev.vars 中設定，或手動執行: wrangler secret put GOOGLE_CLIENT_ID"
  exit 1
fi

# 設定 GOOGLE_CLIENT_SECRET
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "❌ 錯誤: GOOGLE_CLIENT_SECRET 未設定"
  echo "請在 .dev.vars 中設定，或手動執行: wrangler secret put GOOGLE_CLIENT_SECRET"
  exit 1
fi

# 設定 GOOGLE_REDIRECT_URI（生產環境）
PRODUCTION_REDIRECT_URI="https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback"

echo "📝 準備設定以下 secrets:"
echo "   GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "   GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:10}..."
echo "   GOOGLE_REDIRECT_URI: $PRODUCTION_REDIRECT_URI"
echo ""

read -p "是否繼續設定？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 取消設定"
  exit 1
fi

# 設定 secrets
echo "🔐 設定 GOOGLE_CLIENT_ID..."
echo "$GOOGLE_CLIENT_ID" | wrangler secret put GOOGLE_CLIENT_ID

echo "🔐 設定 GOOGLE_CLIENT_SECRET..."
echo "$GOOGLE_CLIENT_SECRET" | wrangler secret put GOOGLE_CLIENT_SECRET

echo "🔐 設定 GOOGLE_REDIRECT_URI..."
echo "$PRODUCTION_REDIRECT_URI" | wrangler secret put GOOGLE_REDIRECT_URI

echo ""
echo "✅ Google OAuth secrets 設定完成！"
echo ""
echo "📋 驗證設定:"
wrangler secret list | grep -i "GOOGLE"

