import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, collection, getDocs } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  scanLimit: number;
  storageLimit: number;
  aiModel: 'gpt-3.5-turbo' | 'gpt-4';
  retentionDays: number;
}

export interface UserSubscription {
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface UsageStats {
  scansUsed: number;
  scansLimit: number;
  storageUsed: number;
  storageLimit: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(FirebaseAuthService);

  getAvailablePlans(): Observable<SubscriptionPlan[]> {
    const plansRef = collection(this.firestore, 'plans');
    return from(getDocs(plansRef)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as SubscriptionPlan)
        )
      )
    );
  }

  getCurrentSubscription(): Observable<UserSubscription | null> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(null);
        const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
        return from(getDoc(subscriptionRef)).pipe(
          map((doc) => (doc.exists() ? (doc.data() as UserSubscription) : null))
        );
      })
    );
  }

  async upgradePlan(planId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const upgradePlanFunction = httpsCallable(this.functions, 'upgradePlan');
    return upgradePlanFunction({ planId }).then(() => {
      // Update local subscription data
      const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
      return updateDoc(subscriptionRef, {
        planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        autoRenew: true,
      });
    });
  }

  async cancelSubscription(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const cancelSubscriptionFunction = httpsCallable(this.functions, 'cancelSubscription');
    return cancelSubscriptionFunction({}).then(() => {
      const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
      return updateDoc(subscriptionRef, {
        status: 'cancelled',
        autoRenew: false,
      });
    });
  }

  getUsageStats(): Observable<UsageStats> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(null);
        const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
        return from(getDoc(usageRef));
      }),
      map((doc) => {
        if (!doc?.exists()) {
          return {
            scansUsed: 0,
            scansLimit: 10, // Free tier default
            storageUsed: 0,
            storageLimit: 100 * 1024 * 1024, // 100MB free tier
          } as UsageStats;
        }
        return doc.data() as UsageStats;
      }),
      catchError((error) => {
        console.error('Error fetching usage stats:', error);
        return throwError(() => error);
      })
    );
  }
}
