/**
 * Import function triggers from their respective submodules:

 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { CloudFunctionResponse } from '@rizzium/shared/interfaces';

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
            text: `${prompt}\n\nIMPORTANT: Respond with a JSON object. You must format your entire response as a valid JSON object following the exact format specified above.`,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image and provide your analysis as a JSON object:',
          },
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
      You are an expert document analyzer specializing in ${
        data.analysisType
      } analysis. Your task is to analyze documents while following these guidelines:

      1. Document Validation and Classification:
         - First, determine if the content is a valid, analyzable document or image
         - Identify the document type (e.g., contract, invoice, financial statement, legal agreement)
         - Verify if it's appropriate for ${data.analysisType} analysis
         - For invalid content, provide specific reasons why it can't be analyzed

      2. Analysis Guidelines by Type:
         For ${data.analysisType} analysis, focus on:
         ${
           data.analysisType === 'legal'
             ? `- Contract terms and conditions
                - Legal obligations and liabilities
                - Jurisdiction and governing law
                - Rights and responsibilities
                - Termination clauses
                - Potential legal risks or ambiguities`
             : data.analysisType === 'financial'
             ? `- Financial figures and calculations
                - Payment terms and conditions
                - Currency and amounts
                - Financial obligations
                - Due dates and deadlines
                - Potential financial risks or discrepancies`
             : `- Document structure and formatting
                - Key information and data points
                - Potential risks or concerns
                - Accuracy and completeness
                - Clarity and consistency`
         }

      3. Privacy and Security Guidelines:
         - DO NOT extract or return personal information (names, addresses, ID numbers)
         - Flag sensitive information without revealing actual data
         - Consider regional privacy laws: ${data.region || 'global'}
         - Apply ${data.locale || 'en'} locale-specific standards
         - Mask all personal identifiers in the response

      4. Risk Assessment Criteria:
         HIGH Risk:
         - Critical legal/financial implications
         - Significant privacy concerns
         - Major compliance issues
         - Substantial financial exposure

         MEDIUM Risk:
         - Moderate legal/financial impact
         - Potential privacy concerns
         - Minor compliance issues
         - Limited financial exposure

         LOW Risk:
         - Minimal legal/financial impact
         - No significant privacy concerns
         - Compliant with standards
         - No financial exposure

      5. Response Format:
         You must respond with a valid JSON object in the following format:
         For invalid content:
         {
           "error": true,
           "reason": "Detailed explanation of why analysis failed",
           "suggestions": [
             "Specific suggestions for acceptable content",
             "Examples of expected document types"
           ]
         }

         For valid content:
         {
           "riskLevel": "HIGH" | "MEDIUM" | "LOW",
           "summary": {
             "riskLevel": "HIGH" | "MEDIUM" | "LOW",
             "description": "string",
             "recommendations": ["string"],
             "containsSensitiveInfo": boolean
           },
           "flags": [
             {
               "start": number,
               "end": number,
               "reason": "string",
               "riskLevel": "HIGH" | "MEDIUM" | "LOW"
             }
           ]
         }
    `;

    // Modify the analysis prompt with specific instructions
    const analysisPrompt = `
      ${systemMessage}

      Analyze this content focusing on ${data.analysisType} aspects. Consider:
      1. Document Context:
         - Purpose and intended use
         - Target audience
         - Regional requirements: ${data.region ? `${data.region} standards` : 'global standards'}

      2. Analysis Depth:
         - Provide detailed explanations for all findings
         - Include specific examples from the document
         - Justify risk levels with clear reasoning

      3. Recommendations:
         - Offer actionable, specific improvements
         - Prioritize recommendations by importance
         - Consider practical implementation

      4. Quality Checks:
         - Ensure response is a valid JSON object
         - Verify risk levels match the defined criteria
         - Confirm all flags have precise locations
         - Validate recommendations are relevant and specific

      Remember: Your response must be a valid JSON object following the format specified above.
    `;

    // Use the new implementation
    const analysis = await processAndAnalyzeDocument(data.imageUrl, data.analysisType, analysisPrompt);

    // Sanitize the response to ensure no sensitive data is included
    const sanitizedAnalysis = sanitizeAnalysisResponse(analysis);

    // Transform the response to match CloudFunctionResponse interface
    const response: CloudFunctionResponse = {
      success: true,
      analysis: {
        riskLevel: sanitizedAnalysis.riskLevel,
        summary: {
          riskLevel: sanitizedAnalysis.summary.riskLevel,
          description: sanitizedAnalysis.summary.description,
          recommendations: sanitizedAnalysis.summary.recommendations,
          containsSensitiveInfo: sanitizedAnalysis.summary.containsSensitiveInfo || false,
        },
        flags: (sanitizedAnalysis.flags || []).map((flag) => ({
          start: flag.start,
          end: flag.end,
          reason: flag.reason,
          riskLevel: flag.riskLevel,
        })),
        text: sanitizedAnalysis.text || null,
      },
    };

    // Update analysis document in Firestore
    await updateAnalysisDocument(context.auth.uid, data.imageUrl, sanitizedAnalysis);

    return response;
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
  riskLevel: string;
  text?: string | null;
  summary: {
    riskLevel: string;
    description: string;
    recommendations: string[];
    containsSensitiveInfo?: boolean;
  };
  flags: Array<{
    start: number;
    end: number;
    reason: string;
    riskLevel: string;
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
          content: `${prompt}\n\nIMPORTANT: Respond with a JSON object. You must format your entire response as a valid JSON object following the exact format specified above.`,
        },
        {
          role: 'user',
          content: `Analyze this text content and provide your analysis as a JSON object: ${text}`,
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

  // Create a clean version of the analysis object without undefined values
  const cleanAnalysis = {
    riskLevel: analysis.riskLevel || 'LOW',
    summary: {
      riskLevel: analysis.summary?.riskLevel || 'LOW',
      description: analysis.summary?.description || 'No description provided',
      recommendations: analysis.summary?.recommendations || [],
      containsSensitiveInfo: analysis.summary?.containsSensitiveInfo || false,
    },
    flags: (analysis.flags || []).map((flag) => ({
      start: flag.start || 0,
      end: flag.end || 0,
      reason: flag.reason || 'Unknown reason',
      riskLevel: flag.riskLevel || 'LOW',
    })),
  };

  // Only add text if it exists
  if (analysis.text !== undefined) {
    cleanAnalysis['text'] = analysis.text;
  }

  await doc.ref.update({
    status: 'completed',
    results: cleanAnalysis,
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
  if (sanitizedText) {
    sensitivePatterns.forEach((pattern) => {
      sanitizedText = sanitizedText!.replace(pattern, '[REDACTED]');
    });
  }

  return {
    ...analysis,
    text: sanitizedText,
    summary: {
      ...analysis.summary,
      containsSensitiveInfo: sanitizedText ? sensitivePatterns.some((pattern) => pattern.test(sanitizedText)) : false,
    },
  };
}
