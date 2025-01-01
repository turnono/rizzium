/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { defineString } from 'firebase-functions/params';

// Define configuration parameters
const paystackSecretKey = defineString('PAYSTACK_SECRET_KEY');

// Initialize Firebase Admin
initializeApp();

interface PaystackMetadata {
  [key: string]: string | number | boolean;
}

interface PaystackCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string;
  metadata: PaystackMetadata;
  risk_action: string;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: PaystackMetadata;
    customer: PaystackCustomer;
  };
}

interface PaystackWebhookData {
  event:
    | 'charge.success'
    | 'subscription.create'
    | 'subscription.disable'
    | 'invoice.create'
    | 'invoice.payment_failed';
  data: {
    metadata: {
      custom_fields: Array<{
        display_name: string;
        variable_name: string;
        value: string | number;
      }>;
    };
    customer: {
      email: string;
      metadata: {
        user_id: string;
      };
    };
    reference: string;
    amount: number;
    plan?: {
      plan_code: string;
    };
    subscription?: {
      next_payment_date: string;
    };
  };
}

export const verifyPaystackPayment = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    try {
      // Validate request
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to verify payment');
      }

      const { reference } = request.data;
      if (!reference) {
        throw new HttpsError('invalid-argument', 'Payment reference is required');
      }

      const db = getFirestore();
      const eventRef = db.collection('payment_events').doc();

      try {
        // Get the secret key from environment variables
        const secretKey = paystackSecretKey.value();
        if (!secretKey) {
          logger.error('Paystack secret key not configured');
          await eventRef.set({
            userId: request.auth.uid,
            type: 'payment_verification',
            status: 'error',
            error: 'Payment verification not configured properly',
            timestamp: new Date(),
            reference,
          });
          throw new HttpsError('failed-precondition', 'Payment verification is not configured properly');
        }

        // Verify the payment
        try {
          const response = await axios.get<PaystackVerifyResponse>(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data.status && response.data.data.status === 'success') {
            // Record successful verification
            await eventRef.set({
              userId: request.auth.uid,
              type: 'payment_verification',
              status: 'success',
              timestamp: new Date(),
              reference,
              amount: response.data.data.amount,
              customerEmail: response.data.data.customer.email,
            });

            return {
              status: 'success' as const,
              amount: response.data.data.amount,
              customer: response.data.data.customer,
              reference: response.data.data.reference,
              metadata: response.data.data.metadata,
            };
          } else {
            logger.warn('Payment verification failed', {
              reference,
              status: response.data.data.status,
              message: response.data.data.gateway_response,
            });

            // Record failed verification
            await eventRef.set({
              userId: request.auth.uid,
              type: 'payment_verification',
              status: 'failed',
              error: response.data.data.gateway_response,
              timestamp: new Date(),
              reference,
            });

            throw new HttpsError(
              'failed-precondition',
              'Payment verification failed: ' + response.data.data.gateway_response
            );
          }
        } catch (error) {
          if (error instanceof AxiosError) {
            logger.error('Paystack API error:', {
              status: error.response?.status,
              data: error.response?.data,
              reference,
            });

            // Record API error
            await eventRef.set({
              userId: request.auth.uid,
              type: 'payment_verification',
              status: 'error',
              error: 'Failed to verify payment with Paystack',
              details: {
                status: error.response?.status,
                data: error.response?.data,
              },
              timestamp: new Date(),
              reference,
            });

            throw new HttpsError('internal', 'Failed to verify payment with Paystack');
          }
          throw error;
        }
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }
        logger.error('Unexpected error during payment verification:', error);

        // Record unexpected error
        await eventRef.set({
          userId: request.auth.uid,
          type: 'payment_verification',
          status: 'error',
          error: 'Unexpected error during payment verification',
          timestamp: new Date(),
          reference,
        });

        throw new HttpsError('internal', 'An unexpected error occurred during payment verification');
      }
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error('Unexpected error during payment verification:', error);
      throw new HttpsError('internal', 'An unexpected error occurred during payment verification');
    }
  }
);

