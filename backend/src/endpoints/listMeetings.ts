import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";
import { isAnalysisComplete, logAnalysisCompletion } from "../utils/analysisValidation";

const ListMeetingsRequest = z.object({
  // userId no longer needed - will get from authenticated session
});

const ListMeetingsResponse = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    meeting_id: z.string(),
    client_id: z.string(),
    client_name: z.string(),
    meeting_title: z.string(),
    uploaded_date: z.string(),
    analysis_status: z.string().nullable(),
    summary: z.string().nullable(),
    pain_point: z.string().nullable(),
    goal: z.string().nullable(),
    suggestion: z.string().nullable(),
    action_items_client: z.string().nullable(),
    action_items_coach: z.string().nullable(),
    email_content: z.string().nullable(),
    resources_list: z.string().nullable(),
    mind_map: z.string().nullable(),
    next_meeting_prep: z.string().nullable(),
    sales_technique_advice: z.string().nullable(),
    coaching_advice: z.string().nullable(),
    has_summary: z.number(),
    has_email: z.number(),
    has_resources: z.number(),
    has_mind_map: z.number(),
    reels_count: z.number()
  })),
  error: z.string().optional()
});

export class ListMeetings extends OpenAPIRoute {
  schema = {
    tags: ["Data"],
    summary: "List meetings overview for authenticated user",
    description: "Returns meetings overview for the currently authenticated user",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": { schema: ListMeetingsRequest }
        }
      }
    },
    responses: {
      200: { content: { "application/json": { schema: ListMeetingsResponse } } },
      401: { description: "Unauthorized - invalid or expired session" }
    }
  };

  async handle(c: AppContext) {
    try {
      // Validate authentication
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          data: [],
          error: "Invalid or expired session token"
        }, 401);
      }

      const data = await this.getValidatedData<typeof this.schema>();
      const db = new DatabaseService(c.env);

      // Use authenticated user's ID
      const rows = await db.getMeetingsOverview(auth.user.user_id);

      // 🔍 Filter out incomplete analyses
      const completeAnalyses = rows.filter((meeting: any) => {
        const isComplete = isAnalysisComplete(meeting);

        // Log completion status for debugging
        if (!isComplete && meeting.analysis_status === 'completed') {
          console.warn(`⚠️ Filtering incomplete analysis for meeting ${meeting.meeting_id}`);
          logAnalysisCompletion(meeting.meeting_id, meeting);
        }

        return isComplete;
      });

      console.log(`📊 Meetings: ${rows.length} total, ${completeAnalyses.length} complete analyses`);

      return c.json({ success: true, data: completeAnalyses });
    } catch (err) {
      console.error("Error in ListMeetings:", err);
      return c.json({ 
        success: false, 
        data: [], 
        error: err instanceof Error ? err.message : "Unknown error" 
      }, 500);
    }
  }
}