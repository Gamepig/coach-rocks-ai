import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { DatabaseService } from "../services/database"
import { createUserSession } from "../middleware/auth"

// Request/Response schemas
const LoginRequest = z.object({
  email: z.string().email("Please provide a valid email address")
})

const LoginResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  sessionToken: z.string().optional(),
  user: z.object({
    user_id: z.string(),
    email: z.string(),
    plan: z.string(),
    verified: z.boolean(),
    onboarding_completed: z.boolean().optional(),
    last_login: z.string().optional()
  }).optional()
})

export class Login extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Login with email for returning users",
    description: "Authenticate returning users and create a session token",
    request: {
      body: {
        content: {
          "application/json": {
            schema: LoginRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Login successful",
        content: {
          "application/json": {
            schema: LoginResponse
          }
        }
      },
      "401": {
        description: "User not found or not verified"
      },
      "400": {
        description: "Invalid request data"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { email } = data.body;
      
      console.log("Login endpoint called with email:", email);
      
      const db = new DatabaseService(c.env);
      console.log("DatabaseService created");
      
      // Check if user exists and is verified
      const user = await db.getUserByEmail(email);
      
      if (!user) {
        return c.json({
          success: false,
          message: "User not found. Please sign up first or use email verification."
        }, 401);
      }

      if (!user.verified) {
        return c.json({
          success: false,
          message: "Email not verified. Please verify your email first."
        }, 401);
      }

      // Create session token
      const sessionToken = await createUserSession(user.user_id, c.env, c.req.raw);
      
      // Clean up expired sessions periodically
      try {
        await db.cleanupExpiredSessions();
      } catch (cleanupError) {
        console.warn('Failed to cleanup expired sessions:', cleanupError);
      }

      return c.json({
        success: true,
        message: "Login successful",
        sessionToken,
        user: {
          user_id: user.user_id,
          email: user.email,
          plan: user.plan,
          verified: user.verified,
          onboarding_completed: user.onboarding_completed || false,
          last_login: user.last_login
        }
      });

    } catch (error) {
      console.error("Error in login:", error);
      
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500);
    }
  }
}