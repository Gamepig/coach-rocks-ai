#!/bin/bash
echo "🧪 Testing Session Management System"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8787"
EMAIL="test@example.com"

echo -e "${YELLOW}🚀 Starting session management tests...${NC}\n"

# Step 1: Login
echo "1️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.sessionToken')
if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo -e "✅ ${GREEN}Login successful${NC}"
  echo "   Token: ${TOKEN:0:20}..."
else
  echo -e "❌ ${RED}Login failed${NC}"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

# Step 2: Test token refresh
echo -e "\n2️⃣ Testing token refresh..."
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/api/refresh-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.sessionToken')
if [ "$NEW_TOKEN" != "null" ] && [ "$NEW_TOKEN" != "" ]; then
  echo -e "✅ ${GREEN}Token refresh successful${NC}"
  echo "   New Token: ${NEW_TOKEN:0:20}..."
  TOKEN=$NEW_TOKEN
else
  echo -e "❌ ${RED}Token refresh failed${NC}"
  echo "   Response: $REFRESH_RESPONSE"
  exit 1
fi

# Step 3: Test logout
echo -e "\n3️⃣ Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST $BASE_URL/api/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

SUCCESS=$(echo $LOGOUT_RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo -e "✅ ${GREEN}Logout successful${NC}"
else
  echo -e "❌ ${RED}Logout failed${NC}"
  echo "   Response: $LOGOUT_RESPONSE"
  exit 1
fi

# Step 4: Test invalidated token
echo -e "\n4️⃣ Testing invalidated token..."
INVALID_RESPONSE=$(curl -s -X POST $BASE_URL/api/refresh-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

SUCCESS=$(echo $INVALID_RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
  echo -e "✅ ${GREEN}Token invalidation working correctly${NC}"
else
  echo -e "❌ ${RED}Token invalidation failed - token still works!${NC}"
  echo "   Response: $INVALID_RESPONSE"
  exit 1
fi

echo -e "\n🎉 ${GREEN}All session management tests passed!${NC}"
echo -e "✨ ${YELLOW}Session management system is working correctly${NC}"