import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"

// Request/Response schemas
const GetMeetingByIdRequest = z.object({
  meetingId: z.string().min(1, "Meeting ID is required")
})

const GetMeetingByIdResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
})

export class GetMeetingById extends OpenAPIRoute {
  schema = {
    tags: ["Meetings"],
    summary: "Get meeting data by ID",
    description: "Retrieves full meeting analysis data by meeting ID",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GetMeetingByIdRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Meeting data retrieved successfully",
        content: {
          "application/json": {
            schema: GetMeetingByIdResponse
          }
        }
      },
      "404": {
        description: "Meeting not found"
      }
    }
  }

  async handle(c: any) {
    try {
      // Try to get meetingId from request body
      let meetingId: string | undefined
      
      try {
        const body = await c.req.json()
        meetingId = body.meetingId
      } catch (parseError) {
        console.log("Failed to parse JSON body:", parseError instanceof Error ? parseError.message : String(parseError))
      }
      
      if (!meetingId) {
        return c.json({
          success: false,
          message: "Meeting ID is required"
        }, 400)
      }

      // Get meeting data (include user_id for fallback migration)
      const meeting = await c.env.DB.prepare(`
        SELECT * FROM meetings WHERE meeting_id = ?
      `).bind(meetingId).first()

      if (!meeting) {
        return c.json({
          success: false,
          message: "Meeting not found"
        }, 404)
      }

      // DEBUG: Log all raw database fields
      console.log("🔍 DEBUG - Raw meeting data from database:")
      console.log("🔍 - meeting_id:", meeting.meeting_id)
      console.log("🔍 - email_content:", meeting.email_content)
      console.log("🔍 - resources_list:", meeting.resources_list)
      console.log("🔍 - next_meeting_prep:", meeting.next_meeting_prep)
      console.log("🔍 - mind_map:", meeting.mind_map ? `EXISTS (${meeting.mind_map.length} chars)` : "NULL or EMPTY")
      console.log("🔍 - summary:", meeting.summary ? "EXISTS" : "NULL")
      console.log("🔍 - client_name:", meeting.client_name)
      console.log("🔍 - meeting_title:", meeting.meeting_title)

      // Get reels scripts for this meeting
      const reels = await c.env.DB.prepare(`
        SELECT * FROM reels_ideas WHERE meeting_id = ?
      `).bind(meetingId).all()

      // DEBUG: Log reels data
      console.log("🔍 DEBUG - Reels query results:")
      console.log("🔍 - reels count:", reels?.results?.length || 0)
      if (reels?.results?.length > 0) {
        console.log("🔍 - First reel:", reels.results[0])
      }

      // Parse follow-up email content
      let followUpEmailContent = ""
      let followUpEmailSubject = ""
      if (meeting.email_content) {
        try {
          const emailData = JSON.parse(meeting.email_content)
          followUpEmailContent = emailData.body || emailData.content || ""
          followUpEmailSubject = emailData.subject || ""
        } catch (parseError) {
          console.log("Failed to parse email content, using as string:", parseError instanceof Error ? parseError.message : String(parseError))
          followUpEmailContent = meeting.email_content
        }
      }
      
      // If no email content, create a basic follow-up email
      if (!followUpEmailContent) {
        followUpEmailSubject = `Follow-up: ${meeting.meeting_title}`
        followUpEmailContent = `Hi ${meeting.client_name},

Thank you for our recent coaching session. I wanted to follow up on our discussion and provide you with some key takeaways and next steps.

**Key Insights from Our Session:**
${meeting.summary ? meeting.summary.substring(0, 200) + '...' : 'We had a productive discussion about your goals and challenges.'}

**Next Steps:**
${meeting.action_items_client ? meeting.action_items_client.split(', ').map(item => `• ${item}`).join('\n') : '• Review the action items we discussed\n• Take time to reflect on our conversation\n• Reach out if you have any questions'}

I'm here to support you on your journey. Feel free to reach out if you need any clarification or have questions about implementing these next steps.

Best regards,
Your Coach`
      }

      // Convert reels to the expected format
      let reelsScripts = []
      let hasReels = false
      
      // First try to get reels from reels_ideas table
      if (reels?.results?.length > 0) {
        hasReels = true
        reelsScripts = reels.results.map(reel => {
          // Extract call to action from content if it exists
          let narrative = reel.content || ""
          let callToAction = ""
          
          if (narrative.includes('\nCTA: ')) {
            const parts = narrative.split('\nCTA: ')
            narrative = parts[0]
            callToAction = parts[1] || ""
          }
          
          // Parse tags
          let hashtags = []
          if (reel.tags) {
            try {
              hashtags = JSON.parse(reel.tags)
            } catch (parseError) {
              console.log("Failed to parse tags, using as string:", parseError instanceof Error ? parseError.message : String(parseError))
              hashtags = reel.tags.split(',').map(t => t.trim())
            }
          }
          
          return {
            hook: reel.hook || "",
            narrative: narrative,
            callToAction: callToAction,
            hashtags: hashtags
          }
        })
      }
      
      // Fallback: If no reels in reels_ideas table, check resources_list
      if (!hasReels && meeting.resources_list) {
        try {
          const resourcesData = JSON.parse(meeting.resources_list)
          
          // Check if resources_list contains reels data
          if (resourcesData.reels && Array.isArray(resourcesData.reels) && resourcesData.reels.length > 0) {
            console.log("🔍 DEBUG - Found reels data in resources_list, migrating to reels_ideas table")
            
            // Convert reels from resources_list format to reels_ideas format
            const reelsToMigrate = resourcesData.reels.map((reel: any) => ({
              hook: reel.hook || "",
              narrative: reel.narrative || reel.content || "",
              callToAction: reel.callToAction || "",
              hashtags: reel.hashtags || reel.tags || []
            }))
            
            // Save to reels_ideas table (background migration)
            try {
              const { DatabaseService } = await import("../services/database")
              const dbService = new DatabaseService(c.env)
              await dbService.saveReelsIdeas(meeting.user_id, meetingId, reelsToMigrate.map((r: any) => ({
                hook: r.hook,
                content: r.narrative + (r.callToAction ? `\nCTA: ${r.callToAction}` : ''),
                tags: r.hashtags
              })))
              console.log("✅ Successfully migrated reels from resources_list to reels_ideas table")
            } catch (migrationError) {
              console.error("⚠️ Failed to migrate reels to reels_ideas table:", migrationError)
              // Continue with fallback data even if migration fails
            }
            
            // Use the migrated reels data
            reelsScripts = reelsToMigrate
            hasReels = true
            console.log("🔍 DEBUG - Using reels from resources_list fallback:", reelsScripts.length)
          }
        } catch (parseError) {
          console.log("Failed to parse resources_list for reels fallback:", parseError instanceof Error ? parseError.message : String(parseError))
        }
      }

      // Parse resources list (for actual resources, not reels)
      let resourcesList = []
      if (meeting.resources_list) {
        try {
          const resourcesData = JSON.parse(meeting.resources_list)
          // Check if it's a resources list (has title, url, type properties)
          if (Array.isArray(resourcesData) && resourcesData.length > 0 && resourcesData[0].title) {
            resourcesList = resourcesData
            console.log("🔍 DEBUG - Found resources list:", resourcesList.length)
          }
        } catch (parseError) {
          console.log("Failed to parse resources_list:", parseError instanceof Error ? parseError.message : String(parseError))
        }
      }

      // Return structured meeting data
      console.log("🔍 DEBUG - Final parsed data:")
      console.log("🔍 - followUpEmailContent:", followUpEmailContent)
      console.log("🔍 - followUpEmailSubject:", followUpEmailSubject)
      console.log("🔍 - reelsScripts count:", reelsScripts.length)
      console.log("🔍 - resourcesList count:", resourcesList.length)
      
      return c.json({
        success: true,
        message: "Meeting data retrieved successfully",
        data: {
          isDiscovery: meeting.is_discovery || false,
          hasReels: hasReels,
          summary: {
            clientName: meeting.client_name,
            meetingTitle: meeting.meeting_title,
            summary: meeting.summary,
            painPoint: meeting.pain_point,
            goal: meeting.goal,
            clientProfession: null, // Not stored in database
            clientCompany: null, // Not stored in database 
            targetAudience: null, // Not stored in database
            coachSuggestions: (() => {
              try {
                return meeting.suggestion ? JSON.parse(meeting.suggestion) : []
              } catch (e) {
                console.log("Failed to parse suggestion, using empty array:", e instanceof Error ? e.message : String(e))
                return []
              }
            })(),
            actionItemsClient: (() => {
              try {
                return meeting.action_items_client ? JSON.parse(meeting.action_items_client) : []
              } catch (e) {
                console.log("Failed to parse action_items_client, treating as string:", e instanceof Error ? e.message : String(e))
                // If it's a string, split by comma or newline
                if (typeof meeting.action_items_client === 'string') {
                  return meeting.action_items_client.split(/[,\n]/).map(item => item.trim()).filter(item => item.length > 0)
                }
                return []
              }
            })(),
            actionItemsCoach: (() => {
              try {
                return meeting.action_items_coach ? JSON.parse(meeting.action_items_coach) : []
              } catch (e) {
                console.log("Failed to parse action_items_coach, treating as string:", e instanceof Error ? e.message : String(e))
                if (typeof meeting.action_items_coach === 'string') {
                  return meeting.action_items_coach.split(/[,\n]/).map(item => item.trim()).filter(item => item.length > 0)
                }
                return []
              }
            })(),
            salesTechniqueAdvice: (() => {
              try {
                return meeting.sales_technique_advice ? JSON.parse(meeting.sales_technique_advice) : []
              } catch (e) {
                console.log("Failed to parse sales_technique_advice, using empty array:", e instanceof Error ? e.message : String(e))
                return []
              }
            })(),
            coachingAdvice: (() => {
              try {
                return meeting.coaching_advice ? JSON.parse(meeting.coaching_advice) : []
              } catch (e) {
                console.log("Failed to parse coaching_advice, using empty array:", e instanceof Error ? e.message : String(e))
                return []
              }
            })()
          },
          followUpEmail: {
            subject: followUpEmailSubject,
            content: followUpEmailContent
          },
          socialMediaContent: {
            reels: reelsScripts
          },
          resourcesListPrompt: meeting.resources_list || "", // Return the original prompt string
          resourcesList: resourcesList, // Return the parsed resources list
          nextMeetingPrep: (() => {
            try {
              return meeting.next_meeting_prep ? JSON.parse(meeting.next_meeting_prep) : null
            } catch (e) {
              console.log("Failed to parse next_meeting_prep, using null:", e instanceof Error ? e.message : String(e))
              return null
            }
          })(),
          mindMap: meeting.mind_map || "",
          transcript: meeting.transcript,
          createdAt: meeting.created_at
        }
      })

    } catch (error) {
      console.error("Error in getMeetingById:", error)
      console.error("Error details:", error instanceof Error ? error.message : String(error))
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
      
      return c.json({
        success: false,
        message: "Failed to retrieve meeting data: " + (error instanceof Error ? error.message : String(error))
      }, 500)
    }
  }
}