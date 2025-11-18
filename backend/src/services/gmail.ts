import { Env } from "../types"

interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

/**
 * 錯誤類型定義
 */
type ErrorCategory = 'timeout' | 'api_error' | 'file_format' | 'file_size' | 'database' | 'network' | 'unknown'

interface ErrorClassification {
  category: ErrorCategory
  title: string
  userMessage: string
  technicalDetails: string
  suggestions: string[]
  icon: string
}

/**
 * 根據錯誤信息分類錯誤類型
 */
function classifyError(errorMessage: string): ErrorClassification {
  const lowerMessage = errorMessage.toLowerCase()

  // 1. 超時錯誤
  if (lowerMessage.includes('timeout') || lowerMessage.includes('exceeded') || lowerMessage.includes('time limit')) {
    return {
      category: 'timeout',
      title: 'Analysis Timeout',
      userMessage: 'The analysis took too long and was automatically stopped to prevent system overload.',
      technicalDetails: errorMessage,
      suggestions: [
        'Try uploading a shorter meeting transcript (under 60 minutes recommended)',
        'If using MP4 video, consider uploading a DOCX transcript instead',
        'Split long meetings into multiple shorter sessions',
        'Contact support if this issue persists with short meetings'
      ],
      icon: '⏱️'
    }
  }

  // 2. API 錯誤 (OpenAI, Cloudflare AI, etc.)
  if (lowerMessage.includes('api') || lowerMessage.includes('openai') || lowerMessage.includes('rate limit') || lowerMessage.includes('quota')) {
    return {
      category: 'api_error',
      title: 'AI Service Error',
      userMessage: 'Our AI analysis service encountered an issue while processing your meeting.',
      technicalDetails: errorMessage,
      suggestions: [
        'Wait a few minutes and try uploading again',
        'The issue is usually temporary and resolves automatically',
        'If the problem persists, please contact our support team',
        'We may be experiencing high demand - try again during off-peak hours'
      ],
      icon: '🤖'
    }
  }

  // 3. 文件格式錯誤
  if (lowerMessage.includes('format') || lowerMessage.includes('parse') || lowerMessage.includes('invalid') || lowerMessage.includes('corrupt')) {
    return {
      category: 'file_format',
      title: 'File Format Issue',
      userMessage: 'The uploaded file could not be read or processed correctly.',
      technicalDetails: errorMessage,
      suggestions: [
        'Ensure your file is in DOCX or MP4 format',
        'Try opening and re-saving the file before uploading',
        'Check that the file is not corrupted or password-protected',
        'Convert the file to a supported format using trusted software'
      ],
      icon: '📄'
    }
  }

  // 4. 文件大小錯誤
  if (lowerMessage.includes('size') || lowerMessage.includes('large') || lowerMessage.includes('limit') || lowerMessage.includes('1gb')) {
    return {
      category: 'file_size',
      title: 'File Size Limit Exceeded',
      userMessage: 'The uploaded file exceeds the maximum allowed size of 1GB.',
      technicalDetails: errorMessage,
      suggestions: [
        'Compress your video file using video editing software',
        'Upload only the relevant portion of the meeting',
        'Use a DOCX transcript instead of video for better efficiency',
        'Split large meetings into multiple smaller files'
      ],
      icon: '📦'
    }
  }

  // 5. 數據庫錯誤
  if (lowerMessage.includes('database') || lowerMessage.includes('d1') || lowerMessage.includes('sql') || lowerMessage.includes('query')) {
    return {
      category: 'database',
      title: 'Data Storage Error',
      userMessage: 'We encountered an issue while saving your analysis results.',
      technicalDetails: errorMessage,
      suggestions: [
        'Your analysis may have completed but results were not saved',
        'Try uploading the file again',
        'Contact support if you continue to see this error',
        'This is a temporary system issue that we will investigate'
      ],
      icon: '💾'
    }
  }

  // 6. 網絡錯誤
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return {
      category: 'network',
      title: 'Network Connection Error',
      userMessage: 'A network issue interrupted the analysis process.',
      technicalDetails: errorMessage,
      suggestions: [
        'Check your internet connection and try again',
        'If using VPN, try disabling it temporarily',
        'The issue may be temporary - retry in a few minutes',
        'Contact support if the problem persists'
      ],
      icon: '🌐'
    }
  }

  // 7. 未知錯誤（默認）
  return {
    category: 'unknown',
    title: 'Unexpected Error',
    userMessage: 'An unexpected error occurred during analysis.',
    technicalDetails: errorMessage,
    suggestions: [
      'Try uploading your file again',
      'Ensure the file format is correct (DOCX or MP4)',
      'Check that the file is not corrupted',
      'Contact our support team if the problem persists'
    ],
    icon: '⚠️'
  }
}

