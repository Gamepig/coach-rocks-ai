import type { Env } from '../types';

export class DatabaseService {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  /**
   * Save or update a client
   */
  async saveClient(client: any): Promise<string> {
    try {
      // Check if client already exists for this user
      const existingClient = await this.getClientByName(client.userId, client.name);
      
      if (existingClient) {
        // Update existing client
        const stmt = this.db.prepare(`
          UPDATE clients SET 
            email = ?
          WHERE client_id = ?
        `);

        await stmt.bind(
          client.email || null,
          existingClient.client_id
        ).run();

        console.log('Client updated successfully');
        return existingClient.client_id;
      } else {
        // Create new client
        const clientId = crypto.randomUUID();
        const stmt = this.db.prepare(`
          INSERT INTO clients (
            client_id, user_id, name, email
          ) VALUES (?, ?, ?, ?)
        `);

        await stmt.bind(
          clientId,
          client.userId,
          client.name,
          client.email || null
        ).run();

        console.log('Client saved successfully');
        return clientId;
      }
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  }

  /**
   * Get a client by name for a specific user
   */
  async getClientByName(userId: string, clientName: string): Promise<any | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM clients WHERE user_id = ? AND name = ?
      `);

      const result = await stmt.bind(userId, clientName).first();
      return result;
    } catch (error) {
      console.error('Error getting client by name:', error);
      throw error;
    }
  }

  /**
   * Save a meeting to the database
   */
  async saveMeeting(meeting: any): Promise<string> {
    try {
      const meetingId = crypto.randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO meetings (
          meeting_id, user_id, client_id, client_name, meeting_title, meeting_date,
          is_discovery, transcript, summary, pain_point, suggestion, goal,
          sales_technique_advice, coaching_advice, action_items_client, action_items_coach,
          mind_map, email_content, resources_list, next_meeting_prep, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.bind(
        meetingId,
        meeting.userId,
        meeting.clientId,
        meeting.clientName,
        meeting.meetingTitle,
        meeting.meetingDate,
        meeting.isDiscovery || false,
        meeting.transcript || null,
        meeting.summary || null,
        meeting.painPoint || null,
        meeting.suggestion || null,
        meeting.goal || null,
        JSON.stringify(meeting.salesTechniqueAdvice || []),
        JSON.stringify(meeting.coachingAdvice || []),
        JSON.stringify(meeting.actionItemsClient || []),
        JSON.stringify(meeting.actionItemsCoach || []),
        meeting.mindMap || null,
        meeting.emailContent || null,
        meeting.resourcesList || null,
        meeting.nextMeetingPrep || null,
        new Date().toISOString()  // Add created_at timestamp
      ).run();

      console.log('Meeting saved successfully');
      return meetingId;
    } catch (error) {
      console.error('Error saving meeting:', error);
      throw error;
    }
  }

  /**
   * Get a meeting by ID
   */
  async getMeeting(id: string): Promise<any | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM meetings WHERE meeting_id = ?
      `);

      const result = await stmt.bind(id).first();
      
      if (!result) {
        return null;
      }

