import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from 'hono/cors';
import { SummarizeText } from "./endpoints/summarizeText";
import { GenerateMindMap } from "./endpoints/generateMindMap";
import { GenerateFollowUpEmail } from "./endpoints/generateFollowUpEmail";
import { GenerateReelsScripts } from "./endpoints/generateReelsScripts";
import { GenerateNextMeetingPrep } from "./endpoints/generateNextMeetingPrep";
import { ConvertMp4ToMp3 } from "./endpoints/convertMp4ToMp3";
import { GenerateResourcesList } from "./endpoints/generateResourcesList";
import { GeneratePerplexityResourcesList } from "./endpoints/generatePerplexityResourcesList";
import { TestAI } from "./endpoints/testAI";
import { GenerateIgCreative } from "./endpoints/generateIgCreative";
import { TestDatabase } from "./endpoints/testDatabase";
import { ListMeetings } from "./endpoints/listMeetings";
import { ListClients } from "./endpoints/listClients";
import { UpdateClient } from "./endpoints/updateClient";
import { DeleteReel, FavoriteReel, ListReels, UpdateReel } from "./endpoints/reels";
import { ListTags, CreateTag, UpdateTag, DeleteTag } from "./endpoints/tags";
import { GetClientTags, AssignTagToClient, RemoveTagFromClient } from "./endpoints/clientTags";
import { StartAnalysisWithEmail } from "./endpoints/startAnalysisWithEmail";
import { VerifyEmailAndViewResults, VerifyEmailAndViewResultsGet } from "./endpoints/verifyEmailAndViewResults";
import { GetMeetingById } from "./endpoints/getMeetingById";
import { DebugMeeting } from "./endpoints/debugMeeting";
import { Login } from "./endpoints/login";
import { RefreshToken } from "./endpoints/refreshToken";
import { Logout } from "./endpoints/logout";
import { TestSessionAuth } from "./endpoints/testSessionAuth";
import { Dashboard, ValidateSession } from "./endpoints/dashboard";
import { DebugAuth } from "./endpoints/debugAuth";
import { DebugClientMeetings } from "./endpoints/debugClientMeetings";
import { SaveUserColumnPreferences, GetUserColumnPreferences } from "./endpoints/userColumnPreferences";
import { AssignMeetingToClient } from "./endpoints/assignMeetingToClient";
import { AnalyzeAuthenticatedMeeting } from "./endpoints/analyzeAuthenticatedMeeting";
import { GetMeetingStatus } from "./endpoints/getMeetingStatus";
import { ClassifyMeeting } from "./endpoints/classifyMeeting";
import { ZoomWebhook } from "./endpoints/zoomWebhook";
import { GoogleWebhook } from "./endpoints/googleWebhook";
import { CompleteOnboarding } from "./endpoints/completeOnboarding";
import { AuthGoogle } from "./endpoints/authGoogle";
import { AuthGoogleInit } from "./endpoints/authGoogleInit";
import { AuthGoogleNew } from "./endpoints/authGoogleNew";
import { LoginNew } from "./endpoints/loginNew";
import { RegisterNew } from "./endpoints/registerNew";
import { Health } from "./endpoints/health";
import { TestEmailAuth } from "./endpoints/testEmailAuth";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Allowed localhost origins for CORS (development)
const localhostOrigins = [
	'http://localhost:5173',  // Primary frontend port
	'http://localhost:5174',
	'http://localhost:5175',
	'http://localhost:5176',
	'http://localhost:3000',  // Create React App default
	'http://localhost:3001',  // Create React App fallback
	'http://localhost:8080',  // Vue/Webpack dev server
	'http://localhost:4173',  // Vite preview mode
	'http://localhost:4174',  // Vite preview fallback
];

// Helper function to get allowed origins (includes env-based production URL)
const getAllowedOrigins = (env: Env): string[] => {
	const origins = [...localhostOrigins];
	// Add production frontend URL from environment variable
	if (env.FRONTEND_URL) {
		origins.push(env.FRONTEND_URL);
	}
	return origins;
};

