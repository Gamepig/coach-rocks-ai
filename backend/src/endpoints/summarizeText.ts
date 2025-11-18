import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { ParsedSummarySchema, FollowUpEmailSchema, ParsedSocialMediaSchema } from "../types";
import { OpenAIService } from "../services/openai";
import { DatabaseService } from "../services/database";
import { ResponseParser } from "../utils/responseParser";

const SummarizeTextRequest = z.object({
  text: z.string().min(1, "Text is required"),
  userId: z.string().optional() // Optional for backward compatibility
});

const SummarizeTextResponse = z.object({
  success: Bool(),
  isDiscovery: z.boolean(),
  data: ParsedSummarySchema,
  resourcesListPrompt: z.string(),
  followUpEmail: FollowUpEmailSchema,
  socialMediaContent: ParsedSocialMediaSchema,
  nextMeetingPrep: z.object({
    overallInsights: z.object({
      overallClientGoals: z.string(),
      recurringPainPoints: z.array(z.string()),
      successfulStrategies: z.array(z.string()),
      areasOfStagnation: z.array(z.string())
    }),
    quickOverview: z.string(),
    clientProgressAssessment: z.string(),
    currentJourneyStatus: z.string(),
    keyAreasToAddress: z.array(z.string()),
    potentialNewDiscussionPoints: z.array(z.string()),
    recommendedMindset: z.string()
  }).optional(),
  error: z.string().optional()
});

export class SummarizeText extends OpenAPIRoute {
  schema = {
    tags: ["OpenAI"],
    summary: "Analyze meeting transcripts and extract structured information",
    request: {
      body: {
        content: {
          "application/json": {
            schema: SummarizeTextRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the analyzed text summary in structured format with DeepSeek prompt and follow-up email",
        content: {
          "application/json": {
            schema: SummarizeTextResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: SummarizeTextResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: SummarizeTextResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { text, userId } = data.body;
      
      const openaiService = new OpenAIService(c.env);
      
      // Step 1: Detect meeting type
      const meetingTypeResult = await openaiService.detectMeetingType(text);
      const isDiscovery = meetingTypeResult.isDiscovery;
      
      // Step 2: Summarize with appropriate type
      const type = isDiscovery ? 'discovery' : 'consulting';
      const rawResult = await openaiService.summarizeText(text, type);
      
      // Parse the raw result into structured data with DeepSeek prompt
      const parsedData = ResponseParser.parseSummaryWithDeepSeek(rawResult);
      
      // Step 3: Generate follow-up email
      const followUpEmail = await openaiService.generateFollowUpEmail(parsedData.summary, isDiscovery);
      
      // Step 4: Generate reels scripts
      const reelsContent = await openaiService.generateReelsScripts(text);
      const parsedReels = ResponseParser.parseSocialMedia(reelsContent);
      
      // Initialize next meeting prep variable
      let nextMeetingPrep = null;
      
      // Save to database if userId is provided
      if (userId) {
        try {
          const dbService = new DatabaseService(c.env);
          
          // Extract client information from AI response
          const clientData = {
            userId,
            name: parsedData.summary.clientName || 'Unknown Client',
            email: null, // Could be extracted from transcript if available
            phoneNumber: null
          };
          
          // Save or update client
          const clientId = await dbService.saveClient(clientData);
          
          // Prepare meeting data
          const meetingData = {
            userId,
            clientId,
            clientName: parsedData.summary.clientName || 'Unknown Client',
            meetingTitle: parsedData.summary.meetingTitle || 'Coaching Session',
            meetingDate: new Date().toISOString().split('T')[0],
            isDiscovery: isDiscovery, // Use AI-determined discovery status
            transcript: text,
            summary: parsedData.summary.summary || null,
            painPoint: parsedData.summary.painPoint || null,
            suggestion: parsedData.summary.coachSuggestions?.join(', ') || null,
            goal: parsedData.summary.goal || null,
            salesTechniqueAdvice: parsedData.summary.salesTechniqueAdvice || parsedData.summary.coachingAdvice || [],
            coachingAdvice: parsedData.summary.coachingAdvice || [],
            actionItemsClient: parsedData.summary.actionItemsClient || [],
            actionItemsCoach: parsedData.summary.actionItemsCoach || [],
            mindMap: null, // Will be generated by separate endpoint
            emailContent: JSON.stringify(followUpEmail), // Save the generated email
            resourcesList: parsedData.resourcesListPrompt || null,
            nextMeetingPrep: null
          };
          
          // Save meeting
          const meetingId = await dbService.saveMeeting(meetingData);

          // Persist reels for this meeting
          try {
            const reelsToSave = (parsedReels?.reels ?? []).map((r: any) => ({
              hook: r.hook,
              content: r.narrative,
              tags: r.hashtags
            }));
            await dbService.saveReelsIdeas(userId, meetingId, reelsToSave);
          } catch (reelsSaveError) {
            console.error('Failed to save reels for meeting:', reelsSaveError);
          }
          
          // Step 5: Generate next meeting preparation
          try {
            // Get all meetings for this client (including the current one)
            const allMeetings = await dbService.getMeetingsByClient(userId, clientId);
            
            if (allMeetings && allMeetings.length > 0) {
              // Prepare the data for AI analysis
              const meetingsData = allMeetings.map(meeting => ({
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
              nextMeetingPrep = await openaiService.generateNextMeetingPrep(meetingsData);
              
              // Save the next meeting prep back to the database
              try {
                await dbService.updateMeetingNextMeetingPrep(meetingId, nextMeetingPrep);
              } catch (updateError) {
                console.error('Failed to save next meeting prep to database:', updateError);
              }
            }
          } catch (prepError) {
            // Log prep generation errors but don't fail the request
            console.error('Next meeting prep generation error:', prepError);
            console.log('Continuing with response despite prep generation error');
          }
          
        } catch (dbError) {
          // Log database errors but don't fail the request
          console.error('Database save error:', dbError);
          console.log('Continuing with AI response despite database error');
        }
      }
      
      return {
        success: true,
        isDiscovery: isDiscovery,
        data: parsedData.summary,
        resourcesListPrompt: parsedData.resourcesListPrompt,
        followUpEmail: followUpEmail,
        socialMediaContent: parsedReels,
        nextMeetingPrep: nextMeetingPrep
      };
    } catch (error) {
      console.error("Summarize text error:", error);
      return {
        success: false,
        isDiscovery: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
} 