export const paystackWebhook = onRequest(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  async (request, response) => {
    try {
      const hash = crypto.createHmac('sha512', paystackSecretKey.value() || '');
      const expectedSignature = hash.update(JSON.stringify(request.body)).digest('hex');
      const paystackSignature = request.headers['x-paystack-signature'];

      if (expectedSignature !== paystackSignature) {
        logger.error('Invalid Paystack signature');
        response.status(401).send('Invalid signature');
        return;
      }

      const event = request.body;
      const db = getFirestore();

      switch (event.event) {
        case 'charge.success':
          await handleSuccessfulCharge(event.data, db);
          break;
        case 'subscription.create':
          await handleSubscriptionCreate(event.data, db);
          break;
        case 'subscription.disable':
          await handleSubscriptionDisable(event.data, db);
          break;
        case 'invoice.create':
          await handleInvoiceCreate(event.data, db);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data, db);
          break;
        default:
          logger.info(`Unhandled Paystack event: ${event.event}`);
      }

      response.status(200).send('Webhook processed');
    } catch (error) {
      logger.error('Error processing webhook:', error);
      response.status(500).send('Webhook processing failed');
    }
  }
);

async function handleSuccessfulCharge(data: PaystackWebhookData['data'], db: FirebaseFirestore.Firestore) {
  const { metadata, customer, reference, amount } = data;
  const userId = metadata?.custom_fields?.find(
    (field: { variable_name: string; value: string | number }) => field.variable_name === 'user_id'
  )?.value;

  if (!userId) {
    logger.error('User ID not found in metadata', { reference });
    return;
  }

  const subscriptionRef = db.doc(`users/${userId}/subscriptions/current`);
  const transactionRef = db.doc(`users/${userId}/transactions/${reference}`);

  await db.runTransaction(async (transaction) => {
    // Update subscription status
    transaction.set(
      subscriptionRef,
      {
        status: 'active',
        lastPaymentDate: new Date(),
        paystackReference: reference,
      },
      { merge: true }
    );

    // Record transaction
    transaction.set(transactionRef, {
      reference,
      status: 'success',
      amount: amount / 100,
      createdAt: new Date(),
      customerEmail: customer.email,
      metadata: metadata,
    });
  });
}

async function handleSubscriptionCreate(data: PaystackWebhookData['data'], db: FirebaseFirestore.Firestore) {
  const { customer, plan } = data;
  const subscriptionRef = db.doc(`users/${customer.metadata.user_id}/subscriptions/current`);

  await subscriptionRef.set(
    {
      status: 'active',
      planCode: plan.plan_code,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: true,
    },
    { merge: true }
  );
}

async function handleSubscriptionDisable(data: PaystackWebhookData['data'], db: FirebaseFirestore.Firestore) {
  const { customer } = data;
  const subscriptionRef = db.doc(`users/${customer.metadata.user_id}/subscriptions/current`);

  await subscriptionRef.set(
    {
      status: 'cancelled',
      autoRenew: false,
    },
    { merge: true }
  );
}

async function handleInvoiceCreate(data: PaystackWebhookData['data'], db: FirebaseFirestore.Firestore) {
  const { customer, subscription } = data;
  const subscriptionRef = db.doc(`users/${customer.metadata.user_id}/subscriptions/current`);

  await subscriptionRef.set(
    {
      nextBillingDate: new Date(subscription.next_payment_date),
    },
    { merge: true }
  );
}

async function handlePaymentFailed(data: PaystackWebhookData['data'], db: FirebaseFirestore.Firestore) {
  const { customer } = data;
  const subscriptionRef = db.doc(`users/${customer.metadata.user_id}/subscriptions/current`);

  await subscriptionRef.set(
    {
      status: 'payment_failed',
      lastFailedPayment: new Date(),
    },
    { merge: true }
  );
}
