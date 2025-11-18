# Backend Development Guide

This file provides guidance for backend development in this repository.

## Development Commands

### Backend (coach-backend)
- **Development server**: `npm run dev` or `npm run start` - Starts Wrangler dev server (⚠️ 禁止使用 localhost:8787，詳見 `PROJECT_RULES.md`)
- **Deploy**: `npm run deploy` - Deploys to Cloudflare Workers
- **Type generation**: `npm run cf-typegen` - Generates Cloudflare Worker types

### Frontend (coachAI)
- **Development server**: `npm run dev` - Starts Vite dev server on localhost:5173
- **Build**: `npm run build` - Creates production build
- **Lint**: `npm run lint` - Runs ESLint
- **Preview**: `npm run preview` - Preview production build

## Architecture Overview

This is a full-stack coaching analysis application with two main components:

### Backend (Cloudflare Workers + D1)
- **Framework**: Hono web framework with Chanfana OpenAPI integration
- **Runtime**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite-based)
- **AI Services**: OpenAI GPT, DeepSeek R1, Perplexity API
- **Entry point**: `src/index.ts` - defines all API routes
- **Key services**:
  - `src/services/openai.ts` - OpenAI API integration
  - `src/services/deepseek.ts` - DeepSeek API integration  
  - `src/services/perplexity.ts` - Perplexity API integration
  - `src/services/database.ts` - D1 database operations
- **API Documentation**: Available at the dev server URL when running (⚠️ 禁止使用 localhost:8787)

### Frontend (React + Vite)
- **Framework**: React 19 with Vite bundler
- **API Communication**: Custom API service in `src/services/api.js`
- **Key Features**: File upload, AI analysis dashboard, data tables, tag management
- **Main Components**:
  - `src/App.jsx` - Main application logic and state management
  - `src/components/MainDashboard/` - Analysis results dashboard
  - `src/components/Tables/` - Data tables for meetings, clients, reels
  - `src/components/TagManager/` - Tag management system

## Core Functionality

### AI-Powered Analysis Pipeline
1. **File Upload**: Supports DOCX transcripts and MP4 video recordings
2. **Transcript Processing**: MP4 files converted to audio then transcribed via OpenAI Whisper
3. **Structured Analysis**: Text analyzed to extract:
   - Client information (name, company, profession)
   - Pain points and goals
   - Coach suggestions and action items
   - Follow-up email templates
   - Reels scripts for social media
4. **Additional Content Generation**:
   - Mind maps (Mermaid diagrams)
   - Resources lists (via DeepSeek/Perplexity)
   - Next meeting preparation notes

### Email Notification System (Updated 2025-11-18)

**Email Service**: Resend API (Primary) + MailChannels (Fallback)
- **Architecture**: HTTP-based email service (compatible with Cloudflare Workers)
- **Custom Domain**: noreply@coachrocks.com (DNS verified ✅)
- **Free Tier**: 3,000 emails/month with Resend
- **Deliverability**: 99.9% enterprise-grade

**Email Flow**:
1. **Analysis Started** - Sent immediately when user uploads meeting
   - Subject: 🚀 Your Analysis Started - {fileName}
   - Content: Analysis items list, completion promise
2. **Analysis Complete** - Sent when results are ready (3-5 minutes)
   - Success: AI insights summary + VIEW COMPLETE ANALYSIS button
   - Failure: Error notification with troubleshooting steps

**Key Features**:
- ✅ Two-stage notification (start + complete)
- ✅ Mobile-responsive HTML templates
- ✅ Accessible CTA buttons (WCAG compliant)
- ✅ Cross-client tested (Gmail, Outlook, Apple Mail)
- ✅ Smart error classification (AI-powered)

**Key Files**:
- `src/services/gmail.ts` - Email sending service with dual-layer architecture
- `src/endpoints/startAnalysisWithEmail.ts` - Triggers start notification (line 178-180)
- `src/endpoints/analyzeAuthenticatedMeeting.ts` - Triggers completion notification

**Configuration**:
- Required: `RESEND_API_KEY`, `FROM_EMAIL`
- Optional: `APP_NAME`, `BACKEND_URL`, `FRONTEND_URL`
- Setup Guide: See `EMAIL_SETUP.md`

**Latest Updates**:
- 2025-11-18: Added analysis started email notification
- 2025-11-18: Fixed CTA button color for email client compatibility

### Database Schema
Key tables in D1 database:
- `users` - User accounts and subscription plans
- `clients` - Client information with tag relationships
- `meetings` - Meeting records with full analysis data
- `tags` - User-defined client tags
- `client_tags` - Many-to-many client-tag relationships
- `reels_ideas` - Generated social media content

### API Architecture Patterns
- **Structured Responses**: All endpoints return typed JSON (no raw text parsing)
- **Error Handling**: Consistent error response format across all endpoints
- **Type Safety**: Zod schemas define request/response types in `src/types.ts`
- **CORS Configuration**: Configured for localhost:5173 frontend development

## Environment Configuration

### Required Secrets (Backend)
Set via `wrangler secret put <SECRET_NAME>`:
- `OPENAI_API_KEY` - OpenAI API access
- `RESEND_API_KEY` - Resend email service API key (NEW 2025-11-18)
- `FROM_EMAIL` - Email sender address (e.g., noreply@coachrocks.com)
- `PERPLEXITY_API_KEY` - Perplexity API access
- `JWT_SECRET` - JSON Web Token signing secret

### Database Setup
- D1 database binding configured in `wrangler.jsonc`
- Migrations in `migrations/` directory
- Run migrations via `wrangler d1 migrations apply <database_name>`

## Code Patterns and Conventions

### Backend Endpoint Structure
Each endpoint follows this pattern:
```typescript
export class EndpointName extends OpenAPIRoute {
  schema = {
    request: { body: RequestSchema },
    responses: { "200": { content: { "application/json": { schema: ResponseSchema } } } }
  }
  
  async handle(request: Request, env: Env, context: ExecutionContext, data: RequestType) {
    // Implementation using services
  }
}
```

### Frontend API Integration
- All backend calls go through `apiService` in `src/services/api.js`
- No direct OpenAI API calls from frontend (security)
- Consistent error handling and loading states

### State Management Pattern
- React state for UI and temporary data
- No external state management library
- API calls trigger state updates in main App component

## Database Migration Process
1. Create new migration file in `migrations/` directory
2. Use format: `000X_description.sql`
3. Test locally: `wrangler d1 migrations apply coachdb --local`
4. Apply to production: `wrangler d1 migrations apply coachdb`

## Testing and Debugging
- Backend: Use `/api/test-ai` and `/api/test-database` endpoints for testing
- Frontend: Browser dev tools for React debugging
- Database: `wrangler d1 execute coachdb --command="SELECT * FROM table_name"`

## Integration Notes
- ⚠️ **禁止使用 localhost:8787**（錯誤的舊專案位置，詳見 `PROJECT_RULES.md`）
- Backend configured for frontend on localhost:5173
- File uploads handled via FormData (MP4 transcription)
- JSON requests for all text-based API calls
