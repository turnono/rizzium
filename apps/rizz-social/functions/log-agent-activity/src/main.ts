/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Initialize Firestore
const db = getFirestore();

interface AgentActivity {
  id?: string;
  agentId: string;
  type: 'script' | 'research' | 'optimization' | 'social';
  title: string;
  description: string;
  timestamp: FirebaseFirestore.Timestamp;
  status: 'completed' | 'pending' | 'scheduled';
  metadata?: Record<string, unknown>;
}

export const logAgentActivity = onRequest({ cors: true }, async (request, response) => {
  try {
    const activity: Omit<AgentActivity, 'id' | 'timestamp'> = request.body;

    // Validate required fields
    if (!activity.agentId || !activity.type || !activity.title) {
      response.status(400).json({
        error: 'Missing required fields: agentId, type, and title are required',
      });
      return;
    }

    // Validate agent type
    const validTypes = ['script', 'research', 'optimization', 'social'];
    if (!validTypes.includes(activity.type)) {
      response.status(400).json({
        error: `Invalid agent type. Must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Create activity document
    const activityDoc = {
      ...activity,
      timestamp: FirebaseFirestore.Timestamp.now(),
      status: activity.status || 'completed',
    };

    // Add to Firestore
    const docRef = await db.collection('AgentActivities').add(activityDoc);

    logger.info('Activity logged successfully', {
      activityId: docRef.id,
      agentId: activity.agentId,
      type: activity.type,
    });

    response.status(200).json({
      success: true,
      activityId: docRef.id,
      message: 'Activity logged successfully',
    });
  } catch (error) {
    logger.error('Error logging activity', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
