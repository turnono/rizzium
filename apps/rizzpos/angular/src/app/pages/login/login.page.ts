import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { catchError, of, take, switchMap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FooterComponent,
    HeaderComponent
  ]
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  authMode: 'login' | 'register' = 'login';
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: FirebaseAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    console.log('LoginPageComponent initialized');
    this.updateValidators();
    this.checkAndSignInAnonymously();
  }

  private checkAndSignInAnonymously(): void {
    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return this.authService.signInAnonymously();
        }
        return of(user);
      }),
      catchError(error => {
        console.error('Error signing in anonymously:', error);
        this.errorMessage = error.message;
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  segmentChanged(event: CustomEvent) {
    this.authMode = event.detail.value;
    this.updateValidators();
    this.errorMessage = '';
  }

  updateValidators(): void {
    const confirmPasswordControl = this.loginForm.get('confirmPassword');
    if (this.authMode === 'register') {
      confirmPasswordControl?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);
    } else {
      confirmPasswordControl?.clearValidators();
    }
    confirmPasswordControl?.updateValueAndValidity();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = this.loginForm.get('password')?.value;
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const authMethod = this.authMode === 'login' ? this.authService.signInWithEmail(email, password) : this.authService.signUpWithEmail(email, password);

      authMethod.pipe(
        catchError((error: Error) => {
          this.errorMessage = error.message;
          return of(null);
        })
      ).subscribe(user => {
        if (user) {
          this.router.navigate(['/home']);
        }
      });
    }
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle().pipe(
      catchError((error: Error) => {
        this.errorMessage = 'Error signing in with Google. Please try again.';
        console.error('Google sign-in error:', error);
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }
}
