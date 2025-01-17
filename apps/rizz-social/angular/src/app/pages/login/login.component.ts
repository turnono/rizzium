import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { logoGoogle } from 'ionicons/icons';
import { Auth, GoogleAuthProvider, signInWithPopup, authState } from '@angular/fire/auth';
import { signal } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Welcome to RizzSocial</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" (click)="signInWithGoogle()" [disabled]="isLoading()">
            @if (!isLoading()) {
            <ion-icon slot="start" [icon]="googleIcon"></ion-icon>
            Sign in with Google } @else {
            <ion-spinner name="dots"></ion-spinner>
            }
          </ion-button>

          @if (error()) {
          <ion-text color="danger" class="error-message">
            {{ error() }}
          </ion-text>
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      ion-card {
        max-width: 400px;
        margin: 2rem auto;
      }

      ion-card-header {
        text-align: center;
      }

      ion-button {
        margin-top: 1rem;
      }

      .error-message {
        display: block;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginComponent {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  googleIcon = logoGoogle;
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Check if already authenticated
    authState(this.auth).subscribe((user) => {
      if (user) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async signInWithGoogle() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log('Successfully signed in:', result.user);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      this.error.set('Failed to sign in with Google. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
