import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { DatabaseService } from "../services/database";

export class TestDatabase extends OpenAPIRoute {
  schema = {
    tags: ["Database"],
    summary: "Test database functionality",
    description: "Test endpoint to verify D1 database is working correctly",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              action: z.string().optional(),
              data: z.any().optional()
            })
          }
        }
      }
    },
    responses: {
      200: {
        description: "Database test successful",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              data: z.any().optional()
            })
          }
        }
      }
    }
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { action, data: requestData } = data.body || {};

      const dbService = new DatabaseService(c.env);

      // Handle different actions
      if (action === 'insertUser') {
        const userData = requestData;
        // Insert user into users table
        const stmt = c.env.DB.prepare(`
          INSERT INTO users (user_id, email, password_hash, plan) 
          VALUES (?, ?, ?, ?)
        `);
        await stmt.bind(
          userData.userId,
          userData.email,
          'hashed_password',
          userData.plan
        ).run();
        
        return {
          success: true,
          message: `User ${userData.userId} inserted successfully`,
          data: userData
        };
      }

      if (action === 'insertMeeting') {
        const meetingData = requestData;
        
        // First, save or get client
        const clientData = {
          userId: meetingData.userId,
          name: meetingData.clientName,
          email: null,
          phoneNumber: null
        };
        
        const clientId = await dbService.saveClient(clientData);
        
        // Prepare meeting data
        const meetingToSave = {
          userId: meetingData.userId,
          clientId: clientId,
          clientName: meetingData.clientName,
          meetingTitle: meetingData.meetingTitle,
          meetingDate: meetingData.meetingDate,
          isDiscovery: meetingData.isDiscovery,
          transcript: meetingData.summary, // Use summary as transcript for mock data
          summary: meetingData.summary,
          painPoint: meetingData.painPoint,
          suggestion: meetingData.suggestion,
          goal: meetingData.goal,
          salesTechniqueAdvice: meetingData.salesTechniqueAdvice,
          coachingAdvice: meetingData.coachingAdvice,
          actionItemsClient: meetingData.actionItemsClient,
          actionItemsCoach: meetingData.actionItemsCoach,
          mindMap: null,
          emailContent: null,
          resourcesList: null,
          nextMeetingPrep: null
        };
        
        const meetingId = await dbService.saveMeeting(meetingToSave);
        
        return {
          success: true,
          message: `Meeting "${meetingData.meetingTitle}" for ${meetingData.clientName} inserted successfully`,
          data: { meetingId, clientId, ...meetingData }
        };
      }

      // Default test functionality
      console.log('Testing database functionality...');

      // Use existing test user
      const testUserId = "test-user-123";
      
      // Test client data
      const testClient = {
        userId: testUserId,
        name: "Test Client",
        email: "test@example.com",
        phoneNumber: "+1234567890"
      };

      // Test meeting data
      const testMeeting = {
        userId: testUserId,
        clientId: "", // Will be set after client is saved
        clientName: "Test Client",
        meetingTitle: "Test Meeting",
        meetingDate: "2025-01-15",
        isDiscovery: true,
        transcript: "This is a test transcript for the meeting.",
        summary: "Test meeting summary",
        painPoint: "Test pain point",
        suggestion: "Test suggestion",
        goal: "Test goal",
        salesTechniqueAdvice: ["Test Sales Technique 1", "Test Sales Technique 2"],
        coachingAdvice: ["Test Advice 1", "Test Advice 2"],
        actionItemsClient: ["Test Action 1", "Test Action 2"],
        actionItemsCoach: ["Test Coach Action 1", "Test Coach Action 2"],
        mindMap: null,
        emailContent: null,
        resourcesList: "Test resources list",
        nextMeetingPrep: null
      };

      // Save test client
      const clientId = await dbService.saveClient(testClient);
      console.log('Test client saved with ID:', clientId);

      // Update meeting data with client ID
      testMeeting.clientId = clientId;

      // Save test meeting
      const meetingId = await dbService.saveMeeting(testMeeting);
      console.log('Test meeting saved with ID:', meetingId);

      // Get all meetings for the test user
      const allMeetings = await dbService.getAllMeetings(testUserId);

      // Clean up - delete test meeting and client (they will cascade)
      await dbService.deleteMeeting(meetingId);

      return {
        success: true,
        message: "Database test completed successfully",
        data: {
          clientSaved: { clientId, ...testClient },
          meetingSaved: { meetingId, ...testMeeting },
          totalMeetings: allMeetings.length,
          databaseInitialized: true
        }
      };
    } catch (error) {
      console.error("Database test error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        data: null
      };
    }
  }
} 