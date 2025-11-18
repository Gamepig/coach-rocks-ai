import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { authMiddleware, hashToken } from "../middleware/auth"
import { DatabaseService } from "../services/database"

// Request/Response schemas
const LogoutRequest = z.object({
  logoutAll: z.boolean().optional().default(false) // Option to logout from all devices
})

const LogoutResponse = z.object({
  success: z.boolean(),
  message: z.string()
})

export class Logout extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Logout user",
    description: "Invalidate session token(s) and logout user",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: LogoutRequest
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Logout successful",
        content: {
          "application/json": {
            schema: LogoutResponse
          }
        }
      },
      "401": {
        description: "Invalid or expired token"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { logoutAll } = data.body;
      
      // ✅ 修復：允許登出即使 token 無效（用戶可能就是想清除過期的 token）
      // 嘗試驗證 session，但不因為驗證失敗而阻止登出
      const auth = await authMiddleware(c.req.raw, c.env);
      const db = new DatabaseService(c.env);
      
      if (auth.isValid && auth.user) {
        // Session 有效，執行完整的登出流程
        if (logoutAll) {
          // Logout from all devices
          await db.invalidateAllUserSessions(auth.user.user_id);
          
          return c.json({
            success: true,
            message: "Logged out from all devices successfully"
          });
        } else {
          // Logout from current device only
          const authHeader = c.req.header('Authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const tokenHash = await hashToken(token);
            await db.invalidateSessionToken(tokenHash);
          }
          
          return c.json({
            success: true,
            message: "Logged out successfully"
          });
        }
      } else {
        // ✅ 修復：Session 無效時，仍然嘗試清除 token（如果有的話）
        // 這樣可以處理 token 已過期但用戶仍想登出的情況
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const tokenHash = await hashToken(token);
            await db.invalidateSessionToken(tokenHash);
          } catch (tokenError) {
            // Token 處理失敗不影響登出流程
            console.log("Token invalidation failed (may already be invalid):", tokenError);
          }
        }
        
        // 即使 token 無效，也返回成功（因為本地狀態已經清除）
        return c.json({
          success: true,
          message: "Logged out successfully (session was already invalid)"
        });
      }

    } catch (error) {
      console.error("Error in logout:", error);
      
      // ✅ 修復：即使發生錯誤，也返回成功（因為本地狀態已經清除）
      // 這樣可以確保用戶總是可以登出
      return c.json({
        success: true,
        message: "Logged out successfully (error occurred but local state cleared)"
      });
    }
  }
}