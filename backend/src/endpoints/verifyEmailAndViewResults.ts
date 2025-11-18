import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import jwt from "@tsndr/cloudflare-worker-jwt"
import { Context } from "hono"

// Helper function to get frontend URL (supports multiple ports)
function getFrontendUrl(env: any, request?: Request): string {
  // ✅ 優先從請求頭中獲取前端 URL（支持多端口）
  if (request) {
    const referer = request.headers.get('Referer')
    const origin = request.headers.get('Origin')
    const sourceUrl = referer || origin
    
    if (sourceUrl) {
      try {
        const sourceUrlObj = new URL(sourceUrl)
        // 只允許 localhost 或配置的域名
        if (sourceUrlObj.hostname === 'localhost' || sourceUrlObj.hostname === '127.0.0.1' || env.FRONTEND_URL?.includes(sourceUrlObj.hostname)) {
          const frontendUrl = `${sourceUrlObj.protocol}//${sourceUrlObj.host}`
          console.log('✅ Using frontend URL from request:', frontendUrl)
          return frontendUrl
        } else {
          console.log('⚠️ Origin not allowed, using environment or default')
        }
      } catch (e) {
        console.log('⚠️ Failed to parse Referer/Origin, using environment or default')
      }
    }
  }
  
  // ✅ 優先使用環境變數（必須設定）
  if (env.FRONTEND_URL) {
    console.log('Using FRONTEND_URL from environment:', env.FRONTEND_URL)
    return env.FRONTEND_URL
  }
  
  // ❌ FRONTEND_URL 必須設定，不提供 fallback
  console.error('❌ FRONTEND_URL not configured')
  throw new Error('FRONTEND_URL not configured. Please set FRONTEND_URL environment variable.')
}

// Request/Response schemas
const VerifyEmailRequest = z.object({
  token: z.string().min(1, "Token is required")
})

const VerifyEmailResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  redirectUrl: z.string().optional(),
  sessionToken: z.string().optional(),
  hasClientAssignment: z.boolean().optional(),
  requiresClientSelection: z.boolean().optional(),
  meetingData: z.any().optional()
})

