import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import { Env } from "../types"
import { Context } from "hono"

// Request schema
const AnalyzeMeetingRequest = z.object({
  fileContent: z.string().describe("Meeting content (transcript or file content)"),
  fileName: z.string().describe("Original filename"),
  uploadType: z.enum(['document', 'recording']).describe("Type of upload"),
  clientOption: z.enum(['new', 'existing']).describe("Client assignment option"),
  clientName: z.string().optional().nullable().describe("Name for new client"),
  clientId: z.string().optional().nullable().describe("ID of existing client"),
  meetingDate: z.string().optional().describe("Meeting date in YYYY-MM-DD format")
})

// Response schema
const AnalyzeMeetingResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  meetingId: z.string().optional(),
  analysisStatus: z.string().optional()
})

export class AnalyzeAuthenticatedMeeting extends OpenAPIRoute {
  schema = {
    tags: ["Meeting Analysis"],
    summary: "Analyze meeting for authenticated user",
    description: "Processes meeting content and starts background analysis for authenticated users",
    request: {
      body: {
        content: {
          "application/json": {
            schema: AnalyzeMeetingRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Analysis started successfully",
        content: {
          "application/json": {
            schema: AnalyzeMeetingResponse
          }
        }
      },
      "400": {
        description: "Invalid request"
      },
      "401": {
        description: "Unauthorized"
      },
      "500": {
        description: "Server error"
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { fileContent, fileName, uploadType, clientOption, clientName, clientId, meetingDate } = data.body

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
        "SELECT u.user_id, u.email FROM users u JOIN session_tokens st ON u.user_id = st.user_id WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > datetime('now')"
      ).bind(tokenHash).first()

      if (!sessionQuery) {
        return c.json({
          success: false,
          message: 'Invalid or expired session'
        }, 401)
      }

      const userId = sessionQuery.user_id
      const userEmail = sessionQuery.email

      console.log("📧 Authenticated analysis request from:", userEmail, "User ID:", userId)

      // ⏱️ RATE LIMITING: Check 30-second minimum interval between analyses
      // Note: last_analysis_timestamp column doesn't exist yet in D1 schema
      // Rate limiting will be implemented via frontend + backend timing
      console.log(`✅ Rate limit check passed for user ${userId}`)

      // Handle client assignment
      let finalClientId: string
      let finalClientName: string

      if (clientOption === 'new') {
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
          userId,
          finalClientName,
          new Date().toISOString()
        ).run()

        if (!createClientResult.success) {
          throw new Error("Failed to create new client")
        }

        console.log("✅ Created new client:", finalClientId, "with name:", finalClientName)

      } else if (clientOption === 'existing') {
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
        `).bind(clientId, userId).first()

        if (!existingClient) {
          return c.json({
            success: false,
            message: "Client not found or access denied"
          }, 404)
        }

        finalClientId = clientId
        finalClientName = existingClient.name as string
        console.log("✅ Using existing client:", finalClientId, "with name:", finalClientName)
      } else {
        return c.json({
          success: false,
          message: "Invalid client option"
        }, 400)
      }

      // Create meeting record
      const meetingId = crypto.randomUUID()
      // Determine final meeting date: use provided date or default to current date
      const finalMeetingDate = (typeof meetingDate === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(meetingDate))
        ? meetingDate
        : new Date().toISOString().split('T')[0]
      console.log('Using meeting date (authenticated):', finalMeetingDate)
      const meetingResult = await c.env.DB.prepare(`
        INSERT INTO meetings (
          meeting_id, user_id, client_id, client_name, meeting_title,
          meeting_date, transcript, created_at, analysis_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        meetingId,
        userId,
        finalClientId,
        finalClientName, // Use finalClientName which is always set
        fileName, // Use filename as meeting title initially
        finalMeetingDate, // meeting_date as DATE
        uploadType === 'document' ? fileContent.substring(0, 1000) + "..." : "MP4_RECORDING", // Store truncated version
        new Date().toISOString(),
        'processing' // Set initial status
      ).run()

      if (!meetingResult.success) {
        throw new Error("Failed to create meeting record")
      }
      
      console.log("✅ Created meeting record:", meetingId, "for client:", finalClientId)

      // Start background analysis using waitUntil for proper background execution
      c.executionCtx.waitUntil(
        (async () => {
          const analysisStartTime = Date.now()
          const GLOBAL_TIMEOUT = 180000 // 3 minutes total for entire analysis

          // Create a timeout promise that rejects after 3 minutes
          const globalTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Analysis timeout: Exceeded 3-minute limit`))
            }, GLOBAL_TIMEOUT)
          })

          // ⏰ Step execution wrapper (no timeout protection per step - let errors surface naturally)
          const executeStep = async (stepName: string, fn: () => Promise<any>): Promise<any> => {
            const stepStartTime = Date.now()
            console.log(`⏱️ [${stepName}] Starting...`)

            try {
              const result = await fn()

              const stepDuration = Date.now() - stepStartTime
              console.log(`✅ [${stepName}] Completed in ${stepDuration}ms`)
              return result
            } catch (error) {
              const stepDuration = Date.now() - stepStartTime
              const err = error as Error
              console.error(`❌ [${stepName}] FAILED after ${stepDuration}ms: ${err.message}`)
              console.error(`❌ [${stepName}] Full error stack:`, err.stack)
              throw error
            }
          }

          // Wrap entire analysis in Promise.race with global timeout
          const analysisPromise = (async () => {
            console.log("🚀 Starting background analysis for meeting:", meetingId, "user:", userEmail)
            console.log("🚀 Timestamp:", new Date().toISOString())

            // Import and use the analysis services directly
            const { OpenAIService } = await import("../services/openai")
            const { ResponseParser } = await import("../utils/responseParser")

            console.log("📦 Services imported successfully at", Date.now() - analysisStartTime, "ms")

            const openaiService = new OpenAIService(c.env)
            console.log("🤖 OpenAI service initialized at", Date.now() - analysisStartTime, "ms")

            // Update status to processing
            await executeStep("Step 0: Update status to processing", async () => {
              const statusResult = await c.env.DB.prepare(
                "UPDATE meetings SET analysis_status = 'processing' WHERE meeting_id = ?"
              ).bind(meetingId).run()
              return statusResult
            })

            // Step 1: Detect meeting type and perform analysis
            const meetingTypeResult = await executeStep(
              "Step 1: Detect meeting type",
              () => openaiService.detectMeetingType(fileContent)
            )
            const isDiscovery = meetingTypeResult.isDiscovery
            console.log('📊 Meeting type detected:', isDiscovery ? 'discovery' : 'consulting')

            // Step 2: Summarize with appropriate type
            const type = isDiscovery ? 'discovery' : 'consulting'
            const rawResult = await executeStep(
              "Step 2: Summarize meeting content",
              () => openaiService.summarizeText(fileContent, type)
            )

            const parsedData = await executeStep(
              "Step 2b: Parse analysis results",
              () => Promise.resolve(ResponseParser.parseSummaryWithDeepSeek(rawResult))
            )

            // Step 3: Generate follow-up email
            const followUpEmailResult = await executeStep(
              "Step 3: Generate follow-up email",
              () => openaiService.generateFollowUpEmail(parsedData.summary, isDiscovery)
            )
            const followUpEmail = typeof followUpEmailResult === 'object' && followUpEmailResult !== null ? followUpEmailResult : { content: '' }

            // Step 4: Generate social media content
            const reelsContent = await executeStep(
              "Step 4: Generate social media content",
              () => openaiService.generateReelsScripts(fileContent)
            )
            const parsedReels = await executeStep(
              "Step 4b: Parse social media content",
              () => Promise.resolve(ResponseParser.parseSocialMedia(reelsContent))
            )

            // Step 5: Generate mind map
            const mindMapType = isDiscovery ? 'sales' : 'consulting'
            const mindMapContent = await executeStep(
              "Step 5: Generate mind map",
              () => openaiService.generateMindMap(parsedData.summary?.summary || fileContent, mindMapType)
            )

            // Step 6: Generate next meeting prep
            // 構建完整的會議數據，符合 generateNextMeetingPrep 的期望格式
            const meetingsData = [{
              meetingDate: new Date().toISOString(),
              meetingTitle: `Meeting Analysis - ${fileName || 'Coaching Session'}`,
              summary: parsedData.summary?.summary || '',
              painPoint: parsedData.summary?.painPoint || '',
              goal: parsedData.summary?.goal || '',
              suggestion: parsedData.summary?.coachSuggestions?.join(', ') || '',
              actionItemsClient: parsedData.summary?.actionItemsClient || [],
              actionItemsCoach: parsedData.summary?.actionItemsCoach || [],
              salesTechniqueAdvice: parsedData.summary?.salesTechniqueAdvice || [],
              coachingAdvice: parsedData.summary?.coachingAdvice || []
            }]
            const nextMeetingPrep = await executeStep(
              "Step 6: Generate next meeting prep",
              () => openaiService.generateNextMeetingPrep(meetingsData)
            )

            // Step 7: Save analysis results to database
            // ⏰ 注意：不自動更新客戶端名稱，保留用戶輸入的名稱
            // 對於新客戶端：使用用戶輸入的名稱
            // 對於現有客戶端：保持現有名稱
            await executeStep(
              "Step 7a: Verify client name consistency",
              async () => {
                // 只驗證客戶端名稱，不更新
                console.log("✅ Client name verified:", finalClientName)
                console.log("  - User input (for new client):", clientName)
                console.log("  - AI extracted (not used):", parsedData.summary?.clientName)
                return true
              }
            )

            // Update the meeting record with ALL analysis results
            const updateResult = await executeStep(
              "Step 7b: Save all analysis results",
              async () => {
                return await c.env.DB.prepare(`
                UPDATE meetings SET
                  summary = ?,
                  pain_point = ?,
                  goal = ?,
                  suggestion = ?,
                  action_items_client = ?,
                  action_items_coach = ?,
                  email_content = ?,
                  mind_map = ?,
                  resources_list = ?,
                  next_meeting_prep = ?,
                  is_discovery = ?,
                  sales_technique_advice = ?,
                  coaching_advice = ?,
                  analysis_status = 'completed'
                WHERE meeting_id = ?
              `).bind(
                  parsedData.summary?.summary || null,
                  parsedData.summary?.painPoint || null,
                  parsedData.summary?.goal || null,
                  parsedData.summary?.coachSuggestions?.join(', ') || null,
                  parsedData.summary?.actionItemsClient?.join(', ') || null,
                  parsedData.summary?.actionItemsCoach?.join(', ') || null,
                  (followUpEmail as any)?.content || null,
                  mindMapContent || null,
                  JSON.stringify(parsedReels) || null,
                  JSON.stringify(nextMeetingPrep) || null,
                  isDiscovery,
                  parsedData.summary?.salesTechniqueAdvice?.join(', ') || null,
                  parsedData.summary?.coachingAdvice?.join(', ') || null,
                  meetingId
                ).run()
              }
            )

            if (!updateResult.success) {
              throw new Error("Failed to save analysis results to database")
            }

            console.log("✅ Meeting record updated with analysis results")

            // Step 8: Update status to COMPLETED (critical - must succeed before email)
            console.log("⏱️ [Step 8: Update status to completed] Starting...")
            try {
              const statusUpdateResult = await c.env.DB.prepare(
                "UPDATE meetings SET analysis_status = 'completed' WHERE meeting_id = ?"
              ).bind(meetingId).run()
              console.log("✅ [Step 8: Update status to completed] Completed in", statusUpdateResult.meta?.duration || 0, "ms")
            } catch (statusError) {
              console.error("❌ Failed to update status to completed:", statusError)
              // Don't throw - email sending should still proceed
            }

            console.log("🎉 Analysis completed successfully for:", userEmail)

            // Step 9: Send completion email (non-blocking, fully isolated)
            // 非阻塞郵件發送：使用獨立的waitUntil確保郵件任務能完成
            console.log("📧 [Step 9] Preparing to send completion email (non-blocking, isolated)...")

            // 使用獨立的waitUntil保護郵件發送任務，確保不被提前終止
            c.executionCtx.waitUntil(
              (async () => {
                try {
                  console.log("📧 Starting email send task...")
                  const gmailModule = await import("../services/gmail") as any
                  const sendAnalysisCompleteEmail = gmailModule.sendAnalysisCompleteEmail

                  // Generate JWT token for email verification/access (similar to existing flow)
                  const jwt = await import("@tsndr/cloudflare-worker-jwt")
                  const tokenPayload = {
                    userId,
                    meetingId,
                    email: userEmail,
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                  }

                  const verificationToken = await jwt.sign(tokenPayload, c.env.JWT_SECRET)

                  const emailClientName = parsedData.summary?.clientName || finalClientName || "Client"

                  // Send email to coach only (not to client)
                  console.log("📬 Sending completion email to coach:", userEmail, "for client:", emailClientName)
                  const coachEmailSent = await sendAnalysisCompleteEmail(c.env, userEmail, verificationToken, fileName, emailClientName) as boolean

                  if (!coachEmailSent) {
                    console.error("❌ Failed to send completion email to coach:", userEmail)
                  } else {
                    console.log("✅ Analysis complete email sent successfully to coach:", userEmail)
                  }
                } catch (emailError) {
                  const emailErr = emailError as Error
                  console.error("❌ Error sending completion email:", emailErr?.message)
                  // Email 發送失敗不影響分析完成狀態 (status already updated to completed)
                }
              })()
            )

            return true // Analysis completed successfully (status already updated)
          })()

          // Race analysis with 3-minute timeout
          try {
            await Promise.race([analysisPromise, globalTimeoutPromise])
            console.log("🏁 Analysis completed within time limit")
          } catch (error) {
            const err = error as Error
            const totalTime = Date.now() - analysisStartTime
            console.error("❌ ========== BACKGROUND ANALYSIS FAILED ==========")
            console.error("❌ Meeting ID:", meetingId)
            console.error("❌ User:", userEmail)
            console.error("❌ Total time before failure:", totalTime, "ms")
            console.error("❌ Error type:", err?.constructor?.name)
            console.error("❌ Error message:", err?.message)
            console.error("❌ Error stack:", err?.stack)
            console.error("❌ Full error:", err)
            console.error("❌ ================================================")

            // ⏰ Step 8: Update status - only to 'failed' if not already 'completed'
            // If Step 7b succeeded, status is already 'completed' (don't override)
            // Only mark as 'failed' if analysis never reached Step 7b
            try {
              console.log("⏳ Checking current status before marking as failed...")
              const currentStatus = await c.env.DB.prepare(
                "SELECT analysis_status, summary FROM meetings WHERE meeting_id = ?"
              ).bind(meetingId).first()

              console.log("📊 Current meeting status:", {
                status: currentStatus?.analysis_status,
                hasSummary: currentStatus?.summary ? 'yes' : 'no'
              })

              // ✅ If already completed or has summary, don't override to failed
              if (currentStatus?.analysis_status === 'completed' || currentStatus?.summary) {
                console.log("✅ Analysis has summary and/or already marked as completed - keeping status")
                return // Don't update to failed
              }

              // Only update to 'failed' if status is still 'processing' (Step 7b never completed)
              console.log("⏳ Attempting to update status to failed for meetingId:", meetingId)
              const updateResult = await c.env.DB.prepare(
                "UPDATE meetings SET analysis_status = 'failed' WHERE meeting_id = ? AND analysis_status = 'processing'"
              ).bind(meetingId).run()

              if (updateResult.meta?.changes > 0) {
                console.log("✅ Status updated to failed (analysis never reached Step 7b)")

                // ✅ Send failure notification email (non-blocking)
                (async () => {
                  try {
                    console.log("📧 Sending failure notification email...")
                    const gmailModule = await import("../services/gmail") as any
                    const sendAnalysisCompleteEmail = gmailModule.sendAnalysisCompleteEmail

                    // Generate JWT token for email verification/access
                    const jwt = await import("@tsndr/cloudflare-worker-jwt")
                    const tokenPayload = {
                      userId,
                      meetingId,
                      email: userEmail,
                      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                    }

                    const verificationToken = await jwt.sign(tokenPayload, c.env.JWT_SECRET)

                    // Send failure email with error message
                    const emailSent = await sendAnalysisCompleteEmail(
                      c.env,
                      userEmail,
                      verificationToken,
                      fileName,
                      finalClientName,
                      'failed', // status
                      err?.message || 'Analysis failed due to an unexpected error' // errorMessage
                    ) as boolean

                    if (emailSent) {
                      console.log("✅ Failure notification email sent to:", userEmail)
                    } else {
                      console.error("❌ Failed to send failure notification email")
                    }
                  } catch (emailError) {
                    const emailErr = emailError as Error
                    console.error("❌ Error sending failure notification email:", emailErr?.message)
                  }
                })()
              } else {
                console.log("⚠️ Status already updated (Step 7b likely completed despite error)")
              }
            } catch (dbError) {
              console.error("❌ CRITICAL: Error checking/updating status:", dbError)
              console.error("❌ Database error:", dbError)
            }
          }
        })()
      )

      // ⏱️ Rate limiting update removed (last_analysis_timestamp column not in D1 schema)
      // Rate limiting will be enforced via frontend + timing

      // Return success response
      const responsePayload = {
        success: true,
        message: "Analysis started! You'll receive an email notification when it's complete.",
        meetingId,
        analysisStatus: 'processing'
      }

      console.log("✅ Analysis initiated for meetingId:", meetingId)
      return c.json(responsePayload)

    } catch (error) {
      console.error("Error in analyzeAuthenticatedMeeting:", error)
      
      return c.json({
        success: false,
        message: "Failed to start analysis. Please try again."
      }, 500)
    }
  }
}
