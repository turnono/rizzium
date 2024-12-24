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
    // Add privacy-focused system message
    const systemMessage = `
      Analyze the document while following these privacy guidelines:
      1. DO NOT extract or return any personal information (names, addresses, ID numbers, etc.) unless explicitly requested
      2. If sensitive information is detected, mention its presence without revealing the actual data
      3. Focus on document structure, type, and potential risks
      4. Redact or mask any personal identifiers in the response
      5. For legal documents, focus on document type and general terms rather than specific parties
    `;

    // Modify the analysis prompt
    const analysisPrompt = `
      ${systemMessage}
      Please analyze this document with focus on ${data.analysisType} aspects.
      If you detect sensitive information, indicate its presence without revealing the actual data.
    `;

    // Analyze image with privacy-aware prompt
    const analysis = await analyzeImageWithGPT4(data.imageUrl, data.analysisType, analysisPrompt);

    // Sanitize the response to ensure no sensitive data is included
    const sanitizedAnalysis = sanitizeAnalysisResponse(analysis);

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.imageUrl, sanitizedAnalysis);

    return { success: true, analysis: sanitizedAnalysis };
  } catch (error) {
    console.error('Analysis error:', error);

    // More specific error handling
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

function getAnalysisPrompt(type: 'general' | 'legal' | 'financial'): string {
  const basePrompt = `Analyze this document image and provide a structured JSON response with:
1. Risk Level: Determine if this document presents HIGH, MEDIUM, or LOW risk. Consider factors like:
   - Unusual terms or conditions
   - Financial obligations
   - Legal implications
   - Missing information

2. Summary: Provide a clear, concise overview of:
   - Main purpose of the document
   - Key parties involved
   - Critical dates or deadlines
   - Important terms

3. Red Flags: List specific concerns in the document:
   - Unclear or ambiguous terms
   - Potential risks or liabilities
   - Missing signatures or information
   - Unusual requirements

4. Recommendations: Suggest specific actions like:
   - Areas needing clarification
   - Additional documentation needed
   - Suggested modifications
   - Next steps

Format the response as a JSON object with the following structure:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "summary": {
    "riskLevel": "HIGH|MEDIUM|LOW",
    "description": "string",
    "recommendations": ["string"]
  },
  "flags": [
    {
      "start": number,
      "end": number,
      "reason": "string",
      "riskLevel": "HIGH|MEDIUM|LOW"
    }
  ]
}`;

  switch (type) {
    case 'legal':
      return `${basePrompt}\nPay special attention to legal terminology, contractual obligations, liability clauses, and signature requirements.`;
    case 'financial':
      return `${basePrompt}\nFocus on financial terms, payment obligations, fees, interest rates, and monetary commitments.`;
    default:
      return basePrompt;
  }
}

// Also update the return type for better type safety
interface AnalysisResult {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: {
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    recommendations: string[];
  };
  flags: Array<{
    start: number;
    end: number;
    reason: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

async function analyzeImageWithGPT4(
  imageUrl: string,
  type: 'general' | 'legal' | 'financial',
  prompt: string
): Promise<AnalysisResult> {
  // Convert URL to base64 if it's not already in base64 format
  let base64Image = imageUrl;
  if (!imageUrl.startsWith('data:')) {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new functions.https.HttpsError('invalid-argument', 'Failed to process image URL');
    }
  }

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
              url: base64Image,
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
    throw new Error('Failed to parse analysis results');
  }
}

async function updateAnalysisDocument(userId: string, imageUrl: string, analysis: any): Promise<void> {
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

// Helper function to sanitize analysis response
function sanitizeAnalysisResponse(analysis: any) {
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
