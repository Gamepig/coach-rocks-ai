import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { OpenAIService } from "../services/openai";

export class TestAI extends OpenAPIRoute {
  schema = {
    tags: ["AI"],
    summary: "Test AI functionality",
    description: "Test endpoint to verify AI bindings are working correctly",
    responses: {
      200: {
        description: "AI test successful",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              data: z.object({
                cloudflareAI: z.any(),
                openAI: z.any()
              }).optional()
            })
          }
        }
      }
    }
  };

  async handle(c: AppContext) {
    try {
      console.log('Testing AI functionality...');
      
      const openaiService = new OpenAIService(c.env);
      
      // Test Cloudflare AI binding
      let cloudflareAIResult = null;
      let cloudflareAIError = null;
      
      try {
        console.log('Testing Cloudflare AI binding...');
        cloudflareAIResult = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: "Hello, can you respond with 'Cloudflare AI test successful'?",
          max_tokens: 50,
          temperature: 0.7
        });
        console.log('Cloudflare AI test successful:', cloudflareAIResult);
      } catch (error) {
        console.error('Cloudflare AI test failed:', error);
        cloudflareAIError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Test OpenAI API using a simple method
      let openAIResult = null;
      let openAIError = null;
      
      try {
        console.log('Testing OpenAI API...');
        // Use a simple test method that doesn't require complex prompts
        // Note: summarizeText accepts 'discovery' or 'consulting' as type, not 'sales'
        openAIResult = await openaiService.summarizeText(
          "This is a test meeting with John from ABC Company. He is a sales manager struggling with team performance. His goal is to increase conversion rate by 20% this quarter.",
          "discovery" // Use 'discovery' for sales-oriented meetings
        );
        console.log('OpenAI test successful:', openAIResult);
      } catch (error) {
        console.error('OpenAI test failed:', error);
        openAIError = error instanceof Error ? error.message : 'Unknown error';
      }

      return {
        success: true,
        message: "AI tests completed",
        data: {
          cloudflareAI: {
            success: !cloudflareAIError,
            result: cloudflareAIResult,
            error: cloudflareAIError
          },
          openAI: {
            success: !openAIError,
            result: openAIResult,
            error: openAIError
          }
        }
      };
    } catch (error) {
      console.error("AI test error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        data: null
      };
    }
  }
} 