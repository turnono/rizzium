import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

interface DocumentFlag {
  start: number;
  end: number;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedText: string;
}

export const analyzeDocument = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { documentUrl } = data;

  if (!documentUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Document URL is required');
  }

  try {
    // Download the document
    const response = await fetch(documentUrl);
    const buffer = await response.buffer();

    // Parse the document based on type
    let text = '';
    if (documentUrl.toLowerCase().endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      // For text files, just convert buffer to string
      text = buffer.toString('utf-8');
    }

    // Perform analysis (simplified example)
    const analysis = analyzeText(text);

    // Update the analysis document in Firestore
    const db = admin.firestore();
    const analysisRef = db.collection(`users/${context.auth.uid}/analyses`).doc();

    await analysisRef.update({
      status: 'completed',
      results: analysis,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, analysisId: analysisRef.id };
  } catch (error) {
    console.error('Document analysis error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze document');
  }
});

function analyzeText(text: string) {
  // Simple analysis example - you can expand this with more sophisticated analysis
  const flags: DocumentFlag[] = [];

  // Example patterns to check
  const patterns = [
    {
      pattern: /\b(waive|waiver|waiving)\b/gi,
      reason: 'Rights waiver clause detected',
      riskLevel: 'HIGH' as const,
    },
    {
      pattern: /\b(liability|indemnify|indemnification)\b/gi,
      reason: 'Liability or indemnification clause detected',
      riskLevel: 'MEDIUM' as const,
    },
    {
      pattern: /\b(terminate|termination)\b/gi,
      reason: 'Termination clause detected',
      riskLevel: 'medium' as const,
    },
  ];

  // Find matches for each pattern
  patterns.forEach(({ pattern, reason, riskLevel }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      flags.push({
        start: match.index,
        end: match.index + match[0].length,
        reason,
        riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        matchedText: match[0],
      });
    }
  });

  // Determine overall risk level
  const riskLevel = flags.some((f) => f.riskLevel === 'HIGH')
    ? 'HIGH'
    : flags.some((f) => f.riskLevel === 'MEDIUM')
    ? 'MEDIUM'
    : 'LOW';

  return {
    text,
    flags,
    riskLevel,
    summary: {
      riskLevel,
      description: `Analysis found ${flags.length} potential issues.`,
      recommendations: [
        'Review all flagged sections carefully',
        'Consider legal consultation for high-risk items',
        'Document any agreed changes or clarifications',
      ],
    },
  };
}
