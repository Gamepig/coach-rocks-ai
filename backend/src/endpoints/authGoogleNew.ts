/**
 * Google OAuth 2.0 Callback Endpoint (New Implementation)
 * 
 * Simplified and correct implementation
 */

import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { handleGoogleCallback } from "../auth/google"

export class AuthGoogleNew extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Google OAuth 2.0 callback (New)",
    description: "Handle Google OAuth callback with authorization code",
    request: {
      query: {
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
        error_description: z.string().optional()
      }
    },
    responses: {
      "302": {
        description: "Redirect to frontend with session token"
      },
      "400": {
        description: "Invalid request"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(c: AppContext) {
    return await handleGoogleCallback(c)
  }
}

