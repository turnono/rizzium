import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { of, from } from 'rxjs';

import {
  IonContent,
  IonIcon,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonImg,
  ToastController,
} from '@ionic/angular/standalone';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
    IonContent,
    IonSpinner,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonText,
    IonIcon,
    IonButton,
    IonImg,
  ],
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  authMode: 'login' | 'register' = 'login';
  hidePassword = true;
  errorMessage = '';
  private toastService = inject(ToastController);
  businessId?: string;

  constructor(
    private fb: FormBuilder,
    private authService: FirebaseAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ eyeOffOutline, eyeOutline });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
    });
  }

  ngOnInit() {
    console.log('Route:', this.route.snapshot.queryParams);
    this.businessId = this.route.snapshot.queryParams['businessId'] as string;
    console.log('Business ID:', this.businessId);
    this.authService.user$.subscribe((user) => {
      if (user) {
        if (this.businessId) {
          // navigate to the business dashboard
          console.log(
            'User already logged in, redirecting to business dashboard'
          );
          this.router.navigate(['/business', this.businessId]);
        } else {
          console.log('User already logged in, redirecting to home');
          this.router.navigate(['/home']);
        }
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (this.authMode === 'login') {
        this.signIn(email, password);
      } else {
        this.register(email, password);
      }
    }
  }

  async signIn(email: string, password: string) {
    this.authService
      .signInWithEmailAndPassword(email, password)
      .pipe(
        tap(() => {
          if (this.businessId) {
            this.router.navigate(['/business', this.businessId]);
          } else {
            this.router.navigate(['/home']);
          }
        }),
        catchError((error) => {
          console.error('Error signing in:', error);
          this.errorMessage = error.message;
          return of(null);
        })
      )
      .subscribe();
  }

  async register(email: string, password: string) {
    from(this.authService.createUserWithEmailAndPassword(email, password))
      .pipe(
        tap(async () => {
          // TODO: send email verification
          // pop up a toast
          const toast = await this.toastService.create({
            message: 'Registration successful',
            duration: 5000,
            position: 'top',
            color: 'success',
          });
          toast.present();
          if (this.businessId) {
            // navigate to the business dashboard
            this.router.navigate(['/business', this.businessId]);
          } else {
            this.router.navigate(['/home']);
          }
          this.loginForm.reset();
          this.errorMessage = '';
        }),
        catchError((error) => {
          console.error('Error registering:', error);
          this.errorMessage = error.message;
          return of(null);
        })
      )
      .subscribe();
  }

  signInWithGoogle() {
    this.authService
      .signInWithGoogle()
      .pipe(
        tap(() => {
          if (this.businessId) {
            this.router.navigate(['/business', this.businessId]);
          } else {
            this.router.navigate(['/home']);
          }
        }),
        catchError((error) => {
          console.error('Error signing in with Google:', error);
          this.errorMessage = error.message;
          return of(null);
        })
      )
      .subscribe();
  }

  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    this.loginForm.reset();
    this.errorMessage = '';
  }
}
