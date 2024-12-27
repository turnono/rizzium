import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, collection, getDocs } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';
import { getStripePayments, createCheckoutSession } from '@stripe/firestore-stripe-payments';
import type { Stripe } from '@stripe/stripe-js';
import { getApp } from 'firebase/app';

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
  stripePriceId?: string;
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
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
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
  private payments: ReturnType<typeof getStripePayments>;

  constructor() {
    const app = getApp();
    this.payments = getStripePayments(app, {
      productsCollection: 'products',
      customersCollection: 'stripe_customers',
    });
  }

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
        const subscriptionRef = doc(this.firestore, `stripe_customers/${user.uid}/subscriptions/current`);
        return from(getDoc(subscriptionRef)).pipe(
          map((doc) => (doc.exists() ? (doc.data() as UserSubscription) : null))
        );
      })
    );
  }

  async upgradePlan(priceId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    try {
      const session = await createCheckoutSession(this.payments, {
        price: priceId,
        success_url: window.location.origin + '/settings',
        cancel_url: window.location.origin + '/pricing',
      });

      window.location.assign(session.url);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async openCustomerPortal(): Promise<void> {
    const portalFunction = httpsCallable(this.functions, 'ext-firestore-stripe-payments-createPortalLink');
    const { data } = await portalFunction({
      returnUrl: window.location.origin + '/settings',
    });
    window.location.assign((data as { url: string }).url);
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
