// Test email verification flow
import jwt from '@tsndr/cloudflare-worker-jwt';

async function createTestVerificationToken() {
  const jwtSecret = "312dca0cf81ed917e64b9fd577681471eaf9dca5aadf753cd55bab2518a60166";
  
  const payload = {
    userId: "80779cae-f708-443a-ba7e-127a9ec5c1c5",
    meetingId: "a1b1036b-b41f-417e-ad40-7d7844b385e3",
    email: "katherine84522@gmail.com",
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const token = await jwt.sign(payload, jwtSecret);
  console.log("Test verification token:");
  console.log(token);
  
  const verificationUrl = `http://localhost:8787/api/verify-email?token=${encodeURIComponent(token)}`;
  console.log("\nTest verification URL:");
  console.log(verificationUrl);
}

createTestVerificationToken().catch(console.error);