import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  DocumentSnapshot,
  DocumentData,
  Timestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { paystackConfig } from '../../../../../apps/finescan/angular/src/app/paystack.config';
import PaystackPop from '@paystack/inline-js';
import { SUBSCRIPTION_PLANS } from './plans.config';
import { Router } from '@angular/router';

interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
  redirecturl?: string;
}

interface PaystackVerifyResponse {
  status: 'success' | 'failed';
  amount: number;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    customer_code: string;
    phone: string;
    metadata: Record<string, unknown>;
    risk_action: string;
  };
  reference: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  };
}

export interface PaystackTransaction {
  reference: string;
  status: string;
  amount: number;
  planId: string;
  createdAt: Timestamp;
  customerEmail: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
  };
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  plan?: string;
  currency?: string;
  channels?: Array<'card' | 'bank_transfer' | 'apple_pay' | 'ussd' | 'mobile_money' | 'eft' | 'qr'>;
  label?: string;
  description?: string;
  metadata?: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  };
  onSuccess: (response: PaystackResponse) => void;
  onCancel: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class PaystackService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private config = paystackConfig;

  async initializePayment(planId: string, email: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    if (!this.config.publicKey) {
      throw new Error('Paystack public key not configured');
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error('Invalid plan selected');

    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const handler = new PaystackPop();
      handler.newTransaction({
        key: this.config.publicKey,
        email,
        amount: plan.price * 100, // Convert to cents
        ref: reference,
        plan: plan.planCode, // Use the Paystack plan code
        currency: 'ZAR',
        channels: ['card', 'bank_transfer'] as const,
        label: `Finescan ${plan.name} Plan - ${email}`,
        description: `${plan.name} Plan - ${plan.features.join(', ')}`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Plan Name',
              variable_name: 'plan_name',
              value: plan.name,
            },
            {
              display_name: 'Plan Features',
              variable_name: 'plan_features',
              value: plan.features.join(', '),
            },
            {
              display_name: 'Plan ID',
              variable_name: 'plan_id',
              value: planId,
            },
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: user.uid,
            },
          ],
        },
        onSuccess: async (response: PaystackResponse) => {
          if (response.status === 'success') {
            await this.verifyPayment(response.reference, planId);
          } else {
            throw new Error(response.message || 'Payment failed');
          }
        },
        onCancel: () => {
          console.log('Payment window closed');
        },
      } as PaystackOptions);
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  private async verifyPayment(reference: string, planId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    try {
      const verifyPayment = httpsCallable<{ reference: string }, PaystackVerifyResponse>(
        this.functions,
        'verifyPaystackPayment'
      );
      const { data } = await verifyPayment({ reference });

      if (data.status === 'success') {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
        if (!plan) throw new Error('Invalid plan');

        // Navigate to home immediately after payment verification
        this.router.navigate(['/home']);

        // Perform all updates in parallel
        const now = Timestamp.now();
        const thirtyDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

        // Check if usage document exists
        const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
        const usageDoc = await getDoc(usageRef);

        const updates = [
          // Update subscription
          setDoc(doc(this.firestore, `users/${user.uid}/subscriptions/current`), {
            planId,
            status: 'active',
            startDate: now,
            endDate: thirtyDaysFromNow,
            autoRenew: true,
            paystackReference: reference,
            lastPaymentDate: now,
            customerEmail: data.customer.email,
            customerMetadata: data.customer.metadata,
            metadata: data.metadata,
          }),

          // Update user document
          updateDoc(doc(this.firestore, `users/${user.uid}`), {
            tier: plan.tier,
            subscriptionStatus: 'active',
            subscriptionEndDate: thirtyDaysFromNow,
          }),

          // Create or update usage document
          setDoc(
            usageRef,
            {
              scansUsed: 0,
              scansLimit: plan.scanLimit,
              storageUsed: 0,
              storageLimit: plan.storageLimit,
              retentionDays: plan.retentionDays,
              tier: plan.tier,
              lastResetDate: now,
            },
            { merge: usageDoc.exists() }
          ),

          // Record transaction
          setDoc(doc(this.firestore, `users/${user.uid}/transactions/${reference}`), {
            reference,
            status: 'success',
            amount: data.amount / 100,
            planId,
            createdAt: now,
            customerEmail: data.customer.email,
            metadata: data.metadata,
            authorization: null,
          } as PaystackTransaction),
        ];

        await Promise.all(updates);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  getTransaction(reference: string): Observable<PaystackTransaction | null> {
    return from(this.authService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) throw new Error('User must be authenticated');
        const transactionRef = doc(this.firestore, `users/${user.uid}/transactions/${reference}`);
        return from(getDoc(transactionRef));
      }),
      map((snapshot: DocumentSnapshot<DocumentData>) =>
        snapshot.exists() ? (snapshot.data() as PaystackTransaction) : null
      ),
      catchError((error) => {
        console.error('Error fetching transaction:', error);
        return throwError(() => new Error('Failed to fetch transaction details'));
      })
    );
  }
}
