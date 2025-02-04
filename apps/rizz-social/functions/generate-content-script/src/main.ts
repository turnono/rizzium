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
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

interface ScriptRequest {
  topic: string;
  style: 'funny' | 'informative' | 'dramatic' | 'casual';
  duration: '15s' | '30s' | '60s';
  targetAudience?: string;
  keyPoints?: string[];
  tone?: 'professional' | 'friendly' | 'energetic' | 'calm';
}

interface ScriptResponse {
  script: string;
  hooks: string[];
  hashtags: string[];
  duration: string;
  notes: string[];
  sections: {
    intro: string;
    main: string;
    conclusion: string;
  };
}

export const generateContentScript = onRequest({ cors: true }, async (request, response) => {
  try {
    // Initialize OpenAI with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const scriptRequest: ScriptRequest = request.body;

    // Validate required fields
    if (!scriptRequest.topic || !scriptRequest.style || !scriptRequest.duration) {
      response.status(400).json({
        error: 'Missing required fields: topic, style, and duration are required',
      });
      return;
    }

    // Construct the prompt
    const prompt = `As a professional TikTok content creator, create a script with the following specifications:

Topic: ${scriptRequest.topic}
Style: ${scriptRequest.style}
Duration: ${scriptRequest.duration}
${scriptRequest.targetAudience ? `Target Audience: ${scriptRequest.targetAudience}` : ''}
${scriptRequest.keyPoints ? `Key Points: ${scriptRequest.keyPoints.join(', ')}` : ''}
${scriptRequest.tone ? `Tone: ${scriptRequest.tone}` : ''}

Please structure your response exactly as follows:

SCRIPT:
[Write the complete script here, optimized for TikTok's format]

HOOKS:
1. [First hook]
2. [Second hook]
3. [Third hook]

SECTIONS:
Intro: [Opening lines]
Main: [Core content]
Conclusion: [Call to action]

HASHTAGS:
[List 5-7 relevant hashtags]

PRODUCTION NOTES:
- [Note 1]
- [Note 2]
- [Note 3]

Ensure the script is engaging, concise, and follows TikTok best practices.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-1106-preview',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content || '';

    // Parse AI response with better error handling
    const scriptResponse: ScriptResponse = {
      script: aiResponse.split('SCRIPT:')[1]?.split('HOOKS:')[0]?.trim() || 'Error parsing script',
      hooks:
        aiResponse
          .split('HOOKS:')[1]
          ?.split('SECTIONS:')[0]
          ?.trim()
          .split('\n')
          .filter((line) => line.trim())
          .map((hook) => hook.replace(/^\d+\.\s*/, '')) || [],
      sections: {
        intro: aiResponse.split('Intro:')[1]?.split('Main:')[0]?.trim() || '',
        main: aiResponse.split('Main:')[1]?.split('Conclusion:')[0]?.trim() || '',
        conclusion: aiResponse.split('Conclusion:')[1]?.split('HASHTAGS:')[0]?.trim() || '',
      },
      hashtags:
        aiResponse
          .split('HASHTAGS:')[1]
          ?.split('PRODUCTION NOTES:')[0]
          ?.trim()
          .split('\n')
          .filter((tag) => tag.trim()) || [],
      duration: scriptRequest.duration,
      notes:
        aiResponse
          .split('PRODUCTION NOTES:')[1]
          ?.trim()
          .split('\n')
          .map((note) => note.replace(/^-\s*/, ''))
          .filter((note) => note.trim()) || [],
    };

    logger.info('Script generated successfully', {
      topic: scriptRequest.topic,
      style: scriptRequest.style,
      sections: Object.keys(scriptResponse.sections).length,
    });

    response.status(200).json({
      success: true,
      script: scriptResponse,
      usage: completion.usage,
    });
  } catch (error) {
    logger.error('Error generating script', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