/**
 * Send email via HTTP-based Email API services
 * 
 * ⚠️ IMPORTANT: Cloudflare Workers CANNOT use Gmail SMTP directly
 * 
 * Technical Limitation:
 * - Cloudflare Workers does NOT support TCP Socket connections
 * - Gmail SMTP requires TCP connections (ports 465/587)
 * - Workers only support HTTP/HTTPS fetch API
 * 
 * Workaround Methods:
 * 1. Resend API (Primary) - HTTP API, supports test domain for development
 * 2. MailChannels API (Fallback) - Free, native Cloudflare support, requires DNS configuration
 * 
 * Gmail credentials (GMAIL_SMTP_USER, GMAIL_SMTP_PASSWORD) are kept
 * for potential future use with other services or if Cloudflare adds TCP support.
 * 
 * See: backend/GMAIL_SMTP_LIMITATION_ANALYSIS.md for detailed analysis
 */
export async function sendEmail(env: Env, message: EmailMessage): Promise<boolean> {
  try {
    const toAddresses = Array.isArray(message.to) ? message.to : [message.to]
    const fromEmail = message.from || env.FROM_EMAIL || "noreply@coachrocks.com"
    const appName = env.APP_NAME || "Coach AI"
    const smtpUser = env.GMAIL_SMTP_USER || fromEmail
    const smtpPassword = env.GMAIL_SMTP_PASSWORD

    // ✅ 使用 Gmail SMTP via SMTP.js (WebSocket/HTTP approach)
    // For Cloudflare Workers, we'll use a SMTP gateway service
    // Alternative: Use Resend, SendGrid, or similar service with SMTP support
    
    // Build email message in RFC 2822 format
    const textContent = message.text || stripHtml(message.html || "")
    const htmlContent = message.html || ""
    
    // Create email headers
    const emailHeaders = [
      `From: ${appName} <${fromEmail}>`,
      `To: ${toAddresses.join(', ')}`,
      `Subject: ${message.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="boundary123"`
    ].join('\r\n')

    // Create email body with both text and HTML
    const emailBody = [
      emailHeaders,
      '',
      '--boundary123',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      textContent,
      '',
      htmlContent ? [
        '--boundary123',
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlContent
      ].join('\r\n') : '',
      '--boundary123--'
    ].filter(Boolean).join('\r\n')

    console.log("📧 Sending email via Gmail SMTP:", {
      to: toAddresses[0],
      subject: message.subject,
      from: fromEmail
    })

    // ✅ 使用 Resend 作為主要 Email 發送服務
    // Resend 優勢：
    // - HTTP API：完全兼容 Cloudflare Workers
    // - 測試域名：開發環境可使用 onboarding@resend.dev（無需域名驗證）
    // - 生產環境：支援自訂域名（需要 DNS 配置）
    // - 良好的文檔和支援
    //
    // 配置要求：
    // 1. API Key：已配置 RESEND_API_KEY
    // 2. 開發環境：自動使用 onboarding@resend.dev（如果域名未驗證）
    // 3. 生產環境：需要驗證域名並配置 DNS 記錄（可選）
    //
    // 如果 Resend 失敗，可以 fallback 到 MailChannels（如果配置了 DNS）
    // 但 Resend 是主要服務
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMAIL SENDING FLOW: Resend (PRIMARY) → MailChannels (FALLBACK)
    // ═══════════════════════════════════════════════════════════════════════════

    let sendingAttemptDetails = {
      to: toAddresses[0],
      subject: message.subject,
      primaryService: "Resend",
      fallbackService: "MailChannels",
      timestamp: new Date().toISOString()
    }

    // STEP 1: 優先使用 Resend（如果配置了 API Key）
    if (env.RESEND_API_KEY) {
      try {
        // 判斷是否為生產環境
        const isProduction = env.FRONTEND_URL?.startsWith('https://') || false

        // 開發環境：如果使用 coachrocks.com 域名但未驗證，使用測試域名
        let resendFromEmail = fromEmail
        let resendEnvironment = "production"

        if (!isProduction && fromEmail.includes('@coachrocks.com')) {
          console.log("ℹ️ Development mode: Using Resend test domain (onboarding@resend.dev)")
          resendFromEmail = "onboarding@resend.dev"
          resendEnvironment = "development"
        }

        console.log(`🚀 [RESEND] Sending email via Resend API (${resendEnvironment})...`)
        console.log(`   To: ${toAddresses[0]} | Subject: ${message.subject}`)

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: `${appName} <${resendFromEmail}>`,
            to: toAddresses,
            subject: message.subject,
            text: textContent,
            html: htmlContent
          })
        })

        if (resendResponse.ok) {
          const resendData = await resendResponse.json()
          console.log(`✅ [RESEND] Email sent successfully!`)
          console.log(`   Email ID: ${resendData.id}`)
          console.log(`   Status: completed`)
          return true
        } else {
          const errorData = await resendResponse.json().catch(() => ({}))
          console.warn(`⚠️ [RESEND] API error (status ${resendResponse.status}):`, errorData.message || errorData.name || "Unknown error")
          console.log(`🔄 [FALLBACK] Switching to MailChannels as fallback...`)
        }
      } catch (resendError) {
        const err = resendError as Error
        console.warn(`⚠️ [RESEND] Connection error: ${err.message}`)
        console.log(`🔄 [FALLBACK] Switching to MailChannels as fallback...`)
      }
    } else {
      console.log(`⚠️ [RESEND] API Key not configured, skipping primary service`)
      console.log(`🔄 [FALLBACK] Using MailChannels as primary service...`)
    }

    // STEP 2: Fallback 到 MailChannels API（如果 Resend 失敗或未配置）
    console.log(`📧 [MAILCHANNELS] Attempting email delivery via MailChannels API...`)
    console.log(`   To: ${toAddresses[0]} | Subject: ${message.subject}`)

    const emailPayload = {
      personalizations: [
        {
          to: toAddresses.map(email => ({ email }))
        }
      ],
      from: {
        email: fromEmail,
        name: appName
      },
      subject: message.subject,
      content: [
        {
          type: "text/plain",
          value: textContent
        },
        ...(htmlContent ? [{
          type: "text/html",
          value: htmlContent
        }] : [])
      ]
    }

    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cloudflare-Worker"
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [MAILCHANNELS] API error (status ${response.status}):`)
      console.error(`   ${errorText || "Unknown error"}`)
      console.log(`⚠️ Email sending failed, but continuing with main analysis flow`)
      console.log(`📋 Setup Instructions:`)
      console.log(`   1. Resend: Create API key at https://resend.com/api-keys`)
      console.log(`   2. Resend: Add domain and configure DNS (MX, SPF, DKIM, DMARC)`)
      console.log(`   3. MailChannels: Configure DNS Domain Lockdown (_mailchannels TXT record)`)
      console.log(`   4. MailChannels: Configure SPF (v=spf1 include:relay.mailchannels.net ~all)`)
      return false
    }

    console.log(`✅ [MAILCHANNELS] Email sent successfully via fallback service!`)
    console.log(`   Status: completed`)
    return true

  } catch (error) {
    console.error("❌ Failed to send email:", error)
    // Don't throw - graceful degradation
    return false
  }
}

