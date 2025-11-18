import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { authMiddleware, createUserSession } from "../middleware/auth"

// Request/Response schemas
const RefreshTokenRequest = z.object({
  // No body needed - token comes from Authorization header
})

const RefreshTokenResponse = z.object({
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

export class RefreshToken extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Refresh session token",
    description: "Refresh an existing session token to extend its expiration",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: RefreshTokenRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Token refreshed successfully",
        content: {
          "application/json": {
            schema: RefreshTokenResponse
          }
        }
      },
      "401": {
        description: "Invalid or expired token"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      
      // Validate current session
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          message: "Invalid or expired session token"
        }, 401);
      }

      // Create new session token (this will invalidate the old one automatically)
      const newSessionToken = await createUserSession(auth.user.user_id, c.env, c.req.raw);

      return c.json({
        success: true,
        message: "Token refreshed successfully",
        sessionToken: newSessionToken,
        user: {
          user_id: auth.user.user_id,
          email: auth.user.email,
          plan: auth.user.plan,
          verified: auth.user.verified,
          onboarding_completed: auth.user.onboarding_completed || false,
          last_login: auth.user.last_login
        }
      });

    } catch (error) {
      console.error("Error in refresh token:", error);
      
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500);
    }
  }
}