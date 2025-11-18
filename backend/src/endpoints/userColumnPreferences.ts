import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Env } from "../types";
import { Context } from "hono";

// Schema for saving column preferences - wrap array in object for Chanfana
const SaveColumnPreferencesSchema = z.object({
  columns: z.array(z.string()).describe("Array of visible column names")
});

// Save user column preferences endpoint
export class SaveUserColumnPreferences extends OpenAPIRoute {
  schema = {
    tags: ["User Preferences"],
    summary: "Save user's client table column preferences",
    request: {
      body: {
        content: {
          "application/json": {
            schema: SaveColumnPreferencesSchema,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Column preferences saved successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string().optional(),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const clients_columns_settings = data.body.columns

      console.log('SaveUserColumnPreferences: Starting...', { clients_columns_settings });

      // Get authorization header
      const authHeader = c.req.header('Authorization');
      console.log('SaveUserColumnPreferences: Auth header present:', !!authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('SaveUserColumnPreferences: Missing or invalid auth header');
        return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
      }

      const token = authHeader.substring(7);
      console.log('SaveUserColumnPreferences: Token extracted, length:', token.length);

      // Hash the token for lookup (like other endpoints do)
      const encoder = new TextEncoder()
      const tokenData = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData)
      const hashArray = new Uint8Array(hashBuffer)
      const tokenHash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Validate session and get user ID using correct table
      console.log('SaveUserColumnPreferences: Looking up session with hash:', tokenHash.substring(0, 10) + '...');
      const sessionQuery = await c.env.DB.prepare(
        "SELECT u.user_id FROM users u JOIN session_tokens st ON u.user_id = st.user_id WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > datetime('now')"
      ).bind(tokenHash).first();

      console.log('SaveUserColumnPreferences: Session query result:', sessionQuery);

      if (!sessionQuery) {
        console.log('SaveUserColumnPreferences: Invalid or expired session');
        return c.json({ success: false, error: 'Invalid or expired session' }, 401);
      }

      const userId = sessionQuery.user_id;
      console.log('SaveUserColumnPreferences: User ID:', userId);

      console.log('SaveUserColumnPreferences: Column settings to save:', clients_columns_settings);

      // Convert array to JSON string for storage
      const settingsJson = JSON.stringify(clients_columns_settings);
      console.log('SaveUserColumnPreferences: JSON to store:', settingsJson);

      // Update user's column preferences
      console.log('SaveUserColumnPreferences: Updating database...');
      const updateResult = await c.env.DB.prepare(
        "UPDATE users SET clients_columns_settings = ? WHERE user_id = ?"
      ).bind(settingsJson, userId).run();

      console.log('SaveUserColumnPreferences: Database update result:', updateResult);

      return c.json({
        success: true,
        message: "Column preferences saved successfully"
      });

    } catch (error) {
      console.error('Save column preferences error:', error);
      return c.json({
        success: false,
        error: 'Failed to save column preferences'
      }, 500);
    }
  }
}

// Get user column preferences endpoint
export class GetUserColumnPreferences extends OpenAPIRoute {
  schema = {
    tags: ["User Preferences"],
    summary: "Get user's client table column preferences",
    responses: {
      "200": {
        description: "Column preferences retrieved successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              data: z.array(z.string()).optional(),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  };

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      console.log('GetUserColumnPreferences: Starting...');

      // Get authorization header
      const authHeader = c.req.header('Authorization');
      console.log('GetUserColumnPreferences: Auth header present:', !!authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('GetUserColumnPreferences: Missing or invalid auth header');
        return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
      }

      const token = authHeader.substring(7);
      console.log('GetUserColumnPreferences: Token extracted, length:', token.length);

      // Hash the token for lookup (like other endpoints do)
      const encoder = new TextEncoder()
      const tokenData = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData)
      const hashArray = new Uint8Array(hashBuffer)
      const tokenHash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Validate session and get user ID using correct table
      const sessionQuery = await c.env.DB.prepare(
        "SELECT u.user_id FROM users u JOIN session_tokens st ON u.user_id = st.user_id WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > datetime('now')"
      ).bind(tokenHash).first();

      console.log('GetUserColumnPreferences: Session query result:', sessionQuery);

      if (!sessionQuery) {
        console.log('GetUserColumnPreferences: Invalid or expired session');
        return c.json({ success: false, error: 'Invalid or expired session' }, 401);
      }

      const userId = sessionQuery.user_id;
      console.log('GetUserColumnPreferences: User ID:', userId);

      // Get user's column preferences
      const userQuery = await c.env.DB.prepare(
        "SELECT clients_columns_settings FROM users WHERE user_id = ?"
      ).bind(userId).first();

      console.log('GetUserColumnPreferences: User query result:', userQuery);

      let columnSettings = [];
      if (userQuery && userQuery.clients_columns_settings) {
        try {
          columnSettings = JSON.parse(userQuery.clients_columns_settings);
          console.log('GetUserColumnPreferences: Parsed settings:', columnSettings);
        } catch (parseError) {
          console.error('Failed to parse column settings:', parseError);
          columnSettings = [];
        }
      }

      console.log('GetUserColumnPreferences: Returning success with data:', columnSettings);
      return c.json({
        success: true,
        data: columnSettings
      });

    } catch (error) {
      console.error('Get column preferences error:', error);
      console.error('Error stack:', error.stack);
      return c.json({
        success: false,
        error: 'Failed to get column preferences'
      }, 500);
    }
  }
}