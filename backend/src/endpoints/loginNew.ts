/**
 * Email Login Endpoint (New Implementation)
 * 
 * Supports email/password login with secure password verification
 */

import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { loginUser } from "../auth/email"

const LoginRequest = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export class LoginNew extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Login with email and password (New)",
    description: "Authenticate users with email and password",
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
            schema: z.object({
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
          }
        }
      },
      "401": {
        description: "Invalid credentials"
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
      const data = await this.getValidatedData<typeof this.schema>()
      const { email, password } = data.body

      console.log("Login endpoint called with email:", email)

      const result = await loginUser(email, password, c.env, c.req.raw)

      if (!result.success) {
        return c.json({
          success: false,
          message: result.error || "Login failed"
        }, 401)
      }

      return c.json({
        success: true,
        message: "Login successful",
        sessionToken: result.sessionToken,
        user: result.user
      })
    } catch (error) {
      console.error("Error in login:", error)
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500)
    }
  }
}

