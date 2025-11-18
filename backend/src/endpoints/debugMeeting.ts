import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"

const DebugMeetingRequest = z.object({
  meetingId: z.string().min(1, "Meeting ID is required")
})

export class DebugMeeting extends OpenAPIRoute {
  schema = {
    tags: ["Debug"],
    summary: "Debug meeting data in database",
    description: "Inspect raw database data for a meeting",
    request: {
      body: {
        content: {
          "application/json": {
            schema: DebugMeetingRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Debug data retrieved successfully"
      },
      "404": {
        description: "Meeting not found"
      }
    }
  }

  async handle(c: any) {
    try {
      const body = await c.req.json()
      const meetingId = body.meetingId

      if (!meetingId) {
        return c.json({
          success: false,
          message: "Meeting ID is required"
        }, 400)
      }

      // Get meeting data
      const meeting = await c.env.DB.prepare(`
        SELECT * FROM meetings WHERE meeting_id = ?
      `).bind(meetingId).first()

      if (!meeting) {
        return c.json({
          success: false,
          message: "Meeting not found"
        }, 404)
      }

      // Get reels data
      const reels = await c.env.DB.prepare(`
        SELECT * FROM reels_ideas WHERE meeting_id = ?
      `).bind(meetingId).all()

      // Return raw data for inspection
      return c.json({
        success: true,
        message: "Debug data retrieved successfully",
        data: {
          meeting: {
            meeting_id: meeting.meeting_id,
            client_name: meeting.client_name,
            meeting_title: meeting.meeting_title,
            summary: meeting.summary ? "EXISTS (" + meeting.summary.length + " chars)" : "NULL",
            email_content: meeting.email_content ? "EXISTS (" + meeting.email_content.length + " chars)" : "NULL",
            resources_list: meeting.resources_list ? "EXISTS (" + meeting.resources_list.length + " chars)" : "NULL",
            next_meeting_prep: meeting.next_meeting_prep ? "EXISTS (" + meeting.next_meeting_prep.length + " chars)" : "NULL",
            created_at: meeting.created_at
          },
          reels: {
            count: reels?.results?.length || 0,
            data: reels?.results || []
          },
          // Raw data for inspection
          raw_email_content: meeting.email_content,
          raw_resources_list: meeting.resources_list,
          raw_next_meeting_prep: meeting.next_meeting_prep
        }
      })

    } catch (error) {
      console.error("Error in debugMeeting:", error)
      return c.json({
        success: false,
        message: "Failed to retrieve debug data: " + (error instanceof Error ? error.message : String(error))
      }, 500)
    }
  }
}
