import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, User, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = new Observable((subscriber) => {
      return this.auth.onAuthStateChanged(subscriber);
    });
  }

  async signInWithEmail(email: string, password: string): Promise<any> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Error signing in with email and password', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<any> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Error signing up with email and password', error);
      throw error;
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
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
