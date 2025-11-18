import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { ParsedEmailSchema } from "../types";
import { OpenAIService } from "../services/openai";
import { ResponseParser } from "../utils/responseParser";

const GenerateFollowUpEmailRequest = z.object({
  summary: z.string().min(1, "Summary is required"),
  type: z.enum(["sales", "consulting"], { description: "The type of coaching session" })
});

const GenerateFollowUpEmailResponse = z.object({
  success: Bool(),
  data: ParsedEmailSchema,
  error: z.string().optional()
});

export class GenerateFollowUpEmail extends OpenAPIRoute {
  schema = {
    tags: ["OpenAI"],
    summary: "Generate professional follow-up email templates",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateFollowUpEmailRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated follow-up email in structured format",
        content: {
          "application/json": {
            schema: GenerateFollowUpEmailResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateFollowUpEmailResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateFollowUpEmailResponse,
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
      const rawResult = await openaiService.generateFollowUpEmail(summary, type);
      
      // Parse the raw text into structured data
      const parsedData = ResponseParser.parseEmail(rawResult);
      
      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error("Generate follow-up email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 