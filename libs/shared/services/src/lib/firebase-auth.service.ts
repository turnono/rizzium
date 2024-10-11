import { Injectable } from '@angular/core';
import { Auth, User, signInAnonymously, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, Timestamp, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { switchMap, first, tap } from 'rxjs/operators';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'client' | 'anon';

export interface AppUser extends User {
  role: UserRole;
  businessId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private userSubject: BehaviorSubject<AppUser | null> = new BehaviorSubject<AppUser | null>(null);
  user$: Observable<AppUser | null> = this.userSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    onAuthStateChanged(this.auth, (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        this.getUserRole(user).then(role => {
          const appUser: AppUser = { ...user, role };
          this.userSubject.next(appUser);
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  ensureAuth(): Observable<AppUser | null> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user) {
          return from(signInAnonymously(this.auth)).pipe(
            switchMap(credential => this.initializeUser(credential.user)),
            switchMap(() => this.user$)
          );
        }
        return of(user);
      })
    );
  }

  private async initializeUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const cartRef = doc(this.firestore, `carts/${user.uid}`);

    if (user.isAnonymous) {
      await setDoc(userRef, {
        isAnonymous: true,
        role: 'anon',
        createdAt: Timestamp.now()
      }, { merge: true });

      await setDoc(cartRef, {
        items: [],
        createdAt: Timestamp.now()
      }, { merge: true });
    } else {
      // Handle registered user initialization if needed
    }
  }

  private async getUserRole(user: User): Promise<UserRole> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return (userSnap.data()['role'] as UserRole) || 'anon';
    }
    return 'anon';
  }

  signOut() {
    return signOut(this.auth);
  }

  createUserWithEmailAndPassword(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  signInWithEmailAndPassword(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      tap(userCredential => console.log('User signed in:', userCredential.user))
    );
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      tap(userCredential => console.log('User signed in with Google:', userCredential.user))
    );
  }

  async getCurrentUser(): Promise<AppUser | null> {
    const user = await this.user$.pipe(first()).toPromise();
    return user || null;
  }

  async handleRoleBasedURL(businessId: string, role?: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, {
      businesses: arrayUnion(businessId)
    });

    if (role) {
      const businessUserRef = doc(this.firestore, `businesses/${businessId}/businessUsers/${user.uid}`);
      await setDoc(businessUserRef, {
        role: role,
        userId: user.uid,
        createdAt: Timestamp.now(),
        displayName: user.displayName || 'New User'
      }, { merge: true });
    }
  }

  async getUserRoleForBusiness(businessId: string): Promise<UserRole> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const businessUserRef = doc(this.firestore, `businesses/${businessId}/businessUsers/${user.uid}`);
    const businessUserSnap = await getDoc(businessUserRef);

    if (businessUserSnap.exists()) {
      return businessUserSnap.data()['role'] as UserRole;
    }

    return 'client';
  }

  // Add more authentication methods as needed
}
