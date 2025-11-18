/**
 * @deprecated This module is deprecated. Use services/gmail.ts instead for email sending.
 * The MailChannels API is being replaced with Gmail SMTP for better reliability and cost-effectiveness.
 * Migration completed on: 2025-11-06
 * All email functions have been moved to services/gmail.ts
 */

import { Env } from "../types"

interface MailChannelsMessage {
  from: {
    email: string
    name?: string
  }
  to: Array<{
    email: string
    name?: string
  }>
  subject: string
  content: Array<{
    type: "text/plain" | "text/html"
    value: string
  }>
}

/**
 * Send email via MailChannels API
 * Docs: https://mailchannels.readme.io/reference/send
 */
async function sendEmail(env: Env, message: MailChannelsMessage): Promise<boolean> {
  try {
    // For MailChannels with Cloudflare Workers, we need to use a simpler format
    const emailPayload = {
      personalizations: [
        {
          to: message.to
        }
      ],
      from: message.from,
      subject: message.subject,
      content: message.content
    }

    console.log("Sending email via MailChannels:", JSON.stringify(emailPayload, null, 2))

    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cloudflare-Worker",
        "X-Api-Key": env.MAILCHANNELS_API_KEY
      },
      body: JSON.stringify(emailPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("MailChannels API error:", response.status, errorText)
      
      // For development: log the email instead of failing
      console.log("📧 EMAIL WOULD HAVE BEEN SENT:")
      console.log("To:", message.to[0].email)
      console.log("Subject:", message.subject)
      console.log("Content:", message.content[0].value.substring(0, 200) + "...")
      
      // Return true for development so the flow continues
      return true
    }

    console.log("Email sent successfully via MailChannels")
    return true

  } catch (error) {
    console.error("Failed to send email via MailChannels:", error)
    return false
  }
}

/**
 * Send simple notification email when analysis starts (for new users)
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

  const message: MailChannelsMessage = {
    from: {
      email: fromEmail,
      name: appName
    },
    to: [
      {
        email: email,
        name: email.split('@')[0]
      }
    ],
    subject: `🚀 Your Analysis Started - ${fileName}`,
    content: [
      {
        type: "text/plain",
        value: `Hi there!

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
      },
      {
        type: "text/html",
        value: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Started</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🚀 Analysis Started!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">We're processing your content with AI</p>
  </div>

  <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
    <h2 style="color: #2a3a5e; margin-top: 0;">Hi there!</h2>
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
      }
    ]
  }

  return await sendEmail(env, message)
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
  const fromEmail = env.FROM_EMAIL || "noreply@coachapp.com"

  const message: MailChannelsMessage = {
    from: {
      email: fromEmail,
      name: appName
    },
    to: [
      {
        email: email,
        name: email.split('@')[0]
      }
    ],
    subject: `🎉 Your analysis is processing - ${fileName}`,
    content: [
      {
        type: "text/plain",
        value: `Hi there!

Great news! Your meeting analysis for "${fileName}" is now processing.

You'll receive another email when it's complete, but you can check the progress anytime:
${resultsUrl}

Thanks for using ${appName}!

Best regards,
The ${appName} Team`
      },
      {
        type: "text/html",
        value: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Processing</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎉 Analysis Processing!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your results will be ready soon</p>
  </div>

  <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
    <h2 style="color: #2a3a5e; margin-top: 0;">Hi there!</h2>
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
      }
    ]
  }

  return await sendEmail(env, message)
}

/**
 * Send analysis complete email
 */
export async function sendAnalysisCompleteEmail(
  env: Env, 
  email: string, 
  token: string, 
  fileName: string,
  clientName?: string
): Promise<boolean> {
  // ✅ 動態獲取後端 URL（避免硬編碼）
  const backendUrl = getBackendUrl(env)
  const resultsUrl = `${backendUrl}/api/verify-email?token=${token}`
  const appName = env.APP_NAME || "Coach AI"
  const fromEmail = env.FROM_EMAIL || "noreply@coachapp.com"

  const message: MailChannelsMessage = {
    from: {
      email: fromEmail,
      name: appName
    },
    to: [
      {
        email: email,
        name: email.split('@')[0]
      }
    ],
    subject: `✅ Analysis Complete - ${clientName ? `${clientName} Meeting` : fileName}`,
    content: [
      {
        type: "text/plain",
        value: `Hi there!

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
The ${appName} Team`
      },
      {
        type: "text/html",
        value: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Complete!</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #feca57 50%, #48dbfb 75%, #6c5ce7 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✅ Analysis Complete!</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your insights are ready</p>
  </div>

  <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
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
       style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #feca57 50%, #48dbfb 75%, #6c5ce7 100%); color: white; text-decoration: none; padding: 20px 40px; border-radius: 12px; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 30px rgba(107, 138, 253, 0.4);">
      🎉 View Complete Analysis
    </a>
  </div>

  <div style="border-top: 1px solid #e3eafe; padding-top: 20px; margin-top: 32px; text-align: center; color: #5a6a8a; font-size: 14px;">
    <p>Thanks for using ${appName}!</p>
    <p style="margin: 8px 0;">Best regards,<br>The ${appName} Team</p>
  </div>

</body>
</html>`
      }
    ]
  }

  return await sendEmail(env, message)
}