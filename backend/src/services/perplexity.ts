import type { Env } from '../types';

export interface ResourceItem {
  title: string;
  url: string;
  type: string;
  description?: string;
}

export class PerplexityService {
  private apiKey: string;
  private baseURL: string;

  constructor(env: Env) {
    console.log('Perplexity API Key available:', !!env.PERPLEXITY_API_KEY);
    console.log('Perplexity API Key length:', env.PERPLEXITY_API_KEY?.length || 0);
    
    if (!env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set in environment variables');
    }
    
    this.apiKey = env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
  }

  private async callPerplexity(prompt: string, maxTokens: number = 2000) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at finding high-quality online resources. When given a search prompt, return 3-5 relevant resources in this exact format:\n\n1. **Resource Title**\n   Brief description of the resource.\n   URL: https://example.com/resource-url\n\n2. **Another Resource Title**\n   Brief description of the resource.\n   URL: https://example.com/another-url\n\nIMPORTANT: Each resource MUST include the actual URL. Do not use reference numbers or markdown links. Include the full https:// URL for each resource.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw new Error(`Perplexity API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateResourcesList(prompt: string): Promise<ResourceItem[]> {
    const rawResult = await this.callPerplexity(prompt);
    console.log('Perplexity generateResourcesList raw output:', rawResult);
    console.log('Raw result type:', typeof rawResult);
    console.log('Raw result length:', rawResult.length);
    
    try {
      // First, try to extract JSON from markdown code blocks
      const markdownMatch = rawResult.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        console.log('Found JSON in markdown code block:', markdownMatch[1]);
        const resources = JSON.parse(markdownMatch[1]);
        console.log('Parsed JSON from markdown:', resources);
        
        if (Array.isArray(resources)) {
          return resources.map((resource: any) => ({
            title: resource.title || '',
            url: resource.url || '',
            type: resource.type || 'article',
            description: resource.description || ''
          }));
        }
      }
      
      // Try to parse the response as JSON directly
      const resources = JSON.parse(rawResult);
      console.log('Parsed JSON:', resources);
      console.log('Is array?', Array.isArray(resources));
      
      if (Array.isArray(resources)) {
        return resources.map((resource: any) => ({
          title: resource.title || '',
          url: resource.url || '',
          type: resource.type || 'article',
          description: resource.description || ''
        }));
      }
      
      // If not an array, try to extract JSON from the response
      const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON array in response:', jsonMatch[0]);
        const resources = JSON.parse(jsonMatch[0]);
        return resources.map((resource: any) => ({
          title: resource.title || '',
          url: resource.url || '',
          type: resource.type || 'article',
          description: resource.description || ''
        }));
      }
      
      // Parse Perplexity's text format with numbered resources and references
      const parsedResources = this.parsePerplexityTextFormat(rawResult);
      if (parsedResources.length > 0) {
        console.log('Parsed resources from text format:', parsedResources);
        return parsedResources;
      }
      
      // Fallback: return empty array
      console.warn('Could not parse Perplexity response, returning empty array');
      console.warn('Raw response was:', rawResult);
      return [];
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      console.error('Raw response was:', rawResult);
      
      // Try parsing as text format even if JSON parsing failed
      const parsedResources = this.parsePerplexityTextFormat(rawResult);
      if (parsedResources.length > 0) {
        console.log('Parsed resources from text format after error:', parsedResources);
        return parsedResources;
      }
      
      return [];
    }
  }

  private parsePerplexityTextFormat(text: string): ResourceItem[] {
    const resources: ResourceItem[] = [];
    
    try {
      console.log('Parsing Perplexity text format...');
      console.log('Raw text length:', text.length);
      
      // Split the text into lines
      const lines = text.split('\n');
      let currentResource: Partial<ResourceItem> = {};
      let inResource = false;
      let resourceNumber = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Look for numbered resources (e.g., "1. **Title**")
        const resourceMatch = line.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
        if (resourceMatch) {
          // Save previous resource if exists
          if (currentResource.title) {
            resources.push({
              title: currentResource.title || '',
              url: currentResource.url || '',
              type: currentResource.type || 'article',
              description: currentResource.description || ''
            });
          }
          
          // Start new resource
          resourceNumber = parseInt(resourceMatch[1]);
          currentResource = {
            title: resourceMatch[2].trim(),
            type: 'article',
            description: '',
            url: ''
          };
          inResource = true;
          console.log('Found resource:', resourceNumber, currentResource.title);
          continue;
        }
        
        // Look for URL lines (e.g., "URL: https://example.com")
        const urlMatch = line.match(/^URL:\s*(https?:\/\/[^\s]+)/);
        if (urlMatch && currentResource.title) {
          currentResource.url = urlMatch[1];
          console.log('Found URL for resource', resourceNumber, ':', urlMatch[1]);
          continue;
        }
        
        // Look for direct URLs in the text (fallback)
        const directUrlMatch = line.match(/https?:\/\/[^\s]+/);
        if (directUrlMatch && currentResource.title && !currentResource.url) {
          currentResource.url = directUrlMatch[0];
          console.log('Found direct URL for resource', resourceNumber, ':', directUrlMatch[0]);
          continue;
        }
        
        // Collect description text (lines that are not numbered resources or URLs)
        if (inResource && line && 
            !line.match(/^(\d+)\./) && 
            !line.match(/^URL:\s*/) &&
            !line.match(/https?:\/\/[^\s]+/)) {
          
          if (currentResource.description) {
            currentResource.description += ' ' + line;
          } else {
            currentResource.description = line;
          }
        }
      }
      
      // Add the last resource
      if (currentResource.title) {
        resources.push({
          title: currentResource.title || '',
          url: currentResource.url || '',
          type: currentResource.type || 'article',
          description: currentResource.description || ''
        });
      }
      
      console.log('Parsed resources from text format:', resources);
      return resources;
    } catch (error) {
      console.error('Error parsing Perplexity text format:', error);
      return [];
    }
  }
} 