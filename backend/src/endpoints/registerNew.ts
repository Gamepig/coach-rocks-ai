/**
 * Email Registration Endpoint (New Implementation)
 * 
 * Handles user registration with email and password
 */

import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { registerUser } from "../auth/email"

const RegisterRequest = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export class RegisterNew extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Register new user with email and password (New)",
    description: "Create a new user account with email and password",
    request: {
      body: {
        content: {
          "application/json": {
            schema: RegisterRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Registration successful",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              userId: z.string().optional()
            })
          }
        }
      },
      "400": {
        description: "Invalid request data or user already exists"
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

      console.log("Register endpoint called with email:", email)

      const result = await registerUser(email, password, c.env)

      if (!result.success) {
        return c.json({
          success: false,
          message: result.error || "Registration failed"
        }, 400)
      }

      return c.json({
        success: true,
        message: "Registration successful. Please verify your email.",
        userId: result.userId
      })
    } catch (error) {
      console.error("Error in registration:", error)
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500)
    }
  }
}

