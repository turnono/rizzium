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
import { getStorage } from 'firebase-admin/storage';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';
// TEST

// Initialize Firebase Admin
initializeApp();

// Get config and initialize OpenAI
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});

interface AnalysisRequest {
  documentUrl: string;
  analysisType: 'general' | 'legal' | 'financial';
}

export const analyzeDocument = functions.https.onCall(async (data: AnalysisRequest, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Input validation
  if (!data.documentUrl || !data.analysisType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get document text based on file type
    const text = await extractTextFromDocument(data.documentUrl);
    if (!text) {
      throw new functions.https.HttpsError('internal', 'Failed to extract text from document');
    }

    // Get analysis prompt based on type
    const prompt = getAnalysisPrompt(data.analysisType);

    // Analyze text with GPT-4
    const analysis = await analyzeTextWithGPT4(text, prompt);

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.documentUrl, analysis);

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

async function extractTextFromDocument(url: string): Promise<string> {
  // Get the file path from the Storage URL
  const filePath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);

  // Get the file from Firebase Storage
  const bucket = getStorage().bucket();
  const file = bucket.file(filePath);

  // Download the file contents
  const [buffer] = await file.download();

  // Process based on file type
  if (filePath.toLowerCase().endsWith('.pdf')) {
    return extractTextFromPDF(buffer.buffer);
  } else {
    // For text files
    return buffer.toString('utf-8');
  }
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return text;
}

function getAnalysisPrompt(type: 'general' | 'legal' | 'financial'): string {
  const basePrompt = `Analyze the following document and provide:
1. Overall risk level (high, medium, low)
2. Summary of key points
3. Potential red flags or concerning elements
4. Specific recommendations
Format the response as a JSON object with the following structure:
{
  "riskLevel": "high|medium|low",
  "summary": {
    "riskLevel": "high|medium|low",
    "description": "string",
    "recommendations": ["string"]
  },
  "flags": [
    {
      "start": number,
      "end": number,
      "reason": "string",
      "riskLevel": "high|medium|low"
    }
  ],
  "recommendations": ["string"]
}`;

  switch (type) {
    case 'legal':
      return `${basePrompt}\nFocus on legal implications, contractual obligations, and potential liabilities.`;
    case 'financial':
      return `${basePrompt}\nFocus on financial terms, obligations, and potential risks to monetary assets.`;
    default:
      return basePrompt;
  }
}

async function analyzeTextWithGPT4(text: string, prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  try {
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error parsing GPT-4 response:', error);
    throw new Error('Failed to parse analysis results');
  }
}

async function updateAnalysisDocument(userId: string, documentUrl: string, analysis: any): Promise<void> {
  const db = getFirestore();
  const analysisRef = db.collection(`users/${userId}/analyses`).where('fileUrl', '==', documentUrl);

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
