/**
 * Zoom Webhook Endpoint
 * 接收 Zoom 會議完成事件並觸發自動分析
 */

import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { z } from 'zod'
import { Env } from '../types'
import { AutoAnalysisService } from '../services/autoAnalysisService'

// Zod schema for Zoom webhook payload
const ZoomWebhookRequest = z.object({
  event: z.string(),
  payload: z.object({
    object: z.object({
      id: z.union([z.string(), z.number()]),
      topic: z.string(),
      duration: z.number(),
      participants: z.array(z.object({
        user_name: z.string().optional(),
        email: z.string().optional()
      })).optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional()
    }).passthrough(),
    account_id: z.string().optional()
  }).passthrough()
}).passthrough()

export class ZoomWebhook extends OpenAPIRoute {
  schema = {
    tags: ['Integrations'],
    summary: 'Zoom webhook receiver',
    description: 'Receives meeting completion events from Zoom and triggers auto-analysis',
    request: {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['event'],
              properties: {
                event: { type: 'string' },
                payload: { type: 'object' }
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
      const parsed = ZoomWebhookRequest.safeParse(rawBody)
      if (!parsed.success) {
        console.warn('⚠️  Schema validation failed:', parsed.error)
        return c.json({ success: false, message: 'Invalid webhook payload', correlationId: '' }, 400)
      }
      const webhookData = parsed.data

      console.log('🔔 Zoom webhook received - Event:', webhookData.event)

      // 驗證 webhook 簽名（使用 Zoom 的 verification token）
      // 測試期間：若缺少則僅警告，不阻擋流程
      const verificationToken = c.req.header('x-zm-request-timestamp')
      if (!verificationToken) {
        console.warn('⚠️  缺少 Zoom verification token（測試模式放行）')
      }

      // 目前跳過驗證，實際應該檢查簽名
      // TODO: 實作 Zoom webhook 簽名驗證

      const payload = webhookData.payload

      // 只處理特定的 webhook 事件
      if (webhookData.event !== 'meeting.completed') {
        console.log(`⏭️  跳過事件: ${webhookData.event}`)
        return c.json({
          success: true,
          message: 'Event skipped',
          correlationId: ''
        })
      }

      // 提取會議資訊
      const meetingEvent = payload.object
      if (!meetingEvent) {
        return c.json({
          success: false,
          message: 'Invalid meeting event'
        }, 400)
      }

      console.log('📋 會議信息:', {
        meetingId: meetingEvent.id,
        topic: meetingEvent.topic,
        duration: meetingEvent.duration,
        participants: meetingEvent.participants?.length || 0
      })

      // 提取轉錄資料
      // 注意: Zoom webhook 不直接提供轉錄，需要透過 API 取得
      // 這裡假設已經從 Zoom 的轉錄 webhook 取得
      let recordingData = await this.fetchZoomRecording(
        meetingEvent.id,
        c.env
      )

      // 測試控制：?noTranscript=1 模擬無轉錄
      if (c.req.query('noTranscript') === '1') {
        recordingData = null
      }

      if (!recordingData?.transcript) {
        console.warn('⚠️  無法取得會議轉錄，跳過分析')
        return c.json({
          success: true,
          message: 'No transcript available',
          correlationId: ''
        })
      }

      // 準備自動分析輸入
      const analysisInput = {
        provider: 'zoom' as const,
        meetingId: meetingEvent.id.toString(),
        title: meetingEvent.topic,
        transcript: recordingData.transcript,
        duration: meetingEvent.duration, // 分鐘
        participants: (meetingEvent.participants || []).map((p: any) => ({
          name: p.user_name || 'Unknown',
          email: p.email
        })),
        recordingUrl: recordingData.recordingUrl,
        metadata: {
          zoomMeetingId: meetingEvent.id,
          startTime: meetingEvent.start_time,
          endTime: meetingEvent.end_time,
          accountId: payload.account_id
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
      console.error('❌ Zoom webhook 處理失敗:', error)

      return c.json({
        success: false,
        message: 'Failed to process webhook',
        correlationId: ''
      }, 500)
    }
  }

  /**
   * 從 Zoom 取得錄製檔案和轉錄
   * 測試環境：返回 mock transcript
   */
  private async fetchZoomRecording(
    meetingId: string,
    env: Env
  ): Promise<{ transcript: string; recordingUrl?: string } | null> {
    try {
      // 這是一個佔位函數，實際應該呼叫 Zoom API
      // 需要：
      // 1. Zoom OAuth token
      // 2. Zoom API 端點
      // 3. 轉錄服務（Zoom 的語音轉錄或第三方）

      console.log(`📥 嘗試從 Zoom 取得會議 ${meetingId} 的轉錄...`)

      // TODO: 實作與 Zoom API 的集成
      // const response = await fetch(`https://zoom.us/v2/meetings/${meetingId}/recordings`, {
      //   headers: {
      //     Authorization: `Bearer ${env.ZOOM_API_TOKEN}`
      //   }
      // })

      // 測試環境：返回 mock transcript
      // 在實際環境中，這裡應該返回 null 或實際的轉錄資料
      const mockTranscript = `This is a mock transcript for Zoom meeting ${meetingId}. 
      The meeting discussed various topics including project updates, team collaboration, and future planning.
      Participants engaged in meaningful discussions and shared valuable insights.`
      
      return {
        transcript: mockTranscript,
        recordingUrl: `https://zoom.us/recording/${meetingId}`
      }
    } catch (error) {
      console.error('❌ 取得 Zoom 轉錄失敗:', error)
      return null
    }
  }
}
