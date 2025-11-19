import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

// Environment interface for Cloudflare Workers
export interface Env {
	AI: Ai;
	DB: D1Database;
	
	// AI Services
	OPENAI_API_KEY: string;
	PERPLEXITY_API_KEY: string;
	SERPER_API_KEY: string;
	
	// Authentication
	JWT_SECRET: string;
	
	// Email Service (Gmail SMTP)
	GMAIL_SMTP_USER: string;
	GMAIL_SMTP_PASSWORD: string;
	FROM_EMAIL: string;
	APP_NAME: string;
	
	// Email Service - Resend API (optional, preferred over MailChannels)
	RESEND_API_KEY?: string;
	
	// Application URLs
	BACKEND_URL: string;
	FRONTEND_URL: string;
	DEV_FRONTEND_URL?: string; // Optional: Development frontend URL (default: http://localhost:5173)
	
	// OAuth - Google
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
	
	// OAuth - Zoom
	ZOOM_CLIENT_ID: string;
	ZOOM_CLIENT_SECRET: string;
	ZOOM_REDIRECT_URI: string;
	
	// Optional: DKIM configuration for MailChannels (deprecated, kept for backward compatibility)
	DKIM_DOMAIN?: string;
	DKIM_SELECTOR?: string;
	DKIM_PRIVATE_KEY?: string;
	MAILCHANNELS_API_KEY?: string; // Deprecated, will be removed after Gmail SMTP migration
}

// OpenAI API types
export const OpenAIRequest = z.object({
	text: Str({ description: "The text content to analyze" }),
	type: z.enum(["sales", "consulting"], { description: "The type of coaching session" }),
	summary: Str({ description: "The summary content for mind map generation", required: false }),
	fileContent: Str({ description: "The file content for email generation", required: false })
});

export const OpenAIResponse = z.object({
	success: z.boolean(),
	data: z.any(),
	error: Str({ required: false })
});

// Structured response types
export const ParsedSummarySchema = z.object({
	clientName: z.string(),
	meetingTitle: z.string(),
	painPoint: z.string(),
	goal: z.string(),
	coachSuggestions: z.array(z.string()),
	summary: z.string(),
	coachingAdvice: z.array(z.string()).optional(),
	salesTechniqueAdvice: z.array(z.string()).optional(),
	actionItemsClient: z.array(z.string()),
	actionItemsCoach: z.array(z.string())
});

export const ParsedMindMapSchema = z.object({
	mermaidCode: z.string()
});

export const ParsedEmailSchema = z.object({
	subject: z.string(),
	body: z.string()
});

export const FollowUpEmailSchema = z.object({
	subject: z.string(),
	body: z.string()
});

export const ParsedSocialMediaSchema = z.object({
	reels: z.array(z.object({
		hook: z.string(),
		narrative: z.string(),
		callToAction: z.string(),
		hashtags: z.array(z.string())
	}))
});

// Coaching session types
export const CoachingSession = z.object({
	id: Str(),
	clientName: Str({ required: false }),
	meetingTitle: Str({ required: false }),
	clientProfession: Str({ required: false }),
	clientCompany: Str({ required: false }),
	targetAudience: Str({ required: false }),
	painPoint: Str({ required: false }),
	goal: Str({ required: false }),
	coachSuggestions: z.array(Str()),
	summary: Str(),
	coachingAdvice: z.array(Str({ required: false })),
	actionItemsClient: z.array(Str()),
	actionItemsCoach: z.array(Str()),
	mindMap: Str({ required: false }),
	followUpEmail: Str({ required: false }),
	socialMediaContent: z.array(Str({ required: false })),
	createdAt: DateTime(),
	type: z.enum(["sales", "consulting"])
});

export type OpenAIRequestType = z.infer<typeof OpenAIRequest>;
export type OpenAIResponseType = z.infer<typeof OpenAIResponse>;
export type CoachingSessionType = z.infer<typeof CoachingSession>;
export type ParsedSummaryType = z.infer<typeof ParsedSummarySchema>;
export type ParsedMindMapType = z.infer<typeof ParsedMindMapSchema>;
export type ParsedEmailType = z.infer<typeof ParsedEmailSchema>;
export type ParsedSocialMediaType = z.infer<typeof ParsedSocialMediaSchema>;
