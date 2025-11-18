import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { authMiddleware } from "../middleware/auth"

const DebugAuthResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  authInfo: z.object({
    hasAuthHeader: z.boolean(),
    tokenType: z.string().optional(),
    tokenPreview: z.string().optional(),
    authResult: z.any().optional()
  })
})

export class DebugAuth extends OpenAPIRoute {
  schema = {
    tags: ["Debug"],
    summary: "Debug authentication issues",
    description: "Helps debug authentication token issues",
    responses: {
      "200": {
        description: "Debug information",
        content: {
          "application/json": {
            schema: DebugAuthResponse
          }
        }
      }
    }
  }

  async handle(c: AppContext) {
    try {
      const authHeader = c.req.header('Authorization');
      
      const debugInfo = {
        hasAuthHeader: !!authHeader,
        tokenType: undefined as string | undefined,
        tokenPreview: undefined as string | undefined,
        authResult: undefined as any
      };

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        debugInfo.tokenType = token.includes('.') ? 'JWT' : 'Session Token';
        debugInfo.tokenPreview = token.substring(0, 20) + '...';
        
        // Test authentication
        const authResult = await authMiddleware(c.req.raw, c.env);
        debugInfo.authResult = {
          isValid: authResult.isValid,
          error: authResult.error,
          userEmail: authResult.user?.email,
          userId: authResult.user?.user_id
        };
      }

      return c.json({
        success: true,
        message: "Debug information retrieved",
        authInfo: debugInfo
      });

    } catch (error) {
      console.error("Error in debug auth:", error);
      
      return c.json({
        success: false,
        message: "Debug failed: " + error.message,
        authInfo: {
          hasAuthHeader: false,
          error: error.message
        }
      });
    }
  }
}