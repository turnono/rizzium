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
    // Analyze image with GPT-4 Vision
    const analysis = await analyzeImageWithGPT4(data.imageUrl, data.analysisType);

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.imageUrl, analysis);

    return { success: true, analysis };
  } catch (error) {
    console.error('Analysis error:', error);
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
        model: 'gpt-4',
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

function getAnalysisPrompt(type: 'general' | 'legal' | 'financial'): string {
  const basePrompt = `Analyze this document image and provide:
1. Overall risk level (high, medium, low)
2. Summary of key points
3. Potential red flags or concerning elements
4. Specific recommendations

Focus on clearly visible text and important visual elements.`;

  switch (type) {
    case 'legal':
      return `${basePrompt}\nPay special attention to legal terms, signatures, dates, and contractual elements.`;
    case 'financial':
      return `${basePrompt}\nPay special attention to numbers, amounts, financial terms, and monetary values.`;
    default:
      return basePrompt;
  }
}

async function analyzeImageWithGPT4(imageUrl: string, type: 'general' | 'legal' | 'financial'): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: getAnalysisPrompt(type),
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  try {
    // Format the response as JSON
    const formattedResponse = {
      riskLevel: 'medium', // Default value
      summary: {
        riskLevel: 'medium',
        description: '',
        recommendations: [],
      },
      flags: [],
      recommendations: [],
      rawAnalysis: response.choices[0].message.content,
    };

    // Parse the GPT response and try to extract structured information
    const content = response.choices[0].message.content || '';

    // Basic parsing of risk levels (you can enhance this based on your needs)
    if (content.toLowerCase().includes('high risk')) {
      formattedResponse.riskLevel = 'high';
    } else if (content.toLowerCase().includes('low risk')) {
      formattedResponse.riskLevel = 'low';
    }

    formattedResponse.summary.description = content;

    // Extract recommendations (lines starting with "Recommendation:" or numbered lists)
    const recommendations = content.match(/(?:Recommendation:|^\d+\.\s).+/gm) || [];
    formattedResponse.recommendations = recommendations.map((r) =>
      r.replace(/^(?:Recommendation:|\d+\.\s)/, '').trim()
    );

    return formattedResponse;
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
