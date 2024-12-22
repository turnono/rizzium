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
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import OpenAI from 'openai';
import { z } from 'zod';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../../.env') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

initializeApp();

// Input validation schema
const AnalyzeDocumentSchema = z.object({
  documentUrl: z.string().url(),
  analysisType: z.enum(['general', 'legal', 'financial', 'medical']).default('general'),
});

// Initialize OpenAI with key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeDocument = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
    // Validate input
    const { documentUrl, analysisType } = AnalyzeDocumentSchema.parse(data);

    // Extract file ID from the URL
    const fileId = documentUrl.split('/').pop();
    if (!fileId) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid document URL');
    }

    // Get the file from Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(`finescan-uploads/${fileId}`);

    // Check if file exists and user has access
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError('not-found', 'Document not found');
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    if (!metadata.contentType?.startsWith('application/pdf') && !metadata.contentType?.startsWith('text/')) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Unsupported file type. Only PDF and text files are supported.'
      );
    }

    // Get signed URL for the file
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // URL expires in 5 minutes
    });

    // Fetch the document content
    const response = await fetch(signedUrl);
    const text = await response.text();

    // Prepare the prompt based on analysis type
    const prompts = {
      general: 'Please analyze this document and provide a general summary:',
      legal: 'Please analyze this legal document and highlight key legal points, obligations, and potential risks:',
      financial: 'Please analyze this financial document and highlight key financial data, trends, and implications:',
      medical:
        'Please analyze this medical document and highlight key medical findings, diagnoses, and recommendations:',
    };

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert document analyzer specializing in ${analysisType} analysis.`,
        },
        {
          role: 'user',
          content: `${prompts[analysisType]}\n\nDocument content:\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Return the analysis
    return {
      analysis: completion.choices[0].message.content,
      metadata: {
        analysisType,
        documentName: metadata.name,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Document analysis error:', error);

    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input parameters', error.errors);
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while analyzing the document');
  }
});
