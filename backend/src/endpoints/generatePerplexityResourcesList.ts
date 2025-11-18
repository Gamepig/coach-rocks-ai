import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { PerplexityService } from "../services/perplexity";

const GeneratePerplexityResourcesListRequest = z.object({
  prompt: z.string().min(1, "Prompt is required")
});

const ResourceItem = z.object({
  title: z.string(),
  url: z.string(),
  type: z.string(),
  description: z.string().optional()
});

const GeneratePerplexityResourcesListResponse = z.object({
  success: Bool(),
  resourcesList: z.array(ResourceItem),
  error: z.string().optional()
});

export class GeneratePerplexityResourcesList extends OpenAPIRoute {
  schema = {
    tags: ["Perplexity"],
    summary: "Generate resources list using Perplexity Sonar model",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GeneratePerplexityResourcesListRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated resources list",
        content: {
          "application/json": {
            schema: GeneratePerplexityResourcesListResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GeneratePerplexityResourcesListResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GeneratePerplexityResourcesListResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { prompt } = data.body;
      
      console.log('Environment keys available:', Object.keys(c.env));
      console.log('PERPLEXITY_API_KEY in env:', !!c.env.PERPLEXITY_API_KEY);
      
      const perplexityService = new PerplexityService(c.env);
      const resourcesList = await perplexityService.generateResourcesList(prompt);
      
      return {
        success: true,
        resourcesList
      };
    } catch (error) {
      console.error("Generate Perplexity resources list error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 