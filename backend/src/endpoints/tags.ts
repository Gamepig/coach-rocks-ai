import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const CreateTagRequest = z.object({
  name: z.string().min(1, "Tag name is required").max(100, "Tag name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format").default("#3B82F6")
});

const UpdateTagRequest = z.object({
  name: z.string().min(1, "Tag name is required").max(100, "Tag name too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format").optional()
});

const TagResponse = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  created_at: z.string()
});

const TagsListResponse = z.object({
  success: Bool(),
  tags: z.array(TagResponse),
  error: z.string().optional()
});

const CreateTagResponse = z.object({
  success: Bool(),
  tag_id: z.string().optional(),
  error: z.string().optional()
});

const UpdateTagResponse = z.object({
  success: Bool(),
  error: z.string().optional()
});

const DeleteTagResponse = z.object({
  success: Bool(),
  error: z.string().optional()
});

// GET /api/tags - List all tags for a user
export class ListTags extends OpenAPIRoute {
  schema = {
    tags: ["Tags"],
    summary: "List all tags for authenticated user",
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: TagsListResponse,
          },
        },
      },
      "401": {
        description: "Invalid or expired session token"
      }
    },
  };

  async handle(c: AppContext) {
    try {
      // Validate session using authentication middleware
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          error: "Invalid or expired session token"
        }, 401);
      }

      const dbService = new DatabaseService(c.env);
      const tags = await dbService.getTagsByUser(auth.user.user_id);

      return {
        success: true,
        tags: tags || []
      };
    } catch (error) {
      console.error("List tags error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// POST /api/tags - Create a new tag
export class CreateTag extends OpenAPIRoute {
  schema = {
    tags: ["Tags"],
    summary: "Create a new tag for authenticated user",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateTagRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: CreateTagResponse,
          },
        },
      },
      "401": {
        description: "Invalid or expired session token"
      }
    },
  };

  async handle(c: AppContext) {
    try {
      // Validate session using authentication middleware
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          error: "Invalid or expired session token"
        }, 401);
      }

      // Parse body manually since schema validation is causing issues
      const body = await c.req.json();
      const { name, color } = body;
      
      if (!name) {
        return {
          success: false,
          error: "Tag name is required"
        };
      }

      const dbService = new DatabaseService(c.env);
      const tagId = await dbService.createTag({
        userId: auth.user.user_id,
        name,
        color: color || "#3B82F6"
      });

      return {
        success: true,
        tag_id: tagId
      };
    } catch (error) {
      console.error("Create tag error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// PUT /api/tags/:id - Update a tag
export class UpdateTag extends OpenAPIRoute {
  schema = {
    tags: ["Tags"],
    summary: "Update an existing tag",
    request: {
      body: {
        content: {
          "application/json": {
            schema: UpdateTagRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: UpdateTagResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { name, color } = data.body;
      const tagId = c.req.param("id");
      
      if (!tagId) {
        return {
          success: false,
          error: "Tag ID is required"
        };
      }

      const dbService = new DatabaseService(c.env);
      await dbService.updateTag(tagId, { name, color });

      return {
        success: true
      };
    } catch (error) {
      console.error("Update tag error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// DELETE /api/tags/:id - Delete a tag
export class DeleteTag extends OpenAPIRoute {
  schema = {
    tags: ["Tags"],
    summary: "Delete a tag",
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: DeleteTagResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const tagId = c.req.param("id");
      
      if (!tagId) {
        return {
          success: false,
          error: "Tag ID is required"
        };
      }

      const dbService = new DatabaseService(c.env);
      await dbService.deleteTag(tagId);

      return {
        success: true
      };
    } catch (error) {
      console.error("Delete tag error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 