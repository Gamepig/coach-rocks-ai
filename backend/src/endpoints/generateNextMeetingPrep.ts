import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { OpenAIService } from "../services/openai";
import { DatabaseService } from "../services/database";

const GenerateNextMeetingPrepRequest = z.object({
  userId: z.string().min(1, "User ID is required"),
  clientId: z.string().min(1, "Client ID is required")
});

const GenerateNextMeetingPrepResponse = z.object({
  success: Bool(),
  data: z.object({
    overallInsights: z.object({
      overallClientGoals: z.string(),
      recurringPainPoints: z.array(z.string()),
      successfulStrategies: z.array(z.string()),
      areasOfStagnation: z.array(z.string())
    }),
    quickOverview: z.string(),
    keyAreasToAddress: z.array(z.string()),
    statusCheckOnActionItems: z.array(z.object({
      actionItem: z.string(),
      followUpQuestion: z.string()
    })),
    potentialNewDiscussionPoints: z.array(z.string()),
    recommendedMindset: z.string()
  }),
  error: z.string().optional()
});

export class GenerateNextMeetingPrep extends OpenAPIRoute {
  schema = {
    tags: ["OpenAI"],
    summary: "Generate next meeting preparation based on client's previous meetings",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateNextMeetingPrepRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns comprehensive next meeting preparation",
        content: {
          "application/json": {
            schema: GenerateNextMeetingPrepResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateNextMeetingPrepResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateNextMeetingPrepResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { userId, clientId } = data.body;

      console.log('Generating next meeting prep for client:', clientId);

      const dbService = new DatabaseService(c.env);
      const openaiService = new OpenAIService(c.env);

      // Get all previous meetings for this client
      const meetings = await dbService.getMeetingsByClient(userId, clientId);
      
      if (!meetings || meetings.length === 0) {
        return {
          success: false,
          data: null,
          error: "No previous meetings found for this client"
        };
      }

      console.log(`Found ${meetings.length} previous meetings for client`);

      // Prepare the data for AI analysis
      const meetingsData = meetings.map(meeting => ({
        meetingTitle: meeting.meeting_title,
        meetingDate: meeting.meeting_date,
        summary: meeting.summary,
        painPoint: meeting.pain_point,
        goal: meeting.goal,
        suggestion: meeting.suggestion,
        actionItemsClient: meeting.action_items_client ? JSON.parse(meeting.action_items_client) : [],
        actionItemsCoach: meeting.action_items_coach ? JSON.parse(meeting.action_items_coach) : [],
        salesTechniqueAdvice: meeting.sales_technique_advice ? JSON.parse(meeting.sales_technique_advice) : [],
        coachingAdvice: meeting.coaching_advice ? JSON.parse(meeting.coaching_advice) : []
      }));

      // Generate the next meeting preparation using AI
      const nextMeetingPrep = await openaiService.generateNextMeetingPrep(meetingsData);

      return {
        success: true,
        data: nextMeetingPrep
      };

    } catch (error) {
      console.error("Generate next meeting prep error:", error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 