// Explicit OPTIONS handler for CORS preflight requests
app.options('*', async (c) => {
	const origin = c.req.header('Origin');
	const allowedOrigins = getAllowedOrigins(c.env);

	// Check if origin is allowed
	if (origin && allowedOrigins.includes(origin)) {
		console.log('✅ OPTIONS preflight request allowed for origin:', origin);
		return c.json({}, 200, {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '86400' // 24 hours
		});
	}
	
	// If origin is not allowed, still return CORS headers but with error
	console.log('⚠️ OPTIONS preflight request from disallowed origin:', origin);
	return c.json({ error: 'Origin not allowed' }, 403, {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true'
	});
});

// CORS middleware with dynamic origin checking
app.use(
	'*',
	cors({
		origin: (origin, c) => {
			const allowedOrigins = getAllowedOrigins(c.env);
			return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
		},
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
		credentials: true
	})
);

// Setup OpenAPI registry
// Note: schema.servers URL should match BACKEND_URL environment variable
const openapi = fromHono(app, {
	docs_url: "/",
	schema: {
		servers: [
			{
				url: "https://coach-backend.gamepig1976.workers.dev",
				description: "Production server"
			}
		]
	}
});

// Register OpenAI endpoints
openapi.post("/api/openai/summarize-text", SummarizeText);
openapi.post("/api/openai/generate-mindmap", GenerateMindMap);
openapi.post("/api/openai/generate-followup-email", GenerateFollowUpEmail);
openapi.post("/api/openai/generate-reels-scripts", GenerateReelsScripts);
openapi.post("/api/openai/generate-next-meeting-prep", GenerateNextMeetingPrep);
openapi.post("/api/media/convert-mp4-to-transcript", ConvertMp4ToMp3);

// Register DeepSeek endpoints
openapi.post("/api/resources-list", GenerateResourcesList);

// Register Perplexity endpoints
openapi.post("/api/perplexity/resources-list", GeneratePerplexityResourcesList);

// Register Test endpoints
openapi.get("/api/test-ai", TestAI);
openapi.get("/api/test-database", TestDatabase);
openapi.post("/api/test-database", TestDatabase);
// openapi.post("/api/test-search", TestSearch); // disabled: endpoint not present

// Data listing endpoints
openapi.post("/api/meetings/list", ListMeetings);
openapi.get("/api/clients/list", ListClients);
openapi.put("/api/clients/:clientId", UpdateClient);

// Reels endpoints
openapi.post("/api/reels/list", ListReels);
openapi.put("/api/reels/update", UpdateReel);
openapi.post("/api/reels/favorite", FavoriteReel);
openapi.delete("/api/reels/delete", DeleteReel);

// Tag management endpoints
openapi.get("/api/tags", ListTags);
openapi.post("/api/tags", CreateTag);
openapi.put("/api/tags/:id", UpdateTag);
openapi.delete("/api/tags/:id", DeleteTag);

// Client tag assignment endpoints
openapi.get("/api/clients/:id/tags", GetClientTags);
openapi.post("/api/clients/:id/tags", AssignTagToClient);

// Email authentication endpoints  
openapi.post("/api/start-analysis-with-email", StartAnalysisWithEmail);
openapi.post("/api/verify-email", VerifyEmailAndViewResults);
openapi.get("/api/verify-email", VerifyEmailAndViewResultsGet);

// Session management endpoints
openapi.post("/api/login", Login);
openapi.post("/api/login-new", LoginNew); // New email/password login
openapi.post("/api/register-new", RegisterNew); // New email/password registration
openapi.post("/api/refresh-token", RefreshToken);
openapi.post("/api/logout", Logout);
openapi.get("/api/validate-session", ValidateSession);
openapi.get("/api/auth/google/init", AuthGoogleInit);
openapi.get("/api/auth/google/callback", AuthGoogle);
// openapi.get("/api/auth/google/callback-new", AuthGoogleNew); // New implementation (same endpoint for now)
// openapi.post("/api/register", Register); // disabled: endpoint not present
// openapi.post("/api/integrations/zoom/oauth", ZoomOAuth); // disabled: endpoint not present
openapi.post("/api/integrations/zoom/webhook", ZoomWebhook); // For receiving webhook events
openapi.post("/api/integrations/google/webhook", GoogleWebhook); // For receiving Google Meet webhook events

