import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isLogin ? 'Login' : 'Register' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-segment [(ngModel)]="isLogin">
        <ion-segment-button value="true">
          <ion-label>Login</ion-label>
        </ion-segment-button>
        <ion-segment-button value="false">
          <ion-label>Register</ion-label>
        </ion-segment-button>
      </ion-segment>

      <form (ngSubmit)="onSubmit()">
        <ion-input label="Email" type="email" [(ngModel)]="email" name="email" required></ion-input>
        <ion-input label="Password" type="password" [(ngModel)]="password" name="password" required></ion-input>
        <ion-button expand="block" type="submit">{{ isLogin ? 'Login' : 'Register' }}</ion-button>
      </form>

      <div class="divider">
        <span>OR</span>
      </div>

      <ion-button expand="block" (click)="signInWithGoogle()">
        <ion-icon name="logo-google" slot="start"></ion-icon>
        Sign in with Google
      </ion-button>
    </ion-content>
  `,
  styles: [`
    form {
      margin-top: 20px;
    }
    ion-input {
      margin-bottom: 15px;
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 20px 0;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #ccc;
    }
    .divider span {
      padding: 0 10px;
    }
  `],
})
export class LoginComponent {
  isLogin = true;
  email = '';
  password = '';

  constructor(private authService: FirebaseAuthService, private router: Router) {}

  async onSubmit() {
    try {
      if (this.isLogin) {
        await this.authService.signInWithEmail(this.email, this.password);
      } else {
        await this.authService.signUpWithEmail(this.email, this.password);
      }
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error:', error);
      // TODO: Show error message to user
    }
  }

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // TODO: Show error message to user
    }
  }
}
