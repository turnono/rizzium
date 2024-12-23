/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { https } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

// Initialize Firebase Admin
initializeApp();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const analyzeDocument = https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { documentUrl, analysisType } = data;

  if (!documentUrl) {
    throw new https.HttpsError('invalid-argument', 'Document URL is required');
  }

  try {
    // Get the file from Storage
    const bucket = getStorage().bucket();
    const filePath = decodeURIComponent(documentUrl.split('/o/')[1].split('?')[0]);
    const file = bucket.file(filePath);

    // Download the file
    const [content] = await file.download();
    const text = content.toString('utf-8');

    // Perform analysis (mock implementation)
    const analysisResults = await performAnalysis(text, analysisType);

    // Update the analysis document in Firestore
    const fileName = path.basename(filePath);
    await getFirestore()
      .collection(`users/${context.auth.uid}/analyses`)
      .where('fileUrl', '==', documentUrl)
      .limit(1)
      .get()
      .then(async (querySnapshot) => {
        if (!querySnapshot.empty) {
          await querySnapshot.docs[0].ref.update({
            status: 'completed',
            results: analysisResults,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

    return { success: true, results: analysisResults };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new https.HttpsError('internal', 'Failed to analyze document');
  }
});

async function performAnalysis(text: string, analysisType: string) {
  // Mock analysis implementation
  const riskLevel = Math.random() > 0.5 ? 'high' : 'low';

  return {
    text: text.substring(0, 1000), // First 1000 chars
    riskLevel,
    summary: {
      riskLevel,
      description: `Sample analysis of ${analysisType} document`,
      recommendations: ['Review carefully', 'Consult with expert'],
    },
    flags: [
      {
        type: 'warning',
        description: 'Potential risk identified',
        context: 'Section 1.2',
      },
    ],
    recommendations: ['Perform detailed review', 'Update documentation', 'Schedule follow-up'],
  };
}