/**
 * Strip HTML tags from HTML content to create plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * Send analysis started email (for new users)
 */
/**
 * 獲取後端 URL（避免硬編碼）
 * 生產環境必須設定 BACKEND_URL，否則拋出錯誤
 */
function getBackendUrl(env: Env): string {
  if (env.BACKEND_URL) {
    return env.BACKEND_URL
  }
  
  // ❌ BACKEND_URL 必須設定，不提供 fallback
  console.error('❌ BACKEND_URL not configured')
  throw new Error('BACKEND_URL not configured. Please set BACKEND_URL environment variable.')
}

export async function sendAnalysisStartedEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string
): Promise<boolean> {
  // ✅ 動態獲取後端 URL（避免硬編碼）
  const backendUrl = getBackendUrl(env)
  const resultsUrl = `${backendUrl}/api/verify-email?token=${token}`
  const appName = env.APP_NAME || "Coach AI"
  const fromEmail = env.FROM_EMAIL || "noreply@coachrocks.com"

  console.log("Preparing analysis started email for:", email)

  const textContent = `Hi there!

Your meeting analysis for "${fileName}" is now processing!

We're analyzing your content with AI to extract:
• Client insights and pain points
• Action items and coaching suggestions
• Follow-up email templates
• Social media content ideas

You'll receive your complete results via email once the analysis is finished (usually within a few minutes).

Thanks for using ${appName}!

Best regards,
The ${appName} Team`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Started</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🚀 Analysis Started!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">We're processing your content with AI</p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2a3a5e; margin-top: 0;">Hi ${email.split('@')[0]}!</h2>
    <p>Your meeting analysis for <strong>"${fileName}"</strong> is now processing!</p>
  </div>

  <div style="background: #e3eafe; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
    <h3 style="color: #2a3a5e; margin-top: 0; font-size: 18px;">🤖 We're analyzing your content to extract:</h3>
    <ul style="margin: 12px 0; padding-left: 20px; color: #5a6a8a;">
      <li>Client insights and pain points</li>
      <li>Action items and coaching suggestions</li>
      <li>Follow-up email templates</li>
      <li>Social media content ideas</li>
    </ul>
  </div>

  <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
    <p style="margin: 0; color: #059669;">
      <strong>📧 Next Steps:</strong> You'll receive your complete results via email once the analysis is finished (usually within a few minutes).
    </p>
  </div>

  <div style="border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;">
    <p>Thanks for using ${appName}!</p>
    <p style="margin: 8px 0;">Best regards,<br>The ${appName} Team</p>
  </div>

</body>
</html>`

  return await sendEmail(env, {
    to: email,
    subject: `🚀 Your Analysis Started - ${fileName}`,
    html: htmlContent,
    text: textContent,
    from: fromEmail
  })
}

/**
 * Send notification email to verified users
 */
export async function sendNotificationEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string
): Promise<boolean> {
  // ✅ 動態獲取後端 URL（避免硬編碼）
  const backendUrl = getBackendUrl(env)
  const resultsUrl = `${backendUrl}/api/verify-email?token=${token}`
  const appName = env.APP_NAME || "Coach AI"
  const fromEmail = env.FROM_EMAIL || "noreply@coachrocks.com"

  const textContent = `Hi there!

Great news! Your meeting analysis for "${fileName}" is now processing.

You'll receive another email when it's complete, but you can check the progress anytime:
${resultsUrl}

Thanks for using ${appName}!

Best regards,
The ${appName} Team`

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Processing</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎉 Analysis Processing!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your results will be ready soon</p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2a3a5e; margin-top: 0;">Hi ${email.split('@')[0]}!</h2>
    <p>Great news! Your meeting analysis for <strong>"${fileName}"</strong> is now processing.</p>
    <p>You'll receive another email when it's complete, but you can check the progress anytime:</p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${resultsUrl}"
       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);">
      📊 Check Progress
    </a>
  </div>

  <div style="background: #e3eafe; padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
    <p style="margin: 0; color: #5a6a8a;">
      <strong>📧 Heads up:</strong> You'll get another email when your analysis is complete with all insights, action items, and follow-up content!
    </p>
  </div>

  <div style="border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;">
    <p>Thanks for using ${appName}!</p>
    <p style="margin: 8px 0;">Best regards,<br>The ${appName} Team</p>
  </div>

</body>
</html>`

  return await sendEmail(env, {
    to: email,
    subject: `🎉 Your analysis is processing - ${fileName}`,
    html: htmlContent,
    text: textContent,
    from: fromEmail
  })
}

