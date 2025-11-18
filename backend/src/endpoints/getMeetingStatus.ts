import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import { Context } from "hono"

// Response schema
const MeetingStatusResponse = z.object({
  success: z.boolean(),
  meetingId: z.string(),
  status: z.string(), // 'processing', 'completed', 'failed'
  message: z.string().optional()
})

export class GetMeetingStatus extends OpenAPIRoute {
  schema = {
    tags: ["Meeting Analysis"],
    summary: "Get meeting analysis status",
    description: "Returns the current analysis status of a meeting",
    request: {
      params: z.object({
        meetingId: z.string().describe("Meeting ID to check status for")
      })
    },
    responses: {
      "200": {
        description: "Status retrieved successfully",
        content: {
          "application/json": {
            schema: MeetingStatusResponse
          }
        }
      },
      "401": {
        description: "Unauthorized"
      },
      "404": {
        description: "Meeting not found"
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      const meetingId = c.req.param("meetingId")
      
      if (!meetingId) {
        return c.json({
          success: false,
          message: "Meeting ID is required"
        }, 400)
      }

      // Get authorization header and validate session
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: false,
          message: 'Missing or invalid authorization header'
        }, 401)
      }

      const token = authHeader.substring(7)
      
      // Hash the token for lookup (like the auth middleware does)
      const encoder = new TextEncoder()
      const tokenData = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData)
      const hashArray = new Uint8Array(hashBuffer)
      const tokenHash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      // Validate session and get user info
      const sessionQuery = await c.env.DB.prepare(
        "SELECT u.user_id FROM users u JOIN session_tokens st ON u.user_id = st.user_id WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > datetime('now')"
      ).bind(tokenHash).first()

      if (!sessionQuery) {
        return c.json({
          success: false,
          message: 'Invalid or expired session'
        }, 401)
      }

      const userId = sessionQuery.user_id
      console.log(`🔍 [getMeetingStatus] Querying for meetingId: ${meetingId}, userId: ${userId}`)

      // Get meeting status (ensure it belongs to the user)
      const meeting = await c.env.DB.prepare(`
        SELECT analysis_status, summary
        FROM meetings
        WHERE meeting_id = ? AND user_id = ?
      `).bind(meetingId, userId).first()

      console.log(`📊 [getMeetingStatus] Query result:`, {
        found: !!meeting,
        analysis_status: meeting?.analysis_status,
        hasSummary: !!meeting?.summary
      })

      if (!meeting) {
        console.warn(`⚠️ [getMeetingStatus] Meeting not found for meetingId: ${meetingId}`)
        return c.json({
          success: false,
          message: 'Meeting not found or access denied'
        }, 404)
      }

      const status = meeting.analysis_status || 'processing'
      console.log(`✅ [getMeetingStatus] Returning status: ${status}`)
      
      // Determine message based on status
      let message = ''
      switch (status) {
        case 'processing':
          message = 'Analysis is still in progress...'
          break
        case 'completed':
          message = 'Analysis completed successfully!'
          break
        case 'failed':
          message = 'Analysis failed. Please try again.'
          break
        default:
          message = 'Unknown status'
      }

      return c.json({
        success: true,
        meetingId,
        status,
        message
      })

    } catch (error) {
      console.error("Error in getMeetingStatus:", error)
      
      return c.json({
        success: false,
        message: "Failed to get meeting status"
      }, 500)
    }
  }
}