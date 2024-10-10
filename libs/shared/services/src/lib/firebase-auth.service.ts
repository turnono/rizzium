import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User, UserCredential, signInAnonymously } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FirebaseError } from '@angular/fire/app';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);

  constructor() {
    this.auth.onAuthStateChanged(user => this.userSubject.next(user));
  }

  signInAnonymously(): Observable<User> {
    return from(signInAnonymously(this.auth)).pipe(
      switchMap((credential: UserCredential) => this.createUserAndCart(credential.user)),
      catchError((error: FirebaseError) => {
        console.error('Anonymous sign-in error:', error);
        return throwError(() => new Error(this.getErrorMessage(error.code)));
      })
    );
  }

  private createUserAndCart(user: User): Observable<User> {
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const cartDocRef = doc(this.firestore, `carts/${user.uid}`);

    return from(Promise.all([
      setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous
      }, { merge: true }),
      setDoc(cartDocRef, { items: [] }, { merge: true })
    ])).pipe(
      map(() => user),
      tap(user => this.userSubject.next(user)),
      catchError(error => {
        console.error('Error creating user or cart document:', error);
        // Still return the user even if document creation fails
        return of(user);
      })
    );
  }

  signInWithEmail(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential: UserCredential) => this.handleSignIn(credential.user)),
      catchError(error => throwError(() => new Error(this.getErrorMessage(error.code))))
    );
  }

  signUpWithEmail(email: string, password: string): Observable<User> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential: UserCredential) => this.handleSignIn(credential.user)),
      catchError(error => throwError(() => new Error(this.getErrorMessage(error.code))))
    );
  }

  signInWithGoogle(): Observable<User> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((credential: UserCredential) => this.handleSignIn(credential.user)),
      catchError(error => throwError(() => new Error(this.getErrorMessage(error.code))))
    );
  }

  private handleSignIn(user: User): Observable<User> {
    return this.transferAnonymousData(user).pipe(
      switchMap(() => this.createUserAndCart(user))
    );
  }

  private transferAnonymousData(newUser: User): Observable<void> {
    const anonymousUser = this.auth.currentUser;
    if (anonymousUser && anonymousUser.isAnonymous) {
      return this.transferUserAndCartData(anonymousUser.uid, newUser.uid).pipe(
        switchMap(() => this.deleteAnonymousUser(anonymousUser.uid))
      );
    }
    return of(undefined);
  }

  private transferUserAndCartData(fromUid: string, toUid: string): Observable<void> {
    const fromUserDocRef = doc(this.firestore, `users/${fromUid}`);
    const fromCartDocRef = doc(this.firestore, `carts/${fromUid}`);
    const toUserDocRef = doc(this.firestore, `users/${toUid}`);
    const toCartDocRef = doc(this.firestore, `carts/${toUid}`);

    return from(Promise.all([
      getDoc(fromUserDocRef),
      getDoc(fromCartDocRef)
    ])).pipe(
      switchMap(([fromUserDoc, fromCartDoc]) => {
        const userData = fromUserDoc.data();
        const cartData = fromCartDoc.data();
        return Promise.all([
          setDoc(toUserDocRef, { ...userData, uid: toUid }, { merge: true }),
          setDoc(toCartDocRef, cartData || {}, { merge: true })
        ]);
      }),
      map(() => undefined)
    );
  }

  private deleteAnonymousUser(uid: string): Observable<void> {
    const deleteAnonUser = httpsCallable(this.functions, 'deleteAnonUser');
    return from(deleteAnonUser({ uid })).pipe(
      map(() => undefined)
    );
  }

  signOut(): Observable<void> {
    return from(this.auth.signOut()).pipe(
      tap(() => this.userSubject.next(null)),
      catchError(error => throwError(() => new Error(this.getErrorMessage(error.code))))
    );
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/operation-not-allowed':
        return 'Anonymous sign-in is not enabled. Please enable it in the Firebase Console.';
      default:
        return `An error occurred. Please try again. (${errorCode})`;
    }
  }
}
