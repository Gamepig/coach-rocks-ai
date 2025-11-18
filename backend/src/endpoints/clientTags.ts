import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";

const AssignTagRequest = z.object({
  tag_id: z.string().min(1, "Tag ID is required")
});

const ClientTagsResponse = z.object({
  success: Bool(),
  tags: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    created_at: z.string()
  })),
  error: z.string().optional()
});

const AssignTagResponse = z.object({
  success: Bool(),
  error: z.string().optional()
});

const RemoveTagResponse = z.object({
  success: Bool(),
  error: z.string().optional()
});

// GET /api/clients/:id/tags - Get all tags for a specific client
export class GetClientTags extends OpenAPIRoute {
  schema = {
    tags: ["Client Tags"],
    summary: "Get all tags for a specific client",
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: ClientTagsResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const clientId = c.req.param("id");
      
      if (!clientId) {
        return {
          success: false,
          error: "Client ID is required"
        };
      }

      const dbService = new DatabaseService(c.env);
      const tags = await dbService.getClientTags(clientId);

      return {
        success: true,
        tags: tags || []
      };
    } catch (error) {
      console.error("Get client tags error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// POST /api/clients/:id/tags - Assign a tag to a client
export class AssignTagToClient extends OpenAPIRoute {
  schema = {
    tags: ["Client Tags"],
    summary: "Assign a tag to a client",
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: AssignTagResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const clientId = c.req.param("id");
      
      if (!clientId) {
        return {
          success: false,
          error: "Client ID is required"
        };
      }

      // Parse body manually
      const body = await c.req.json();
      const { tag_id } = body;
      
      if (!tag_id) {
        return {
          success: false,
          error: "Tag ID is required"
        };
      }

      const dbService = new DatabaseService(c.env);
      await dbService.assignTagToClient(clientId, tag_id);

      return {
        success: true
      };
    } catch (error) {
      console.error("Assign tag to client error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// DELETE /api/clients/:id/tags/:tag_id - Remove a tag from a client
export class RemoveTagFromClient extends OpenAPIRoute {
  schema = {
    tags: ["Client Tags"],
    summary: "Remove a tag from a client",
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: RemoveTagResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const clientId = c.req.param("id");
      const tagId = c.req.param("tag_id");
      
      if (!clientId || !tagId) {
        return {
          success: false,
          error: "Client ID and Tag ID are required"
        };
      }

      const dbService = new DatabaseService(c.env);
      await dbService.removeTagFromClient(clientId, tagId);

      return {
        success: true
      };
    } catch (error) {
      console.error("Remove tag from client error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 