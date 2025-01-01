import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';
import { PaystackService } from './paystack.service';
import { SUBSCRIPTION_PLANS, Plan } from './plans.config';

export type PlanTier = 'free' | 'pro';

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

interface PricingAnalytics {
  event: 'plan_viewed' | 'upgrade_started' | 'upgrade_completed' | 'upgrade_failed';
  planId: string;
  planTier: PlanTier;
  userId: string;
  previousTier?: PlanTier;
  error?: string;
  timestamp?: Date;
}

interface PaymentEventData {
  planId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

interface PaymentAnalytics {
  event:
    | 'payment_initiated'
    | 'payment_completed'
    | 'payment_failed'
    | 'subscription_renewed'
    | 'subscription_cancelled'
    | 'refund_requested';
  planId: string;
  planTier: PlanTier;
  userId: string;
  previousTier?: PlanTier;
  error?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(FirebaseAuthService);
  private paystackService = inject(PaystackService);

  getAvailablePlans(): Observable<Plan[]> {
    return of(SUBSCRIPTION_PLANS).pipe(
      tap(async () => {
        const user = await this.authService.getCurrentUser();
        if (user) {
          // Track plan view
          await this.trackPricingEvent({
            event: 'plan_viewed',
            planId: 'all',
            planTier: user.tier,
            userId: user.uid,
          });
        }
      })
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

  private async trackPricingEvent(event: PricingAnalytics): Promise<void> {
    try {
      const analyticsRef = collection(this.firestore, 'analytics/pricing/events');
      await addDoc(analyticsRef, {
        ...event,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error tracking pricing event:', error);
    }
  }

  private async trackPaymentEvent(event: PaymentAnalytics): Promise<void> {
    try {
      const analyticsRef = collection(this.firestore, 'analytics/payments/events');
      await addDoc(analyticsRef, {
        ...event,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error tracking payment event:', error);
    }
  }

  async upgradePlan(planId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) throw new Error('Invalid plan selected');

      // Track upgrade initiation
      await this.trackPricingEvent({
        event: 'upgrade_started',
        planId: plan.id,
        planTier: plan.tier,
        userId: user.uid,
        previousTier: user.tier,
      });

      if (plan.price === 0) {
        // Handle free plan
        const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
        await setDoc(subscriptionRef, {
          planId: plan.id,
          tier: plan.tier,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          autoRenew: true,
        } as UserSubscription);

        // Track successful upgrade
        await this.trackPricingEvent({
          event: 'upgrade_completed',
          planId: plan.id,
          planTier: plan.tier,
          userId: user.uid,
          previousTier: user.tier,
        });
        return;
      }

      // Track payment initiation
      await this.trackPaymentEvent({
        event: 'payment_initiated',
        planId: plan.id,
        planTier: plan.tier,
        userId: user.uid,
        amount: plan.price,
        currency: 'ZAR',
      });

      // Initialize Paystack payment
      await this.paystackService.initializePayment(planId, user.email || '');
    } catch (error) {
      // Track failed payment
      await this.trackPaymentEvent({
        event: 'payment_failed',
        planId: planId,
        planTier: SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.tier || 'pro',
        userId: user.uid,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Track failed upgrade
      await this.trackPricingEvent({
        event: 'upgrade_failed',
        planId: planId,
        planTier: SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.tier || 'pro',
        userId: user.uid,
        previousTier: user.tier,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Error upgrading plan:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentData: PaymentEventData): Promise<void> {
    await this.trackPaymentEvent({
      event: 'payment_completed',
      planId: paymentData.planId,
      planTier: 'pro',
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
    });
  }

  async cancelSubscription(userId: string, planId: string): Promise<void> {
    await this.trackPaymentEvent({
      event: 'subscription_cancelled',
      planId,
      planTier: 'pro',
      userId,
    });
  }

  async requestRefund(userId: string, planId: string, amount: number): Promise<void> {
    await this.trackPaymentEvent({
      event: 'refund_requested',
      planId,
      planTier: 'pro',
      userId,
      amount,
      currency: 'ZAR',
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
