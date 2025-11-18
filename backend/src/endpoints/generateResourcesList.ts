import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { PerplexityService } from "../services/perplexity";

const GenerateResourcesListRequest = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  meetingId: z.string().min(1, "Meeting ID is required")
});

const ResourceItem = z.object({
  title: z.string(),
  url: z.string(),
  type: z.string(),
  description: z.string().optional()
});

const GenerateResourcesListResponse = z.object({
  success: Bool(),
  resourcesList: z.array(ResourceItem),
  error: z.string().optional()
});

export class GenerateResourcesList extends OpenAPIRoute {
  schema = {
    tags: ["Perplexity"],
    summary: "Generate resources list using Perplexity AI model",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateResourcesListRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated resources list",
        content: {
          "application/json": {
            schema: GenerateResourcesListResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateResourcesListResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateResourcesListResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { prompt, meetingId } = data.body;
      
      console.log('Environment keys available:', Object.keys(c.env));
      console.log('PERPLEXITY_API_KEY in env:', !!c.env.PERPLEXITY_API_KEY);
      
      const perplexityService = new PerplexityService(c.env);
      const resourcesList = await perplexityService.generateResourcesList(prompt);
      
      // Save the resources list to the database
      if (resourcesList && resourcesList.length > 0) {
        try {
          await c.env.DB.prepare(`
            UPDATE meetings 
            SET resources_list = ? 
            WHERE meeting_id = ?
          `).bind(
            JSON.stringify(resourcesList),
            meetingId
          ).run();
          
          console.log('Resources list saved to database for meeting:', meetingId);
        } catch (dbError) {
          console.error('Failed to save resources list to database:', dbError);
          // Continue with response even if database save fails
        }
      }
      
      return {
        success: true,
        resourcesList
      };
    } catch (error) {
      console.error("Generate resources list error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 