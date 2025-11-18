import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

const GenerateIgCreativeRequest = z.object({
  image_style: z.string().min(1, "Image style is required"),
  quote: z.string().min(1, "Quote is required"),
  color_theme: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color theme must be a valid hex color"),
  font: z.string().min(1, "Font is required")
});

const GenerateIgCreativeResponse = z.object({
  success: Bool(),
  baseImage: z.string().optional(),
  textOverlay: z.string().optional(),
  compositeHTML: z.string().optional(),
  error: z.string().optional()
});

export class GenerateIgCreative extends OpenAPIRoute {
  schema = {
    tags: ["AI"],
    summary: "Generate Instagram creative with text overlay",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateIgCreativeRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the generated Instagram creative image",
        content: {
          "application/json": {
            schema: GenerateIgCreativeResponse,
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: GenerateIgCreativeResponse,
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: GenerateIgCreativeResponse,
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { image_style, quote, color_theme, font } = data.body;

      console.log('Generating Instagram creative with:', { image_style, quote, color_theme, font });

      // Step 1: Generate image prompt using Llama model
      const imagePrompt = await this.generateImagePrompt(image_style, color_theme, c.env);
      console.log('Generated image prompt:', imagePrompt);

      // Step 2: Generate base image using DreamShaper
      const baseImage = await this.generateBaseImage(imagePrompt, c.env);
      console.log('Generated base image, size:', baseImage.byteLength);

      if (!baseImage || baseImage.byteLength === 0) {
        throw new Error('Failed to generate base image');
      }

      // Step 3: Create text overlay
      const textOverlay = await this.createTextOverlay(quote, font, color_theme);
      console.log('Created text overlay');

      // Step 4: Overlay text on image
      const finalImage = await this.overlayTextOnImage(baseImage, textOverlay);
      console.log('Created final image with text overlay');

      if (!finalImage || finalImage.length === 0) {
        throw new Error('Failed to create final image');
      }

      // Parse the final image response
      const responseData = JSON.parse(finalImage);
      
      return {
        success: true,
        baseImage: responseData.baseImage,
        textOverlay: responseData.textOverlay,
        compositeHTML: responseData.compositeHTML
      };
    } catch (error) {
      console.error("Generate Instagram creative error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private async generateImagePrompt(imageStyle: string, colorTheme: string, env: any): Promise<string> {
    try {
      console.log('Testing AI binding availability...');
      
      if (!env.AI) {
        throw new Error('AI binding is not available');
      }

      const prompt = `Generate a detailed image prompt for creating an Instagram post with the following requirements:
      - Style: ${imageStyle}
      - Color theme: ${colorTheme}
      - The image should be suitable for social media with good composition
      - Make it visually appealing and modern
      - The image should have good contrast and space for text overlay
      - Avoid any text or words in the image
      
      Return only the image prompt, no additional text.`;

      console.log('Calling Llama model with prompt...');
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      console.log('Llama response received:', typeof response);
      return response.response;
    } catch (error) {
      console.error('Error in generateImagePrompt:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'No code'
      });
      
      // If AI is not available, return a fallback prompt
      if (error instanceof Error && error.message.includes('Authentication error')) {
        console.log('AI authentication failed, using fallback prompt');
        return `A beautiful Instagram post with ${imageStyle} style, ${colorTheme} color theme, suitable for social media with good composition and modern appeal, with good contrast for text overlay.`;
      }
      
      throw error;
    }
  }

  private async generateBaseImage(imagePrompt: string, env: any): Promise<ArrayBuffer> {
    try {
      console.log('Generating image with prompt:', imagePrompt);
      console.log('AI binding available:', !!env.AI);
      
      if (!env.AI) {
        throw new Error('AI binding is not available');
      }

      // Use the Stable Diffusion XL model for image generation
      console.log('Using @cf/stabilityai/stable-diffusion-xl-base-1.0 model...');
      let response;
      try {
        response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
          prompt: imagePrompt,
          width: 1024,
          height: 1024,
          num_steps: 20,
          guidance_scale: 7.5
        });
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        if (imageError instanceof Error && imageError.message.includes('Authentication error')) {
          throw new Error('AI authentication failed. Please ensure your Cloudflare account has AI features enabled and the worker is deployed.');
        }
        throw imageError;
      }

      console.log('Image generation response type:', typeof response);
      console.log('Image generation response:', response);
      console.log('Image generation response length:', response?.byteLength || 'unknown');
      console.log('Image generation response constructor:', response?.constructor?.name);

      if (!response) {
        throw new Error('Image generation returned null/undefined response');
      }

      // Handle different response formats
      if (response instanceof ArrayBuffer) {
        console.log('Response is ArrayBuffer, size:', response.byteLength);
        return response;
      } else if (response instanceof Uint8Array) {
        console.log('Response is Uint8Array, size:', response.byteLength);
        return response.buffer as ArrayBuffer;
      } else if (response instanceof ReadableStream) {
        console.log('Response is ReadableStream, converting to ArrayBuffer...');
        // Convert ReadableStream to ArrayBuffer
        const reader = response.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        // Combine all chunks into a single ArrayBuffer
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        console.log('Converted ReadableStream to ArrayBuffer, size:', result.buffer.byteLength);
        return result.buffer;
      } else if (typeof response === 'string') {
        console.log('Response is string, length:', response.length);
        // If it's a base64 string, convert it back to ArrayBuffer
        const binaryString = atob(response);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      } else {
        console.log('Response is unknown type:', typeof response);
        // Try to convert to ArrayBuffer
        try {
          return new Uint8Array(response).buffer;
        } catch (e) {
          throw new Error(`Unsupported response format: ${typeof response}`);
        }
      }
    } catch (error) {
      console.error('Error generating base image:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error(`Failed to generate base image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTextOverlay(quote: string, font: string, colorTheme: string): Promise<ArrayBuffer> {
    try {
      // Create an SVG with text overlay that can be converted to an image
      const svgContent = this.createSVGTextOverlay(quote, font, colorTheme);
      
      // Convert SVG to base64 data URL
      const svgBase64 = btoa(svgContent);
      const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      // For now, we'll return the SVG data URL as a string
      // In a production environment, you would convert this to a PNG
      return new TextEncoder().encode(svgDataUrl).buffer as ArrayBuffer;
    } catch (error) {
      console.error('Error creating text overlay:', error);
      throw new Error(`Failed to create text overlay: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSVGTextOverlay(quote: string, font: string, colorTheme: string): string {
    // Create an SVG with text overlay
    const words = quote.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Simple text wrapping (approximate)
    for (const word of words) {
      if ((currentLine + word).length > 30) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    lines.push(currentLine.trim());

    const lineHeight = 70;
    const startY = 540 - (lines.length - 1) * lineHeight / 2;

    const textElements = lines.map((line, index) => 
      `<text x="540" y="${startY + index * lineHeight}" 
             font-family="${font}, Arial, sans-serif" 
             font-size="48" 
             font-weight="bold" 
             fill="${colorTheme}" 
             text-anchor="middle" 
             dominant-baseline="middle"
             filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.7))">${line}</text>`
    ).join('');

    return `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${textElements}
    </svg>`;
  }

  private async overlayTextOnImage(baseImage: ArrayBuffer, textOverlay: ArrayBuffer): Promise<string> {
    try {
      console.log('Processing base image overlay');
      console.log('Base image size:', baseImage.byteLength);
      
      // Get the SVG text overlay
      const svgDataUrl = new TextDecoder().decode(textOverlay);
      console.log('SVG text overlay created');
      
      // Convert the base image to base64 using a more efficient method
      const uint8Array = new Uint8Array(baseImage);
      
      // Use a more efficient base64 conversion that avoids stack overflow
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binaryString);
      
      console.log('Base64 image length:', base64.length);
      
      if (!base64 || base64.length === 0) {
        throw new Error('Failed to convert image to base64');
      }
      
      // Create a composite image using HTML/CSS approach
      // Since we can't use Canvas API, we'll create an HTML structure
      // that can be used to display the image with text overlay
      const compositeHTML = `
        <div style="position: relative; width: 1080px; height: 1080px;">
          <img src="data:image/png;base64,${base64}" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
            <img src="${svgDataUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>
      `;
      
      // For now, return both the base image and the SVG overlay
      // The client can use this to create the composite image
      const responseData = {
        baseImage: `data:image/png;base64,${base64}`,
        textOverlay: svgDataUrl,
        compositeHTML: compositeHTML
      };
      
      return JSON.stringify(responseData);
    } catch (error) {
      console.error('Error overlaying text on image:', error);
      throw new Error(`Failed to overlay text on image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 