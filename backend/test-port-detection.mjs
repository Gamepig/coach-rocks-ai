// Test frontend port detection logic
import jwt from '@tsndr/cloudflare-worker-jwt';

async function testPortDetection() {
  const jwtSecret = "312dca0cf81ed917e64b9fd577681471eaf9dca5aadf753cd55bab2518a60166";
  
  const payload = {
    userId: "80779cae-f708-443a-ba7e-127a9ec5c1c5",
    meetingId: "a1b1036b-b41f-417e-ad40-7d7844b385e3",
    email: "katherine84522@gmail.com",
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const token = await jwt.sign(payload, jwtSecret);
  
  console.log("Testing port detection with different frontend ports...\n");
  
  // Test the GET verification endpoint that uses port detection
  const testUrl = `http://localhost:8787/api/verify-email?token=${encodeURIComponent(token)}`;
  
  console.log("Test URL (will trigger port detection):");
  console.log(testUrl);
  console.log("\nExpected behavior:");
  console.log("- Backend should try ports [5175, 5174, 5173, 3000, 3001, 4173, 4174, 8080]");
  console.log("- Should detect frontend running on port 5175 (or first available port)");
  console.log("- Should redirect to detected frontend URL with proper parameters");
  console.log("\nClick the URL above to test the port detection!");
}

testPortDetection().catch(console.error);