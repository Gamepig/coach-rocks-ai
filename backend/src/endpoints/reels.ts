import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const ReelsListRequest = z.object({ 
  // userId no longer needed - will get from authenticated session
});
const ReelsListResponse = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    meeting_id: z.string(),
    hook: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    is_favorite: z.number(),
    created_at: z.string()
  })),
  error: z.string().optional()
});

const UpdateReelRequest = z.object({
  id: z.string(),
  hook: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const FavoriteReelRequest = z.object({ id: z.string(), isFavorite: z.boolean() });
const DeleteReelRequest = z.object({ id: z.string() });

export class ListReels extends OpenAPIRoute {
  schema = {
    tags: ["Reels"],
    summary: "List reels for authenticated user",
    description: "Returns reels for the currently authenticated user",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: ReelsListRequest } } } },
    responses: { 
      200: { content: { "application/json": { schema: ReelsListResponse } } },
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
      const rows = await db.getReelsByUser(auth.user.user_id);
      
      return c.json({ success: true, data: rows });
    } catch (err) {
      console.error("Error in ListReels:", err);
      return c.json({ 
        success: false, 
        data: [], 
        error: err instanceof Error ? err.message : "Unknown error" 
      }, 500);
    }
  }
}

export class UpdateReel extends OpenAPIRoute {
  schema = {
    tags: ["Reels"],
    summary: "Update a reel",
    request: { body: { content: { "application/json": { schema: UpdateReelRequest } } } },
    responses: { 200: { content: { "application/json": { schema: z.object({ success: z.boolean() }) } } } }
  };
  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id, hook, content, tags } = data.body;
    const db = new DatabaseService(c.env);
    await db.updateReel(id, { hook, content, tags });
    return { success: true };
  }
}

export class FavoriteReel extends OpenAPIRoute {
  schema = {
    tags: ["Reels"],
    summary: "Set favorite on a reel",
    request: { body: { content: { "application/json": { schema: FavoriteReelRequest } } } },
    responses: { 200: { content: { "application/json": { schema: z.object({ success: z.boolean() }) } } } }
  };
  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id, isFavorite } = data.body;
    const db = new DatabaseService(c.env);
    await db.setReelFavorite(id, isFavorite);
    return { success: true };
  }
}

export class DeleteReel extends OpenAPIRoute {
  schema = {
    tags: ["Reels"],
    summary: "Delete a reel",
    request: { body: { content: { "application/json": { schema: DeleteReelRequest } } } },
    responses: { 200: { content: { "application/json": { schema: z.object({ success: z.boolean() }) } } } }
  };
  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.body;
    const db = new DatabaseService(c.env);
    await db.deleteReel(id);
    return { success: true };
  }
}