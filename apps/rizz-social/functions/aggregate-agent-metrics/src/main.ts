/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

interface AgentMetrics {
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  scheduledActivities: number;
  lastAggregatedAt: admin.firestore.Timestamp;
}

// Run hourly
export const aggregateAgentMetrics = onSchedule(
  {
    schedule: '0 * * * *',
    region: 'us-central1',
    memory: '256MiB',
  },
  async (event) => {
    try {
      const agentTypes = ['script', 'research', 'optimization', 'social'];
      const now = admin.firestore.Timestamp.now();
      const batch = db.batch();

      for (const agentId of agentTypes) {
        // Get activities for this agent
        const activitiesQuery = db.collection('AgentActivities').where('agentId', '==', agentId);

        const snapshot = await activitiesQuery.get();

        // Calculate metrics
        const metrics: AgentMetrics = {
          totalActivities: snapshot.size,
          completedActivities: 0,
          pendingActivities: 0,
          scheduledActivities: 0,
          lastAggregatedAt: now,
        };

        snapshot.docs.forEach((doc) => {
          const status = doc.data().status;
          switch (status) {
            case 'completed':
              metrics.completedActivities++;
              break;
            case 'pending':
              metrics.pendingActivities++;
              break;
            case 'scheduled':
              metrics.scheduledActivities++;
              break;
          }
        });

        // Store metrics
        const metricsRef = db.collection('AgentMetrics').doc(agentId);
        batch.set(metricsRef, metrics, { merge: true });

        functions.logger.info(`Metrics aggregated for agent: ${agentId}`, metrics);
      }

      await batch.commit();

      functions.logger.info('Metrics aggregation completed successfully', {
        timestamp: now.toDate().toISOString(),
      });
    } catch (error) {
      functions.logger.error('Error aggregating metrics', error);
      throw error; // Retrigger the function on failure
    }
  }
);
