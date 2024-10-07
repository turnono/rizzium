import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, User, signInAnonymously, signInWithPopup, signOut } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = new Observable((subscriber) => {
      return this.auth.onAuthStateChanged(subscriber);
    });
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  }

  async signInAnonymously() {
    try {
      await signInAnonymously(this.auth);
    } catch (error) {
      console.error('Error signing in anonymously', error);
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  }
}
