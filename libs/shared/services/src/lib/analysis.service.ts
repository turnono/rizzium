import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Analysis } from '@rizzium/shared/interfaces';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  constructor(private firestore: Firestore, private authService: FirebaseAuthService) {}

  getUserAnalyses(): Observable<Analysis[]> {
    return from(this.authService.getCurrentUser()).pipe(
      map((user) => {
        if (!user) throw new Error('No authenticated user');
        return user.uid;
      }),
      map(async (userId) => {
        const analysisRef = collection(this.firestore, 'analyses');
        const q = query(analysisRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Analysis));
      }),
      from
    );
  }
}
