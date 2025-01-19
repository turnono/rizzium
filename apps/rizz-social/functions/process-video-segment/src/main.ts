import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

interface ContentScheduleRequest {
  content: {
    id: string;
    title: string;
    description: string;
    platform: 'tiktok';
    scheduledTime: string; // ISO string
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    mediaUrls?: string[];
    tags?: string[];
  };
  action: 'schedule' | 'update' | 'delete' | 'get' | 'list';
}

interface ScheduleResponse {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
}

export const manageContentCalendar = onRequest({ cors: true }, async (request, response) => {
  try {
    const { content, action }: ContentScheduleRequest = request.body;

    if (!action) {
      response.status(400).json({
        success: false,
        message: 'Action is required',
      });
      return;
    }

    const db = admin.firestore();
    const contentRef = db.collection('content-calendar');
    let doc: admin.firestore.DocumentSnapshot;
    let snapshot: admin.firestore.QuerySnapshot;
    let result: ScheduleResponse;

    switch (action) {
      case 'schedule':
        if (!content || !content.scheduledTime) {
          throw new Error('Content and scheduled time are required for scheduling');
        }

        await contentRef.doc(content.id).set({
          ...content,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: 'Content scheduled successfully',
          data: { id: content.id },
        };
        break;

      case 'update':
        if (!content || !content.id) {
          throw new Error('Content ID is required for updates');
        }

        await contentRef.doc(content.id).update({
          ...content,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: 'Content updated successfully',
        };
        break;

      case 'delete':
        if (!content || !content.id) {
          throw new Error('Content ID is required for deletion');
        }

        await contentRef.doc(content.id).delete();

        result = {
          success: true,
          message: 'Content deleted successfully',
        };
        break;

      case 'get':
        if (!content || !content.id) {
          throw new Error('Content ID is required');
        }

        doc = await contentRef.doc(content.id).get();

        result = {
          success: true,
          data: doc.exists ? (doc.data() as Record<string, unknown>) : null,
        };
        break;

      case 'list':
        snapshot = await contentRef.orderBy('scheduledTime', 'asc').limit(100).get();

        result = {
          success: true,
          data: {
            items: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
          },
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    logger.info('Content calendar operation completed', {
      action,
      contentId: content?.id,
    });

    response.status(200).json(result);
  } catch (error) {
    logger.error('Error in content calendar management', error);
    response.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
