import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { authMiddleware } from "../middleware/auth"
import { DatabaseService } from "../services/database"

// Response schema
const DashboardResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    landingPage: z.string(),
    quickStats: z.object({
      totalMeetings: z.number(),
      clientsServed: z.number(),
      reelsGenerated: z.number(),
      thisWeekUploads: z.number()
    }),
    recentActivity: z.array(z.object({
      type: z.string(),
      client: z.string(),
      meeting_title: z.string().optional(),
      date: z.string(),
      meeting_id: z.string().optional()
    })),
    quickActions: z.array(z.object({
      label: z.string(),
      action: z.string(),
      icon: z.string()
    }))
  }).optional(),
  user: z.object({
    user_id: z.string(),
    email: z.string(),
    plan: z.string(),
    verified: z.boolean(),
    onboarding_completed: z.boolean().optional()
  }).optional()
})

export class Dashboard extends OpenAPIRoute {
  schema = {
    tags: ["Dashboard"],
    summary: "Get dashboard data for authenticated user",
    description: "Returns personalized dashboard with stats, recent activity, and quick actions",
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Dashboard data retrieved successfully",
        content: {
          "application/json": {
            schema: DashboardResponse
          }
        }
      },
      "401": {
        description: "Invalid or expired session token"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(c: AppContext) {
    try {
      // Validate session
      const auth = await authMiddleware(c.req.raw, c.env);

      if (!auth.isValid || !auth.user) {
        return c.json({
          success: false,
          message: "Invalid or expired session token"
        }, 401);
      }

      const db = new DatabaseService(c.env);

      // 🔍 DEBUG: Verify new code is executing (v2025-11-16-ca3015fb)
      console.log('✅ NEW DASHBOARD CODE EXECUTING - Version ca3015fb deployed successfully');

      // Get dashboard data
      const dashboardData = await db.getDashboardData(auth.user.user_id);
      console.log('📊 Dashboard data retrieved with recentActivity items:', dashboardData?.recentActivity?.length || 0);

      // 🔍 Debug: Add raw recentActivity for troubleshooting
      const responseData = {
        success: true,
        message: "Dashboard data retrieved successfully",
        data: dashboardData,
        user: {
          user_id: auth.user.user_id,
          email: auth.user.email,
          plan: auth.user.plan,
          verified: auth.user.verified,
          onboarding_completed: auth.user.onboarding_completed || false
        },
        // Debug field to see actual recent activity data
        _debug: {
          recentActivityCount: dashboardData?.recentActivity?.length || 0,
          recentActivitySample: dashboardData?.recentActivity?.slice(0, 2)
        }
      };

      return c.json(responseData);

    } catch (error) {
      console.error("Error in dashboard endpoint:", error);
      
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500);
    }
  }
}

// Session validation endpoint
const ValidateSessionResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  valid: z.boolean(),
  user: z.object({
    user_id: z.string(),
    email: z.string(),
    plan: z.string(),
    verified: z.boolean(),
    last_login: z.string().optional()
  }).optional(),
  authState: z.enum(["authenticated", "session_expired", "anonymous"])
})

export class ValidateSession extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Validate current session token",
    description: "Check if session token is valid and return user state",
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Session validation result",
        content: {
          "application/json": {
            schema: ValidateSessionResponse
          }
        }
      }
    }
  }

  async handle(c: AppContext) {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: true,
          message: "No session token provided",
          valid: false,
          authState: "anonymous"
        });
      }

      // Validate session using existing middleware
      const auth = await authMiddleware(c.req.raw, c.env);
      
      if (auth.isValid && auth.user) {
        return c.json({
          success: true,
          message: "Session is valid",
          valid: true,
          user: {
            user_id: auth.user.user_id,
            email: auth.user.email,
            plan: auth.user.plan,
            verified: auth.user.verified,
            last_login: auth.user.last_login
          },
          authState: "authenticated"
        });
      } else {
        // Check if we have some cached user data (for expired session UX)
        let authState = "anonymous";
        
        // If we had a token but it's invalid, it's likely expired
        if (authHeader.startsWith('Bearer ')) {
          authState = "session_expired";
        }
        
        return c.json({
          success: true,
          message: "Session is invalid or expired",
          valid: false,
          authState
        });
      }

    } catch (error) {
      console.error("Error in session validation:", error);
      
      return c.json({
        success: false,
        message: "Session validation failed",
        valid: false,
        authState: "anonymous"
      });
    }
  }
}