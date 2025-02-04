/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin
initializeApp();

// Get Firestore instance
const db = getFirestore();

/**
 * Scheduled function that runs daily to aggregate agent metrics
 */
export const aggregateAgentMetrics = onSchedule('0 0 * * *', async (event) => {
  try {
    logger.info('Starting agent metrics aggregation');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayTimestamp = Timestamp.fromDate(yesterday);

    // Query all agent activities from yesterday
    const activitiesSnapshot = await db
      .collection('agent-activities')
      .where('timestamp', '>=', yesterdayTimestamp)
      .get();

    // Initialize metrics object
    const metrics = {
      totalActivities: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      date: yesterdayTimestamp,
    };

    let totalExecutionTime = 0;

    // Process each activity
    activitiesSnapshot.forEach((doc) => {
      const activity = doc.data();
      metrics.totalActivities++;

      if (activity.status === 'success') {
        metrics.successfulTasks++;
      } else if (activity.status === 'failed') {
        metrics.failedTasks++;
      }

      if (activity.executionTime) {
        totalExecutionTime += activity.executionTime;
      }
    });

    // Calculate average execution time
    if (metrics.totalActivities > 0) {
      metrics.averageExecutionTime = totalExecutionTime / metrics.totalActivities;
    }

    // Store aggregated metrics
    await db.collection('agent-metrics').doc(yesterday.toISOString().split('T')[0]).set(metrics);

    logger.info('Successfully aggregated agent metrics', metrics);
  } catch (error) {
    logger.error('Error aggregating agent metrics:', error);
    throw error;
  }
});
