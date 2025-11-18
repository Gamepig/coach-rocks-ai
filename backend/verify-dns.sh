#!/bin/bash

echo "🔍 CoachRocks DNS 配置驗證工具"
echo "=================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查函數
check_record() {
    local record_type=$1
    local record_name=$2
    local expected_content=$3
    local description=$4

    echo "檢查 ${description}..."
    echo "查詢: ${record_type} ${record_name}"

    result=$(dig +short ${record_type} ${record_name} 2>/dev/null)

    if [ -z "$result" ]; then
        echo -e "${RED}❌ 未找到記錄${NC}"
        echo ""
        return 1
    else
        echo -e "${GREEN}✅ 找到記錄${NC}"
        echo "回應: ${result}"

        if [ ! -z "$expected_content" ]; then
            if echo "$result" | grep -q "$expected_content"; then
                echo -e "${GREEN}✅ 內容符合預期${NC}"
            else
                echo -e "${YELLOW}⚠️  內容可能不完全匹配，請手動檢查${NC}"
            fi
        fi
        echo ""
        return 0
    fi
}

echo "📋 開始檢查 4 條 DNS 記錄..."
echo ""

# 計數器
passed=0
total=4

# 1. DKIM 記錄
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "記錄 1/4: DKIM 驗證 (TXT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if check_record "TXT" "resend._domainkey.coachrocks.com" "p=MIGfMA0GC" "DKIM (resend._domainkey)"; then
    ((passed++))
fi

# 2. SPF MX 記錄
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "記錄 2/4: SPF MX 記錄"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if check_record "MX" "send.coachrocks.com" "amazonses.com" "SPF MX (send)"; then
    ((passed++))
fi

# 3. SPF TXT 記錄
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "記錄 3/4: SPF TXT 記錄"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if check_record "TXT" "send.coachrocks.com" "v=spf1" "SPF TXT (send)"; then
    ((passed++))
fi

# 4. DMARC 記錄
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "記錄 4/4: DMARC 記錄"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if check_record "TXT" "_dmarc.coachrocks.com" "v=DMARC1" "DMARC (_dmarc)"; then
    ((passed++))
fi

# 總結
echo "=================================="
echo "📊 驗證結果總結"
echo "=================================="
echo ""

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 完美！所有 ${total} 條記錄都已正確配置！${NC}"
    echo ""
    echo "✅ 下一步："
    echo "1. 前往 Resend Dashboard: https://resend.com/domains"
    echo "2. 選擇 coachrocks.com"
    echo "3. 點擊 'Restart verification' 按鈕"
    echo "4. 等待驗證通過（可能需要幾分鐘）"
else
    echo -e "${YELLOW}⚠️  已通過 ${passed}/${total} 條記錄${NC}"
    echo ""
    echo "❓ 可能的原因："
    echo "1. DNS 記錄還未傳播完成（可能需要 5-30 分鐘）"
    echo "2. 記錄配置不正確"
    echo "3. Proxy 狀態設置錯誤（必須是 DNS only，灰色雲朵）"
    echo ""
    echo "💡 建議："
    echo "1. 等待 15 分鐘後重新執行此腳本"
    echo "2. 檢查 Cloudflare DNS Records 頁面確認配置"
    echo "3. 確保所有記錄 Proxy 狀態為 'DNS only'"
fi

echo ""
echo "=================================="
echo "📝 參考文檔"
echo "=================================="
echo "詳細配置步驟: documents/DNS_CONFIG_STEP_BY_STEP.md"
echo "快速參考: documents/RESEND_QUICK_REFERENCE.md"
echo ""
