/**
 * Auto Analysis Service
 * 統一入口點處理來自 Zoom 和 Google Meet 的自動化分析觸發
 *
 * 功能：
 * - 支援多 provider（Zoom / Google）
 * - 會議過濾（時長、參與者數量）
 * - 客戶匹配（根據參與者 email/name）
 * - 統一的分析觸發流程
 * - 完整的錯誤追蹤（correlation ID）
 */

import { Env } from '../types'
import { OpenAIService } from './openai'
import { DatabaseService } from './database'

// 類型定義
export interface AutoAnalysisInput {
  provider: 'zoom' | 'google'
  meetingId: string
  title: string
  transcript: string
  duration: number // 分鐘
  participants: Array<{
    name: string
    email?: string
  }>
  recordingUrl?: string
  metadata?: Record<string, any>
}

export interface AutoAnalysisResult {
  success: boolean
  message: string
  meetingId: string
  userId?: string
  clientId?: string
  correlationId: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface AnalysisFilters {
  minDuration: number // 分鐘
  maxDuration?: number // 分鐘
  minParticipants: number
  maxParticipants?: number
}

export class AutoAnalysisService {
  private env: Env
  private dbService: DatabaseService
  private openaiService: OpenAIService
  private readonly filters: AnalysisFilters = {
    minDuration: 15, // 最少 15 分鐘
    minParticipants: 1
  }

  constructor(env: Env) {
    this.env = env
    this.dbService = new DatabaseService(env)
    this.openaiService = new OpenAIService(env)
  }

  /**
   * 主入口函數：觸發自動分析
   */
  async triggerAnalysis(input: AutoAnalysisInput): Promise<AutoAnalysisResult> {
    const correlationId = this.generateCorrelationId(input.provider, input.meetingId)

    try {
      console.log(`[${correlationId}] 📌 開始自動分析觸發 - Provider: ${input.provider}, 會議: ${input.title}`)

      // 步驟 1：驗證輸入
      const validationError = this.validateInput(input)
      if (validationError) {
        console.warn(`[${correlationId}] ⚠️  輸入驗證失敗: ${validationError}`)
        return {
          success: false,
          message: validationError,
          meetingId: input.meetingId,
          correlationId,
          error: {
            code: 'INVALID_INPUT',
            message: validationError
          }
        }
      }

      // 步驟 2：會議過濾檢查
      const filterResult = this.checkMeetingFilters(input)
      if (!filterResult.pass) {
        console.info(`[${correlationId}] ⏭️  會議被跳過 - 原因: ${filterResult.reason}`)
        return {
          success: false,
          message: filterResult.reason,
          meetingId: input.meetingId,
          correlationId,
          error: {
            code: 'FILTERED_OUT',
            message: filterResult.reason
          }
        }
      }

      // 步驟 3：客戶匹配
      console.log(`[${correlationId}] 🔍 嘗試匹配客戶...`)
      const matchedCustomer = await this.matchCustomer(input.participants)

      if (!matchedCustomer) {
        console.info(`[${correlationId}] ⚠️  找不到匹配的客戶 - 跳過分析`)
        return {
          success: false,
          message: '找不到匹配的客戶 - 自動分析跳過',
          meetingId: input.meetingId,
          correlationId,
          error: {
            code: 'NO_CUSTOMER_MATCH',
            message: '無法將參與者與現有客戶匹配'
          }
        }
      }

      console.log(`[${correlationId}] ✅ 找到匹配客戶: ${matchedCustomer.clientId} (${matchedCustomer.clientName})`)

      // 步驟 4：建立會議記錄
      const meetingRecord = await this.createMeetingRecord(
        input,
        matchedCustomer.userId,
        matchedCustomer.clientId,
        matchedCustomer.clientName,
        correlationId
      )

      if (!meetingRecord) {
        throw new Error('無法建立會議記錄')
      }

      console.log(`[${correlationId}] ✅ 會議記錄已建立: ${meetingRecord.id}`)

      // 步驟 5：觸發背景分析
      console.log(`[${correlationId}] 🚀 觸發背景分析...`)
      this.triggerBackgroundAnalysis(
        meetingRecord.id,
        matchedCustomer.userId,
        matchedCustomer.clientId,
        matchedCustomer.clientName,
        input.transcript,
        matchedCustomer.userEmail,
        input.title,
        correlationId
      )

      return {
        success: true,
        message: '自動分析已觸發',
        meetingId: input.meetingId,
        userId: matchedCustomer.userId,
        clientId: matchedCustomer.clientId,
        correlationId
      }

    } catch (error) {
      console.error(`[${correlationId}] ❌ 自動分析失敗:`, error)

      return {
        success: false,
        message: '自動分析處理失敗',
        meetingId: input.meetingId,
        correlationId,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : '未知錯誤',
          details: error instanceof Error ? error.stack : undefined
        }
      }
    }
  }

