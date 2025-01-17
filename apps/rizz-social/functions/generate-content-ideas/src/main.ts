import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentIdeaRequest {
  topic?: string;
  trend?: {
    title: string;
    description: string;
    category: string;
    examples?: string[];
  };
  targetAudience?: string;
  contentType: 'educational' | 'entertainment' | 'behind-the-scenes' | 'tutorial';
  count?: number;
}

interface ContentIdea {
  title: string;
  description: string;
  hooks: string[];
  visualElements: string[];
  keyPoints: string[];
  estimatedDuration: '15s' | '30s' | '60s';
  difficulty: 'easy' | 'medium' | 'hard';
  requiredResources: string[];
  potentialHashtags: string[];
}

interface ContentIdeaResponse {
  ideas: ContentIdea[];
  inspiration: {
    relatedTopics: string[];
    trendConnections: string[];
  };
  recommendations: {
    bestPractices: string[];
    avoidance: string[];
  };
}

export const generateContentIdeas = onRequest({ cors: true }, async (request, response) => {
  try {
    const ideaRequest: ContentIdeaRequest = request.body;

    // Validate required fields
    if (!ideaRequest.contentType) {
      response.status(400).json({
        error: 'Missing required field: contentType is required',
      });
      return;
    }

    // Construct the prompt
    const prompt = `As a TikTok content strategist, generate creative content ideas with the following parameters:

${ideaRequest.topic ? `TOPIC: ${ideaRequest.topic}` : ''}
${
  ideaRequest.trend
    ? `
TREND:
Title: ${ideaRequest.trend.title}
Description: ${ideaRequest.trend.description}
Category: ${ideaRequest.trend.category}
Examples: ${ideaRequest.trend.examples?.join(', ')}
`
    : ''
}
CONTENT TYPE: ${ideaRequest.contentType}
${ideaRequest.targetAudience ? `TARGET AUDIENCE: ${ideaRequest.targetAudience}` : ''}
NUMBER OF IDEAS: ${ideaRequest.count || 3}

Please provide detailed content ideas in the following format:

IDEAS:
[For each idea, provide:
- Title
- Description
- 3 potential hooks
- Visual elements to include
- Key points to cover
- Estimated duration (15s, 30s, or 60s)
- Difficulty level
- Required resources
- Relevant hashtags]

INSPIRATION:
- Related topics to explore
- Connections to current trends

RECOMMENDATIONS:
- Best practices for this type of content
- Things to avoid

Format the response as a structured JSON object matching the ContentIdeaResponse interface.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-1106-preview',
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const aiResponse: ContentIdeaResponse = JSON.parse(completion.choices[0].message.content || '{}');

    logger.info('Content ideas generated successfully', {
      topic: ideaRequest.topic,
      contentType: ideaRequest.contentType,
      ideaCount: aiResponse.ideas?.length || 0,
    });

    response.status(200).json({
      success: true,
      ideas: aiResponse,
      usage: completion.usage,
    });
  } catch (error) {
    logger.error('Error generating content ideas', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
