import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth) {}

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  async signIn() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }
}
