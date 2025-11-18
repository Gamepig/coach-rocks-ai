export interface ParsedSummary {
  clientName: string;
  meetingTitle: string;
  painPoint: string;
  goal: string;
  coachSuggestions: string[];
  summary: string;
  coachingAdvice?: string[];
  salesTechniqueAdvice?: string[];
  actionItemsClient: string[];
  actionItemsCoach: string[];
}

export interface ParsedSummaryWithDeepSeek {
  summary: ParsedSummary;
  resourcesListPrompt: string;
}

export interface ParsedMindMap {
  mermaidCode: string;
}

export interface ParsedEmail {
  subject: string;
  body: string;
}

export interface ParsedSocialMedia {
  reels: Array<{
    hook: string;
    narrative: string;
    callToAction: string;
    hashtags: string[];
  }>;
}

export class ResponseParser {
  static parseSummaryWithDeepSeek(text: string): ParsedSummaryWithDeepSeek {
    try {
      console.log('Attempting to parse as JSON:', text.substring(0, 200) + '...');
      
      // First, try to extract JSON from the response if it has text prefixes
      let jsonText = text;
      
      // Look for JSON object markers
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = text.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON from response:', jsonText.substring(0, 200) + '...');
      }
      
      // Try to parse as JSON
      const jsonResponse = JSON.parse(jsonText);
      console.log('JSON parsing successful, checking for required fields...');
      
      if (jsonResponse.summary && jsonResponse.resourcesListPrompt) {
        console.log('Found both summary and resourcesListPrompt fields');
        return {
          summary: jsonResponse.summary,
          resourcesListPrompt: jsonResponse.resourcesListPrompt
        };
      } else {
        console.log('Missing required fields. Available fields:', Object.keys(jsonResponse));
        // If we have a summary but no resourcesListPrompt, try to extract it
        if (jsonResponse.summary) {
          console.log('Found summary but no resourcesListPrompt, returning with empty prompt');
          return {
            summary: jsonResponse.summary,
            resourcesListPrompt: ""
          };
        }
      }
    } catch (error) {
      console.log('Failed to parse as JSON, error:', error);
      console.log('Raw text for debugging:', text);
    }
    
