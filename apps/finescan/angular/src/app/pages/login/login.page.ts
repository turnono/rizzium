import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Login to FineScan</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input type="email" formControlName="email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" formControlName="password"></ion-input>
            </ion-item>
            <ion-button expand="block" type="submit" [disabled]="!loginForm.valid" class="ion-margin-top">
              Login
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
export class LoginPage {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: FirebaseAuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        await this.authService.signInWithEmailAndPassword(this.loginForm.value.email, this.loginForm.value.password);
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  }
}
