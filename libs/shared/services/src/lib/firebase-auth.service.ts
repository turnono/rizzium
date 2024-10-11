import { Injectable } from '@angular/core';
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
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { first, tap } from 'rxjs/operators';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'client' | 'anon';

export interface AppUser extends User {
  role: UserRole;
  businessId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private userSubject: BehaviorSubject<AppUser | null> =
    new BehaviorSubject<AppUser | null>(null);
  user$: Observable<AppUser | null> = this.userSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        this.getUserRole(user).then((role) => {
          const appUser: AppUser = { ...user, role };
          this.userSubject.next(appUser);
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  async createUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
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
    const cartRef = doc(this.firestore, `carts/${user.uid}`);

    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Timestamp.now(),
      role: user.isAnonymous ? 'anon' : 'client',
    };

    await setDoc(userRef, userData, { merge: true });

    await setDoc(
      cartRef,
      {
        items: [],
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
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

  signInWithEmailAndPassword(
    email: string,
    password: string
  ): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      tap((userCredential) =>
        console.log('User signed in:', userCredential.user)
      )
    );
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      tap((userCredential) =>
        console.log('User signed in with Google:', userCredential.user)
      )
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
      businesses: arrayUnion(businessId),
    });

    const businessUserRef = doc(
      this.firestore,
      `businesses/${businessId}/businessUsers/${user.uid}`
    );
    const businessUserSnap = await getDoc(businessUserRef);

    if (!businessUserSnap.exists()) {
      // If the user doesn't exist in the business, add them with the specified role or as a client
      await setDoc(
        businessUserRef,
        {
          role: role || 'client',
          userId: user.uid,
          createdAt: Timestamp.now(),
          displayName: user.displayName || 'New User',
        },
        { merge: true }
      );
    } else if (role && role !== 'owner') {
      // If the user exists and a new role is specified (but not 'owner'), update the role
      await updateDoc(businessUserRef, { role: role });
    }
    // If the user is already an 'owner', we don't change their role
  }

  async getUserRoleForBusiness(businessId: string): Promise<UserRole> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const businessUserRef = doc(
      this.firestore,
      `businesses/${businessId}/businessUsers/${user.uid}`
    );
    const businessUserSnap = await getDoc(businessUserRef);

    if (businessUserSnap.exists()) {
      return businessUserSnap.data()['role'] as UserRole;
    }

    return 'client';
  }

  // Add more authentication methods as needed
}