  /**
   * 驗證輸入數據
   */
  private validateInput(input: AutoAnalysisInput): string | null {
    if (!input.provider || !['zoom', 'google'].includes(input.provider)) {
      return 'provider 必須是 zoom 或 google'
    }

    if (!input.meetingId || !input.meetingId.trim()) {
      return 'meetingId 不可為空'
    }

    if (!input.title || !input.title.trim()) {
      return 'title 不可為空'
    }

    if (!input.transcript || !input.transcript.trim()) {
      return 'transcript 不可為空'
    }

    if (typeof input.duration !== 'number' || input.duration <= 0) {
      return '會議時長必須大於 0'
    }

    if (!Array.isArray(input.participants) || input.participants.length === 0) {
      return '參與者列表不可為空'
    }

    return null
  }

  /**
   * 檢查會議是否符合分析條件
   */
  private checkMeetingFilters(input: AutoAnalysisInput): { pass: boolean; reason?: string } {
    // 時長檢查
    if (input.duration < this.filters.minDuration) {
      return {
        pass: false,
        reason: `會議時長 ${input.duration} 分鐘 < 最小要求 ${this.filters.minDuration} 分鐘`
      }
    }

    if (this.filters.maxDuration && input.duration > this.filters.maxDuration) {
      return {
        pass: false,
        reason: `會議時長 ${input.duration} 分鐘 > 最大限制 ${this.filters.maxDuration} 分鐘`
      }
    }

    // 參與者數檢查
    if (input.participants.length < this.filters.minParticipants) {
      return {
        pass: false,
        reason: `參與者數 ${input.participants.length} < 最小要求 ${this.filters.minParticipants}`
      }
    }

    if (this.filters.maxParticipants && input.participants.length > this.filters.maxParticipants) {
      return {
        pass: false,
        reason: `參與者數 ${input.participants.length} > 最大限制 ${this.filters.maxParticipants}`
      }
    }

    return { pass: true }
  }

