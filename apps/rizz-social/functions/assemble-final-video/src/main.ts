import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

interface FinalVideo {
  scriptId: string;
  userId: string;
  status: 'processing' | 'completed' | 'error';
  totalSegments: number;
  completedSegments: number;
  videoUrl?: string;
  error?: string;
}

export const assembleFinalVideo = functions.firestore.document('FinalVideos/{videoId}').onUpdate(async (change) => {
  const newData = change.after.data() as FinalVideo;
  const previousData = change.before.data() as FinalVideo;

  // Only proceed if we've just completed all segments
  if (
    newData.completedSegments === newData.totalSegments &&
    previousData.completedSegments !== newData.totalSegments &&
    newData.status === 'processing'
  ) {
    try {
      // Get all segments
      const segments = await db
        .collection('VideoQueue')
        .where('scriptId', '==', newData.scriptId)
        .orderBy('segmentIndex')
        .get();

      const tempDir = os.tmpdir();
      const segmentFiles: string[] = [];

      // Download all segment videos
      for (const segment of segments.docs) {
        const segmentData = segment.data();
        const tempFilePath = path.join(tempDir, `segment_${segmentData.segmentIndex}.mp4`);

        // Download from Firebase Storage
        const videoFileName = `videos/${newData.scriptId}/${segmentData.segmentIndex}.mp4`;
        await bucket.file(videoFileName).download({
          destination: tempFilePath,
        });

        segmentFiles.push(tempFilePath);
      }

      // Create a file to list all segments for ffmpeg
      const listFilePath = path.join(tempDir, 'segments.txt');
      const listContent = segmentFiles.map((file) => `file '${file}'`).join('\n');
      fs.writeFileSync(listFilePath, listContent);

      // Output path for final video
      const outputPath = path.join(tempDir, 'final.mp4');

      // Combine videos using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(listFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions('-c copy')
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Upload final video to Firebase Storage
      const finalVideoPath = `final-videos/${newData.scriptId}/final.mp4`;
      await bucket.upload(outputPath, {
        destination: finalVideoPath,
        metadata: {
          contentType: 'video/mp4',
        },
      });

      // Get signed URL for the final video
      const [url] = await bucket.file(finalVideoPath).getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      // Update FinalVideo document
      await change.after.ref.update({
        status: 'completed',
        videoUrl: url,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Cleanup
      segmentFiles.forEach((file) => fs.unlinkSync(file));
      fs.unlinkSync(listFilePath);
      fs.unlinkSync(outputPath);
    } catch (error) {
      console.error('Error assembling final video:', error);
      await change.after.ref.update({
        status: 'error',
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  return null;
});
