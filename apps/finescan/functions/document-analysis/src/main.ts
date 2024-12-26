/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Initialize Firebase Admin
initializeApp();

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

interface AnalysisRequest {
  imageUrl: string;
  analysisType: 'general' | 'legal' | 'financial';
  region?: string;
  locale?: string;
}

async function processAndAnalyzeDocument(
  fileUrl: string,
  type: 'general' | 'legal' | 'financial',
  prompt: string
): Promise<AnalysisResult> {
  let base64Content = fileUrl;
  let isTextFile = false;
  const MAX_TEXT_SIZE = 1024 * 1024; // 1MB limit for text files

  if (!fileUrl.startsWith('data:')) {
    try {
      const response = await fetch(fileUrl);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      isTextFile = contentType === 'text/plain';

      if (isTextFile) {
        if (contentLength > MAX_TEXT_SIZE) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Text file size (${contentLength} bytes) exceeds the maximum allowed size (${MAX_TEXT_SIZE} bytes)`
          );
        }
        const text = await response.text();
        return await analyzeTextContent(text, type, prompt);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Content = `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('invalid-argument', 'Failed to process file');
    }
  } else {
    // Handle already base64 encoded content
    const contentType = base64Content.split(';')[0].split(':')[1];
    isTextFile = contentType === 'text/plain';

    if (isTextFile) {
      try {
        const base64Data = base64Content.split(',')[1];
        const text = Buffer.from(base64Data, 'base64').toString('utf-8');
        if (text.length > MAX_TEXT_SIZE) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Text content size (${text.length} bytes) exceeds the maximum allowed size (${MAX_TEXT_SIZE} bytes)`
          );
        }
        return await analyzeTextContent(text, type, prompt);
      } catch (error) {
        console.error('Error processing base64 text:', error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError('invalid-argument', 'Failed to process text content');
      }
    }
  }

  // Process as image if not text
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: base64Content,
            },
          },
        ],
      },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: 'json_object',
    },
  });

  try {
    const analysis = JSON.parse(response.choices[0].message.content) as AnalysisResult;
    return analysis;
  } catch (error) {
    console.error('Error parsing GPT-4 response:', error);
    throw new functions.https.HttpsError('internal', 'Failed to parse analysis results');
  }
}

export const analyzeDocument = functions.https.onCall(async (data: AnalysisRequest, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Input validation
  if (!data?.imageUrl) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing image URL. Please provide a valid image URL for analysis.'
    );
  }

  try {
    // Add privacy-focused system message with region awareness
    const systemMessage = `
      Analyze the document while following these privacy guidelines:
      1. DO NOT extract or return any personal information (names, addresses, ID numbers, etc.) unless explicitly requested
      2. If sensitive information is detected, mention its presence without revealing the actual data
      3. Focus on document structure, type, and potential risks
      4. Redact or mask any personal identifiers in the response
      5. For legal documents, focus on document type and general terms rather than specific parties
      6. Consider regional context: ${data.region || 'global'} and locale: ${data.locale || 'en'}
      7. Adapt analysis to regional document formats, standards, and regulations if specified
      8. Provide the analysis results in a JSON format
    `;

    // Modify the analysis prompt with region awareness
    const analysisPrompt = `
      ${systemMessage}
      Please analyze this document with focus on ${data.analysisType} aspects and return the results as a JSON object.
      If you detect sensitive information, indicate its presence without revealing the actual data.
      ${data.region ? `Consider specific standards and regulations for ${data.region}.` : ''}
      Return your analysis in a valid JSON format matching the AnalysisResult interface.
    `;

    // Use the new implementation
    const analysis = await processAndAnalyzeDocument(data.imageUrl, data.analysisType, analysisPrompt);

    // Sanitize the response to ensure no sensitive data is included
    const sanitizedAnalysis = sanitizeAnalysisResponse(analysis);

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.imageUrl, sanitizedAnalysis);

    return { success: true, analysis: sanitizedAnalysis };
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Invalid OpenAI API key. Please check your configuration.',
          error.message
        );
      } else if (error.message.includes('does not have access')) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Your OpenAI account does not have access to required models. Please check your subscription.',
          error.message
        );
      }
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred during document analysis',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

export const continueConversation = functions.https.onCall(
  async (data: { userId: string; message: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, message } = data;

    try {
      // Retrieve previous conversation context from Firestore
      const db = getFirestore();
      const conversationRef = db.collection(`users/${userId}/conversations`).doc('current');
      const conversationDoc = await conversationRef.get();

      let messages = [];
      if (conversationDoc.exists) {
        messages = conversationDoc.data()?.messages || [];
      }

      // Add the user's message to the conversation
      messages.push({ role: 'user', content: message });

      // Call OpenAI API to get a response
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
      });

      const assistantMessage = response.choices[0].message.content;

      // Add the assistant's response to the conversation
      messages.push({ role: 'assistant', content: assistantMessage });

      // Update the conversation in Firestore
      await conversationRef.set({ messages });

      return { success: true, response: assistantMessage };
    } catch (error) {
      console.error('Conversation error:', error);
      throw new functions.https.HttpsError('internal', 'An error occurred during the conversation');
    }
  }
);

export const testOpenAIConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Requires admin access');
  }
  // te

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    return {
      success: true,
      message: 'OpenAI connection successful',
      modelResponse: response.choices[0].message.content,
    };
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKey: `${functions.config().openai.api_key?.substring(0, 5)}...`,
    };
  }
});

// Also update the return type for better type safety
interface AnalysisResult {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  text?: string;
  summary: {
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    recommendations: string[];
    containsSensitiveInfo?: boolean;
  };
  flags: Array<{
    start: number;
    end: number;
    reason: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

async function analyzeTextContent(
  text: string,
  type: 'general' | 'legal' | 'financial',
  prompt: string
): Promise<AnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: `Analyze this text content: ${text}`,
        },
      ],
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: 'json_object',
      },
    });

    const analysis = JSON.parse(response.choices[0].message.content) as AnalysisResult;
    return {
      ...analysis,
      text: text,
    };
  } catch (error) {
    console.error('Error analyzing text content:', error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze text content');
  }
}

async function updateAnalysisDocument(userId: string, imageUrl: string, analysis: AnalysisResult): Promise<void> {
  const db = getFirestore();
  const analysisRef = db.collection(`users/${userId}/analyses`).where('fileUrl', '==', imageUrl);

  const snapshot = await analysisRef.get();
  if (snapshot.empty) {
    throw new Error('Analysis document not found');
  }

  const doc = snapshot.docs[0];
  await doc.ref.update({
    status: 'completed',
    results: analysis,
    updatedAt: new Date(),
  });
}

function sanitizeAnalysisResponse(analysis: AnalysisResult): AnalysisResult {
  // Remove or mask any detected personal information
  const sensitivePatterns = [
    /\b\d{13}\b/, // ID numbers
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email addresses
    /\b\d{10}\b/, // Phone numbers
    // Add more patterns as needed
  ];

  let sanitizedText = analysis.text;
  sensitivePatterns.forEach((pattern) => {
    sanitizedText = sanitizedText.replace(pattern, '[REDACTED]');
  });

  return {
    ...analysis,
    text: sanitizedText,
    summary: {
      ...analysis.summary,
      containsSensitiveInfo: sensitivePatterns.some((pattern) => pattern.test(analysis.text)),
    },
  };
}
