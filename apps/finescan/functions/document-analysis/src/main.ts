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
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

    // Extract file info from URL
    const userId = context.auth.uid;
    const fileName = documentUrl.split('/').pop();
    if (!fileName) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid document URL');
    }

    // Get the file from Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(`finescan-uploads/${userId}/${fileName}`);

    // Check if file exists
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
          content: `You are an expert document analyzer specializing in ${analysisType} analysis.
          Analyze the document and provide a structured response with:
          1. A risk level (low, medium, high)
          2. A summary of key findings
          3. Specific red flags or concerns
          4. Recommendations
          Format the response as JSON with the following structure:
          {
            "summary": {
              "riskLevel": "low|medium|high",
              "description": "overall summary",
              "recommendations": ["rec1", "rec2"]
            },
            "flags": [
              {
                "type": "risk type",
                "severity": "low|medium|high",
                "description": "description",
                "start": textStartIndex,
                "end": textEndIndex
              }
            ]
          }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Store results in Firestore
    const firestore = getFirestore();
    const analysisRef = await firestore
      .collection('users')
      .doc(context.auth.uid)
      .collection('analyses')
      .add({
        userId: context.auth.uid,
        fileName: fileName,
        analysisType: analysisType,
        text,
        results: {
          // Match the interface structure
          text,
          riskLevel: analysis.summary.riskLevel,
          summary: analysis.summary,
          flags: analysis.flags.map((flag) => ({
            start: flag.start,
            end: flag.end,
            reason: flag.description,
            riskLevel: flag.severity,
          })),
          recommendations: analysis.summary.recommendations,
        },
        status: 'completed',
        createdAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      });

    // Store flags in subcollection
    const batch = firestore.batch();
    analysis.flags.forEach((flag: any) => {
      const flagRef = analysisRef.collection('flags').doc();
      batch.set(flagRef, {
        ...flag,
        createdAt: Timestamp.now(),
      });
    });
    await batch.commit();

    // Schedule file deletion (after 30 days)
    const deleteAfter = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    setTimeout(async () => {
      try {
        await file.delete();
        await analysisRef.update({
          status: 'archived',
          fileDeleted: true,
        });
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }, deleteAfter);

    return {
      analysisId: analysisRef.id,
      ...analysis,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new functions.https.HttpsError('internal', 'Analysis failed');
  }
});

// Add a Firestore trigger to clean up expired analyses
export const cleanupExpiredAnalyses = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const firestore = getFirestore();
  const storage = getStorage();
  const bucket = storage.bucket();

  const now = Timestamp.now();
  const expiredAnalyses = await firestore
    .collection('analyses')
    .where('expiresAt', '<=', now)
    .where('status', '==', 'completed')
    .get();

  for (const doc of expiredAnalyses.docs) {
    const data = doc.data();
    try {
      // Delete the original file
      const file = bucket.file(`finescan-uploads/${data.userId}/${data.fileName}`);
      await file.delete().catch(() => {}); // Ignore if file already deleted

      // Update analysis status
      await doc.ref.update({
        status: 'archived',
        fileDeleted: true,
      });
    } catch (error) {
      console.error(`Error cleaning up analysis ${doc.id}:`, error);
    }
  }
});
