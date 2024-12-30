import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, orderBy, onSnapshot, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, switchMap } from 'rxjs';
import { Analysis } from '@rizzium/shared/interfaces';
import { FirebaseAuthService } from './firebase-auth.service';
import { UsageLimitService } from './usage-limit.service';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  private usageLimitService = inject(UsageLimitService);

  getUserAnalyses(): Observable<Analysis[]> {
    return from(this.authService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) throw new Error('No authenticated user');

        const analysisRef = collection(this.firestore, `users/${user.uid}/analyses`);
        const q = query(analysisRef, orderBy('createdAt', 'desc'));

        return new Observable<Analysis[]>((observer) => {
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const analyses = snapshot.docs.map(
                (doc) =>
                  ({
                    id: doc.id,
                    ...doc.data(),
                  } as Analysis)
              );
              observer.next(analyses);
            },
            (error) => {
              console.error('Error fetching analyses:', error);
              observer.error(error);
            }
          );

          // Return cleanup function
          return () => unsubscribe();
        });
      })
    );
  }

  async startAnalysis(analysisId: string): Promise<boolean> {
    return this.usageLimitService.checkAndIncrementUsage();
  }

  async deleteAnalysis(analysisId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const analysisRef = doc(this.firestore, `users/${user.uid}/analyses/${analysisId}`);
    await deleteDoc(analysisRef);
  }
}
