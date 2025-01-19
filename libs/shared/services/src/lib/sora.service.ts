import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';
import { Observable, from, map } from 'rxjs';

interface VideoResponse {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SoraService {
  private functions = inject(Functions);

  generateVideo(prompt: string): Observable<string> {
    const generateVideo = httpsCallable<{ prompt: string }, VideoResponse>(this.functions, 'generateSoraVideo');
    return from(generateVideo({ prompt })).pipe(map((result: HttpsCallableResult<VideoResponse>) => result.data.url));
  }
}
