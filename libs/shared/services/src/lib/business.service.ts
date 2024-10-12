import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
  orderBy,
  limit,
  deleteDoc,
} from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import {
  Observable,
  from,
  map,
  BehaviorSubject,
  forkJoin,
  of,
  firstValueFrom,
} from 'rxjs';
import {
  BusinessData,
  Product,
  Transaction,
  Promotion,
  Purchase,
  BusinessUser,
} from '@rizzpos/shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private userBusinessesSubject = new BehaviorSubject<BusinessData[]>([]);
  userBusinesses$ = this.userBusinessesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: FirebaseAuthService
  ) {
    this.initUserBusinessesListener();
  }

  private async initUserBusinessesListener() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      const businessesRef = collection(this.firestore, 'businesses');
      const q = query(businessesRef, where('ownerId', '==', user.uid));
      onSnapshot(q, (querySnapshot) => {
        const businesses = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as BusinessData)
        );
        this.userBusinessesSubject.next(businesses);
      });
    }
  }

  async setupBusiness(
    businessData: Omit<BusinessData, 'id' | 'ownerId' | 'createdAt'>
  ) {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const fullBusinessData: Omit<BusinessData, 'id'> = {
      ...businessData,
      ownerId: user.uid,
      createdAt: Timestamp.now(),
    };

    try {
      const businessRef = await addDoc(
        collection(this.firestore, 'businesses'),
        fullBusinessData
      );

      await setDoc(
        doc(
          this.firestore,
          `businesses/${businessRef.id}/businessUsers/${user.uid}`
        ),
        {
          role: 'owner',
          userId: user.uid,
          createdAt: Timestamp.now(),
          displayName: user.displayName || 'Business Owner',
        }
      );

      const userRef = doc(this.firestore, `users/${user.uid}`);
      await updateDoc(userRef, {
        businesses: arrayUnion(businessRef.id),
      });

      return businessRef.id;
    } catch (error) {
      console.error('Error setting up business:', error);
      throw new Error('Failed to set up business. Please try again.');
    }
  }

  async registerBusiness(
    businessData: Omit<BusinessData, 'ownerId' | 'createdAt'>
  ) {
    return this.setupBusiness(businessData);
  }

  async getUserBusiness(userId: string): Promise<string | null> {
    try {
      const businessesRef = collection(this.firestore, 'businesses');
      const q = query(businessesRef, where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error getting user business:', error);
      throw new Error('Failed to get user business. Please try again.');
    }
  }

  async getUserBusinesses(userId: string): Promise<BusinessData[]> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data()['businesses']) {
        const businessIds = userSnap.data()['businesses'] as string[];
        const businessObservables = businessIds.map((id) =>
          this.getBusinessData(id)
        );

        const results = await firstValueFrom(forkJoin(businessObservables));
        return results.filter(
          (business): business is BusinessData => business !== null
        );
      }

      return [];
    } catch (error) {
      console.error('Error getting user businesses:', error);
      throw new Error('Failed to get user businesses. Please try again.');
    }
  }

  getBusinessData(businessId: string): Observable<BusinessData | null> {
    const businessRef = doc(this.firestore, `businesses/${businessId}`);
    return from(getDoc(businessRef)).pipe(
      map((businessSnap) => {
        if (businessSnap.exists()) {
          return {
            id: businessSnap.id,
            ...businessSnap.data(),
          } as BusinessData;
        }
        return null;
      })
    );
  }

  getUserBusinesses$(userId: string): Observable<BusinessData[]> {
    return this.userBusinesses$;
  }

  async getPastPurchases(
    businessId: string,
    userId: string
  ): Promise<Purchase[]> {
    try {
      const purchasesRef = collection(
        this.firestore,
        `businesses/${businessId}/purchases`
      );
      const q = query(
        purchasesRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Purchase)
      );
    } catch (error) {
      console.error('Error fetching past purchases:', error);
      throw new Error('Failed to fetch past purchases. Please try again.');
    }
  }

  getLoyaltyPoints(businessId: string, userId: string): Observable<number> {
    const customerDoc = doc(
      this.firestore,
      `businesses/${businessId}/customers/${userId}`
    );
    return from(getDoc(customerDoc)).pipe(
      map((doc) => (doc.exists() ? doc.data()['loyaltyPoints'] || 0 : 0))
    );
  }

  async getPromotions(businessId: string): Promise<Promotion[]> {
    try {
      const promotionsRef = collection(
        this.firestore,
        `businesses/${businessId}/promotions`
      );
      const q = query(promotionsRef, where('validUntil', '>', Timestamp.now()));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Promotion)
      );
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw new Error('Failed to fetch promotions. Please try again.');
    }
  }

  async getUserRole(businessId: string, userId: string): Promise<string> {
    try {
      const userRef = doc(
        this.firestore,
        `businesses/${businessId}/businessUsers/${userId}`
      );
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data()['role'] || 'customer';
      }
      return 'customer';
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw new Error('Failed to fetch user role. Please try again.');
    }
  }

  getBusinessUsers(businessId: string): Observable<BusinessUser[]> {
    const businessUsersRef = collection(
      this.firestore,
      `businesses/${businessId}/businessUsers`
    );
    return from(getDocs(businessUsersRef)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as BusinessUser)
        )
      )
    );
  }

  updateUserRole(
    businessId: string,
    userId: string,
    newRole: string
  ): Observable<void> {
    const userRef = doc(
      this.firestore,
      `businesses/${businessId}/businessUsers/${userId}`
    );
    return from(updateDoc(userRef, { role: newRole }));
  }

  removeUserFromBusiness(businessId: string, userId: string): Observable<void> {
    const userRef = doc(
      this.firestore,
      `businesses/${businessId}/businessUsers/${userId}`
    );
    return new Observable((observer) => {
      deleteDoc(userRef)
        .then(() => {
          this.authService.getCurrentUser().then((user) => {
            if (user) {
              const userDocRef = doc(this.firestore, `users/${user.uid}`);
              getDoc(userDocRef).then((userDoc) => {
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const updatedBusinesses = (
                    userData['businesses'] || []
                  ).filter((id: string) => id !== businessId);
                  updateDoc(userDocRef, { businesses: updatedBusinesses })
                    .then(() => {
                      observer.next();
                      observer.complete();
                    })
                    .catch((error) => observer.error(error));
                } else {
                  observer.next();
                  observer.complete();
                }
              });
            } else {
              observer.next();
              observer.complete();
            }
          });
        })
        .catch((error) => observer.error(error));
    });
  }

  getActivePromotions(businessId: string): Observable<Promotion[]> {
    const promotionsCollection = collection(
      this.firestore,
      `businesses/${businessId}/promotions`
    );
    const activePromotionsQuery = query(
      promotionsCollection,
      where('expiryDate', '>', Timestamp.now())
    );

    return from(getDocs(activePromotionsQuery)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              expiryDate: doc.data()['expiryDate'].toDate(),
            } as Promotion)
        )
      )
    );
  }

  getLowStockProducts(businessId: string): Observable<Product[]> {
    const productsCollection = collection(
      this.firestore,
      `businesses/${businessId}/products`
    );
    const lowStockQuery = query(
      productsCollection,
      where('stockQuantity', '<', 10),
      limit(10)
    );
    return from(getDocs(lowStockQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product))
      )
    );
  }

  getRecentTransactions(businessId: string): Observable<Transaction[]> {
    const transactionsCollection = collection(
      this.firestore,
      `businesses/${businessId}/transactions`
    );
    const recentTransactionsQuery = query(
      transactionsCollection,
      orderBy('date', 'desc'),
      limit(5)
    );
    return from(getDocs(recentTransactionsQuery)).pipe(
      map((snapshot) =>
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
        )
      )
    );
  }

  // Add more methods for business management as needed
}
