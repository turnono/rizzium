import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

interface VideoSegment {
  segmentId: string;
  scriptText: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  scriptId: string;
  userId: string;
  segmentIndex: number;
}

export const processVideoSegment = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .pubsub.schedule('every 10 minutes')
  .onRun(async () => {
    let segmentDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | null = null;

    try {
      // Find the next pending segment
      const segmentQuery = await db
        .collection('VideoQueue')
        .where('status', '==', 'pending')
        .orderBy('createdAt')
        .limit(1)
        .get();

      if (segmentQuery.empty) {
        console.log('No pending segments found');
        return null;
      }

      segmentDoc = segmentQuery.docs[0];
      const segment = segmentDoc.data() as VideoSegment;

      // Update status to in-progress
      await segmentDoc.ref.update({
        status: 'in-progress',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Call Sora API (placeholder - replace with actual Sora API endpoint)
      const soraResponse = await axios.post(
        'https://api.sora.com/generate',
        {
          prompt: segment.scriptText,
          duration: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${functions.config().sora.apikey}`,
          },
        }
      );

      // Upload video to Firebase Storage
      const videoFileName = `videos/${segment.scriptId}/${segment.segmentIndex}.mp4`;
      const videoFile = bucket.file(videoFileName);

      // Download video from Sora and upload to Firebase Storage
      const videoBuffer = Buffer.from(soraResponse.data.videoData, 'base64');
      await videoFile.save(videoBuffer, {
        metadata: {
          contentType: 'video/mp4',
        },
      });

      const videoUrl = await videoFile.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Long expiration for demo
      });

      // Update segment status
      await segmentDoc.ref.update({
        status: 'completed',
        videoUrl: videoUrl[0],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update FinalVideo document
      const finalVideoQuery = await db
        .collection('FinalVideos')
        .where('scriptId', '==', segment.scriptId)
        .limit(1)
        .get();

      if (!finalVideoQuery.empty) {
        await finalVideoQuery.docs[0].ref.update({
          completedSegments: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    } catch (error) {
      console.error('Error processing video segment:', error);

      // Update segment with error status if we have a segment reference
      if (segmentDoc) {
        await segmentDoc.ref.update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    }
  });
