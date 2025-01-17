/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import OpenAI from 'openai';
import * as functions from 'firebase-functions';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

interface OptimizationRequest {
  content: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  goals: ('engagement' | 'reach' | 'conversion')[];
  contentType: 'video' | 'post' | 'story' | 'reel';
  currentPerformance?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  targetAudience?: string;
}

interface OptimizationResponse {
  optimizedContent: string;
  suggestions: {
    content: string[];
    visual: string[];
    engagement: string[];
  };
  hashtags: string[];
  callToAction: {
    primary: string;
    alternatives: string[];
  };
  timing: {
    bestTimeToPost: string;
    frequency: string;
    timezone: string;
  };
  keyMetrics: {
    toTrack: string[];
    targetGoals: Record<string, string>;
  };
}

export const optimizeContent = onRequest({ cors: true }, async (request, response) => {
  try {
    const optimizationRequest: OptimizationRequest = request.body;

    // Validate required fields
    if (
      !optimizationRequest.content ||
      !optimizationRequest.platform ||
      !optimizationRequest.goals ||
      !optimizationRequest.contentType
    ) {
      response.status(400).json({
        error: 'Missing required fields: content, platform, contentType, and goals are required',
      });
      return;
    }

    // Construct the prompt
    const prompt = `As a social media optimization expert, analyze and optimize this content:

PLATFORM: ${optimizationRequest.platform}
CONTENT TYPE: ${optimizationRequest.contentType}
GOALS: ${optimizationRequest.goals.join(', ')}
${optimizationRequest.targetAudience ? `TARGET AUDIENCE: ${optimizationRequest.targetAudience}` : ''}

ORIGINAL CONTENT:
${optimizationRequest.content}

${
  optimizationRequest.currentPerformance
    ? `
CURRENT PERFORMANCE:
Views: ${optimizationRequest.currentPerformance.views || 'N/A'}
Likes: ${optimizationRequest.currentPerformance.likes || 'N/A'}
Comments: ${optimizationRequest.currentPerformance.comments || 'N/A'}
Shares: ${optimizationRequest.currentPerformance.shares || 'N/A'}
`
    : ''
}

Please provide a detailed optimization analysis in the following format:

OPTIMIZED CONTENT:
[Provide the optimized version]

CONTENT SUGGESTIONS:
1. [Content improvement 1]
2. [Content improvement 2]
3. [Content improvement 3]

VISUAL SUGGESTIONS:
1. [Visual improvement 1]
2. [Visual improvement 2]
3. [Visual improvement 3]

ENGAGEMENT SUGGESTIONS:
1. [Engagement strategy 1]
2. [Engagement strategy 2]
3. [Engagement strategy 3]

HASHTAGS:
[List 5-10 relevant hashtags]

CALL TO ACTION:
Primary: [Main CTA]
Alternatives:
1. [Alternative 1]
2. [Alternative 2]

TIMING:
Best Time: [Specify best posting time]
Frequency: [Recommend posting frequency]
Timezone: [Specify timezone]

KEY METRICS:
Metrics to Track:
1. [Metric 1]
2. [Metric 2]
3. [Metric 3]

Target Goals:
- [Metric 1]: [Goal]
- [Metric 2]: [Goal]
- [Metric 3]: [Goal]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-1106-preview',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0].message.content || '';

    // Parse AI response
    const optimizationResponse: OptimizationResponse = {
      optimizedContent: aiResponse.split('OPTIMIZED CONTENT:')[1]?.split('CONTENT SUGGESTIONS:')[0]?.trim() || '',
      suggestions: {
        content:
          aiResponse
            .split('CONTENT SUGGESTIONS:')[1]
            ?.split('VISUAL SUGGESTIONS:')[0]
            ?.trim()
            .split('\n')
            .map((s) => s.replace(/^\d+\.\s*/, ''))
            .filter((s) => s.trim()) || [],
        visual:
          aiResponse
            .split('VISUAL SUGGESTIONS:')[1]
            ?.split('ENGAGEMENT SUGGESTIONS:')[0]
            ?.trim()
            .split('\n')
            .map((s) => s.replace(/^\d+\.\s*/, ''))
            .filter((s) => s.trim()) || [],
        engagement:
          aiResponse
            .split('ENGAGEMENT SUGGESTIONS:')[1]
            ?.split('HASHTAGS:')[0]
            ?.trim()
            .split('\n')
            .map((s) => s.replace(/^\d+\.\s*/, ''))
            .filter((s) => s.trim()) || [],
      },
      hashtags:
        aiResponse
          .split('HASHTAGS:')[1]
          ?.split('CALL TO ACTION:')[0]
          ?.trim()
          .split('\n')
          .filter((tag) => tag.trim()) || [],
      callToAction: {
        primary: aiResponse.split('Primary:')[1]?.split('Alternatives:')[0]?.trim() || '',
        alternatives:
          aiResponse
            .split('Alternatives:')[1]
            ?.split('TIMING:')[0]
            ?.trim()
            .split('\n')
            .map((cta) => cta.replace(/^\d+\.\s*/, ''))
            .filter((cta) => cta.trim()) || [],
      },
      timing: {
        bestTimeToPost: aiResponse.split('Best Time:')[1]?.split('Frequency:')[0]?.trim() || '',
        frequency: aiResponse.split('Frequency:')[1]?.split('Timezone:')[0]?.trim() || '',
        timezone: aiResponse.split('Timezone:')[1]?.split('KEY METRICS:')[0]?.trim() || '',
      },
      keyMetrics: {
        toTrack:
          aiResponse
            .split('Metrics to Track:')[1]
            ?.split('Target Goals:')[0]
            ?.trim()
            .split('\n')
            .map((m) => m.replace(/^\d+\.\s*/, ''))
            .filter((m) => m.trim()) || [],
        targetGoals: {},
      },
    };

    logger.info('Content optimized successfully', {
      platform: optimizationRequest.platform,
      goals: optimizationRequest.goals,
      contentType: optimizationRequest.contentType,
    });

    response.status(200).json({
      success: true,
      optimization: optimizationResponse,
      usage: completion.usage,
    });
  } catch (error) {
    logger.error('Error optimizing content', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
