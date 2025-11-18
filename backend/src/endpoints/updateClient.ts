import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const UpdateClientRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["Active", "Inactive", "Prospect", "Lead", "Paused", "Archived"]).optional()
});

const ClientData = z.object({
  client_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  user_id: z.string()
});

const UpdateClientResponse = z.object({
  success: z.boolean(),
  data: ClientData.optional(),
  error: z.string().optional()
});

export class UpdateClient extends OpenAPIRoute {
  schema = {
    tags: ["Clients"],
    summary: "Update client information",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: UpdateClientRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Client updated successfully",
        content: {
          "application/json": {
            schema: UpdateClientResponse,
          },
        },
      },
      "400": {
        description: "Invalid request parameters"
      },
      "401": {
        description: "Invalid or expired session token"
      },
      "404": {
        description: "Client not found or access denied"
      },
      "500": {
        description: "Server error"
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

      // Get clientId from URL parameter
      const clientId = c.req.param("clientId");

      if (!clientId) {
        return c.json({
          success: false,
          error: "Client ID is required"
        }, 400);
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(clientId)) {
        return c.json({
          success: false,
          error: "Invalid client ID format"
        }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const updateData = UpdateClientRequest.parse(body);

      const dbService = new DatabaseService(c.env);

      // Verify client exists and belongs to current user
      const client = await dbService.getClientById(clientId);

      if (!client || client.user_id !== auth.user.user_id) {
        return c.json({
          success: false,
          error: "Client not found or access denied"
        }, 404);
      }

      // Validate request parameters
      if (updateData.name !== undefined && updateData.name.trim().length === 0) {
        return c.json({
          success: false,
          error: "Client name cannot be empty"
        }, 400);
      }

      if (updateData.status !== undefined && !["Active", "Inactive", "Prospect", "Lead", "Paused", "Archived"].includes(updateData.status)) {
        return c.json({
          success: false,
          error: "Status must be one of: Active, Inactive, Prospect, Lead, Paused, Archived"
        }, 400);
      }

      // Build update object with only provided fields
      const updates: any = {};
      if (updateData.name !== undefined) updates.name = updateData.name;
      if (updateData.email !== undefined) updates.email = updateData.email;
      if (updateData.status !== undefined) updates.status = updateData.status;
      if (updateData.notes !== undefined) updates.notes = updateData.notes;
      if (updateData.tags !== undefined) updates.tags = updateData.tags;

      // Perform the update
      await dbService.updateClient(clientId, updates);

      // Fetch and return updated client data
      const updatedClient = await dbService.getClientById(clientId);

      return c.json({
        success: true,
        data: updatedClient
      }, 200);

    } catch (error) {
      console.error("Update client error:", error);

      if (error instanceof z.ZodError) {
        return c.json({
          success: false,
          error: "Invalid request format: " + error.errors[0].message
        }, 400);
      }

      return c.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }, 500);
    }
  }
}
