import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const DebugClientMeetingsResponse = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    client_id: z.string(),
    client_name: z.string(),
    meeting_count: z.number(),
    meeting_client_names: z.string().nullable()
  })),
  error: z.string().optional()
});

export class DebugClientMeetings extends OpenAPIRoute {
  schema = {
    tags: ["Debug"],
    summary: "Debug client-meeting relationships to troubleshoot grouping issues",
    security: [{ bearerAuth: [] }],
    responses: { 
      200: { 
        description: "Successfully retrieved debug information",
        content: { "application/json": { schema: DebugClientMeetingsResponse } } 
      },
      401: {
        description: "Invalid or expired session token"
      }
    }
  };

  async handle(c: AppContext) {
    try {
      // Validate session using authentication middleware
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          data: [],
          error: "Invalid or expired session token"
        }, 401);
      }
      
      const db = new DatabaseService(c.env);
      const rows = await db.debugClientMeetingRelationships(auth.user.user_id);
      
      return c.json({ 
        success: true, 
        data: rows,
        message: "Use this endpoint to debug client-meeting grouping issues. Check if meeting_client_names match client_name."
      });
    } catch (err) {
      return c.json({ 
        success: false, 
        data: [], 
        error: err instanceof Error ? err.message : "Unknown error" 
      }, 500);
    }
  }
}