    // Fallback to old format - parse as text and return with empty resourcesListPrompt
    console.log('Falling back to text parsing');
    const summary = this.parseSummary(text);
    return {
      summary,
      resourcesListPrompt: ""
    };
  }

  static parseSummary(text: string): ParsedSummary {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const result: ParsedSummary = {
      clientName: '',
      meetingTitle: '',
      painPoint: '',
      goal: '',
      coachSuggestions: [],
      summary: '',
      coachingAdvice: [],
      salesTechniqueAdvice: [],
      actionItemsClient: [],
      actionItemsCoach: []
    };

    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('CLIENT NAME:')) {
        result.clientName = this.extractValue(line);
      } else if (line.includes('MEETING TITLE:')) {
        result.meetingTitle = this.extractValue(line);
      } else if (line.includes("CLIENT'S PAIN POINT:")) {
        result.painPoint = this.extractValue(line);
      } else if (line.includes("CLIENT'S GOAL:")) {
        result.goal = this.extractValue(line);
      } else if (line.includes("COACH'S SUGGESTION(S):")) {
        currentSection = 'suggestions';
      } else if (line.startsWith('SUMMARY:')) {
        currentSection = 'summary';
        // Extract inline summary if present
        const inlineSummary = line.substring('SUMMARY:'.length).trim();
        if (inlineSummary) {
          result.summary += inlineSummary + ' ';
        }
      } else if (line.includes('COACHING ADVICE:')) {
        currentSection = 'advice';
      } else if (line.includes('SALES TECHNIQUE ADVICE:')) {
        currentSection = 'salesAdvice';
      } else if (line.includes('ACTION ITEMS FOR CLIENT:')) {
        currentSection = 'clientActions';
      } else if (line.includes('ACTION ITEMS FOR COACH:')) {
        currentSection = 'coachActions';
      } else if (line.startsWith('-') && currentSection === 'suggestions') {
        result.coachSuggestions.push(line.substring(1).trim());
      } else if (currentSection === 'summary' && !line.startsWith('SUMMARY:')) {
        result.summary += line + ' ';
      } else if (line.startsWith('-') && currentSection === 'advice') {
        result.coachingAdvice!.push(line.substring(1).trim());
      } else if (line.startsWith('-') && currentSection === 'salesAdvice') {
        result.salesTechniqueAdvice!.push(line.substring(1).trim());
      } else if (line.startsWith('-') && currentSection === 'clientActions') {
        result.actionItemsClient.push(line.substring(1).trim());
      } else if (line.startsWith('-') && currentSection === 'coachActions') {
        result.actionItemsCoach.push(line.substring(1).trim());
      }
    }

    // Clean up summary
    result.summary = result.summary.trim();
    
    return result;
  }

  static parseMindMap(text: string): ParsedMindMap {
    // Clean up the text first
    let cleanedText = text.trim();
    
    // Extract Mermaid code block if present
    const mermaidMatch = cleanedText.match(/```mermaid\s*([\s\S]*?)\s*```/);
    if (mermaidMatch) {
      cleanedText = mermaidMatch[1].trim();
    }
    
    // Remove any markdown formatting that might be present
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Validate that it starts with "mindmap"
    if (!cleanedText.startsWith('mindmap')) {
      // If it doesn't start with mindmap, try to find it in the text
      const mindmapMatch = cleanedText.match(/mindmap\s*([\s\S]*)/i);
      if (mindmapMatch) {
        cleanedText = 'mindmap' + mindmapMatch[1];
      } else {
        // If still no mindmap found, prepend it
        cleanedText = 'mindmap\n' + cleanedText;
      }
    }
    
    // Parse and rebuild the mindmap with proper indentation
    const lines = cleanedText.split('\n');
    const mindmapLines: string[] = ['mindmap'];
    const styleLines: string[] = [];
    let inStyleBlock = false;
    
    for (let line of lines) {
      line = line.replace(/\r/g, '').trimEnd();
      if (!line || line === 'mindmap') continue;
      
      if (line.startsWith('classDef') || line.startsWith('class ')) {
        inStyleBlock = true;
        styleLines.push(line.trim());
        continue;
      }
      
      if (inStyleBlock) {
        styleLines.push(line.trim());
        continue;
      }
      
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Find the root node
      if (trimmed.startsWith('root(')) {
        // Ensure root node is properly formatted
        const rootContent = trimmed.replace(/^root\(\(([^)]+)\)\)$/, '$1');
        const cleanRootContent = rootContent
          .replace(/['"]/g, '') // Remove quotes
          .replace(/[^\w\s\-:]/g, ' ') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        mindmapLines.push(`  root((${cleanRootContent}))`);
        continue;
      }
      
      // Calculate indentation level based on original indentation
      const leadingSpaces = line.match(/^\s*/)?.[0].length ?? 0;
      let indentLevel = 1; // Start at level 1 (2 spaces)
      
      if (leadingSpaces > 0) {
        // Convert original indentation to our 2-space system
        // Assume original uses 2-4 spaces per level
        indentLevel = Math.max(1, Math.floor(leadingSpaces / 2));
      }
      
      mindmapLines.push('  '.repeat(indentLevel) + trimmed);
    }
    
    const result = mindmapLines.join('\n');
    
    // Final cleanup - ensure no extra whitespace or hidden characters
    const finalResult = result
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle any remaining carriage returns
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove excessive empty lines
      .trim();
    
    console.log('Final Mermaid code:', finalResult);
    
    return { mermaidCode: finalResult };
  }

  static parseEmail(text: string): ParsedEmail {
    // Try to extract subject if present
    const subjectMatch = text.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow-up Email';
    
    // Remove subject line if present and clean up
    const body = text.replace(/Subject:\s*.+/i, '').trim();
    
    return {
      subject,
      body
    };
  }

  static parseSocialMedia(text: string): ParsedSocialMedia {
    console.log('Parsing social media content:', text.substring(0, 200) + '...');
    
    try {
      // Use the same JSON extraction helper as other endpoints
      const jsonResponse = this.extractJSONFromResponse(text);
      console.log('Successfully extracted JSON from social media response');
      
      if (jsonResponse.reels && Array.isArray(jsonResponse.reels)) {
        console.log('Found reels array with', jsonResponse.reels.length, 'reels');
        return { reels: jsonResponse.reels };
      } else {
        console.log('JSON response does not contain reels array');
        return { reels: [] };
      }
    } catch (jsonError) {
      console.log('Failed to extract JSON, trying text parsing...');
      
      // Fallback to text parsing for backward compatibility
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const reels: Array<{ hook: string; narrative: string; callToAction: string; hashtags: string[] }> = [];
      
      // For backward compatibility, try to parse as old format
      for (const line of lines) {
        // Handle markdown format: **Category:** Content
        let match = line.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
        if (match) {
          const category = match[1].trim();
          const content = match[2].trim();
          console.log('Found post (markdown):', { category, content: content.substring(0, 50) + '...' });
          // Convert old format to new format
          reels.push({
            hook: `Hook for ${category}`,
            narrative: content,
            callToAction: "Follow for more tips!",
            hashtags: ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
          });
          continue;
        }
        
        // Handle dash format: - Category: Content
        if (line.startsWith('-')) {
          let match = line.match(/^- \[([^\]]+)\]:\s*(.+)$/);
          if (!match) {
            match = line.match(/^- ([^:]+):\s*(.+)$/);
          }
          if (!match) {
            match = line.match(/^- (.+?):\s*(.+)$/);
          }
          
          if (match) {
            const category = match[1].trim();
            const content = match[2].trim();
            console.log('Found post (dash):', { category, content: content.substring(0, 50) + '...' });
                                  // Convert old format to new format
                      reels.push({
                        hook: `Hook for ${category}`,
                        narrative: content,
                        callToAction: "Follow for more tips!",
                        hashtags: ["#reels", "#explorepage", "#trending", "#viral", "#fyp", "#salescoaching", "#teammotivation", "#businessgrowth", "#salesstrategy", "#leadership"]
                      });
          } else {
            console.log('Could not parse line:', line);
          }
        }
      }
      
      console.log('Total reels found:', reels.length);
      return { reels };
    }
  }

  private static extractValue(line: string): string {
    const colonIndex = line.indexOf(':');
    return colonIndex !== -1 ? line.substring(colonIndex + 1).trim() : '';
  }

  private static extractJSONFromResponse(response: string): any {
    try {
      // First try to parse as-is
      return JSON.parse(response);
    } catch (error) {
      console.log('Initial JSON parse failed, trying to clean and extract...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error('Failed to parse JSON from markdown block:', parseError);
        }
      }
      
      // Try to find JSON object in the response and clean it
      const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          let jsonString = jsonObjectMatch[0];
          
          // Clean common AI-generated JSON issues
          jsonString = jsonString
            // Remove trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix unescaped quotes in string values
            .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1$2$3"')
            // Remove any control characters
            .replace(/[\x00-\x1F\x7F]/g, '');
          
          return JSON.parse(jsonString);
        } catch (parseError) {
          console.error('Failed to parse cleaned JSON object from response:', parseError);
          console.log('Attempted to parse:', jsonObjectMatch[0].substring(0, 200) + '...');
        }
      }
      
      // Last resort: try to extract just the reels array
      const reelsMatch = response.match(/"reels"\s*:\s*\[([\s\S]*?)\]/);
      if (reelsMatch) {
        try {
          const reelsJson = `{"reels": [${reelsMatch[1]}]}`;
          return JSON.parse(reelsJson);
        } catch (parseError) {
          console.error('Failed to parse reels array:', parseError);
        }
      }
      
      throw new Error('Could not extract valid JSON from AI response');
    }
  }
} 