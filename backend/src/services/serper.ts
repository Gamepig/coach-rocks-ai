import type { Env } from '../types';

export interface ResourceItem {
  title: string;
  url: string;
  type: string;
  description?: string;
}

export class SerperService {
  private apiKey: string;
  private baseURL: string;

  constructor(env: Env) {
    if (!env.SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY is not set in environment variables');
    }
    
    this.apiKey = env.SERPER_API_KEY;
    this.baseURL = 'https://google.serper.dev';
  }

  private async callSerper(prompt: string) {
    try {
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: prompt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Serper API error response:', errorText);
        throw new Error(`Serper API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as any;
      return data.organic || [];
    } catch (error) {
      console.error('Serper API error:', error);
      throw new Error(`Serper API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateResourcesList(prompt: string): Promise<ResourceItem[]> {
    const rawResult = await this.callSerper(prompt);
    
    try {
      return rawResult.map((resource: any) => ({
        title: resource.title || '',
        url: resource.link || '',
        type: 'article',
        description: resource.snippet || ''
      }));
    } catch (error) {
      console.error('Failed to parse Serper response:', error);
      console.error('Raw response was:', rawResult);
      return [];
    }
  }
}
