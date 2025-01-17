import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentRefinementRequest {
  idea: {
    title: string;
    description: string;
    targetAudience?: string;
    duration?: '15s' | '30s' | '60s';
    keyPoints?: string[];
  };
  refinementGoals: ('engagement' | 'clarity' | 'virality' | 'education' | 'entertainment')[];
  currentFeedback?: string[];
  platform: 'tiktok';
}

interface RefinedContent {
  title: {
    original: string;
    refined: string;
    alternatives: string[];
  };
  description: {
    original: string;
    refined: string;
    improvements: string[];
  };
  structure: {
    hook: string;
    mainContent: string[];
    conclusion: string;
    transitions: string[];
  };
  enhancements: {
    visualIdeas: string[];
    soundIdeas: string[];
    interactionPrompts: string[];
  };
  audience: {
    primary: string;
    secondary: string[];
    engagementTactics: string[];
  };
  performance: {
    potentialReachScore: number;
    viralityFactors: string[];
    optimizationTips: string[];
  };
}

export const refineContentIdea = onRequest({ cors: true }, async (request, response) => {
  try {
    const refinementRequest: ContentRefinementRequest = request.body;

    // Validate required fields
    if (!refinementRequest.idea || !refinementRequest.refinementGoals || !refinementRequest.platform) {
      response.status(400).json({
        error: 'Missing required fields: idea, refinementGoals, and platform are required',
      });
      return;
    }

    // Construct the prompt
    const prompt = `As a TikTok content optimization specialist, refine and enhance this content idea:

ORIGINAL IDEA:
Title: ${refinementRequest.idea.title}
Description: ${refinementRequest.idea.description}
${refinementRequest.idea.targetAudience ? `Target Audience: ${refinementRequest.idea.targetAudience}` : ''}
${refinementRequest.idea.duration ? `Duration: ${refinementRequest.idea.duration}` : ''}
${refinementRequest.idea.keyPoints ? `Key Points: ${refinementRequest.idea.keyPoints.join(', ')}` : ''}

REFINEMENT GOALS: ${refinementRequest.refinementGoals.join(', ')}
${refinementRequest.currentFeedback ? `CURRENT FEEDBACK: ${refinementRequest.currentFeedback.join('\n')}` : ''}

Please provide a comprehensive refinement analysis in the following format:

TITLE REFINEMENT:
- Original title
- Refined version
- Alternative options

DESCRIPTION ENHANCEMENT:
- Original description
- Refined version
- Specific improvements made

STRUCTURE:
- Attention-grabbing hook
- Main content points
- Strong conclusion
- Smooth transitions

VISUAL AND AUDIO ENHANCEMENTS:
- Visual ideas
- Sound suggestions
- Interaction prompts

AUDIENCE TARGETING:
- Primary audience
- Secondary audiences
- Engagement tactics

PERFORMANCE OPTIMIZATION:
- Potential reach score (0-100)
- Virality factors
- Optimization tips

Format the response as a structured JSON object matching the RefinedContent interface.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-1106-preview',
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const refinedContent: RefinedContent = JSON.parse(completion.choices[0].message.content || '{}');

    logger.info('Content idea refined successfully', {
      originalTitle: refinementRequest.idea.title,
      refinementGoals: refinementRequest.refinementGoals,
      platform: refinementRequest.platform,
    });

    response.status(200).json({
      success: true,
      refinedContent,
      usage: completion.usage,
    });
  } catch (error) {
    logger.error('Error refining content idea', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
