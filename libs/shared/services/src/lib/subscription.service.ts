import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, collection, getDocs, setDoc } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';
import { PaystackService } from './paystack.service';

export type PlanTier = 'free' | 'basic' | 'pro' | 'business';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  features: string[];
  scanLimit: number;
  storageLimit: number;
  aiModel: 'gpt-3.5-turbo' | 'gpt-4';
  retentionDays: number;
  description: string;
  isPopular?: boolean;
}

export interface UserSubscription {
  planId: string;
  tier: PlanTier;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paystackReference?: string;
}

export interface UsageStats {
  scansUsed: number;
  scansLimit: number;
  storageUsed: number;
  storageLimit: number;
  retentionDays: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(FirebaseAuthService);
  private paystackService = inject(PaystackService);

  getAvailablePlans(): Observable<SubscriptionPlan[]> {
    const plansRef = collection(this.firestore, 'products');
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

    try {
      // Get plan details
      const planRef = doc(this.firestore, `products/${planId}`);
      const planDoc = await getDoc(planRef);
      if (!planDoc.exists()) throw new Error('Plan not found');

      const plan = planDoc.data() as SubscriptionPlan;
      if (plan.price === 0) {
        // Handle free plan
        const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
        await setDoc(subscriptionRef, {
          planId,
          tier: plan.tier,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          autoRenew: true,
        } as UserSubscription);
        return;
      }

      // Initialize Paystack payment
      await this.paystackService.initializePayment(plan.price, planId, user.email || '');
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
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
            scansLimit: 3, // Free tier default
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024, // 50MB free tier
            retentionDays: 7,
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
