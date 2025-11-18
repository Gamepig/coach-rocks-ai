import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { ParsedMindMapSchema } from "../types";
import { OpenAIService } from "../services/openai";
import { ResponseParser } from "../utils/responseParser";

const GenerateMindMapRequest = z.object({
  summary: z.string().min(1, "Summary is required"),
  type: z.enum(["sales", "consulting"], { description: "The type of coaching session" })
});

const GenerateMindMapResponse = z.object({
  success: Bool(),
  data: ParsedMindMapSchema,
  error: z.string().optional()
});

export class GenerateMindMap extends OpenAPIRoute {
  schema = {
    tags: ["OpenAI"],
    summary: "Generate Mermaid mindmap diagrams from meeting summaries",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateMindMapRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated mindmap in structured format",
        content: {
          "application/json": {
            schema: GenerateMindMapResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateMindMapResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateMindMapResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { summary, type } = data.body;
      
      const openaiService = new OpenAIService(c.env);
      const rawResult = await openaiService.generateMindMap(summary, type);
      
      // Parse the raw text into structured data
      const parsedData = ResponseParser.parseMindMap(rawResult);
      
      // Validate that we have a complete mindmap
      if (!parsedData.mermaidCode.includes('root(') && !parsedData.mermaidCode.includes('root (')) {
        return {
          success: false,
          error: "Incomplete mindmap response received. Please try again."
        };
      }
      
      // Check if the response seems truncated
      if (parsedData.mermaidCode.length < 100) {
        return {
          success: false,
          error: "Mindmap response appears to be truncated. Please try again."
        };
      }
      
      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error("Generate mindmap error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 