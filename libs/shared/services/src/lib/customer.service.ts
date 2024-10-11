import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private firestore: Firestore) {}

  async getCustomerData(businessId: string, customerId: string) {
    const customerDoc = doc(
      this.firestore,
      `businesses/${businessId}/customers/${customerId}`
    );
    const customerSnapshot = await getDoc(customerDoc);

    if (customerSnapshot.exists()) {
      return customerSnapshot.data();
    } else {
      throw new Error('Customer not found');
    }
  }

  async getRecentTransactions(businessId: string, customerId: string) {
    const transactionsCollection = collection(
      this.firestore,
      `businesses/${businessId}/transactions`
    );
    const recentTransactionsQuery = query(
      transactionsCollection,
      where('customerId', '==', customerId),
      orderBy('date', 'desc'),
      limit(5)
    );

    const querySnapshot = await getDocs(recentTransactionsQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}
