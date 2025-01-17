import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions } from '@angular/fire/functions';

const firebaseConfig = {
  // Your Firebase config will be here
  // This should be loaded from environment variables in production
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideIonicAngular(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFunctions(() => getFunctions()),
  ],
};
