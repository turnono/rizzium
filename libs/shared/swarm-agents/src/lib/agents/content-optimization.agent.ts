import { Injectable } from '@angular/core';
import { SwarmAgentsService } from '../services/swarm-agents.service';

interface ContentOptimizationResponse {
  caption: string;
  hashtags: string[];
  suggestions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ContentOptimizationAgent {
  constructor(private swarmAgents: SwarmAgentsService) {}

  async optimizeContent(script: string): Promise<ContentOptimizationResponse> {
    const prompt = `As a TikTok content optimization expert, analyze and optimize the following script/idea:

${script}

Provide the following:
1. An optimized caption that's engaging and hooks viewers
2. A curated list of relevant, trending hashtags (max 5)
3. Suggestions for video optimization and engagement (max 3 points)

Format the response in JSON with the following structure:
{
  "caption": "string",
  "hashtags": ["string"],
  "suggestions": ["string"]
}`;

    const result = await this.swarmAgents.submitTask(prompt, ['optimization']);

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate optimization suggestions');
    }

    try {
      const parsed = JSON.parse(result.output);
      return {
        caption: parsed.caption || '',
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    } catch (error) {
      console.error('Failed to parse optimization response:', error);
      throw new Error('Failed to generate optimization suggestions');
    }
  }
}
