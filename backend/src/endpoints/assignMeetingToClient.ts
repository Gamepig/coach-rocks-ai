import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import { Context } from "hono"

// Request schema
const AssignMeetingRequest = z.object({
  meetingId: z.string().describe("Meeting ID to assign"),
  clientAction: z.enum(['new', 'existing']).describe("Whether to create new client or use existing"),
  clientName: z.string().optional().nullable().describe("Name for new client"),
  clientId: z.string().optional().nullable().describe("ID of existing client")
})

// Response schema
const AssignMeetingResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  clientId: z.string().optional(),
  redirectUrl: z.string().optional()
})

export class AssignMeetingToClient extends OpenAPIRoute {
  schema = {
    tags: ["Client Management"],
    summary: "Assign meeting to client (new or existing)",
    description: "Creates a new client or assigns meeting to existing client after email verification",
    request: {
      body: {
        content: {
          "application/json": {
            schema: AssignMeetingRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Meeting assigned successfully",
        content: {
          "application/json": {
            schema: AssignMeetingResponse
          }
        }
      },
      "400": {
        description: "Invalid request"
      },
      "404": {
        description: "Meeting not found"
      },
      "500": {
        description: "Server error"
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      console.log("🔄 assignMeetingToClient: Starting request handling")
      const data = await this.getValidatedData<typeof this.schema>()
      const { meetingId, clientAction, clientName, clientId } = data.body

      console.log("📝 Request data:", { meetingId, clientAction, clientName, clientId })

      // Get meeting data to verify it exists and get user info
      console.log("🔍 Looking up meeting:", meetingId)
      const meeting = await c.env.DB.prepare(`
        SELECT m.*, u.user_id
        FROM meetings m
        JOIN users u ON m.user_id = u.user_id
        WHERE m.meeting_id = ?
      `).bind(meetingId).first()

      if (!meeting) {
        return c.json({
          success: false,
          message: "Meeting not found"
        }, 404)
      }

      let finalClientId: string
      let finalClientName: string

      if (clientAction === 'new') {
        // Create new client
        if (!clientName?.trim()) {
          return c.json({
            success: false,
            message: "Client name is required for new client"
          }, 400)
        }

        finalClientId = crypto.randomUUID()
        finalClientName = clientName.trim()

        const createClientResult = await c.env.DB.prepare(`
          INSERT INTO clients (client_id, user_id, name, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(
          finalClientId,
          meeting.user_id,
          finalClientName,
          new Date().toISOString()
        ).run()

        if (!createClientResult.success) {
          throw new Error("Failed to create new client")
        }

        console.log("Created new client:", finalClientId, "with name:", finalClientName)

      } else if (clientAction === 'existing') {
        // Use existing client
        if (!clientId) {
          return c.json({
            success: false,
            message: "Client ID is required for existing client"
          }, 400)
        }

        // Verify client exists and belongs to user
        const existingClient = await c.env.DB.prepare(`
          SELECT client_id, name FROM clients
          WHERE client_id = ? AND user_id = ?
        `).bind(clientId, meeting.user_id).first()

        if (!existingClient) {
          return c.json({
            success: false,
            message: "Client not found or access denied"
          }, 404)
        }

        finalClientId = clientId
        finalClientName = existingClient.name as string
        console.log("Using existing client:", finalClientId, "with name:", finalClientName)
      } else {
        return c.json({
          success: false,
          message: "Invalid client action"
        }, 400)
      }

      // Update meeting to assign to the client
      const updateMeetingResult = await c.env.DB.prepare(`
        UPDATE meetings SET
          client_id = ?,
          client_name = ?
        WHERE meeting_id = ?
      `).bind(
        finalClientId,
        finalClientName,
        meetingId
      ).run()

      if (!updateMeetingResult.success) {
        throw new Error("Failed to assign meeting to client")
      }

      console.log("Successfully assigned meeting", meetingId, "to client", finalClientId)

      // ✅ 從請求頭中獲取前端 URL（支持多端口）
      let frontendUrl = c.env.FRONTEND_URL
      if (!frontendUrl) {
        console.error('❌ FRONTEND_URL not configured')
        throw new Error('FRONTEND_URL not configured. Please set FRONTEND_URL environment variable.')
      }
      const origin = c.req.header('Origin') || c.req.header('Referer')
      
      if (origin) {
        try {
          const originUrl = new URL(origin)
          // 只允許 localhost 或配置的域名
          if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1' || c.env.FRONTEND_URL?.includes(originUrl.hostname)) {
            frontendUrl = `${originUrl.protocol}//${originUrl.host}`
            console.log('✅ Using frontend URL from request:', frontendUrl)
          } else {
            console.log('⚠️ Origin not allowed, using environment or default:', frontendUrl)
          }
        } catch (e) {
          console.log('⚠️ Failed to parse Origin, using environment or default:', frontendUrl)
        }
      }
      
      const redirectUrl = `${frontendUrl}/?meetingId=${meetingId}&clientId=${finalClientId}&assigned=true`

      return c.json({
        success: true,
        message: `Meeting successfully assigned to ${clientAction === 'new' ? 'new' : 'existing'} client`,
        clientId: finalClientId,
        redirectUrl
      })

    } catch (error) {
      console.error("Error in assignMeetingToClient:", error)
      
      return c.json({
        success: false,
        message: "Failed to assign meeting to client"
      }, 500)
    }
  }
}