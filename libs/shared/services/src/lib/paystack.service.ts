import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, DocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { paystackConfig } from '../../../../../apps/finescan/angular/src/app/paystack.config';
import PaystackPop from '@paystack/inline-js';

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  message?: string;
  transaction?: string;
}

interface PaystackVerifyResponse {
  status: string;
  amount: number;
  customer: {
    email: string;
    metadata?: Record<string, unknown>;
  };
}

export interface PaystackTransaction {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  planId: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency: string;
  channels: Array<'card' | 'bank_transfer' | 'ussd' | 'qr' | 'mobile_money'>;
  metadata: {
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
  private config = paystackConfig;

  async initializePayment(amount: number, planId: string, email: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    if (!this.config.publicKey) {
      throw new Error('Paystack public key not configured');
    }

    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const handler = new PaystackPop();
      handler.newTransaction({
        key: this.config.publicKey,
        email,
        amount: amount * 100, // Convert to kobo
        ref: reference,
        currency: 'NGN',
        channels: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'],
        metadata: {
          custom_fields: [
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
      throw new Error('Failed to initialize payment. Please try again.');
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
        // Update user's subscription
        const subscriptionRef = doc(this.firestore, `users/${user.uid}/subscriptions/current`);
        const subscriptionData = {
          planId,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          autoRenew: true,
          paystackReference: reference,
          lastPaymentDate: new Date(),
          customerEmail: data.customer.email,
          customerMetadata: data.customer.metadata,
        };

        await setDoc(subscriptionRef, subscriptionData);

        // Record the transaction
        const transactionRef = doc(this.firestore, `users/${user.uid}/transactions/${reference}`);
        await setDoc(transactionRef, {
          reference,
          status: 'success',
          amount: data.amount / 100, // Convert from kobo back to main currency
          planId,
          createdAt: new Date(),
          customerEmail: data.customer.email,
          metadata: data.customer.metadata,
        } as PaystackTransaction);
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
