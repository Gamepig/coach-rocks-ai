import OpenAI from 'openai';
import type { Env } from '../types';

export class OpenAIService {
  private client: OpenAI;
  private env: Env;

  constructor(env: Env) {
    console.log('OpenAI API Key available:', !!env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', env.OPENAI_API_KEY?.length || 0);
    
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.env = env;
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string, maxTokens: number = 3000) {
    try {
      // Validate parameters
      if (!systemPrompt || typeof systemPrompt !== 'string') {
        throw new Error('System prompt is required and must be a string');
      }
      if (!userPrompt || typeof userPrompt !== 'string') {
        throw new Error('User prompt is required and must be a string');
      }
      
      console.log('Calling OpenAI API...');
      console.log('System prompt length:', systemPrompt.length);
      console.log('User prompt length:', userPrompt.length);
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: maxTokens,
        temperature: 0.7
      });

      console.log('OpenAI response received');
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callCloudflareAI(env: Env, systemPrompt: string, userPrompt: string, maxTokens: number = 3000) {
    try {
      // Validate parameters
      if (!systemPrompt || typeof systemPrompt !== 'string') {
        throw new Error('System prompt is required and must be a string');
      }
      if (!userPrompt || typeof userPrompt !== 'string') {
        throw new Error('User prompt is required and must be a string');
      }
      
      console.log('Calling Cloudflare AI with model: @cf/meta/llama-3.1-8b-instruct');
      console.log('System prompt length:', systemPrompt.length);
      console.log('User prompt length:', userPrompt.length);
      
      // Clean the prompts to prevent JSON issues
      const cleanSystemPrompt = systemPrompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      const cleanUserPrompt = userPrompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      // Try with a simpler model first, then fallback to the original
      let response;
      try {
        response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: `${cleanSystemPrompt}\n\n${cleanUserPrompt}`,
          max_tokens: maxTokens,
          temperature: 0.7
        });
      } catch (error) {
        console.log('First model failed, trying alternative model...');
        // Try with a different model
        response = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
          prompt: `${cleanSystemPrompt}\n\n${cleanUserPrompt}`,
          max_tokens: maxTokens,
          temperature: 0.7
        });
      }

      console.log('Cloudflare AI response received:', typeof response);
      console.log('Response structure:', JSON.stringify(response, null, 2));
      
      // Extract the response text - it might be in different properties
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object') {
        responseText = response.response || JSON.stringify(response);
      }
      
      console.log('Extracted response text length:', responseText.length);
      return responseText;
    } catch (error) {
      console.error('Cloudflare AI error details:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Cloudflare AI call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test method to verify AI binding works
  async testAIBinding(env: Env): Promise<string> {
    try {
      console.log('Testing AI binding...');
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: "Hello, can you respond with 'AI binding test successful'?",
        max_tokens: 50,
        temperature: 0.7
      });
      
      console.log('AI binding test response:', response);
      return response.response || 'No response';
    } catch (error) {
      console.error('AI binding test failed:', error);
      throw error;
    }
  }

  /**
   * Helper function to extract JSON from AI responses that might include markdown formatting
   */
  private extractJSONFromResponse(response: string): any {
    try {
      // First try to parse as-is
      return JSON.parse(response);
    } catch (error) {
      console.log('Initial JSON parse failed, trying to clean and extract...');
      
      // Clean the response by handling control characters in JSON strings
      let cleanedResponse = response;
      
      // Replace actual newlines in JSON string values with escaped newlines
      // This regex finds JSON string values and replaces newlines with \\n
      cleanedResponse = cleanedResponse.replace(/"([^"]*?)"/g, (match, content) => {
        // Replace newlines and other control characters in the string content
        const cleanedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${cleanedContent}"`;
      });
      
      try {
        return JSON.parse(cleanedResponse);
      } catch (cleanError) {
        console.log('Cleaned JSON parse failed, trying markdown extraction...');
      }
      
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          // Clean the extracted JSON as well
          let extractedJson = jsonMatch[1];
          extractedJson = extractedJson.replace(/"([^"]*?)"/g, (match, content) => {
            const cleanedContent = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return `"${cleanedContent}"`;
          });
          return JSON.parse(extractedJson);
        } catch (parseError) {
          console.error('Failed to parse JSON from markdown block:', parseError);
        }
      }
      
      // If that fails, try to find JSON object in the response
      const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          // Clean the extracted JSON as well
          let extractedJson = jsonObjectMatch[0];
          extractedJson = extractedJson.replace(/"([^"]*?)"/g, (match, content) => {
            const cleanedContent = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return `"${cleanedContent}"`;
          });
          return JSON.parse(extractedJson);
        } catch (parseError) {
          console.error('Failed to parse JSON object from response:', parseError);
        }
      }
      
      throw new Error('Could not extract valid JSON from AI response');
    }
  }

  /**
   * Detect if a meeting is a discovery call or consulting session
   */
  async detectMeetingType(transcript: string): Promise<{ isDiscovery: boolean }> {
    const systemPrompt = `You are an expert at analyzing coaching session transcripts. Your task is to determine if this is a discovery call or a regular consulting session.

A discovery call typically:
- Is the first meeting with a potential client
- Focuses on understanding the client's needs and pain points
- Explores whether there's a good fit for coaching services
- Often involves sales techniques and qualification questions
- May discuss pricing, packages, or next steps
- Has a more sales-oriented approach

A regular consulting session typically:
- Is an ongoing coaching relationship
- Focuses on specific advice and strategies
- Delves deeper into implementation and progress
- Has more detailed coaching and mentoring
- Is more educational and advisory in nature

Return your response as a JSON object with this exact structure:
{
  "isDiscovery": true/false
}`;

    const userPrompt = `Analyze the following meeting transcript and determine if this is a discovery call or a regular consulting session.

Transcript: ${transcript}

Return your response as a JSON object with this exact structure:
{
  "isDiscovery": true/false
}`;

    try {
      console.log('Detecting meeting type...');
      const result = await this.callCloudflareAI(this.env, systemPrompt, userPrompt, 500);
      console.log('Meeting type detection successful');
      
      // Parse the JSON response with improved extraction
      const parsedResult = this.extractJSONFromResponse(result);
      return { isDiscovery: parsedResult.isDiscovery };
    } catch (cloudflareError) {
      console.error('Cloudflare AI failed for meeting type detection, falling back to OpenAI:', cloudflareError);
      
      try {
        console.log('Falling back to OpenAI for meeting type detection...');
        const result = await this.callOpenAI(systemPrompt, userPrompt, 500);
        console.log('OpenAI fallback successful for meeting type detection');
        
        // Parse the JSON response with improved extraction
        const parsedResult = this.extractJSONFromResponse(result);
        return { isDiscovery: parsedResult.isDiscovery };
      } catch (openaiError) {
        console.error('Both Cloudflare AI and OpenAI failed for meeting type detection:', openaiError);
        throw new Error(`Meeting type detection failed: Cloudflare AI error: ${cloudflareError instanceof Error ? cloudflareError.message : 'Unknown'}, OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`);
      }
    }
  }

  async summarizeText(text: string, type: 'discovery' | 'consulting'): Promise<string> {
    const systemPrompts = {
      discovery: `You are a sales call analyzer and expert prompt engineer. Extract or infer the following fields from the transcript. If a field is not explicitly stated, use your best judgment to infer it from context. If truly unavailable, leave it blank. Be sure to fill in CLIENT NAME, MEETING TITLE, CLIENT'S PAIN POINT, CLIENT'S GOAL, COACH'S SUGGESTION(S), SUMMARY, SALES TECHNIQUE ADVICE, ACTION ITEMS FOR CLIENT, and ACTION ITEMS FOR COACH. Use clear, client-friendly language.

For SALES TECHNIQUE ADVICE, analyze the coach's sales techniques in the conversation and provide specific, actionable advice. Include:
- Specific sentences or phrases from the conversation that were effective or could be improved
- Concrete suggestions for what the coach could say next time in similar situations
- Specific techniques to improve qualification, objection handling, value proposition, and closing
- Examples of better questions to ask or responses to give

Additionally, generate a precise, clear, and effective search prompt for the DeepSeek model R1 to find 3 to 5 high-quality online resources (such as articles, videos, and reputable websites) relevant to the content of the meeting transcript.

Guidelines for the DeepSeek search prompt:
- Target recent and authoritative web content related to the meeting topics.
- Aim to retrieve diverse formats (articles, videos, blogs, papers).
- Limit to 3 to 5 resources.
- Prioritize quality and relevance.
- Avoid overly broad or generic search terms.

Return your response as a JSON object with two fields:
1. "summary": containing all the structured summary fields
2. "resourcesListPrompt": the search prompt string for DeepSeek R1`,
      consulting: `You are a document analyzer and expert prompt engineer. Extract or infer the following fields from the transcript. If a field is not explicitly stated, use your best judgment to infer it from context. If truly unavailable, leave it blank. Be sure to fill in CLIENT NAME, MEETING TITLE, CLIENT'S PAIN POINT, CLIENT'S GOAL, COACH'S SUGGESTION(S), SUMMARY, COACHING ADVICE, ACTION ITEMS FOR CLIENT, and ACTION ITEMS FOR COACH. Use clear, client-friendly language.

Additionally, generate a precise, clear, and effective search prompt for the DeepSeek model R1 to find 3 to 5 high-quality online resources (such as articles, videos, and reputable websites) relevant to the content of the meeting transcript.

Guidelines for the DeepSeek search prompt:
- Target recent and authoritative web content related to the meeting topics.
- Aim to retrieve diverse formats (articles, videos, blogs, papers).
- Limit to 3 to 5 resources.
- Prioritize quality and relevance.
- Avoid overly broad or generic search terms.

Return your response as a JSON object with two fields:
1. "summary": containing all the structured summary fields
2. "resourcesListPrompt": the search prompt string for DeepSeek R1`
    };

    const userPrompts = {
      discovery: `Analyze the following text and extract the following fields. If a field is not explicitly stated, infer it from context or leave it blank if truly unavailable. Use your best judgment to fill in all fields.

Text: ${text}

For SALES TECHNIQUE ADVICE, provide specific, actionable advice for the coach's sales techniques. Include:
- Quote specific sentences from the conversation that were effective or could be improved
- Provide concrete suggestions for what the coach could say next time
- Give specific examples of better questions to ask or responses to give
- Focus on qualification, objection handling, value proposition, and closing techniques

Additionally, generate a search prompt for DeepSeek R1 to find relevant online resources.

Return your response as a JSON object with this exact structure:

{
  "summary": {
    "clientName": "[client name or best guess]",
    "meetingTitle": "[meeting title or best guess]",
    "painPoint": "[client's main pain point or challenge]",
    "goal": "[client's main goal or objective]",
    "coachSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "summary": "[comprehensive summary of the meeting]",
    "salesTechniqueAdvice": [
      "Quote: '[exact sentence from conversation]' - This was effective because... Next time try saying: '[specific suggestion]'",
      "Quote: '[exact sentence from conversation]' - This could be improved by... Instead, try: '[specific suggestion]'",
      "Quote: '[exact sentence from conversation]' - Better approach would be: '[specific suggestion]'"
    ],
    "actionItemsClient": ["action item 1", "action item 2", "action item 3"],
    "actionItemsCoach": ["action item 1", "action item 2", "action item 3"]
  },
  "resourcesListPrompt": "[search prompt for DeepSeek R1 to find relevant online resources]"
}`,
      consulting: `Analyze the following text and extract the following fields. If a field is not explicitly stated, infer it from context or leave it blank if truly unavailable. Use your best judgment to fill in all fields.

Text: ${text}

Additionally, generate a search prompt for DeepSeek R1 to find relevant online resources.

Return your response as a JSON object with this exact structure:

{
  "summary": {
    "clientName": "[client name or best guess]",
    "meetingTitle": "[meeting title or best guess]",
    "painPoint": "[client's main pain point or challenge]",
    "goal": "[client's main goal or objective]",
    "coachSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "summary": "[comprehensive summary of the meeting]",
    "coachingAdvice": ["advice 1", "advice 2", "advice 3"],
    "actionItemsClient": ["action item 1", "action item 2", "action item 3"],
    "actionItemsCoach": ["action item 1", "action item 2", "action item 3"]
  },
  "resourcesListPrompt": "[search prompt for DeepSeek R1 to find relevant online resources]"
}`
    };

    try {
      // Try Cloudflare AI first
      console.log('Attempting to use Cloudflare AI...');
      const result = await this.callCloudflareAI(this.env, systemPrompts[type], userPrompts[type]);
      console.log('Cloudflare AI successful');
      return result;
    } catch (cloudflareError) {
      console.error('Cloudflare AI failed, falling back to OpenAI:', cloudflareError);
      
      // Fallback to OpenAI
      try {
        console.log('Falling back to OpenAI...');
        const result = await this.callOpenAI(systemPrompts[type], userPrompts[type]);
        console.log('OpenAI fallback successful');
        return result;
      } catch (openaiError) {
        console.error('Both Cloudflare AI and OpenAI failed:', openaiError);
        throw new Error(`AI processing failed: Cloudflare AI error: ${cloudflareError instanceof Error ? cloudflareError.message : 'Unknown'}, OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`);
      }
    }
  }

  async generateMindMap(summary: string, type: 'sales' | 'consulting'): Promise<string> {
    const systemPrompts = {
      sales: "You are a sales call analyzer. Create a detailed radial mind map using Mermaid mindmap syntax. The mind map should be client-focused: the center node is the client's main challenge or goal. The main branches are: 1) Current Situation/Challenges, 2) Root Causes, 3) Solutions/Recommendations, 4) Expected Outcomes/Benefits. Sub-branches should provide details, examples, or actionable steps. Use clear, client-friendly language. IMPORTANT: Do not use quotes around text in nodes. Use simple text without special characters. Ensure the response is complete and properly closed. Respond ONLY with a valid Mermaid code block, nothing else.",
      consulting: "You are a document analyzer. Create a detailed radial mind map using Mermaid mindmap syntax. The mind map should be client-focused: the center node is the client's main challenge or goal. The main branches are: 1) Current Situation/Challenges, 2) Root Causes, 3) Solutions/Recommendations, 4) Expected Outcomes/Benefits. Sub-branches should provide details, examples, or actionable steps. Use clear, client-friendly language. IMPORTANT: Do not use quotes around text in nodes. Use simple text without special characters. Ensure the response is complete and properly closed. Respond ONLY with a valid Mermaid code block, nothing else."
    };

    const userPrompt = `Generate a detailed radial mind map for the following summary using Mermaid mindmap syntax. Make sure to include all four main branches with detailed sub-branches.

Mermaid Syntax Rules:
- Start with "mindmap" on the first line
- Use root((text)) for the center node
- Use simple text for all other nodes (no quotes)
- Use proper indentation (2 spaces per level)
- Do NOT use quotes around text in nodes
- Do NOT use special characters like parentheses, colons, or apostrophes in node names

Summary:
${summary}

IMPORTANT: Provide a complete Mermaid mindmap with all branches and sub-branches. Do not truncate the response.`;

    return await this.callCloudflareAI(this.env, systemPrompts[type], userPrompt, 2000);
  }

  /**
   * Generate follow-up email template based on meeting type
   */
  async generateFollowUpEmail(summary: any, isDiscovery: boolean): Promise<{ subject: string; body: string }> {
    const systemPrompts = {
      discovery: `You are an expert sales coach and email copywriter. Generate a professional follow-up email template for a discovery call. The email should:

- Be warm and professional
- Reference specific points from the conversation
- Include clear next steps
- Be sales-oriented but not pushy
- Mention specific value propositions discussed
- Include a call-to-action for next meeting or proposal

Return your response as a JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`,
      consulting: `You are an expert coaching consultant and email copywriter. Generate a professional follow-up email template for a consulting session. The email should:

- Be supportive and encouraging
- Reference specific action items discussed
- Include progress tracking elements
- Be coaching-focused and educational
- Mention specific strategies or tools discussed
- Include accountability elements

Return your response as a JSON object with this exact structure:
{
  "subject": "Email subject line", 
  "body": "Email body content"
}`
    };

    const userPrompts = {
      discovery: `Generate a follow-up email for this discovery call:

Client Name: ${summary.clientName}
Meeting Title: ${summary.meetingTitle}
Pain Point: ${summary.painPoint}
Goal: ${summary.goal}
Summary: ${summary.summary}
Coach Suggestions: ${summary.coachSuggestions?.join(', ')}

Create a professional follow-up email that references these specific points and includes clear next steps.

Return your response as a JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`,
      consulting: `Generate a follow-up email for this consulting session:

Client Name: ${summary.clientName}
Meeting Title: ${summary.meetingTitle}
Pain Point: ${summary.painPoint}
Goal: ${summary.goal}
Summary: ${summary.summary}
Action Items Client: ${summary.actionItemsClient?.join(', ')}
Action Items Coach: ${summary.actionItemsCoach?.join(', ')}

Create a supportive follow-up email that references these specific points and includes accountability elements.

Return your response as a JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`
    };

    const type = isDiscovery ? 'discovery' : 'consulting';

    try {
      // Try Cloudflare AI first
      console.log('Generating follow-up email with Cloudflare AI...');
      const result = await this.callCloudflareAI(this.env, systemPrompts[type], userPrompts[type], 1000);
      console.log('Follow-up email generation successful');
      
      // Parse the JSON response with improved extraction
      try {
        const parsedResult = this.extractJSONFromResponse(result);
        return { subject: parsedResult.subject, body: parsedResult.body };
      } catch (parseError) {
        console.error('JSON parsing failed for email response:', parseError);
        console.log('Raw response:', result);
        // Fallback to OpenAI if JSON parsing fails
        throw new Error('Invalid JSON response from Cloudflare AI');
      }
    } catch (cloudflareError) {
      console.error('Cloudflare AI failed for email generation, falling back to OpenAI:', cloudflareError);
      
      try {
        console.log('Falling back to OpenAI for email generation...');
        const result = await this.callOpenAI(systemPrompts[type], userPrompts[type], 1000);
        console.log('OpenAI fallback successful for email generation');
        
        // Parse the JSON response with improved extraction
        try {
          const parsedResult = this.extractJSONFromResponse(result);
          return { subject: parsedResult.subject, body: parsedResult.body };
        } catch (parseError) {
          console.error('JSON parsing failed for OpenAI email response:', parseError);
          console.log('Raw OpenAI response:', result);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } catch (openaiError) {
        console.error('Both Cloudflare AI and OpenAI failed for email generation:', openaiError);
        throw new Error(`Email generation failed: Cloudflare AI error: ${cloudflareError instanceof Error ? cloudflareError.message : 'Unknown'}, OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`);
      }
    }
  }

  async generateReelsScripts(summary: string): Promise<string> {
    const systemPrompt = `You are an expert social media strategist and copywriter specializing in short-form video content. Generate 3-5 engaging reels scripts based on coaching insights. Each script should be optimized for platforms like Instagram Reels, TikTok, and YouTube Shorts. Do not mention client names in the content.

Create reels scripts with these essential components:
- Hook: Start with a bold statement, question, or visually interesting moment that captures attention within the first 3-5 seconds
- Narrative/Body: Concise story or quick logical points that build on the hook (problem-solution, tutorial, tips, behind-the-scenes) - 15-20 seconds
- Call to Action (CTA): Clear prompt for viewer engagement (comment, share, save, follow) - 5 seconds
- Hashtags: Generate 6-10 relevant hashtags for maximum reach and engagement

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON. Ensure all strings are properly quoted and escaped. Do not include trailing commas.

Return your response as a JSON object with this exact structure:
{
  "reels": [
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention", 
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook", 
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement", 
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    }
  ]
}`;

    const userPrompt = `Based on this coaching session transcript, generate 3-5 engaging reels scripts for short-form video content.

Transcript: ${summary}

Create reels scripts optimized for Instagram Reels, TikTok, and YouTube Shorts with these components:
- Hook: Start with a bold statement, question, or visually interesting moment (3-5 seconds)
- Narrative: Concise story or quick logical points (15-20 seconds) 
- Call to Action: Clear prompt for viewer engagement (5 seconds)
- Hashtags: Generate 6-10 relevant hashtags for maximum reach and engagement

Tone: Informative and inspirational
Target Audience: Sales professionals, team leaders, and business coaches
Duration: 30-60 seconds total per reel

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON. Ensure all strings are properly quoted and escaped. Do not include trailing commas.

Return your response as a JSON object with this exact structure:
{
  "reels": [
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention", 
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook", 
      "callToAction": "Clear prompt for viewer engagement",
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    },
    {
      "hook": "Bold statement or question to capture attention",
      "narrative": "Concise story or logical points building on the hook",
      "callToAction": "Clear prompt for viewer engagement", 
      "hashtags": ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
    }
  ]
}`;

    try {
      console.log('Generating social media content...');
      const result = await this.callCloudflareAI(this.env, systemPrompt, userPrompt, 1000);
      console.log('Social media content generated:', result.substring(0, 200) + '...');
      
      // Return the raw response and let the parser handle JSON extraction
      console.log('Successfully generated social media content');
      return result;
    } catch (cloudflareError) {
      console.error('Cloudflare AI failed for social media generation, falling back to OpenAI:', cloudflareError);
      
      try {
        console.log('Falling back to OpenAI for social media generation...');
        const result = await this.callOpenAI(systemPrompt, userPrompt, 1000);
        console.log('OpenAI fallback successful for social media generation');
        
        // Parse the JSON response with improved extraction
        try {
          const parsedResult = this.extractJSONFromResponse(result);
          return JSON.stringify(parsedResult);
        } catch (parseError) {
          console.error('JSON parsing failed for OpenAI social media response:', parseError);
          console.log('Raw OpenAI response:', result);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } catch (openaiError) {
        console.error('Both Cloudflare AI and OpenAI failed for social media generation:', openaiError);
        throw new Error(`Social media generation failed: Cloudflare AI error: ${cloudflareError instanceof Error ? cloudflareError.message : 'Unknown'}, OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`);
      }
    }
  }

  async generateNextMeetingPrep(meetingsData: any[]): Promise<any> {
    const systemPrompt = `You are an expert coaching consultant. Analyze a client's previous meetings and generate comprehensive preparation for the next coaching session.

Create a detailed meeting preparation document with:
1. Overall Insights & Recurring Themes
2. Quick Overview of Client's Journey  
3. Client Progress Assessment
4. Current Journey Status
5. Key Areas to Address
6. Potential New Discussion Points
7. Recommended Mindset for the Coach

Format as structured JSON. Be professional and action-oriented. Focus on patterns, progress tracking, and forward momentum.

IMPORTANT: Return ONLY valid JSON. Do not include explanatory text. Ensure all strings are properly quoted and escaped.

Return your response as a JSON object with this exact structure:
{
  "overallInsights": {
    "overallClientGoals": "Bulleted list of client's long-term objectives (format: • Goal 1\n• Goal 2\n• Goal 3)",
    "recurringPainPoints": "Bulleted list of recurring challenges (format: • Challenge 1\n• Challenge 2\n• Challenge 3)",
    "successfulStrategies": ["What has worked well"],
    "areasOfStagnation": ["Where progress is slow"]
  },
  "quickOverview": "Brief summary of client's journey",
  "clientProgressAssessment": "Detailed assessment of client's progress since the beginning of coaching",
  "currentJourneyStatus": "Current status and stage of client's journey",
  "keyAreasToAddress": ["Important topics to discuss"],
  "potentialNewDiscussionPoints": ["Forward-looking suggestions"],
  "recommendedMindset": "Coach's recommended approach"
}`;

    // Limit meetings and truncate long content to stay within token limits
    const maxMeetings = 15; // Include up to 15 most recent meetings
    const maxSummaryLength = 200; // Original summary length
    const maxActionItems = 3; // Original action items count
    
    const limitedMeetingsData = meetingsData
      .slice(0, maxMeetings) // Take only the most recent meetings
      .map((meeting, index) => ({
        ...meeting,
        summary: meeting.summary?.substring(0, maxSummaryLength) + (meeting.summary?.length > maxSummaryLength ? '...' : ''),
        actionItemsClient: meeting.actionItemsClient?.slice(0, maxActionItems) || [],
        actionItemsCoach: meeting.actionItemsCoach?.slice(0, maxActionItems) || [],
        salesTechniqueAdvice: meeting.salesTechniqueAdvice?.slice(0, maxActionItems) || [],
        coachingAdvice: meeting.coachingAdvice?.slice(0, maxActionItems) || []
      }));

    const userPrompt = `Analyze these ${limitedMeetingsData.length} previous meetings and generate next meeting preparation:

${limitedMeetingsData.map((meeting, index) => `
Meeting ${index + 1} (${meeting.meetingDate}):
- Title: ${meeting.meetingTitle}
- Summary: ${meeting.summary}
- Pain Point: ${meeting.painPoint}
- Goal: ${meeting.goal}
- Suggestions: ${meeting.suggestion}
- Action Items: ${meeting.actionItemsClient?.join(', ') || 'None'}
- Coach Actions: ${meeting.actionItemsCoach?.join(', ') || 'None'}
- Sales Advice: ${meeting.salesTechniqueAdvice?.join(', ') || 'None'}
- Coaching Advice: ${meeting.coachingAdvice?.join(', ') || 'None'}
`).join('\n')}

Generate comprehensive preparation for the next coaching session. Focus on patterns, progress tracking, and forward momentum.`;

    try {
      console.log('Generating next meeting preparation with Cloudflare AI...');
      const result = await this.callCloudflareAI(this.env, systemPrompt, userPrompt, 3000);
      console.log('Next meeting preparation generated successfully');
      
      // Parse the JSON response with improved extraction
      try {
        const parsedResult = this.extractJSONFromResponse(result);
        return parsedResult;
      } catch (parseError) {
        console.error('JSON parsing failed for next meeting prep response:', parseError);
        console.log('Raw response:', result);
        // Fallback to OpenAI if JSON parsing fails
        throw new Error('Invalid JSON response from Cloudflare AI');
      }
    } catch (cloudflareError) {
      console.error('Cloudflare AI failed for next meeting prep generation, falling back to OpenAI:', cloudflareError);
      
      try {
        console.log('Falling back to OpenAI for next meeting prep generation...');
        const result = await this.callOpenAI(systemPrompt, userPrompt, 3000);
        console.log('OpenAI fallback successful for next meeting prep generation');
        
        // Parse the JSON response with improved extraction
        try {
          const parsedResult = this.extractJSONFromResponse(result);
          return parsedResult;
        } catch (parseError) {
          console.error('JSON parsing failed for OpenAI next meeting prep response:', parseError);
          console.log('Raw OpenAI response:', result);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } catch (openaiError) {
        console.error('Both Cloudflare AI and OpenAI failed for next meeting prep generation:', openaiError);
        throw new Error(`Next meeting prep generation failed: Cloudflare AI error: ${cloudflareError instanceof Error ? cloudflareError.message : 'Unknown'}, OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown'}`);
      }
    }
  }
} 