// User preferences endpoints
openapi.post("/api/user/column-preferences", SaveUserColumnPreferences);
openapi.get("/api/user/column-preferences", GetUserColumnPreferences);

// Client assignment endpoint
openapi.post("/api/assign-meeting-to-client", AssignMeetingToClient);

// Authenticated meeting analysis endpoints
openapi.post("/api/analyze-authenticated-meeting", AnalyzeAuthenticatedMeeting);
openapi.get("/api/meetings/:meetingId/status", GetMeetingStatus);

// Onboarding endpoints
openapi.post("/api/users/complete-onboarding", CompleteOnboarding);

// Dashboard endpoints  
openapi.get("/api/dashboard", Dashboard);

// Health check endpoint
openapi.get("/api/health", Health);

// Test endpoints
openapi.get("/api/test-session-auth", TestSessionAuth);
openapi.get("/api/debug-auth", DebugAuth);

// Meeting data endpoint
openapi.post("/api/meetings/get-by-id", GetMeetingById);

// Debug endpoint
openapi.post("/api/debug/meeting", DebugMeeting);

// Simple test endpoint to verify backend is working
openapi.get("/api/test-email-auth", TestEmailAuth);

// Direct Hono route as fallback for email auth (bypassing Chanfana)
app.post("/api/start-analysis-with-email-direct", async (c) => {
  try {
    console.log("Direct route hit!")
    const body = await c.req.json()
    console.log("Direct route body:", body)
    
    const { email, fileContent, fileName, meetingDate } = body
    
    // Validate required fields
    if (!email || !fileContent || !fileName) {
      return c.json({
        success: false,
        message: "Missing required fields: email, fileContent, and fileName are required"
      }, 400)
    }
    
    const env = c.env as any
    
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
      
      console.log("Created new user:", userId)
      user = { id: userId, email, verified: false }
    } else {
      userId = user.id
      console.log("Found existing user:", userId)
    }

    // Create client record first
    const clientId = crypto.randomUUID()
    const clientResult = await env.DB.prepare(`
      INSERT INTO clients (client_id, user_id, name, created_at) 
      VALUES (?, ?, ?, ?)
    `).bind(
      clientId,
      userId,
      "New Client", // Default client name
      new Date().toISOString()
    ).run()

    if (!clientResult.success) {
      throw new Error("Failed to create client record")
    }
    
    console.log("Created client record:", clientId)

    // Resolve meeting date (default to today if not provided or invalid)
    let finalMeetingDate: string
    if (typeof meetingDate === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(meetingDate)) {
      finalMeetingDate = meetingDate
    } else {
      finalMeetingDate = new Date().toISOString().split('T')[0]
    }

    // Create meeting record
    const meetingId = crypto.randomUUID()
    const meetingResult = await env.DB.prepare(`
      INSERT INTO meetings (meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, transcript, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      meetingId,
      userId,
      clientId, // Use the client_id we just created
      "New Client", // Default client name
      fileName, // Use filename as meeting title
      finalMeetingDate, // meeting_date as DATE
      fileContent.substring(0, 1000) + "...", // Store truncated version
      new Date().toISOString()
    ).run()

    if (!meetingResult.success) {
      throw new Error("Failed to create meeting record")
    }
    
    console.log("Created meeting record:", meetingId)

    // Generate JWT token for email verification/access
    const jwt = await import("@tsndr/cloudflare-worker-jwt")
    const tokenPayload = {
      userId,
      meetingId,
      email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = await jwt.sign(tokenPayload, env.JWT_SECRET)
    console.log("Generated JWT token")

    // Don't send any email immediately - wait for analysis completion
    // The analysis complete email will be sent when the background process finishes
    console.log("Analysis started for user:", email, "- completion email will be sent when done")

    // Start background analysis using waitUntil for proper background execution
    c.executionCtx.waitUntil(
      (async () => {
        try {
          console.log("🚀 Starting background analysis for meeting:", meetingId, "user:", email)

          // Set status to processing
          await env.DB.prepare(
            "UPDATE meetings SET analysis_status = 'processing' WHERE meeting_id = ?"
          ).bind(meetingId).run()
          console.log("📊 Status updated to 'processing'")
          
          // Import and use the analysis services directly
          const { OpenAIService } = await import("./services/openai")
          const { ResponseParser } = await import("./utils/responseParser")
          
          console.log("📦 Services imported successfully")
          
          const openaiService = new OpenAIService(env)
          console.log("🤖 OpenAI service initialized")
          
          // Step 1: Detect meeting type and perform analysis
          console.log("🔍 Step 1: Detecting meeting type...")
          const meetingTypeResult = await openaiService.detectMeetingType(fileContent)
          const isDiscovery = meetingTypeResult.isDiscovery
          console.log('✅ Meeting type detected:', isDiscovery ? 'discovery' : 'consulting')
          
          // Step 2: Summarize with appropriate type
          console.log("📝 Step 2: Starting analysis...")
          const type = isDiscovery ? 'discovery' : 'consulting'
          const rawResult = await openaiService.summarizeText(fileContent, type)
          console.log("✅ Raw analysis completed, parsing...")
          
          const parsedData = ResponseParser.parseSummaryWithDeepSeek(rawResult)
          console.log("✅ Analysis parsing completed")
          console.log("📊 Parsed data summary:", parsedData.summary ? "HAS DATA" : "NO DATA")
          if (parsedData.summary) {
            console.log("📊 Summary length:", parsedData.summary.summary?.length || 0)
            console.log("📊 Client name:", parsedData.summary.clientName || "N/A")
            console.log("📊 Pain point:", parsedData.summary.painPoint ? "EXISTS" : "MISSING")
          }

          // Step 3: Generate additional content
          console.log("📝 Step 3: Generating follow-up email...")
          const followUpEmail = await openaiService.generateFollowUpEmail(parsedData.summary, isDiscovery)
          
          console.log("📝 Step 4: Generating social media content...")
          const reelsContent = await openaiService.generateReelsScripts(fileContent)
          const parsedReels = ResponseParser.parseSocialMedia(reelsContent)

          console.log("📝 Step 5: Generating mind map...")
          const mindMapType = isDiscovery ? 'sales' : 'consulting'
          const mindMapContent = await openaiService.generateMindMap(parsedData.summary?.summary || fileContent, mindMapType)

          console.log("📝 Step 6: Generating next meeting prep...")
          // For now, use current meeting data as the meetings array
          const meetingsData = [{
            client_name: parsedData.summary?.clientName || 'Client',
            summary: parsedData.summary?.summary || '',
            pain_point: parsedData.summary?.painPoint || '',
            goal: parsedData.summary?.goal || '',
            created_at: new Date().toISOString()
          }]
          const nextMeetingPrep = await openaiService.generateNextMeetingPrep(meetingsData)

          console.log("💾 Step 7: Saving analysis results to database...")
          
          // Debug what we're trying to save
          const summaryToSave = parsedData.summary?.summary || null
          const painPointToSave = parsedData.summary?.painPoint || null
          const goalToSave = parsedData.summary?.goal || null
          
          console.log("💾 Summary to save:", summaryToSave ? `${summaryToSave.length} chars` : "NULL")
          console.log("💾 Pain point to save:", painPointToSave ? `${painPointToSave.length} chars` : "NULL")
          console.log("💾 Goal to save:", goalToSave ? `${goalToSave.length} chars` : "NULL")
          console.log("💾 Follow-up email:", followUpEmail.content ? `${followUpEmail.content.length} chars` : "NULL")
          console.log("💾 Mind map:", mindMapContent ? `${mindMapContent.length} chars` : "NULL")
          console.log("💾 Social media:", parsedReels ? "EXISTS" : "NULL")
          console.log("💾 Meeting ID:", meetingId)

          // Update client name if AI extracted a real client name
          if (parsedData.summary?.clientName && parsedData.summary.clientName !== "New Client") {
            console.log("🔄 Updating client name from AI analysis:", parsedData.summary.clientName)
            try {
              // Update client name in clients table
              const updateClientStmt = env.DB.prepare(`
                UPDATE clients SET name = ? WHERE client_id = ?
              `)
              await updateClientStmt.bind(parsedData.summary.clientName, clientId).run()
              
              // Update client name in meetings table
              const updateMeetingStmt = env.DB.prepare(`
                UPDATE meetings SET client_name = ? WHERE client_id = ?
              `)
              await updateMeetingStmt.bind(parsedData.summary.clientName, clientId).run()
              
              console.log("✅ Client name updated successfully in both tables")
            } catch (error) {
              console.error("❌ Failed to update client name:", error)
              // Don't fail the entire analysis if client name update fails
            }
          }
          
          // Update the meeting record with ALL analysis results
          const updateResult = await env.DB.prepare(`
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
            summaryToSave,
            painPointToSave,
            goalToSave,
            parsedData.summary?.coachSuggestions?.join(', ') || null,
            parsedData.summary?.actionItemsClient?.join(', ') || null,
            parsedData.summary?.actionItemsCoach?.join(', ') || null,
            followUpEmail.content || null,
            mindMapContent || null,
            JSON.stringify(parsedReels) || null, // Store social media content in resources_list for now
            JSON.stringify(nextMeetingPrep) || null,
            isDiscovery,
            parsedData.summary?.salesTechniqueAdvice?.join(', ') || null,
            parsedData.summary?.coachingAdvice?.join(', ') || null,
            meetingId
          ).run()
          
          if (!updateResult.success) {
            throw new Error("Failed to save analysis results to database")
          }
          
          console.log("✅ Meeting record updated with analysis results")
          console.log("🎉 Analysis completed successfully for:", email)
          
          // ONLY send completion email if database save was successful
          console.log("📧 Preparing to send completion email...")
          const { sendAnalysisCompleteEmail } = await import("./services/gmail")
          const clientName = parsedData.summary?.clientName || "New Client"
          
          console.log("📤 Sending completion email to:", email, "for client:", clientName)
          const emailSent = await sendAnalysisCompleteEmail(env, email, token, fileName, clientName)
          console.log("✅ Analysis complete email sent:", emailSent, "to:", email)
          
        } catch (error) {
          console.error("❌ Background analysis FAILED:", error)
          console.error("❌ Error details:", error.message)
          console.error("❌ Error stack:", error.stack)

          // Set status to failed
          try {
            await env.DB.prepare(
              "UPDATE meetings SET analysis_status = 'failed' WHERE meeting_id = ?"
            ).bind(meetingId).run()
            console.log("📊 Status updated to 'failed'")
          } catch (statusError) {
            console.error("❌ Failed to update status to 'failed':", statusError)
          }

          // DO NOT send any email if analysis/save failed
          // User should not receive misleading "analysis complete" email
          console.log("❌ No email will be sent due to analysis failure")
          console.log("❌ User will need to try uploading again")
        }
      })()
    )

    return c.json({
      success: true,
      message: "Analysis started! You'll receive an email with your complete results when finished (usually within a few minutes).",
      analysisId: meetingId,
      isNewUser
    })
    
  } catch (error) {
    console.error("Direct route error:", error)
    return c.json({
      success: false,
      message: "Direct route failed: " + error.message
    }, 500)
  }
});
openapi.delete("/api/clients/:id/tags/:tag_id", RemoveTagFromClient);

// Register Debug endpoints
openapi.get("/api/debug/client-meetings", DebugClientMeetings);

// Register AI Creative endpoints
openapi.post("/api/ai/generate-ig-creative", GenerateIgCreative);

// Export the Hono app
export default app;
