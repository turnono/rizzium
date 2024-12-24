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
    // Analyze image with GPT-3.5 Vision
    const analysis = await analyzeImageWithGPT4(data.imageUrl, data.analysisType);

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.imageUrl, analysis);

    return { success: true, analysis };
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
  const basePrompt = `Analyze this document image and provide a structured response with:
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

Format the response in clear sections. Focus on the most important elements visible in the document.`;

  switch (type) {
    case 'legal':
      return `${basePrompt}\nPay special attention to legal terminology, contractual obligations, liability clauses, and signature requirements.`;
    case 'financial':
      return `${basePrompt}\nFocus on financial terms, payment obligations, fees, interest rates, and monetary commitments.`;
    default:
      return basePrompt;
  }
}

async function analyzeImageWithGPT4(imageUrl: string, type: 'general' | 'legal' | 'financial'): Promise<any> {
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
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this document:' },
          {
            type: 'image_url',
            image_url: {
              url: base64Image,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 1500,
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
