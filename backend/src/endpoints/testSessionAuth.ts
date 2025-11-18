import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import { DatabaseService } from "../services/database"

const TestSessionAuthResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
})

export class TestSessionAuth extends OpenAPIRoute {
  schema = {
    tags: ["Testing"],
    summary: "Test session authentication system",
    description: "Test endpoint to debug session authentication",
    responses: {
      "200": {
        description: "Test completed",
        content: {
          "application/json": {
            schema: TestSessionAuthResponse
          }
        }
      }
    }
  }

  async handle(
    request: Request,
    env: Env,
    context: ExecutionContext
  ): Promise<Response> {
    try {
      console.log("TestSessionAuth endpoint called");
      console.log("Environment keys:", Object.keys(env));
      console.log("env.DB exists:", !!env.DB);
      
      if (!env.DB) {
        throw new Error("Database binding (env.DB) is not available");
      }
      
      const db = new DatabaseService(env);
      console.log("DatabaseService created successfully");
      
      // Test getting user by email
      const testEmail = "test@example.com";
      console.log("Testing getUserByEmail with:", testEmail);
      
      const user = await db.getUserByEmail(testEmail);
      console.log("User found:", user ? "YES" : "NO");
      
      if (user) {
        console.log("User details:", {
          user_id: user.user_id,
          email: user.email,
          verified: user.verified
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Session auth test completed",
        data: {
          userExists: !!user,
          userVerified: user?.verified || false,
          userId: user?.user_id || null
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {
      console.error("Error in TestSessionAuth:", error);
      
      return new Response(JSON.stringify({
        success: false,
        message: "Test failed: " + error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
}