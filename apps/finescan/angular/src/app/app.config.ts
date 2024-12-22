import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { firebaseConfig } from './firebase-config';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { AnalysisService } from '@rizzium/shared/services';
import { AuthGuard, NotAuthGuard } from '@rizzium/shared/guards';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => {
      const auth = getAuth();
      auth.useDeviceLanguage();
      return auth;
    }),
    provideStorage(() => getStorage()),
    provideIonicAngular(),
    AnalysisService,
    AuthGuard,
    NotAuthGuard,
  ],
};
