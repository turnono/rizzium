import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ErrorHandlerService,
  FirebaseAuthService,
} from '@rizzpos/shared/services';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, take, tap } from 'rxjs/operators';
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
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
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
    IonImg,
  ],
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  authMode: 'login' | 'register' = 'login';
  hidePassword = true;
  errorMessage = '';
  private toastService = inject(ToastController);

  constructor(
    private formBuilder: FormBuilder,
    private authService: FirebaseAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
    });
  }

  ngOnInit() {
    // Check if there's a returnUrl in the query params
    this.route.queryParams.pipe(take(1)).subscribe((params: any) => {
      if (params['returnUrl']) {
        // If there's a returnUrl, we'll handle it in the login method
        console.log('Return URL found:', params['returnUrl']);
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        if (this.authMode === 'login') {
          await this.login(email, password);
        } else {
          await this.register(email, password);
        }
      } catch (error) {
        this.errorHandler.handleError(error, 'Login failed');
      }
    }
  }

  async login(email: string, password: string) {
    try {
      await this.authService
        .signInWithEmailAndPassword(email, password)
        .toPromise();
      const user = await this.authService.getCurrentUser();
      if (user) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        if (returnUrl.includes('businessId')) {
          // If returning to a business-specific page, get the role for that business
          const businessId = new URL(
            returnUrl,
            window.location.origin
          ).searchParams.get('businessId');
          if (businessId) {
            const role = await this.authService.getUserRoleForBusiness(
              businessId
            );
            this.redirectBasedOnRole(businessId, role);
          } else {
            this.router.navigateByUrl(returnUrl);
          }
        } else {
          // If no specific business, redirect to home
          this.router.navigateByUrl('/home');
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'Login failed');
    }
  }

  async register(email: string, password: string) {
    try {
      await this.authService.createUserWithEmailAndPassword(email, password);
      this.showToast('Registration successful');
      // go to home page
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorHandler.handleError(error, 'Registration failed');
    }
  }

  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    this.loginForm.reset();
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  async loginWithGoogle() {
    try {
      await this.authService.signInWithGoogle().toPromise();
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorHandler.handleError(error, 'Google login failed');
    }
  }

  private redirectBasedOnRole(businessId: string, role: string) {
    switch (role) {
      case 'owner':
        this.router.navigate(['/business', businessId, 'dashboard']);
        break;
      case 'manager':
        this.router.navigate(['/business', businessId, 'inventory']);
        break;
      case 'cashier':
        this.router.navigate(['/business', businessId, 'sales']);
        break;
      case 'customer':
        this.router.navigate(['/business', businessId, 'customer-dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastService.create({
      message: message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
