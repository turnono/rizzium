import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { VideoSegment, FinalVideo } from '../../../interfaces/src/lib/video-queue.interface';

@Injectable({
  providedIn: 'root',
})
export class VideoQueueService {
  private firestore = inject(Firestore);

  async segmentScript(scriptId: string, userId: string, fullScript: string): Promise<string[]> {
    // Split script into roughly 10-second segments (assuming ~15 words per 10 seconds)
    const words = fullScript.split(' ');
    const wordsPerSegment = 15;
    const segments: string[] = [];

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      segments.push(words.slice(i, i + wordsPerSegment).join(' '));
    }

    // Create video segments in Firestore
    const segmentIds: string[] = [];
    const videoQueueRef = collection(this.firestore, 'VideoQueue');

    for (let i = 0; i < segments.length; i++) {
      const segment: Omit<VideoSegment, 'segmentId'> = {
        scriptText: segments[i],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        scriptId,
        userId,
        segmentIndex: i,
      };

      const docRef = await addDoc(videoQueueRef, segment);
      segmentIds.push(docRef.id);
    }

    // Create final video document
    const finalVideoRef = collection(this.firestore, 'FinalVideos');
    await addDoc(finalVideoRef, {
      scriptId,
      userId,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalSegments: segments.length,
      completedSegments: 0,
    } as FinalVideo);

    return segmentIds;
  }

  async getVideoSegments(scriptId: string) {
    const videoQueueRef = collection(this.firestore, 'VideoQueue');
    const q = query(videoQueueRef, where('scriptId', '==', scriptId), orderBy('segmentIndex'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          segmentId: doc.id,
          ...doc.data(),
        } as VideoSegment)
    );
  }

  async getFinalVideo(scriptId: string) {
    const finalVideoRef = collection(this.firestore, 'FinalVideos');
    const q = query(finalVideoRef, where('scriptId', '==', scriptId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as FinalVideo & { id: string };
  }
}