/**
 * Send analysis complete email (supports both success and failure)
 * @param status - 'completed' (success) or 'failed' (failure)
 * @param errorMessage - Error message to include if status is 'failed'
 */
export async function sendAnalysisCompleteEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string,
  clientName?: string,
  status: 'completed' | 'failed' = 'completed',
  errorMessage?: string
): Promise<boolean> {
  // ✅ 動態獲取後端 URL（避免硬編碼）
  const backendUrl = getBackendUrl(env)
  const resultsUrl = `${backendUrl}/api/verify-email?token=${token}`
  const appName = env.APP_NAME || "Coach AI"
  const fromEmail = env.FROM_EMAIL || "noreply@coachrocks.com"

  // 根據狀態生成不同的郵件內容
  const isSuccess = status === 'completed'

  // ✅ 如果失敗，使用錯誤分類器生成針對性建議
  const errorClassification = !isSuccess && errorMessage
    ? classifyError(errorMessage)
    : null

  const textContent = isSuccess ? `Hi there!

Exciting news! Your meeting analysis is now complete.

${clientName ? `Meeting with: ${clientName}` : `File: ${fileName}`}

Your AI-powered insights include:
• Client insights and pain points
• Action items for you and your client
• Coaching advice and suggestions
• Follow-up email templates
• Social media content ideas

View your complete analysis:
${resultsUrl}

Thanks for using ${appName}!

Best regards,
The ${appName} Team` : `Hi there!

We're sorry, but your meeting analysis failed to complete.

${clientName ? `Meeting with: ${clientName}` : `File: ${fileName}`}

${errorClassification ? `${errorClassification.icon} ${errorClassification.title}
${errorClassification.userMessage}

Technical Details:
${errorClassification.technicalDetails}

What you can do:
${errorClassification.suggestions.map(s => `• ${s}`).join('\n')}` : `Error details:
${errorMessage || 'An unexpected error occurred during analysis.'}

What you can do:
• Try uploading your file again
• Ensure the file format is correct (DOCX or MP4)
• Contact support if the problem persists`}

We apologize for the inconvenience.

Best regards,
The ${appName} Team`

  const htmlContent = isSuccess ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Complete!</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #feca57 50%, #48dbfb 75%, #6c5ce7 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✅ Analysis Complete!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your insights are ready</p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2a3a5e; margin-top: 0;">Exciting news!</h2>
    <p>Your meeting analysis is now <strong>complete</strong>.</p>
    <p><strong>${clientName ? `Meeting with: ${clientName}` : `File: ${fileName}`}</strong></p>
  </div>

  <div style="background: #e3eafe; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
    <h3 style="color: #2a3a5e; margin-top: 0; font-size: 18px;">🚀 Your AI-powered insights include:</h3>
    <ul style="margin: 12px 0; padding-left: 20px; color: #5a6a8a;">
      <li>Client insights and pain points</li>
      <li>Action items for you and your client</li>
      <li>Coaching advice and suggestions</li>
      <li>Follow-up email templates</li>
      <li>Social media content ideas</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${resultsUrl}"
       style="display: inline-block; background-color: #6366f1; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 12px; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4); cursor: pointer;">
      🎉 View Complete Analysis
    </a>
  </div>

  <div style="border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;">
    <p>Thanks for using ${appName}!</p>
    <p style="margin: 8px 0;">Best regards,<br>The ${appName} Team</p>
  </div>

</body>
</html>` : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Failed</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">${errorClassification?.icon || '❌'} ${errorClassification?.title || 'Analysis Failed'}</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">${errorClassification?.userMessage || 'We encountered an error'}</p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2a3a5e; margin-top: 0;">We're sorry</h2>
    <p>Your meeting analysis failed to complete.</p>
    <p><strong>${clientName ? `Meeting with: ${clientName}` : `File: ${fileName}`}</strong></p>
  </div>

  <div style="background: #fee2e2; padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
    <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">⚠️ Technical Details:</h3>
    <p style="color: #7f1d1d; margin: 0; font-family: monospace; font-size: 14px; background: white; padding: 12px; border-radius: 6px; word-break: break-word;">
      ${errorClassification?.technicalDetails || errorMessage || 'An unexpected error occurred during analysis.'}
    </p>
  </div>

  <div style="background: #e3eafe; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
    <h3 style="color: #2a3a5e; margin-top: 0; font-size: 18px;">📋 What you can do:</h3>
    <ul style="margin: 12px 0; padding-left: 20px; color: #5a6a8a;">
      ${errorClassification ? errorClassification.suggestions.map(s => `<li>${s}</li>`).join('') : `
      <li>Try uploading your file again</li>
      <li>Ensure the file format is correct (DOCX or MP4)</li>
      <li>Check that the file is not corrupted</li>
      <li>Contact our support team if the problem persists</li>
      `}
    </ul>
  </div>

  <div style="border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;">
    <p>We apologize for the inconvenience.</p>
    <p style="margin: 8px 0;">Best regards,<br>The ${appName} Team</p>
  </div>

</body>
</html>`

  // ✅ 郵件主題包含錯誤類型圖標和標題
  const emailSubject = isSuccess
    ? `✅ Analysis Complete - ${clientName ? `${clientName} Meeting` : fileName}`
    : errorClassification
      ? `${errorClassification.icon} ${errorClassification.title} - ${clientName ? `${clientName} Meeting` : fileName}`
      : `❌ Analysis Failed - ${clientName ? `${clientName} Meeting` : fileName}`

  return await sendEmail(env, {
    to: email,
    subject: emailSubject,
    html: htmlContent,
    text: textContent,
    from: fromEmail
  })
}
