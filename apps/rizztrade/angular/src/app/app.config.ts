import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { appRoutes } from './app.routes';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { firebaseConfig } from './firebase-config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { arrowDownOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

// Register Ionicons
addIcons({
  'arrow-down-outline': arrowDownOutline,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
  ],
};
