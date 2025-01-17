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
  id: string;
  agentId: string;
  type: 'script' | 'research' | 'optimization' | 'social';
  title: string;
  description: string;
  timestamp: FirebaseFirestore.Timestamp;
  status: 'completed' | 'pending' | 'scheduled';
  metadata?: Record<string, unknown>;
}

interface AgentInsights {
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  scheduledActivities: number;
  lastSevenDaysCount: number;
}

export const getAgentInsights = onRequest({ cors: true }, async (request, response) => {
  try {
    const { agentId } = request.query;

    // Validate required fields
    if (!agentId) {
      response.status(400).json({
        error: 'Missing required field: agentId',
      });
      return;
    }

    // Calculate date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Query activities
    const activitiesQuery = db
      .collection('AgentActivities')
      .where('agentId', '==', agentId)
      .where('timestamp', '>=', FirebaseFirestore.Timestamp.fromDate(startDate))
      .orderBy('timestamp', 'desc');

    const snapshot = await activitiesQuery.get();

    if (snapshot.empty) {
      response.status(200).json({
        message: 'No activities found',
        insights: null,
      });
      return;
    }

    // Calculate insights
    const activities: AgentActivity[] = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as AgentActivity[];

    const insights: AgentInsights = {
      totalActivities: activities.length,
      completedActivities: activities.filter((a) => a.status === 'completed').length,
      pendingActivities: activities.filter((a) => a.status === 'pending').length,
      scheduledActivities: activities.filter((a) => a.status === 'scheduled').length,
      lastSevenDaysCount: activities.filter((a) => a.timestamp.toDate() >= startDate && a.timestamp.toDate() <= endDate)
        .length,
    };

    logger.info('Insights generated successfully', {
      agentId,
      totalActivities: insights.totalActivities,
    });

    response.status(200).json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('Error generating insights', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
