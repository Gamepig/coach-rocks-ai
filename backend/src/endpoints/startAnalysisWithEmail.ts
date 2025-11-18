import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import { summarizeText } from "./summarizeText"
import { sendAnalysisStartedEmail } from "../services/gmail"
import jwt from "@tsndr/cloudflare-worker-jwt"

// Request/Response schemas
const StartAnalysisWithEmailRequest = z.object({
  email: z.string().email("Please provide a valid email address"),
  fileContent: z.string().min(10, "File content is required"), // Reduced minimum for testing
  fileName: z.string().min(1, "File name is required"),
  meetingDate: z.string().optional().describe("Meeting date in YYYY-MM-DD format")
})

const StartAnalysisWithEmailResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  analysisId: z.string().optional(),
  isNewUser: z.boolean()
})

export class StartAnalysisWithEmail extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Start analysis with email authentication",
    description: "Begins meeting analysis and handles user authentication via email",
    request: {
      body: {
        content: {
          "application/json": {
            schema: StartAnalysisWithEmailRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Analysis started successfully",
        content: {
          "application/json": {
            schema: StartAnalysisWithEmailResponse
          }
        }
      },
      "400": {
        description: "Invalid request data"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(request: Request, env: Env, context: ExecutionContext, data: any) {
    try {
      console.log("Received data:", data)
      console.log("Request object:", !!request)
      
      if (request) {
        console.log("Request method:", request.method)
        console.log("Request has headers:", !!request.headers)
        if (request.headers && typeof request.headers.entries === 'function') {
          try {
            console.log("Request headers:", Object.fromEntries(request.headers.entries()))
          } catch (headerError) {
            console.log("Could not read headers:", headerError.message)
          }
        }
      }
      
      // Try to get the request data 
      let requestData = data || {}
      
      // If data is empty, try to parse from request body
      if ((!data || Object.keys(data).length === 0) && request) {
        console.log("Data is empty, parsing request body manually...")
        try {
          const body = await request.text()
          console.log("Raw request body:", body)
          if (body) {
            requestData = JSON.parse(body)
          }
        } catch (parseError) {
          console.error("Failed to parse request body:", parseError)
        }
      }
      
      console.log("Final request data:", requestData)
      
      // Validate the data using our Zod schema
      const validation = StartAnalysisWithEmailRequest.safeParse(requestData)
      if (!validation.success) {
        console.log("Validation failed:", validation.error)
        return Response.json({
          success: false,
          message: "Invalid request data: " + validation.error.errors.map(e => e.message).join(", "),
          isNewUser: false
        }, { status: 400 })
      }
      
      const { email, fileContent, fileName, meetingDate } = validation.data

      // Determine final meeting date: use provided date or default to current date
      const finalMeetingDate = meetingDate || new Date().toISOString().split('T')[0]
      console.log("Using meeting date:", finalMeetingDate)

      // Check if user exists
      let user = await env.DB.prepare(
        "SELECT user_id as id, email, verified FROM users WHERE email = ?"
      ).bind(email).first()

      let isNewUser = false
      let userId: string

      if (!user) {
        // Create new user
        isNewUser = true
        userId = crypto.randomUUID()
        const userResult = await env.DB.prepare(`
          INSERT INTO users (user_id, email, password_hash, plan, verified, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          email,
          "email_auth", // Placeholder since password_hash is required
          "free", // Default plan
          false,
          new Date().toISOString()
        ).run()

        if (!userResult.success) {
          throw new Error("Failed to create user")
        }
        
        // Fetch the created user
        user = { id: userId, email, verified: false }
      } else {
        userId = user.id
      }

      // Start the analysis (call existing summarizeText endpoint logic)
      console.log("Starting analysis for user:", userId)
      
      // TODO: We need to modify summarizeText to accept userId and return meetingId
      // For now, let's create a meeting record first
      const meetingId = crypto.randomUUID()
      
      // Create meeting record
      const meetingResult = await env.DB.prepare(`
        INSERT INTO meetings (meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, transcript, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        meetingId,
        userId,
        crypto.randomUUID(), // Generate client_id (required field)
        "New Client", // Default client name
        fileName, // Use filename as meeting title
        finalMeetingDate, // meeting_date as DATE
        fileContent.substring(0, 1000) + "...", // Store truncated version
        new Date().toISOString()
      ).run()

      if (!meetingResult.success) {
        throw new Error("Failed to create meeting record")
      }

      // Generate JWT token for email verification/access
      const tokenPayload = {
        userId,
        meetingId,
        email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }

      const token = await jwt.sign(tokenPayload, env.JWT_SECRET)

      // Send analysis started email
      await sendAnalysisStartedEmail(env, email, token, fileName)
      console.log("Sent analysis started email to:", email)

      // Start background analysis
      context.waitUntil(
        (async () => {
          try {
            console.log("Starting background analysis for meeting:", meetingId)
            
            // Import and use the analysis services directly
            const { OpenAIService } = await import("../services/openai")
            const { ResponseParser } = await import("../utils/responseParser")
            
            const openaiService = new OpenAIService(env)
            
            // Step 1: Detect meeting type and perform analysis
            const meetingTypeResult = await openaiService.detectMeetingType(fileContent)
            const isDiscovery = meetingTypeResult.isDiscovery
            console.log('Meeting type detected:', isDiscovery ? 'discovery' : 'consulting')
            
            // Step 2: Summarize with appropriate type
            const type = isDiscovery ? 'discovery' : 'consulting'
            const rawResult = await openaiService.summarizeText(fileContent, type)
            const parsedData = ResponseParser.parseSummaryWithDeepSeek(rawResult)
            
            // Step 3: Generate follow-up email
            console.log('Step 3: Generating follow-up email...')
            const followUpEmail = await openaiService.generateFollowUpEmail(parsedData.summary, isDiscovery)
            console.log('Follow-up email generated successfully')
            
            // Step 4: Generate reels scripts
            console.log('Step 4: Generating reels scripts...')
            const reelsContent = await openaiService.generateReelsScripts(fileContent)
            const parsedReels = ResponseParser.parseSocialMedia(reelsContent)
            console.log('Reels scripts generated successfully')
            
            // Step 5: Generate mind map
            console.log('Step 5: Generating mind map...')
            let mindMapContent = null
            try {
              const mindMapType = isDiscovery ? 'sales' : 'consulting'
              mindMapContent = await openaiService.generateMindMap(parsedData.summary?.summary || fileContent, mindMapType)
              console.log('Mind map generated successfully')
            } catch (mindMapError) {
              console.error('Failed to generate mind map:', mindMapError)
              // Continue without mind map - it's not critical
            }
            
            // Step 6: Save all data to database
            console.log('Step 6: Saving data to database...')
            const { DatabaseService } = await import("../services/database")
            const dbService = new DatabaseService(env)
            
            // Extract client information from AI response
            const clientData = {
              userId,
              name: parsedData.summary.clientName || 'Unknown Client',
              email: null,
              phoneNumber: null
            }
            
            // Save or update client
            const clientId = await dbService.saveClient(clientData)
            console.log('Client saved/updated with ID:', clientId)
            
            // Step 7: Generate next meeting preparation
            console.log('Step 7: Generating next meeting preparation...')
            let nextMeetingPrep = null
            try {
              const allMeetings = await dbService.getMeetingsByClient(userId, clientId)
              
              if (allMeetings && allMeetings.length > 0) {
                const meetingsData = allMeetings.map(meeting => ({
                  meetingTitle: meeting.meeting_title,
                  meetingDate: meeting.meeting_date,
                  summary: meeting.summary,
                  painPoint: meeting.pain_point,
                  goal: meeting.goal,
                  suggestion: meeting.suggestion,
                  actionItemsClient: meeting.action_items_client ? JSON.parse(meeting.action_items_client) : [],
                  actionItemsCoach: meeting.action_items_coach ? JSON.parse(meeting.action_items_coach) : [],
                  salesTechniqueAdvice: meeting.sales_technique_advice ? JSON.parse(meeting.sales_technique_advice) : [],
                  coachingAdvice: meeting.coaching_advice ? JSON.parse(meeting.coaching_advice) : []
                }))
                
                nextMeetingPrep = await openaiService.generateNextMeetingPrep(meetingsData)
                console.log('Next meeting preparation generated successfully')
              }
            } catch (prepError) {
              console.error('Next meeting prep generation error:', prepError)
              // Continue without next meeting prep - it's not critical
            }
            
            // Step 8: Update the existing meeting record with all the analysis data
            console.log('Step 8: Updating meeting record with analysis results...')
            await env.DB.prepare(`
              UPDATE meetings SET 
                client_id = ?, client_name = ?, meeting_title = ?, meeting_date = ?,
                is_discovery = ?, transcript = ?, summary = ?, pain_point = ?, 
                suggestion = ?, goal = ?, sales_technique_advice = ?, coaching_advice = ?,
                action_items_client = ?, action_items_coach = ?, email_content = ?, 
                resources_list = ?, mind_map = ?, next_meeting_prep = ?
              WHERE meeting_id = ?
            `).bind(
              clientId,
              parsedData.summary.clientName || 'Unknown Client',
              fileName,
              finalMeetingDate,
              isDiscovery,
              fileContent,
              parsedData.summary.summary || null,
              parsedData.summary.painPoint || null,
              parsedData.summary.coachSuggestions?.join(', ') || null,
              parsedData.summary.goal || null,
              JSON.stringify(parsedData.summary.salesTechniqueAdvice || parsedData.summary.coachingAdvice || []),
              JSON.stringify(parsedData.summary.coachingAdvice || []),
              JSON.stringify(parsedData.summary.actionItemsClient || []),
              JSON.stringify(parsedData.summary.actionItemsCoach || []),
              JSON.stringify(followUpEmail),
              parsedData.resourcesListPrompt || null,
              mindMapContent || null,
              nextMeetingPrep ? JSON.stringify(nextMeetingPrep) : null,
              meetingId
            ).run()
            console.log('Meeting record updated successfully')
            
            // Step 9: Save reels to database with retry mechanism
            console.log('Step 9: Saving reels to database...')
            const reelsToSave = (parsedReels?.reels ?? []).map((r: any) => ({
              hook: r.hook || '',
              content: r.narrative || '',
              tags: r.hashtags || []
            }))
            
            if (reelsToSave.length > 0) {
              const maxRetries = 3
              let retryCount = 0
              let reelsSaved = false
              
              while (retryCount < maxRetries && !reelsSaved) {
                try {
                  await dbService.saveReelsIdeas(userId, meetingId, reelsToSave)
                  console.log(`Reels saved successfully (attempt ${retryCount + 1})`)
                  reelsSaved = true
                } catch (reelsSaveError) {
                  retryCount++
                  console.error(`Failed to save reels (attempt ${retryCount}/${maxRetries}):`, reelsSaveError)
                  
                  if (retryCount >= maxRetries) {
                    console.error('Max retries reached for saving reels. Reels data:', JSON.stringify(reelsToSave))
                    // Log error but don't throw - continue with analysis
                  } else {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                  }
                }
              }
            } else {
              console.log('No reels to save')
            }
            
            console.log("Analysis completed successfully")

            // Send completion email with results
            const { sendAnalysisCompleteEmail } = await import("../services/gmail")
            const clientName = parsedData.summary?.clientName || "New Client"

            await sendAnalysisCompleteEmail(env, email, token, fileName, clientName, 'completed')
            console.log("Sent analysis complete email to:", email)

          } catch (error) {
            console.error("Background analysis failed:", error)
            const err = error as Error

            // ✅ Send failure notification email
            try {
              console.log("📧 Sending failure notification email...")
              const { sendAnalysisCompleteEmail } = await import("../services/gmail")

              await sendAnalysisCompleteEmail(
                env,
                email,
                token,
                fileName,
                "New Client",
                'failed', // status
                err?.message || 'Analysis failed due to an unexpected error' // errorMessage
              )
              console.log("✅ Failure notification email sent to:", email)
            } catch (emailError) {
              console.error("❌ Failed to send failure notification email:", emailError)
            }

            // Update meeting status to failed
            try {
              await env.DB.prepare(
                "UPDATE meetings SET analysis_status = 'failed' WHERE meeting_id = ?"
              ).bind(meetingId).run()
              console.log("✅ Meeting status updated to failed")
            } catch (dbError) {
              console.error("❌ Failed to update meeting status:", dbError)
            }
          }
        })()
      )

      return Response.json({
        success: true,
        message: "Analysis started! You'll receive an email with your complete results when finished (usually within a few minutes).",
        analysisId: meetingId,
        isNewUser
      })

    } catch (error) {
      console.error("Error in startAnalysisWithEmail:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to start analysis. Please try again."
      if (error instanceof SyntaxError) {
        errorMessage = "Invalid request format. Please check your data."
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return Response.json({
        success: false,
        message: errorMessage,
        analysisId: undefined,
        isNewUser: false
      }, { status: 500 })
    }
  }
}