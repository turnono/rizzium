/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import axios, { AxiosError } from 'axios';

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

export const verifyPaystackPayment = onCall(async (request) => {
  try {
    // Validate request
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to verify payment');
    }

    const { reference } = request.data;
    if (!reference) {
      throw new HttpsError('invalid-argument', 'Payment reference is required');
    }

    // Get the secret key from environment variables
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      logger.error('Paystack secret key not configured');
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
        throw new HttpsError('internal', 'Failed to verify payment with Paystack');
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Unexpected error during payment verification:', error);
    throw new HttpsError('internal', 'An unexpected error occurred during payment verification');
  }
});
