import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { ParsedSocialMediaSchema } from "../types";
import { OpenAIService } from "../services/openai";
import { ResponseParser } from "../utils/responseParser";

const GenerateReelsScriptsRequest = z.object({
  summary: z.string().min(1, "Summary is required")
});

const GenerateReelsScriptsResponse = z.object({
  success: Bool(),
  data: ParsedSocialMediaSchema,
  error: z.string().optional()
});

export class GenerateReelsScripts extends OpenAPIRoute {
  schema = {
    tags: ["OpenAI"],
    summary: "Generate reels scripts from meeting insights",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateReelsScriptsRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated reels scripts in structured format",
        content: {
          "application/json": {
            schema: GenerateReelsScriptsResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateReelsScriptsResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateReelsScriptsResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { summary } = data.body;
      
      const openaiService = new OpenAIService(c.env);
      const rawResult = await openaiService.generateReelsScripts(summary);
      
      // Parse the raw text into structured data
      const parsedData = ResponseParser.parseSocialMedia(rawResult);
      
      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error("Generate reels scripts error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 