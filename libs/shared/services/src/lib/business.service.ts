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
} from '@angular/fire/firestore';
import { FirebaseAuthService } from './firebase-auth.service';

export interface BusinessData {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  phoneNumber: string;
  ownerId: string;
  createdAt: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  constructor(
    private firestore: Firestore,
    private authService: FirebaseAuthService
  ) {}

  async setupBusiness(
    businessData: Omit<BusinessData, 'ownerId' | 'createdAt'>
  ) {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('No authenticated user found');

    const fullBusinessData: BusinessData = {
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
        doc(this.firestore, `businesses/${businessRef.id}/users/${user.uid}`),
        {
          role: 'owner',
        }
      );

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
      const businessesRef = collection(this.firestore, 'businesses');
      const q = query(businessesRef, where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as BusinessData)
      );
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

  // Add more methods for business management
}
