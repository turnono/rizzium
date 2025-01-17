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

interface StatusUpdate {
  activityId: string;
  status: 'completed' | 'pending' | 'scheduled';
  metadata?: Record<string, unknown>;
}

export const syncAgentStatus = onRequest({ cors: true }, async (request, response) => {
  try {
    const update: StatusUpdate = request.body;

    // Validate required fields
    if (!update.activityId || !update.status) {
      response.status(400).json({
        error: 'Missing required fields: activityId and status are required',
      });
      return;
    }

    // Validate status
    const validStatuses = ['completed', 'pending', 'scheduled'];
    if (!validStatuses.includes(update.status)) {
      response.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Get activity document
    const activityRef = db.collection('AgentActivities').doc(update.activityId);
    const activityDoc = await activityRef.get();

    if (!activityDoc.exists) {
      response.status(404).json({
        error: 'Activity not found',
      });
      return;
    }

    // Update status and metadata
    const updateData = {
      status: update.status,
      ...(update.metadata && { metadata: update.metadata }),
      updatedAt: FirebaseFirestore.Timestamp.now(),
    };

    await activityRef.update(updateData);

    logger.info('Status updated successfully', {
      activityId: update.activityId,
      status: update.status,
    });

    response.status(200).json({
      success: true,
      message: 'Status updated successfully',
    });
  } catch (error) {
    logger.error('Error updating status', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
