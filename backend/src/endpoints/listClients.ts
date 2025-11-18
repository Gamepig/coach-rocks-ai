import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const ListClientsResponse = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    client_id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    status: z.string().nullable(),
    notes: z.string().nullable(),
    total_sessions: z.number().nullable(),
    last_session_date: z.string().nullable(),
    created_at: z.string(),
    info: z.string().nullable(),
    session_counts: z.number().nullable(),
    address: z.string().nullable(),
    source: z.string().nullable(),
    lead_status: z.string().nullable(),
    engagement_type: z.string().nullable(),
    program: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    next_appointment_date: z.string().nullable(),
    last_communication_date: z.string().nullable(),
    contract_status: z.string().nullable(),
    invoice_status: z.string().nullable(),
    tags: z.string().nullable(), // JSON string of tags array
    meeting_count: z.number(),
    tag_names: z.string().nullable(),
    tag_colors: z.string().nullable()
  })),
  error: z.string().optional()
});

export class ListClients extends OpenAPIRoute {
  schema = {
    tags: ["Data"],
    summary: "List clients with meeting counts and tags",
    security: [{ bearerAuth: [] }],
    responses: { 
      200: { 
        description: "Successfully retrieved clients list",
        content: { "application/json": { schema: ListClientsResponse } } 
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
      const rows = await db.getClientsWithTags(auth.user.user_id);
      return { success: true, data: rows };
    } catch (err) {
      return { success: false, data: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}