export class VerifyEmailAndViewResults extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Verify email and access meeting results",
    description: "Verifies email token and provides access to meeting analysis results",
    request: {
      body: {
        content: {
          "application/json": {
            schema: VerifyEmailRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Email verified successfully",
        content: {
          "application/json": {
            schema: VerifyEmailResponse
          }
        }
      },
      "400": {
        description: "Invalid or expired token"
      },
      "404": {
        description: "Meeting not found"
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { token } = data.body;

      // Verify JWT token
      const isValid = await jwt.verify(token, c.env.JWT_SECRET)
      if (!isValid) {
        return c.json({
          success: false,
          message: "Invalid or expired verification link."
        }, 400)
      }

      // Decode token payload
      const payload = jwt.decode(token)
      const { userId, meetingId, email } = payload.payload as any

      // Verify user exists
      const user = await c.env.DB.prepare(
        "SELECT user_id as id, email, verified FROM users WHERE user_id = ? AND email = ?"
      ).bind(userId, email).first()

      if (!user) {
        return c.json({
          success: false,
          message: "User not found."
        }, 404)
      }

      // Mark user as verified if not already
      if (!user.verified) {
        await c.env.DB.prepare(
          "UPDATE users SET verified = TRUE WHERE user_id = ?"
        ).bind(userId).run()
      }

      // Get meeting data
      console.log("Fetching meeting data for:", meetingId, "user:", userId)
      const meeting = await c.env.DB.prepare(`
        SELECT 
          m.*,
          u.email as user_email
        FROM meetings m
        JOIN users u ON m.user_id = u.user_id  
        WHERE m.meeting_id = ? AND m.user_id = ?
      `).bind(meetingId, userId).first()

      console.log("Meeting found:", meeting ? "YES" : "NO")
      if (meeting) {
        console.log("Meeting ID:", meeting.meeting_id)
        console.log("Meeting summary:", meeting.summary ? `${meeting.summary.length} chars` : "NULL")
      }

      if (!meeting) {
        return c.json({
          success: false,
          message: "Meeting not found or access denied."
        }, 404)
      }

      // Check if analysis is complete
      const analysisComplete = meeting.summary && meeting.summary.length > 0
      console.log("Analysis complete:", analysisComplete)

      if (!analysisComplete) {
        return c.json({
          success: true,
          message: "Email verified! Your analysis is still processing. You'll receive another email when it's ready.",
          redirectUrl: `/analysis-progress?token=${token}`,
          meetingData: {
            id: meeting.id,
            status: "processing",
            created_at: meeting.created_at
          }
        })
      }

      // Create session token for the user after successful verification
      const { createUserSession } = await import("../middleware/auth");
      const sessionToken = await createUserSession(userId, c.env, c.req.raw);

      // Check if meeting is already assigned to a specific client
      const hasClientAssignment = meeting.client_id && meeting.client_id !== 'unassigned'
      console.log("Meeting client assignment status:", {
        client_id: meeting.client_id,
        client_name: meeting.client_name,
        hasClientAssignment
      })

      // Analysis is complete - return full results with session token
      return c.json({
        success: true,
        message: "Email verified! Your analysis is ready.",
        sessionToken, // Include session token for persistent login
        redirectUrl: `/results?token=${token}&meetingId=${meetingId}&clientId=${meeting.client_id}`,
        hasClientAssignment, // NEW: Indicates if meeting is already assigned to a client
        requiresClientSelection: !hasClientAssignment, // NEW: Indicates if client selection is needed
        meetingData: {
          id: meeting.meeting_id, // This is the UUID we need
          client_id: meeting.client_id, // Include client_id for frontend logic
          client_name: meeting.client_name,
          summary: meeting.summary,
          pain_point: meeting.pain_point,
          goal: meeting.goal,
          coach_suggestions: meeting.suggestion, // Note: column name is 'suggestion'
          action_items_client: meeting.action_items_client,
          action_items_coach: meeting.action_items_coach,
          follow_up_email: meeting.email_content, // Note: column name is 'email_content'
          social_media_content: meeting.social_media_content,
          created_at: meeting.created_at,
          status: "completed"
        }
      })

    } catch (error) {
      console.error("Error in verifyEmailAndViewResults:", error)
      
      return c.json({
        success: false,
        message: "Failed to verify email. Please try again or contact support."
      }, 500)
    }
  }
}

// Also create a GET version for magic links clicked from email
export class VerifyEmailAndViewResultsGet extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Verify email via GET request (for email links)",
    description: "Handles email verification when user clicks link in email",
    request: {
      parameters: [
        {
          name: "token",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "JWT verification token"
        }
      ]
    },
    responses: {
      "200": { description: "Redirects to results page" },
      "302": { description: "Redirect to appropriate page" },
      "400": { description: "Invalid token" }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    console.log("🔗 GET verification endpoint called")
    
    // Get token from query parameters using Hono context
    const token = c.req.query('token')
    
    console.log("Token from query:", token ? token.substring(0, 20) + "..." : "null")

    if (!token) {
      console.error("No token found in query parameters")
      return c.text("Missing verification token", 400)
    }

    try {
      // ✅ 從請求頭中獲取前端 URL（支持多端口）
      const frontendUrl = getFrontendUrl(c.env, c.req.raw)
      console.log("✅ Using frontend URL for redirect:", frontendUrl)
      
      // Directly call verification logic (same as POST endpoint)
      const isValid = await jwt.verify(token, c.env.JWT_SECRET)
      if (!isValid) {
        return c.redirect(`${frontendUrl}/?error=invalid-token`, 302)
      }

      const payload = jwt.decode(token)
      const { userId, meetingId, email } = payload.payload as any

      // Verify user exists
      const user = await c.env.DB.prepare(
        "SELECT user_id as id, email, verified FROM users WHERE user_id = ? AND email = ?"
      ).bind(userId, email).first()

      if (!user) {
        return c.redirect(`${frontendUrl}/?error=user-not-found`, 302)
      }

      // Mark user as verified if not already
      if (!user.verified) {
        await c.env.DB.prepare(
          "UPDATE users SET verified = TRUE WHERE user_id = ?"
        ).bind(userId).run()
      }

      // Get meeting data with client info
      const meeting = await c.env.DB.prepare(`
        SELECT m.*, u.email as user_email, c.client_id, c.name as client_name
        FROM meetings m
        JOIN users u ON m.user_id = u.user_id
        LEFT JOIN clients c ON m.client_id = c.client_id
        WHERE m.meeting_id = ? AND m.user_id = ?
      `).bind(meetingId, userId).first()

      if (!meeting) {
        return c.redirect(`${frontendUrl}/?error=meeting-not-found`, 302)
      }

      // Check if analysis is complete
      const analysisComplete = meeting.summary && meeting.summary.length > 0
      console.log("Analysis complete:", analysisComplete)
      
      if (analysisComplete) {
        // Get client info for the redirect
        const clientId = meeting.client_id
        const clientName = meeting.client_name || 'Unknown Client'

        // Analysis is complete - redirect directly to client details page with meeting selected
        console.log("Redirecting to frontend - analysis complete")
        console.log("Meeting ID:", meetingId)
        console.log("Client ID:", clientId)
        console.log("Client Name:", clientName)

        // SaaS Best Practice: Direct deep-link to the specific content user wants to see
        return c.redirect(
          `${frontendUrl}/?verified=true&analysis=complete&meetingId=${meetingId}&clientId=${clientId}&token=${encodeURIComponent(token)}&view=meeting`,
          302
        )
      } else {
        // Analysis still processing
        console.log("Redirecting to frontend - analysis processing")
        return c.redirect(`${frontendUrl}/?verified=true&analysis=processing`, 302)
      }

    } catch (error) {
      console.error("Error in GET verification:", error)
      console.error("Error stack:", error.stack)
      
      try {
        // ✅ 從請求頭中獲取前端 URL（支持多端口）
        const frontendUrl = getFrontendUrl(c.env, c.req.raw)
        console.log("✅ Redirecting due to error to:", frontendUrl)
        return c.redirect(`${frontendUrl}/?error=server-error`, 302)
      } catch (redirectError) {
        console.error("Failed to redirect:", redirectError)
        return c.text(`Verification failed: ${error.message}`, 500)
      }
    }
  }
}