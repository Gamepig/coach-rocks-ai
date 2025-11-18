@echo off
echo 🧪 Testing Session Management System
echo.

echo 1️⃣ Testing login...
curl -X POST http://localhost:8787/api/login -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\"}"
echo.
echo.

echo 2️⃣ Copy the sessionToken from above and paste it in the next command
echo    Replace YOUR_TOKEN_HERE with the actual token:
echo.
echo curl -X POST http://localhost:8787/api/refresh-token -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN_HERE" -d "{}"
echo.

echo 3️⃣ Then test logout with the NEW token from refresh:
echo.
echo curl -X POST http://localhost:8787/api/logout -H "Content-Type: application/json" -H "Authorization: Bearer NEW_TOKEN_HERE" -d "{}"
echo.

echo 4️⃣ Finally, try using the logged out token (should fail):
echo.
echo curl -X POST http://localhost:8787/api/refresh-token -H "Content-Type: application/json" -H "Authorization: Bearer LOGGED_OUT_TOKEN" -d "{}"
echo.

echo ✅ If all steps work as expected, session management is working correctly!