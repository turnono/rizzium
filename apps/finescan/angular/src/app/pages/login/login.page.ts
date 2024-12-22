import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { HeaderComponent } from '@rizzium/shared/ui/organisms';
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
import { ErrorHandlerService } from '@rizzium/shared/services';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
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
    <rizzium-header
      [title]="authMode === 'login' ? 'Login' : 'Register'"
      [showBackButton]="false"
      [(authMode)]="authMode"
      (buttonClicked)="onHeaderButtonClick($event)"
    >
    </rizzium-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ authMode === 'login' ? 'Login to' : 'Register for' }} FineScan</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input type="email" formControlName="email" data-cy="email-input"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" formControlName="password" data-cy="password-input"></ion-input>
            </ion-item>

            @if (authMode === 'register') {
            <ion-item>
              <ion-label position="floating">Confirm Password</ion-label>
              <ion-input type="password" formControlName="confirmPassword" data-cy="confirm-password-input">
              </ion-input>
            </ion-item>
            }

            <ion-button
              expand="block"
              type="submit"
              [disabled]="!authForm.valid"
              class="ion-margin-top"
              data-cy="submit-button"
            >
              {{ authMode === 'login' ? 'Login' : 'Register' }}
            </ion-button>

            <div class="auth-toggle">
              <ion-button fill="clear" (click)="toggleAuthMode()" data-cy="auth-mode-toggle">
                {{ authMode === 'login' ? 'Register' : 'Login' }}
              </ion-button>
            </div>

            @if (errorMessage) {
            <ion-text color="danger" data-cy="error-message" class="ion-padding">
              {{ errorMessage }}
            </ion-text>
            }
          </form>
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

      ion-text {
        display: block;
        text-align: center;
        margin-top: 1rem;
      }

      .auth-toggle {
        margin-top: 1rem;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class LoginPage implements OnInit {
  authMode: 'login' | 'register' = 'login';
  authForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: FirebaseAuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.initForm();
  }

  ngOnInit() {
    // Check if user is already logged in
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  private initForm() {
    const baseForm = {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    };

    if (this.authMode === 'register') {
      this.authForm = this.fb.group(
        {
          ...baseForm,
          confirmPassword: ['', [Validators.required]],
        },
        { validator: this.passwordMatchValidator }
      );
    } else {
      this.authForm = this.fb.group(baseForm);
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.authForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      try {
        const { email, password } = this.authForm.value;

        if (this.authMode === 'login') {
          await this.authService.signInWithEmailAndPassword(email, password);
        } else {
          await this.authService.createUserWithEmailAndPassword(email, password);
        }

        this.router.navigate(['/']);
      } catch (error) {
        await this.errorHandler.handleError(error);
      } finally {
        this.loading = false;
      }
    } else {
      if (this.authForm.get('email')?.hasError('email')) {
        this.errorMessage = 'Invalid email format';
      } else if (this.authForm.hasError('mismatch')) {
        this.errorMessage = 'Passwords do not match';
      } else {
        this.errorMessage = 'Please fill in all required fields';
      }
    }
  }

  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    this.errorMessage = ''; // Clear any existing error messages
    this.initForm(); // Reinitialize the form for the new mode
  }

  onHeaderButtonClick(event: string) {
    if (event === 'logout') {
      this.router.navigate(['/login']);
    }
  }
}
