import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, addDoc, Timestamp, updateDoc } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';
import { PaystackService } from './paystack.service';
import { SUBSCRIPTION_PLANS, Plan } from './plans.config';
import { Router } from '@angular/router';

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
  startDate: Timestamp;
  endDate: Timestamp;
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
  timestamp?: Timestamp;
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
  timestamp?: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(FirebaseAuthService);
  private paystackService = inject(PaystackService);
  private router = inject(Router);

  getAvailablePlans(): Observable<Plan[]> {
    return of(SUBSCRIPTION_PLANS).pipe(
      tap(async () => {
        try {
          const user = await this.authService.getCurrentUser();
          if (user?.tier) {
            // Only track if user and tier exist
            await this.trackPricingEvent({
              event: 'plan_viewed',
              planId: 'all',
              planTier: user.tier,
              userId: user.uid,
            });
          }
        } catch (error) {
          console.error('Error tracking plan view:', error);
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

  async trackPricingEvent(event: PricingAnalytics): Promise<void> {
    try {
      // Ensure planTier is defined by getting it from plans if needed
      if (!event.planTier && event.planId) {
        const plans = await this.getAvailablePlans()
          .pipe(map((plans) => plans.find((p) => p.id === event.planId)))
          .toPromise();
        if (plans) {
          event.planTier = plans.tier;
        }
      }

      // Only proceed if we have a valid planTier
      if (!event.planTier) {
        console.warn('Skipping pricing event tracking due to missing planTier:', event);
        return;
      }

      const analyticsRef = collection(this.firestore, 'pricing_events');
      const eventData: {
        userId: string;
        type: PricingAnalytics['event'];
        timestamp: Timestamp;
        planId: string;
        planTier: PlanTier;
        previousTier?: PlanTier;
        error?: string;
      } = {
        userId: event.userId,
        type: event.event,
        timestamp: Timestamp.now(),
        planId: event.planId,
        planTier: event.planTier,
      };

      if (event.previousTier) {
        eventData.previousTier = event.previousTier;
      }

      if (event.error) {
        eventData.error = event.error;
      }

      await addDoc(analyticsRef, eventData);
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

  async canUpgradeToPlan(planId: string): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) return false;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return false;

    // If user is already on pro tier, they can't upgrade
    if (user.tier === 'pro' && plan.tier === 'pro') {
      return false;
    }

    // If user is on free tier, they can upgrade to pro
    if (user.tier === 'free' && plan.tier === 'pro') {
      return true;
    }

    // If user is on pro tier, they can downgrade to free
    if (user.tier === 'pro' && plan.tier === 'free') {
      return true;
    }

    return false;
  }

  async upgradePlan(planId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const canUpgrade = await this.canUpgradeToPlan(planId);
    if (!canUpgrade) {
      throw new Error('Cannot upgrade to this plan. You might already be subscribed to this tier.');
    }

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
        const now = Timestamp.now();
        const thirtyDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

        // Update subscription
        const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
        await setDoc(subscriptionRef, {
          planId: plan.id,
          tier: plan.tier,
          status: 'active',
          startDate: now,
          endDate: thirtyDaysFromNow,
          autoRenew: true,
        } as UserSubscription);

        // Update user document
        const userRef = doc(this.firestore, `users/${user.uid}`);
        await updateDoc(userRef, {
          tier: plan.tier,
          subscriptionStatus: 'active',
          subscriptionEndDate: thirtyDaysFromNow,
        });

        // Update usage limits
        const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
        await setDoc(usageRef, {
          scansUsed: 0,
          scansLimit: plan.tier === 'free' ? 3 : 200,
          storageUsed: 0,
          storageLimit: plan.tier === 'free' ? 50 * 1024 * 1024 : 10 * 1024 * 1024 * 1024,
          retentionDays: plan.tier === 'free' ? 7 : 30,
          tier: plan.tier,
          lastResetDate: now,
        });

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

      // Track payment initiation for paid plans
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
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === paymentData.planId);
      if (!plan) throw new Error('Invalid plan');

      // Track payment completion
      await this.trackPaymentEvent({
        event: 'payment_completed',
        planId: paymentData.planId,
        planTier: plan.tier,
        userId: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
      });

      const now = Timestamp.now();
      const thirtyDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      // Update subscription
      const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
      await setDoc(subscriptionRef, {
        planId: paymentData.planId,
        tier: plan.tier,
        status: 'active',
        startDate: now,
        endDate: thirtyDaysFromNow,
        autoRenew: true,
        paystackReference: paymentData.transactionId,
      } as UserSubscription);

      // Update user's tier in user document
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await updateDoc(userRef, {
        tier: plan.tier,
        subscriptionStatus: 'active',
        subscriptionEndDate: thirtyDaysFromNow,
      });

      // Set usage limits for the plan
      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      await setDoc(usageRef, {
        scansUsed: 0,
        scansLimit: plan.tier === 'free' ? 3 : 200,
        storageUsed: 0,
        storageLimit: plan.tier === 'free' ? 50 * 1024 * 1024 : 10 * 1024 * 1024 * 1024,
        retentionDays: plan.tier === 'free' ? 7 : 30,
        tier: plan.tier,
        lastResetDate: now,
      });

      // Track successful upgrade
      await this.trackPricingEvent({
        event: 'upgrade_completed',
        planId: paymentData.planId,
        planTier: plan.tier,
        userId: user.uid,
        previousTier: user.tier,
      });

      // Redirect to home page
      await this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
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
