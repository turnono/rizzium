import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

initializeApp();

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2024-12-18.acacia',
});

const db = getFirestore();

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  scanLimit: number;
  storageLimit: number;
  aiModel: 'gpt-3.5-turbo' | 'gpt-4';
  retentionDays: number;
  stripePriceId: string;
}

interface SubscriptionData {
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export const createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { planId } = data;
  const userId = context.auth.uid;

  try {
    // Get the plan details
    const planDoc = await db.collection('plans').doc(planId).get();
    if (!planDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Subscription plan not found');
    }

    const plan = planDoc.data() as SubscriptionPlan;

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: context.auth.token.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${functions.config().app.url}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.url}/settings`,
      metadata: {
        userId,
        planId,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Stripe session creation error:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create checkout session');
  }
});

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig as string, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (!metadata || !metadata.userId || !metadata.planId) {
          throw new Error('Missing required metadata');
        }

        const { userId, planId } = metadata;

        // Update user's subscription in Firestore
        await db
          .collection('users')
          .doc(userId)
          .collection('subscriptions')
          .doc('current')
          .set({
            planId,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            autoRenew: true,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          } as SubscriptionData);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();

        if (!usersSnapshot.empty) {
          const userId = usersSnapshot.docs[0].id;
          await db.collection('users').doc(userId).collection('subscriptions').doc('current').update({
            status: 'expired',
            autoRenew: false,
          });
        }

        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get current subscription
    const subscriptionDoc = await db.collection('users').doc(userId).collection('subscriptions').doc('current').get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'No active subscription found');
    }

    const subscription = subscriptionDoc.data() as SubscriptionData;
    if (!subscription?.stripeSubscriptionId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe subscription found');
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update subscription status in Firestore
    await subscriptionDoc.ref.update({
      status: 'cancelled',
      autoRenew: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    throw new functions.https.HttpsError('internal', 'Unable to cancel subscription');
  }
});
