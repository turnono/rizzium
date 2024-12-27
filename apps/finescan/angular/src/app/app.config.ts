import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { firebaseConfig } from './firebase-config';
import { getApp } from 'firebase/app';
import { getStripePayments } from '@stripe/firestore-stripe-payments';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideIonicAngular({}),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
    {
      provide: 'STRIPE_PAYMENTS',
      useFactory: () => {
        const app = getApp();
        return getStripePayments(app, {
          productsCollection: 'products',
          customersCollection: 'stripe_customers',
        });
      },
    },
  ],
};
