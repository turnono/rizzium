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
} from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { Observable, BehaviorSubject } from 'rxjs';

export interface BusinessData {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  phoneNumber: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Purchase {
  id: string;
  date: Date;
  total: number;
}

export interface Promotion {
  id: string;
  description: string;
  validUntil: Date;
}

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
        const businesses: BusinessData[] = [];

        for (const businessId of businessIds) {
          const businessData = await this.getBusinessData(businessId);
          if (businessData) {
            businesses.push(businessData);
          }
        }

        return businesses;
      }

      return [];
    } catch (error) {
      console.error('Error getting user businesses:', error);
      throw new Error('Failed to get user businesses. Please try again.');
    }
  }

  async getBusinessData(businessId: string): Promise<BusinessData | null> {
    try {
      const businessRef = doc(this.firestore, `businesses/${businessId}`);
      const businessSnap = await getDoc(businessRef);

      if (businessSnap.exists()) {
        return businessSnap.data() as BusinessData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching business data:', error);
      throw new Error('Failed to fetch business data. Please try again.');
    }
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

  async getLoyaltyPoints(businessId: string, userId: string): Promise<number> {
    try {
      const userRef = doc(
        this.firestore,
        `businesses/${businessId}/customers/${userId}`
      );
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data()['loyaltyPoints'] || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching loyalty points:', error);
      throw new Error('Failed to fetch loyalty points. Please try again.');
    }
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

  // Add more methods for business management
}