      // Parse JSON fields with proper type assertions
      return {
        ...result,
        salesTechniqueAdvice: JSON.parse((result.sales_technique_advice as string) || '[]'),
        coachingAdvice: JSON.parse((result.coaching_advice as string) || '[]'),
        actionItemsClient: JSON.parse((result.action_items_client as string) || '[]'),
        actionItemsCoach: JSON.parse((result.action_items_coach as string) || '[]')
      };
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }

  /**
   * Update client name in meetings table
   */
  async updateClientNameInMeetings(clientId: string, newClientName: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE meetings SET client_name = ? WHERE client_id = ?
      `);
      
      await stmt.bind(newClientName, clientId).run();
      console.log('Updated client name in meetings:', newClientName);
    } catch (error) {
      console.error('Error updating client name in meetings:', error);
      throw error;
    }
  }

  /**
   * Update client name in clients table
   */
  async updateClientName(clientId: string, newClientName: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE clients SET name = ? WHERE client_id = ?
      `);
      
      await stmt.bind(newClientName, clientId).run();
      console.log('Updated client name:', newClientName);
    } catch (error) {
      console.error('Error updating client name:', error);
      throw error;
    }
  }

  /**
   * Debug method to check client-meeting relationships
   */
  async debugClientMeetingRelationships(userId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          c.client_id,
          c.name as client_name,
          COUNT(m.meeting_id) as meeting_count,
          GROUP_CONCAT(m.client_name) as meeting_client_names
        FROM clients c
        LEFT JOIN meetings m ON c.client_id = m.client_id
        WHERE c.user_id = ?
        GROUP BY c.client_id, c.name
        ORDER BY c.name ASC
      `);
      
      const result = await stmt.bind(userId).all();
      return result.results || [];
    } catch (error) {
      console.error('Error debugging client-meeting relationships:', error);
      throw error;
    }
  }

  /**
   * Get all meetings for a user
   */
  async getAllMeetings(userId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM meetings WHERE user_id = ? ORDER BY created_at DESC
      `);

      const result = await stmt.bind(userId).all();
      
      return result.results.map((row: any) => ({
        ...row,
        salesTechniqueAdvice: JSON.parse((row.sales_technique_advice as string) || '[]'),
        coachingAdvice: JSON.parse((row.coaching_advice as string) || '[]'),
        actionItemsClient: JSON.parse((row.action_items_client as string) || '[]'),
        actionItemsCoach: JSON.parse((row.action_items_coach as string) || '[]')
      }));
    } catch (error) {
      console.error('Error getting all meetings:', error);
      throw error;
    }
  }

  /**
   * Get all meetings for a specific client
   */
  async getMeetingsByClient(userId: string, clientId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM meetings WHERE user_id = ? AND client_id = ? ORDER BY meeting_date DESC
      `);

      const result = await stmt.bind(userId, clientId).all();
      
      return result.results.map((row: any) => ({
        ...row,
        salesTechniqueAdvice: JSON.parse((row.sales_technique_advice as string) || '[]'),
        coachingAdvice: JSON.parse((row.coaching_advice as string) || '[]'),
        actionItemsClient: JSON.parse((row.action_items_client as string) || '[]'),
        actionItemsCoach: JSON.parse((row.action_items_coach as string) || '[]')
      }));
    } catch (error) {
      console.error('Error getting meetings by client:', error);
      throw error;
    }
  }

  /**
   * Delete a meeting by ID
   */
  async deleteMeeting(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM meetings WHERE meeting_id = ?
      `);

      await stmt.bind(id).run();
      console.log('Meeting deleted successfully');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  /**
   * Save generated reels ideas for a meeting
   */
  async saveReelsIdeas(userId: string, meetingId: string, reels: Array<{ hook: string; narrative?: string; content?: string; callToAction?: string; hashtags?: string[]; tags?: string[] }>): Promise<void> {
    if (!reels || reels.length === 0) return;
    for (const reel of reels) {
      const id = crypto.randomUUID();
      const hook = reel.hook || '';
      const content = (reel.content ?? reel.narrative ?? '') + (reel.callToAction ? `\nCTA: ${reel.callToAction}` : '');
      const tagsArray = (reel.hashtags ?? reel.tags ?? []) as string[];
      const tagsJson = JSON.stringify(tagsArray);
      const stmt = this.db.prepare(`
        INSERT INTO reels_ideas (reels_ideas_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags)
        VALUES (?, ?, ?, 0, 0, ?, ?, ?)
      `);
      await stmt.bind(id, userId, meetingId, hook, content, tagsJson).run();
    }
  }

  /**
   * Get meetings overview for a user (now includes full analysis content)
   */
  async getMeetingsOverview(userId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT
        m.meeting_id,
        m.client_id,
        m.client_name,
        m.meeting_title,
        m.created_at AS uploaded_date,
        m.analysis_status,
        m.summary,
        m.pain_point,
        m.goal,
        m.suggestion,
        m.action_items_client,
        m.action_items_coach,
        m.email_content,
        m.resources_list,
        m.mind_map,
        m.next_meeting_prep,
        m.sales_technique_advice,
        m.coaching_advice,
        CASE WHEN m.summary IS NOT NULL THEN 1 ELSE 0 END AS has_summary,
        CASE WHEN m.email_content IS NOT NULL THEN 1 ELSE 0 END AS has_email,
        CASE WHEN m.resources_list IS NOT NULL THEN 1 ELSE 0 END AS has_resources,
        CASE WHEN m.mind_map IS NOT NULL THEN 1 ELSE 0 END AS has_mind_map,
        (
          SELECT COUNT(*) FROM reels_ideas r WHERE r.meeting_id = m.meeting_id
        ) AS reels_count,
        CASE 
          WHEN (
            SELECT COUNT(*) FROM reels_ideas r WHERE r.meeting_id = m.meeting_id
          ) > 0 THEN 1
          WHEN m.resources_list IS NOT NULL THEN
            CASE 
              WHEN json_extract(m.resources_list, '$.reels') IS NOT NULL THEN 1
              ELSE 0
            END
          ELSE 0
        END AS has_reels
      FROM meetings m
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `);
    const result = await stmt.bind(userId).all();
    return result.results;
  }

  /**
   * Get clients with meeting counts for a user
   */
  async getClientsWithCounts(userId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT 
        c.client_id,
        c.name,
        c.email,
        COUNT(m.meeting_id) AS meeting_count
      FROM clients c
      LEFT JOIN meetings m ON m.client_id = c.client_id
      WHERE c.user_id = ?
      GROUP BY c.client_id, c.name, c.email
      ORDER BY c.name
    `);
    const result = await stmt.bind(userId).all();
    return result.results;
  }

  /** Get reels for a user */
  async getReelsByUser(userId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT 
        reels_ideas_id AS id,
        meeting_id,
        hook,
        content,
        tags,
        is_favorite,
        created_at
      FROM reels_ideas
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const result = await stmt.bind(userId).all();
    return result.results.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags as string) : []
    }));
  }

  /** Update a reel (partial) */
  async updateReel(id: string, fields: { hook?: string | null; content?: string | null; tags?: string[] | null }): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE reels_ideas
      SET 
        hook = COALESCE(?, hook),
        content = COALESCE(?, content),
        tags = COALESCE(?, tags)
      WHERE reels_ideas_id = ?
    `);
    await stmt.bind(
      fields.hook ?? null,
      fields.content ?? null,
      fields.tags ? JSON.stringify(fields.tags) : null,
      id
    ).run();
  }

  /** Update next meeting prep for a meeting */
  async updateMeetingNextMeetingPrep(meetingId: string, nextMeetingPrep: any): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE meetings
      SET next_meeting_prep = ?
      WHERE meeting_id = ?
    `);
    await stmt.bind(
      JSON.stringify(nextMeetingPrep),
      meetingId
    ).run();
  }

  /** Set favorite flag on a reel */
  async setReelFavorite(id: string, isFavorite: boolean): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE reels_ideas SET is_favorite = ? WHERE reels_ideas_id = ?
    `);
    await stmt.bind(isFavorite ? 1 : 0, id).run();
  }

  /** Delete a reel */
  async deleteReel(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM reels_ideas WHERE reels_ideas_id = ?');
      await stmt.bind(id).run();
      console.log('Reel deleted successfully');
    } catch (error) {
      console.error('Error deleting reel:', error);
      throw error;
    }
  }

  // ===== TAG MANAGEMENT METHODS =====

  /**
   * Get all tags for a specific user
   */
  async getTagsByUser(userId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT id, name, color, created_at 
        FROM tags 
        WHERE user_id = ? 
        ORDER BY name ASC
      `);
      
      const result = await stmt.bind(userId).all();
      return result.results || [];
    } catch (error) {
      console.error('Error getting tags by user:', error);
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  async createTag(tag: { userId: string; name: string; color: string }): Promise<string> {
    try {
      const tagId = crypto.randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO tags (id, user_id, name, color) 
        VALUES (?, ?, ?, ?)
      `);
      
      await stmt.bind(tagId, tag.userId, tag.name, tag.color).run();
      console.log('Tag created successfully');
      return tagId;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Update an existing tag
   */
  async updateTag(tagId: string, updates: { name?: string; color?: string }): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.color !== undefined) {
        fields.push('color = ?');
        values.push(updates.color);
      }
      
      if (fields.length === 0) {
        return; // No updates to make
      }
      
      const stmt = this.db.prepare(`
        UPDATE tags 
        SET ${fields.join(', ')} 
        WHERE id = ?
      `);
      
      await stmt.bind(...values, tagId).run();
      console.log('Tag updated successfully');
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  /**
   * Delete a tag (will also remove all client associations)
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      // First delete all client associations
      const deleteAssociations = this.db.prepare('DELETE FROM client_tags WHERE tag_id = ?');
      await deleteAssociations.bind(tagId).run();
      
      // Then delete the tag
      const deleteTag = this.db.prepare('DELETE FROM tags WHERE id = ?');
      await deleteTag.bind(tagId).run();
      
      console.log('Tag and all associations deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * Get all tags for a specific client
   */
  async getClientTags(clientId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT t.id, t.name, t.color, t.created_at
        FROM tags t
        JOIN client_tags ct ON t.id = ct.tag_id
        WHERE ct.client_id = ?
        ORDER BY t.name ASC
      `);
      
      const result = await stmt.bind(clientId).all();
      return result.results || [];
    } catch (error) {
      console.error('Error getting client tags:', error);
      throw error;
    }
  }

  /**
   * Assign a tag to a client
   */
  async assignTagToClient(clientId: string, tagId: string): Promise<void> {
    try {
      const associationId = crypto.randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO client_tags (id, client_id, tag_id) 
        VALUES (?, ?, ?)
      `);
      
      await stmt.bind(associationId, clientId, tagId).run();
      console.log('Tag assigned to client successfully');
    } catch (error) {
      console.error('Error assigning tag to client:', error);
      throw error;
    }
  }

  /**
   * Remove a tag from a client
   */
  async removeTagFromClient(clientId: string, tagId: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM client_tags 
        WHERE client_id = ? AND tag_id = ?
      `);
      
      await stmt.bind(clientId, tagId).run();
      console.log('Tag removed from client successfully');
    } catch (error) {
      console.error('Error removing tag from client:', error);
      throw error;
    }
  }

  /**
   * Get clients with their tags for a specific user
   */
  async getClientsWithTags(userId: string): Promise<any[]> {
    try {
      console.log(`📊 [getClientsWithTags] Querying clients for userId: ${userId}`)
      // First, let's ensure all meetings have the correct client_name
      // This is a safety check to fix any remaining "New Client" entries
      const fixStmt = this.db.prepare(`
        UPDATE meetings m 
        SET client_name = c.name 
        FROM clients c 
        WHERE m.client_id = c.client_id 
        AND m.client_name = 'New Client'
      `);
      
      try {
        await fixStmt.run();
        console.log('Fixed any remaining "New Client" entries in meetings table');
      } catch (fixError) {
        console.warn('Could not fix client names (this is normal for new installations):', fixError instanceof Error ? fixError.message : 'Unknown error');
      }

      const stmt = this.db.prepare(`
        SELECT 
          c.client_id,
          c.name,
          c.email,
          c.status,
          c.notes,
          c.total_sessions,
          c.last_session_date,
          c.created_at,
          c.info,
          c.session_counts,
          c.address,
          c.source,
          c.lead_status,
          c.engagement_type,
          c.program,
          c.start_date,
          c.end_date,
          c.next_appointment_date,
          c.last_communication_date,
          c.contract_status,
          c.invoice_status,
          c.tags,
          COUNT(DISTINCT m.meeting_id) as meeting_count,
          GROUP_CONCAT(DISTINCT t.name) as tag_names,
          GROUP_CONCAT(DISTINCT t.color) as tag_colors
        FROM clients c
        LEFT JOIN meetings m ON c.client_id = m.client_id
        LEFT JOIN client_tags ct ON c.client_id = ct.client_id
        LEFT JOIN tags t ON ct.tag_id = t.id
        WHERE c.user_id = ?
          AND COALESCE(TRIM(LOWER(COALESCE(c.status, 'active'))), 'active') NOT IN ('inactive', 'archived', 'deleted')
        GROUP BY c.client_id, c.name, c.email, c.status, c.notes, c.total_sessions, c.last_session_date, c.created_at, c.info, c.session_counts, c.address, c.source, c.lead_status, c.engagement_type, c.program, c.start_date, c.end_date, c.next_appointment_date, c.last_communication_date, c.contract_status, c.invoice_status, c.tags
        ORDER BY c.name ASC
      `);
      
      const result = await stmt.bind(userId).all();
      const rawClients = result.results || [];
      
      // ✅ 添加詳細日誌：記錄原始查詢結果
      console.log(`📊 [getClientsWithTags] Raw query result: ${rawClients.length} clients found`)
      if (rawClients.length > 0) {
        console.log(`📊 [getClientsWithTags] Sample status values:`, rawClients.slice(0, 5).map(c => ({
          name: c.name,
          status: c.status,
          status_lower: typeof c.status === 'string' ? c.status.toLowerCase() : c.status,
          status_trimmed: typeof c.status === 'string' ? c.status.trim().toLowerCase() : c.status
        })))
      } else {
        console.log(`⚠️ [getClientsWithTags] No clients found - checking if user has any clients at all...`)
        const totalCheck = await this.db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').bind(userId).first()
        console.log(`📊 [getClientsWithTags] Total clients for user: ${totalCheck?.count || 0}`)
      }
      
      // ✅ 修復問題 2：後端去重處理，確保每個 client_id 只出現一次
      const clientsMap = new Map<string, any>();
      rawClients.forEach(client => {
        const clientId = client.client_id as string;
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, client);
        } else {
          // 如果已存在，合併標籤（避免重複）
          const existingClient = clientsMap.get(clientId);
          const existingTagNames = (existingClient.tag_names as string || '').split(',').map((n: string) => n.trim()).filter(Boolean);
          const newTagNames = (client.tag_names as string || '').split(',').map((n: string) => n.trim()).filter(Boolean);
          const existingTagColors = (existingClient.tag_colors as string || '').split(',').map((c: string) => c.trim()).filter(Boolean);
          const newTagColors = (client.tag_colors as string || '').split(',').map((c: string) => c.trim()).filter(Boolean);
          
          // 合併不重複的標籤
          const allTagNames = [...new Set([...existingTagNames, ...newTagNames])];
          const allTagColors = [...new Set([...existingTagColors, ...newTagColors])];
          
          existingClient.tag_names = allTagNames.join(',');
          existingClient.tag_colors = allTagColors.join(',');
        }
      });
      
      const clients = Array.from(clientsMap.values());
      
      // ✅ 添加詳細日誌：記錄去重後的結果
      console.log(`📊 [getClientsWithTags] After deduplication: ${clients.length} unique clients`)
      console.log(`📊 [getClientsWithTags] Deduplication: ${rawClients.length} raw -> ${clients.length} unique`)
      
      // ✅ Fallback: 如果結果為空，檢查用戶是否有會議記錄，如果有則使用更寬鬆的條件
      if (clients.length === 0) {
        console.log(`⚠️ [getClientsWithTags] No clients found with status filter, checking if user has meetings...`)
        const meetingCheck = await this.db.prepare(
          'SELECT COUNT(*) as count FROM meetings WHERE user_id = ?'
        ).bind(userId).first()
        
        if (meetingCheck && (meetingCheck.count as number) > 0) {
          console.log(`⚠️ [getClientsWithTags] User has ${meetingCheck.count} meetings but no clients, using fallback query (no status filter)`)
          // 使用更寬鬆的條件：只排除明確的非活躍狀態
          const fallbackStmt = this.db.prepare(`
            SELECT 
              c.client_id,
              c.name,
              c.email,
              c.status,
              c.notes,
              c.total_sessions,
              c.last_session_date,
              c.created_at,
              c.info,
              c.session_counts,
              c.address,
              c.source,
              c.lead_status,
              c.engagement_type,
              c.program,
              c.start_date,
              c.end_date,
              c.next_appointment_date,
              c.last_communication_date,
              c.contract_status,
              c.invoice_status,
              c.tags,
              COUNT(DISTINCT m.meeting_id) as meeting_count,
              GROUP_CONCAT(DISTINCT t.name) as tag_names,
              GROUP_CONCAT(DISTINCT t.color) as tag_colors
            FROM clients c
            LEFT JOIN meetings m ON c.client_id = m.client_id
            LEFT JOIN client_tags ct ON c.client_id = ct.client_id
            LEFT JOIN tags t ON ct.tag_id = t.id
            WHERE c.user_id = ?
              AND COALESCE(TRIM(LOWER(COALESCE(c.status, 'active'))), 'active') NOT IN ('inactive', 'archived', 'deleted')
            GROUP BY c.client_id, c.name, c.email, c.status, c.notes, c.total_sessions, c.last_session_date, c.created_at, c.info, c.session_counts, c.address, c.source, c.lead_status, c.engagement_type, c.program, c.start_date, c.end_date, c.next_appointment_date, c.last_communication_date, c.contract_status, c.invoice_status, c.tags
            ORDER BY c.name ASC
          `)
          const fallbackResult = await fallbackStmt.bind(userId).all()
          const fallbackClients = fallbackResult.results || []
          console.log(`📊 [getClientsWithTags] Fallback query found ${fallbackClients.length} clients`)
          
          // 應用相同的去重邏輯
          const fallbackMap = new Map<string, any>()
          fallbackClients.forEach(client => {
            const clientId = client.client_id as string
            if (!fallbackMap.has(clientId)) {
              fallbackMap.set(clientId, client)
            } else {
              // 如果已存在，合併標籤（避免重複）
              const existingClient = fallbackMap.get(clientId)
              const existingTagNames = (existingClient.tag_names as string || '').split(',').map((n: string) => n.trim()).filter(Boolean)
              const newTagNames = (client.tag_names as string || '').split(',').map((n: string) => n.trim()).filter(Boolean)
              const existingTagColors = (existingClient.tag_colors as string || '').split(',').map((c: string) => c.trim()).filter(Boolean)
              const newTagColors = (client.tag_colors as string || '').split(',').map((c: string) => c.trim()).filter(Boolean)
              
              // 合併不重複的標籤
              const allTagNames = [...new Set([...existingTagNames, ...newTagNames])]
              const allTagColors = [...new Set([...existingTagColors, ...newTagColors])]
              
              existingClient.tag_names = allTagNames.join(',')
              existingClient.tag_colors = allTagColors.join(',')
            }
          })
          const fallbackUniqueClients = Array.from(fallbackMap.values())
          console.log(`📊 [getClientsWithTags] After fallback deduplication: ${fallbackUniqueClients.length} clients`)
          
          // 使用 fallback 結果
          return fallbackUniqueClients.map(client => ({
            ...client,
            tags: client.tag_names ? 
              (client.tag_names as string).split(',').map((name: string, index: number) => ({
                name: name.trim(),
                color: client.tag_colors ? (client.tag_colors as string).split(',')[index]?.trim() : '#3B82F6'
              })).filter(tag => tag.name) : []
          }))
        }
      }
      
      // Log the raw results for debugging
      clients.forEach(client => {
        console.log(`Client: ${client.name} (ID: ${client.client_id}) - ${client.meeting_count} meetings`)
      })
      
      // Parse tag names and colors into arrays
      return clients.map(client => ({
        ...client,
        tags: client.tag_names ? 
          (client.tag_names as string).split(',').map((name: string, index: number) => ({
            name: name.trim(),
            color: client.tag_colors ? (client.tag_colors as string).split(',')[index]?.trim() : '#3B82F6'
          })).filter(tag => tag.name) : [] // 過濾空標籤
      }));
    } catch (error) {
      console.error('Error getting clients with tags:', error);
      throw error;
    }
  }

  // ===== SESSION MANAGEMENT METHODS =====

  /**
   * Create a new session token for a user
   */
  async createSessionToken(userId: string, tokenHash: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<string> {
    try {
      const tokenId = crypto.randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO session_tokens (token_id, user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        tokenId, 
        userId, 
        tokenHash, 
        expiresAt.toISOString(),
        userAgent || null,
        ipAddress || null
      ).run();
      
      // Update user's last login
      const updateUser = this.db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
      `);
      await updateUser.bind(userId).run();
      
      console.log('Session token created successfully');
      return tokenId;
    } catch (error) {
      console.error('Error creating session token:', error);
      throw error;
    }
  }

  /**
   * Get user by session token
   */
  async getUserBySessionToken(tokenHash: string): Promise<any | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT u.*, st.token_id, st.expires_at, st.last_used
        FROM users u
        JOIN session_tokens st ON u.user_id = st.user_id
        WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > CURRENT_TIMESTAMP
      `);
      
      const result = await stmt.bind(tokenHash).first();
      
      if (result) {
        // Update last_used timestamp
        const updateStmt = this.db.prepare(`
          UPDATE session_tokens SET last_used = CURRENT_TIMESTAMP WHERE token_hash = ?
        `);
        await updateStmt.bind(tokenHash).run();
      }
      
      return result;
    } catch (error) {
      console.error('Error getting user by session token:', error);
      throw error;
    }
  }

  /**
   * Get user by email (for login)
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `);
      
      const result = await stmt.bind(email).first();
      return result;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Create or update user (for email-based auth)
   */
  async createOrUpdateUser(email: string): Promise<{ userId: string; isNewUser: boolean }> {
    try {
      // Check if user exists
      let user = await this.getUserByEmail(email);
      
      if (user) {
        // Update verification status
        const updateStmt = this.db.prepare(`
          UPDATE users SET verified = TRUE WHERE user_id = ?
        `);
        await updateStmt.bind(user.user_id).run();
        
        return { userId: user.user_id, isNewUser: false };
      } else {
        // Create new user
        const userId = crypto.randomUUID();
        const stmt = this.db.prepare(`
          INSERT INTO users (user_id, email, password_hash, verified)
          VALUES (?, ?, ?, ?)
        `);
        
        // For email-based auth, we don't need a password
        await stmt.bind(userId, email, '', true).run();
        
        console.log('New user created:', email);
        return { userId, isNewUser: true };
      }
    } catch (error) {
      console.error('Error creating or updating user:', error);
      throw error;
    }
  }

  /**
   * Invalidate a session token
   */
  async invalidateSessionToken(tokenHash: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_tokens SET is_active = FALSE WHERE token_hash = ?
      `);
      
      await stmt.bind(tokenHash).run();
      console.log('Session token invalidated');
    } catch (error) {
      console.error('Error invalidating session token:', error);
      throw error;
    }
  }

  /**
   * Invalidate all session tokens for a user (logout all devices)
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE session_tokens SET is_active = FALSE WHERE user_id = ?
      `);
      
      await stmt.bind(userId).run();
      console.log('All user sessions invalidated');
    } catch (error) {
      console.error('Error invalidating all user sessions:', error);
      throw error;
    }
  }

  /**
   * Clean up expired session tokens
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM session_tokens WHERE expires_at < CURRENT_TIMESTAMP
      `);
      
      await stmt.run();
      console.log('Expired sessions cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT token_id, created_at, last_used, expires_at, user_agent, ip_address
        FROM session_tokens 
        WHERE user_id = ? AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_used DESC
      `);
      
      const result = await stmt.bind(userId).all();
      return result.results || [];
    } catch (error) {
      console.error('Error getting user active sessions:', error);
      throw error;
    }
  }

  // ===== DASHBOARD DATA METHODS =====

  /**
   * Get dashboard statistics for a user
   * 只計算完成的分析，條件：
   * 1. analysis_status = 'completed' 或 'success'
   * 2. 至少有以下字段之一：summary, email_content, mind_map, resources_list, next_meeting_prep
   */
  async getDashboardStats(userId: string): Promise<any> {
    try {
      // Get total meetings with completed analysis
      // 只計算狀態為 'completed' 且至少有一個核心字段的分析
      const totalMeetingsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM meetings
        WHERE user_id = ?
        AND (analysis_status = 'completed' OR analysis_status = 'success')
        AND (
          summary IS NOT NULL OR
          email_content IS NOT NULL OR
          mind_map IS NOT NULL OR
          resources_list IS NOT NULL OR
          next_meeting_prep IS NOT NULL
        )
      `);
      const totalMeetings = await totalMeetingsStmt.bind(userId).first();

      // Get unique clients served (from completed analyses only)
      const clientsServedStmt = this.db.prepare(`
        SELECT COUNT(DISTINCT client_id) as count FROM meetings
        WHERE user_id = ?
        AND (analysis_status = 'completed' OR analysis_status = 'success')
        AND (
          summary IS NOT NULL OR
          email_content IS NOT NULL OR
          mind_map IS NOT NULL OR
          resources_list IS NOT NULL OR
          next_meeting_prep IS NOT NULL
        )
      `);
      const clientsServed = await clientsServedStmt.bind(userId).first();

      // Get total reels generated
      const reelsGeneratedStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM reels_ideas WHERE user_id = ?
      `);
      const reelsGenerated = await reelsGeneratedStmt.bind(userId).first();

      // Get this week's uploads (completed analyses only)
      const thisWeekUploadsStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM meetings
        WHERE user_id = ?
        AND created_at >= datetime('now', '-7 days')
        AND (analysis_status = 'completed' OR analysis_status = 'success')
        AND (
          summary IS NOT NULL OR
          email_content IS NOT NULL OR
          mind_map IS NOT NULL OR
          resources_list IS NOT NULL OR
          next_meeting_prep IS NOT NULL
        )
      `);
      const thisWeekUploads = await thisWeekUploadsStmt.bind(userId).first();

      console.log('📊 Dashboard stats calculated:', {
        totalMeetings: totalMeetings?.count || 0,
        clientsServed: clientsServed?.count || 0,
        reelsGenerated: reelsGenerated?.count || 0,
        thisWeekUploads: thisWeekUploads?.count || 0
      });

      return {
        totalMeetings: totalMeetings?.count || 0,
        clientsServed: clientsServed?.count || 0,
        reelsGenerated: reelsGenerated?.count || 0,
        thisWeekUploads: thisWeekUploads?.count || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const activities: any[] = [];

      // Get recent meetings (analyzed)
      const recentMeetingsStmt = this.db.prepare(`
        SELECT
          'meeting_analyzed' as type,
          client_name as client,
          meeting_title,
          created_at as date,
          meeting_id
        FROM meetings
        WHERE user_id = ? AND summary IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ?
      `);
      const recentMeetings = await recentMeetingsStmt.bind(userId, Math.floor(limit / 2)).all();

      // 🔍 Debug: Check raw database values
      if (recentMeetings.results && recentMeetings.results.length > 0) {
        console.log('📊 Raw meeting dates from DB:', recentMeetings.results.map(m => ({
          client: m.client,
          date_raw: m.date,
          date_type: typeof m.date
        })));
      }
      activities.push(...(recentMeetings.results || []));

      // Get recent reels generated
      const recentReelsStmt = this.db.prepare(`
        SELECT 
          'reels_generated' as type,
          m.client_name as client,
          m.meeting_title,
          r.created_at as date,
          r.meeting_id
        FROM reels_ideas r
        JOIN meetings m ON r.meeting_id = m.meeting_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC 
        LIMIT ?
      `);
      const recentReels = await recentReelsStmt.bind(userId, Math.floor(limit / 2)).all();
      activities.push(...(recentReels.results || []));

      // Sort by date and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
        .map(activity => {
          const formattedDate = this.formatActivityDate(activity.date);

          // 🔍 DEBUG: Log each activity being formatted
          console.log('📌 Formatting activity:', {
            client: activity.client,
            date_raw: activity.date,
            date_formatted: formattedDate,
            type: activity.type
          });

          return {
            type: activity.type,
            client: activity.client,
            meeting_title: activity.meeting_title,
            date: formattedDate,
            meeting_id: activity.meeting_id
          };
        });

      console.log('✅ Final recentActivity result:', sortedActivities);
      return sortedActivities;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Format activity date for human-readable display
   */
  private formatActivityDate(dateString: string): string {
    // 處理 NULL 或空值
    if (!dateString) {
      console.warn('⚠️ formatActivityDate: dateString is null/empty, returning "Recently"');
      return 'Recently';
    }

    try {
      const date = new Date(dateString);
      const timeMs = date.getTime();
      
      // 檢查是否為有效日期
      if (isNaN(timeMs)) {
        console.warn('⚠️ formatActivityDate: Invalid date detected for:', dateString, 'returning "Recently"');
        return 'Recently';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - timeMs;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
      } else if (diffDays === 1) {
        return '1 day ago';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        const formatted = date.toLocaleDateString();
        // 防止返回 "Invalid Date"
        if (formatted === 'Invalid Date') {
          console.warn('⚠️ formatActivityDate: toLocaleDateString returned "Invalid Date" for:', dateString);
          return dateString; // 返回原始日期字符串
        }
        return formatted;
      }
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'dateString:', dateString);
      return 'Recently';
    }
  }

  /**
   * Get complete dashboard data for a user
   */
  async getDashboardData(userId: string): Promise<any> {
    try {
      const [stats, recentActivity] = await Promise.all([
        this.getDashboardStats(userId),
        this.getRecentActivity(userId, 8)
      ]);

      return {
        landingPage: "dashboard",
        quickStats: stats,
        recentActivity,
        quickActions: [
          { label: "Upload New Meeting", action: "upload_modal", icon: "upload" },
          { label: "View All Meetings", action: "navigate_meetings", icon: "list" },
          { label: "Browse Reels", action: "navigate_reels", icon: "video" }
        ]
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get a client by ID
   */
  async getClientById(clientId: string): Promise<any | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM clients WHERE client_id = ?
      `);

      const result = await stmt.bind(clientId).first();
      return result;
    } catch (error) {
      console.error('Error getting client by id:', error);
      throw error;
    }
  }

  /**
   * Update an existing client
   */
  async updateClient(clientId: string, updates: { name?: string; email?: string; status?: string; notes?: string; tags?: string[] }): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }

      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }

      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }
      
      // Update basic client fields if any
      if (fields.length > 0) {
        const stmt = this.db.prepare(`
          UPDATE clients 
          SET ${fields.join(', ')} 
          WHERE client_id = ?
        `);
        
        await stmt.bind(...values, clientId).run();
        console.log('Client fields updated successfully');
      }

      // Handle tags if provided
      if (updates.tags !== undefined && Array.isArray(updates.tags)) {
        // Delete all existing tags for this client
        const deleteStmt = this.db.prepare(`
          DELETE FROM client_tags
          WHERE client_id = ?
        `);
        await deleteStmt.bind(clientId).run();

        // Add new tags
        for (const tagId of updates.tags) {
          await this.assignTagToClient(clientId, tagId);
        }
        
        console.log('Client tags updated successfully');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Get the last analysis submission timestamp for a user
   * Used for rate limiting enforcement (30-second minimum interval)
   */
  async getLastAnalysisTimestamp(userId: string): Promise<Date | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT last_analysis_timestamp
        FROM users
        WHERE user_id = ?
      `);

      const result = await stmt.bind(userId).first();
      if (!result || !result.last_analysis_timestamp) {
        return null;
      }

      return new Date(result.last_analysis_timestamp);
    } catch (error) {
      console.error('Error getting last analysis timestamp:', error);
      throw error;
    }
  }

  /**
   * Update the last analysis submission timestamp for a user
   * Called after analysis is successfully submitted
   */
  async updateLastAnalysisTimestamp(userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE users
        SET last_analysis_timestamp = ?
        WHERE user_id = ?
      `);

      await stmt.bind(now, userId).run();
      console.log(`Updated last_analysis_timestamp for user ${userId}`);
    } catch (error) {
      console.error('Error updating last analysis timestamp:', error);
      throw error;
    }
  }
} 