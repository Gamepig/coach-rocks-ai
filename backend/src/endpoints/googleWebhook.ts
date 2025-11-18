/**
 * Google Meet/Calendar Webhook Endpoint
 * 接收 Google Meet 會議完成事件並觸發自動分析
 */

import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { z } from 'zod'
import { Env } from '../types'
import { AutoAnalysisService } from '../services/autoAnalysisService'

// Zod schema for Google webhook payload
const GoogleWebhookRequest = z.object({
  kind: z.string(),
  id: z.string().optional(),
  object: z.object({
    id: z.string(),
    summary: z.string().optional(),
    start: z.object({
      dateTime: z.string()
    }).optional(),
    end: z.object({
      dateTime: z.string()
    }).optional(),
    attendees: z.array(z.object({
      displayName: z.string().optional(),
      email: z.string().optional()
    })).optional(),
    status: z.string().optional(),
    conferenceData: z.object({
      conferenceSolution: z.object({
        key: z.object({
          type: z.string()
        })
      }).optional(),
      entryPoints: z.array(z.object({
        entryPointType: z.string(),
        uri: z.string().optional()
      })).optional()
    }).optional(),
    organizer: z.object({
      email: z.string().optional()
    }).optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    eventType: z.string().optional()
  }).passthrough().optional()
}).passthrough()

export class GoogleWebhook extends OpenAPIRoute {
  schema = {
    tags: ['Integrations'],
    summary: 'Google Meet/Calendar webhook receiver',
    description: 'Receives meeting completion events from Google and triggers auto-analysis',
    request: {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['kind'],
              properties: {
                kind: { type: 'string' },
                id: { type: 'string' },
                object: { type: 'object' }
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Webhook received successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                correlationId: { type: 'string' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Invalid webhook payload'
      },
      '403': {
        description: 'Webhook verification failed'
      },
      '500': {
        description: 'Server error'
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      // Manual parsing + Zod validation to avoid body-read conflicts
      const rawBody = await c.req.raw.clone().json()
      const parsed = GoogleWebhookRequest.safeParse(rawBody)
      if (!parsed.success) {
        console.warn('⚠️  Schema validation failed:', parsed.error)
        return c.json({ success: false, message: 'Invalid webhook payload', correlationId: '' }, 400)
      }
      const webhookData = parsed.data

      console.log('🔔 Google webhook received - Kind:', webhookData.kind)

      // 驗證 webhook（Google 使用 HTTP POST 驗證）
      // Google 會傳送一個驗證請求，需要返回特定的響應
      const authHeader = c.req.header('authorization')
      if (!authHeader) {
        console.warn('⚠️  缺少 Google authorization header（測試模式放行）')
      }

      // 驗證 webhook token（需要在環境變數中配置）
      // TODO: 實作 Google webhook 驗證

      const object = webhookData.object || {}

      // 只處理 meeting.updated 事件（會議完成）
      if (webhookData.kind !== 'calendar#event' || !object.eventType) {
        console.log(`⏭️  跳過事件: ${webhookData.kind}`)
        return c.json({
          success: true,
          message: 'Event skipped',
          correlationId: ''
        })
      }

      // 檢查會議是否已完成
      if (object.status !== 'confirmed' || !object.conferenceData?.conferenceSolution?.key?.type) {
        console.log('⏭️  會議未完成或不是視訊會議，跳過')
        return c.json({
          success: true,
          message: 'Not a completed video conference',
          correlationId: ''
        })
      }

      console.log('📋 Google Meet 會議信息:', {
        eventId: object.id,
        summary: object.summary,
        startTime: object.start?.dateTime,
        endTime: object.end?.dateTime,
        attendees: object.attendees?.length || 0
      })

      // 計算會議時長（分鐘）
      let duration = 0
      if (object.start?.dateTime && object.end?.dateTime) {
        const start = new Date(object.start.dateTime)
        const end = new Date(object.end.dateTime)
        duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      }

      // 提取轉錄資料
      let transcriptData = await this.fetchGoogleMeetTranscript(
        object.id,
        c.env
      )
      if (c.req.query('noTranscript') === '1') {
        transcriptData = null
      }

      if (!transcriptData?.transcript) {
        console.warn('⚠️  無法取得 Google Meet 轉錄，跳過分析')
        return c.json({
          success: true,
          message: 'No transcript available',
          correlationId: ''
        })
      }

      // 準備自動分析輸入
      const analysisInput = {
        provider: 'google' as const,
        meetingId: object.id,
        title: object.summary || 'Google Meet',
        transcript: transcriptData.transcript,
        duration,
        participants: (object.attendees || []).map((a: any) => ({
          name: a.displayName || 'Unknown',
          email: a.email
        })),
        recordingUrl: object.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri,
        metadata: {
          googleEventId: object.id,
          calendarId: c.req.query('calendarId') || 'primary',
          organizer: object.organizer?.email,
          createdTime: object.created,
          updatedTime: object.updated
        }
      }

      // 觸發自動分析
      const analysisService = new AutoAnalysisService(c.env)
      const result = await analysisService.triggerAnalysis(analysisInput)

      if (!result.success) {
        console.warn('⚠️  自動分析觸發失敗:', result.error)
        return c.json({
          success: false,
          message: result.message,
          correlationId: result.correlationId
        }, result.error?.code === 'FILTERED_OUT' ? 200 : 400)
      }

      console.log(`✅ 分析已觸發 [${result.correlationId}]`)

      return c.json({
        success: true,
        message: 'Analysis triggered successfully',
        correlationId: result.correlationId
      })

    } catch (error) {
      console.error('❌ Google webhook 處理失敗:', error)

      return c.json({
        success: false,
        message: 'Failed to process webhook',
        correlationId: ''
      }, 500)
    }
  }

  /**
   * 從 Google Meet 取得轉錄
   * 測試環境：返回 mock transcript
   */
  private async fetchGoogleMeetTranscript(
    eventId: string,
    env: Env
  ): Promise<{ transcript: string; recordingUrl?: string } | null> {
    try {
      // 這是一個佔位函數，實際應該呼叫 Google API
      // Google Meet 的轉錄可以透過：
      // 1. Google Drive API（如果錄製到 Drive）
      // 2. Google Meet Recording API
      // 3. 第三方轉錄服務（如 Rev、Otter.ai）

      console.log(`📥 嘗試從 Google Meet 取得會議 ${eventId} 的轉錄...`)

      // TODO: 實作與 Google API 的集成
      // const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=originalName='${eventId}'`, {
      //   headers: {
      //     Authorization: `Bearer ${env.GOOGLE_API_TOKEN}`
      //   }
      // })

      // 測試環境：返回 mock transcript
      // 在實際環境中，這裡應該返回 null 或實際的轉錄資料
      const mockTranscript = `This is a mock transcript for Google Meet event ${eventId}.
      The meeting covered important topics such as project milestones, team coordination, and strategic planning.
      All participants contributed valuable perspectives and actionable insights.`
      
      return {
        transcript: mockTranscript,
        recordingUrl: `https://meet.google.com/recording/${eventId}`
      }
    } catch (error) {
      console.error('❌ 取得 Google 轉錄失敗:', error)
      return null
    }
  }
}