  /**
   * 根據參與者資訊匹配客戶
   */
  private async matchCustomer(
    participants: Array<{ name: string; email?: string }>
  ): Promise<{
    userId: string
    clientId: string
    clientName: string
    userEmail: string
  } | null> {
    try {
      // 嘗試根據電子郵件匹配
      for (const participant of participants) {
        if (participant.email) {
          const match = await this.env.DB.prepare(`
            SELECT c.client_id, c.name, u.user_id, u.email
            FROM clients c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.email = ? OR u.email = ?
            LIMIT 1
          `).bind(participant.email, participant.email).first()

          if (match) {
            return {
              userId: match.user_id,
              clientId: match.client_id,
              clientName: match.name,
              userEmail: match.email
            }
          }
        }
      }

      // 嘗試根據名稱匹配
      for (const participant of participants) {
        if (participant.name) {
          const match = await this.env.DB.prepare(`
            SELECT c.client_id, c.name, u.user_id, u.email
            FROM clients c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.name LIKE ?
            LIMIT 1
          `).bind(`%${participant.name}%`).first()

          if (match) {
            return {
              userId: match.user_id,
              clientId: match.client_id,
              clientName: match.name,
              userEmail: match.email
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error('❌ 客戶匹配失敗:', error)
      return null
    }
  }

  /**
   * 建立會議記錄
   */
  private async createMeetingRecord(
    input: AutoAnalysisInput,
    userId: string,
    clientId: string,
    clientName: string,
    correlationId: string
  ): Promise<{ id: string } | null> {
    try {
      const meetingId = crypto.randomUUID()

      const result = await this.env.DB.prepare(`
        INSERT INTO meetings (
          meeting_id, user_id, client_id, client_name, meeting_title,
          meeting_date, transcript, created_at, analysis_status,
          provider, provider_meeting_id, correlation_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        meetingId,
        userId,
        clientId,
        clientName,
        input.title,
        new Date().toISOString().split('T')[0],
        input.transcript.substring(0, 5000) + '...', // 存儲截斷版本
        new Date().toISOString(),
        'processing',
        input.provider,
        input.meetingId,
        correlationId
      ).run()

      if (!result.success) {
        console.error(`[${correlationId}] ❌ 無法建立會議記錄`, result)
        return null
      }

      return { id: meetingId }
    } catch (error) {
      console.error(`[${correlationId}] ❌ 建立會議記錄異常:`, error)
      return null
    }
  }

  /**
   * 觸發背景分析（非阻斷）
   */
  private triggerBackgroundAnalysis(
    meetingId: string,
    userId: string,
    clientId: string,
    clientName: string,
    transcript: string,
    userEmail: string,
    fileName: string,
    correlationId: string
  ): void {
    // 這個函數應該由調用方透過 context.waitUntil 來執行
    // 這裡只是定義分析流程
    console.log(`[${correlationId}] 📋 已準備背景分析任務 - 等待執行`)
  }

  /**
   * 生成相關 ID（用於追蹤）
   */
  private generateCorrelationId(provider: string, meetingId: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${provider.toUpperCase()}_${timestamp}_${random}`
  }

  /**
   * 執行實際的分析邏輯（由 webhook 端點呼叫）
   */
  async executeAnalysis(
    meetingId: string,
    userId: string,
    clientId: string,
    clientName: string,
    transcript: string,
    userEmail: string,
    fileName: string,
    correlationId: string
  ): Promise<boolean> {
    try {
      console.log(`[${correlationId}] 🔄 開始執行分析...`)

      // 步驟 1：檢測會議類型
      console.log(`[${correlationId}] 📊 檢測會議類型...`)
      const meetingTypeResult = await this.openaiService.detectMeetingType(transcript)
      const isDiscovery = meetingTypeResult.isDiscovery
      console.log(`[${correlationId}] ✅ 會議類型: ${isDiscovery ? 'discovery' : 'consulting'}`)

      // 步驟 2：分析摘要
      console.log(`[${correlationId}] 📝 生成分析摘要...`)
      const type = isDiscovery ? 'discovery' : 'consulting'
      const { ResponseParser } = await import('../utils/responseParser')
      const rawResult = await this.openaiService.summarizeText(transcript, type)
      const parsedData = ResponseParser.parseSummaryWithDeepSeek(rawResult)
      console.log(`[${correlationId}] ✅ 分析摘要完成`)

      // 步驟 3：生成追蹤郵件
      console.log(`[${correlationId}] 📧 生成追蹤郵件...`)
      const followUpEmail = await this.openaiService.generateFollowUpEmail(parsedData.summary, isDiscovery)

      // 步驟 4：生成社交媒體內容
      console.log(`[${correlationId}] 📱 生成社交媒體內容...`)
      const reelsContent = await this.openaiService.generateReelsScripts(transcript)
      const parsedReels = ResponseParser.parseSocialMedia(reelsContent)

      // 步驟 5：更新資料庫
      console.log(`[${correlationId}] 💾 更新資料庫...`)
      await this.env.DB.prepare(`
        UPDATE meetings SET
          summary = ?,
          pain_point = ?,
          goal = ?,
          suggestion = ?,
          action_items_client = ?,
          action_items_coach = ?,
          email_content = ?,
          is_discovery = ?,
          analysis_status = 'completed'
        WHERE meeting_id = ?
      `).bind(
        parsedData.summary?.summary || null,
        parsedData.summary?.painPoint || null,
        parsedData.summary?.goal || null,
        parsedData.summary?.coachSuggestions?.join(', ') || null,
        JSON.stringify(parsedData.summary?.actionItemsClient || []),
        JSON.stringify(parsedData.summary?.actionItemsCoach || []),
        followUpEmail.content || null,
        isDiscovery,
        meetingId
      ).run()

      console.log(`[${correlationId}] ✅ 分析完成`)
      return true

    } catch (error) {
      console.error(`[${correlationId}] ❌ 分析執行失敗:`, error)

      // 更新狀態為失敗
      try {
        await this.env.DB.prepare(
          'UPDATE meetings SET analysis_status = ? WHERE meeting_id = ?'
        ).bind('failed', meetingId).run()
      } catch (dbError) {
        console.error(`[${correlationId}] ❌ 更新失敗狀態異常:`, dbError)
      }

      return false
    }
  }
}
