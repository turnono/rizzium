import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { VideoSegment, FinalVideo } from '../interfaces/video-queue.interface';

@Injectable({
  providedIn: 'root',
})
export class VideoQueueService {
  private firestore = inject(Firestore);

  getVideoSegments(scriptId: string): Observable<VideoSegment[]> {
    const segmentsRef = collection(this.firestore, 'VideoQueue');
    const segmentsQuery = query(segmentsRef, where('scriptId', '==', scriptId), orderBy('segmentIndex'));

    return collectionData(segmentsQuery).pipe(map((segments) => segments as VideoSegment[]));
  }

  getFinalVideo(scriptId: string): Observable<FinalVideo> {
    const finalVideoRef = collection(this.firestore, 'FinalVideos');
    const finalVideoQuery = query(finalVideoRef, where('scriptId', '==', scriptId));

    return collectionData(finalVideoQuery).pipe(map((videos) => (videos[0] || null) as FinalVideo));
  }
}
