/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Initialize Firestore
const db = getFirestore();

// Run daily at midnight
export const cleanupOldActivities = onSchedule('0 0 * * *', async () => {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = FirebaseFirestore.Timestamp.fromDate(thirtyDaysAgo);

    // Query old activities
    const oldActivitiesQuery = db
      .collection('AgentActivities')
      .where('timestamp', '<', cutoffTimestamp)
      .orderBy('timestamp', 'asc')
      .limit(500); // Process in batches to avoid timeout

    const snapshot = await oldActivitiesQuery.get();

    if (snapshot.empty) {
      logger.info('No old activities to clean up');
      return;
    }

    // Delete in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info('Cleanup completed successfully', {
      deletedCount: snapshot.size,
      cutoffDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error) {
    logger.error('Error cleaning up old activities', error);
    throw error; // Retrigger the function on failure
  }
});
