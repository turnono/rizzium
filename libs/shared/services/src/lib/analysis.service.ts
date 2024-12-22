import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs, onSnapshot } from '@angular/fire/firestore';
import { Observable, from, switchMap } from 'rxjs';
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
}
