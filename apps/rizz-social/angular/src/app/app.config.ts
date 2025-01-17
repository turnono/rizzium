import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBTUXSQK1zMr1m3cMhMHu6hcyLk5pbuqJU',
  authDomain: 'rizz-social.firebaseapp.com',
  databaseURL: 'https://rizz-social-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'rizz-social',
  storageBucket: 'rizz-social.firebasestorage.app',
  messagingSenderId: '819830364542',
  appId: '1:819830364542:web:6ccabfc472c507fe62bb2f',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideIonicAngular(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideAuth(() => getAuth()),
  ],
};
