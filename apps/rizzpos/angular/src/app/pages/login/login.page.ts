import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
  ],
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
      confirmPassword: [''],
    });
  }

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (user) {
        console.log('User already logged in, redirecting to home');
        this.router.navigate(['/home']);
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

  signIn(email: string, password: string) {
    this.authService
      .signInWithEmailAndPassword(email, password)
      .pipe(
        tap(() => this.router.navigate(['/home'])),
        catchError((error) => {
          console.error('Error signing in:', error);
          this.errorMessage = error.message;
          return of(null);
        })
      )
      .subscribe();
  }

  register(email: string, password: string) {
    this.authService
      .createUserWithEmailAndPassword(email, password)
      .pipe(
        tap(() => this.router.navigate(['/home'])),
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
        tap(() => this.router.navigate(['/home'])),
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
