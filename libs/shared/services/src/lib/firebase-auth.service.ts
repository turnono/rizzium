import { AppUser, UserRole } from '@rizzium/shared/interfaces';
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();
  private auth = inject(Auth);
  private errorHandler = inject(ErrorHandlerService);

  constructor(private firestore: Firestore, private router: Router) {
    onAuthStateChanged(this.auth, async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        try {
          // Check if user document exists
          const userRef = doc(this.firestore, `users/${user.uid}`);
          const userSnap = await getDoc(userRef);

          // If user document doesn't exist, initialize it
          if (!userSnap.exists()) {
            await this.initializeUser(user);
          }

          // Now safely get the user role
          await this.getUserRole(user);
          this.userSubject.next(user);
        } catch (error) {
          console.error('Error during user initialization:', error);
          this.errorHandler.handleError(error);
          this.userSubject.next(user); // Still update the user state even if role fetch fails
        }
      } else {
        this.userSubject.next(null);
      }
    });
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.initializeUser(credential.user);
    return credential;
  }

  async signInAnonymously(): Promise<UserCredential> {
    const credential = await signInAnonymously(this.auth);
    await this.initializeUser(credential.user);
    return credential;
  }

  private async initializeUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);

    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Timestamp.now(),
      businesses: {},
      tier: 'free', // Initialize with free tier
      subscriptionStatus: 'inactive',
      role: 'user', // Default role
    };

    await setDoc(userRef, userData, { merge: true });
  }

  private async getUserRole(user: User): Promise<{ [businessId: string]: UserRole }> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return (userSnap.data()['businesses'] as { [businessId: string]: UserRole }) || {};
    }
    return {};
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  signInWithEmailAndPassword(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      tap((userCredential) => console.log('User signed in:', userCredential.user))
    );
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      tap((userCredential) => console.log('User signed in with Google:', userCredential.user))
    );
  }

  async getCurrentUser(): Promise<AppUser | null> {
    const user = await this.user$.pipe(first()).toPromise();
    if (user) {
      const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
      const userData = userDoc.data();
      return {
        ...user,
        businesses: userData?.['businesses'] || {},
      } as AppUser;
    }
    return null;
  }

  async handleRoleBasedURL(businessId: string, role?: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, {
      [`businesses.${businessId}`]: role || 'customer',
    });

    const businessUserRef = doc(this.firestore, `businesses/${businessId}/businessUsers/${user.uid}`);
    await setDoc(
      businessUserRef,
      {
        userId: user.uid,
        createdAt: Timestamp.now(),
        displayName: user.displayName || 'New User',
        email: user.email,
      },
      { merge: true }
    );
  }

  async getUserRoleForBusiness(businessId: string): Promise<UserRole> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData?.['businesses']?.[businessId] || 'customer';
    }

    return 'customer';
  }

  // Add more authentication methods as needed
}
