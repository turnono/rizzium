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
import { Observable, from, map } from 'rxjs';
import { Transaction, Purchase } from '@rizzpos/shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private firestore: Firestore) {}

  getCustomerData(businessId: string, customerId: string): Observable<any> {
    const customerDoc = doc(
      this.firestore,
      `businesses/${businessId}/customers/${customerId}`
    );
    return from(getDoc(customerDoc)).pipe(
      map((customerSnapshot) => {
        if (customerSnapshot.exists()) {
          return customerSnapshot.data();
        } else {
          throw new Error('Customer not found');
        }
      })
    );
  }

  getRecentTransactions(
    businessId: string,
    customerId: string
  ): Observable<Transaction[]> {
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

    return from(getDocs(recentTransactionsQuery)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Transaction)
        )
      )
    );
  }

  getCustomerPurchases(
    businessId: string,
    customerId: string
  ): Observable<Purchase[]> {
    const purchasesCollection = collection(
      this.firestore,
      `businesses/${businessId}/purchases`
    );
    const customerPurchasesQuery = query(
      purchasesCollection,
      where('customerId', '==', customerId),
      orderBy('date', 'desc'),
      limit(10)
    );

    return from(getDocs(customerPurchasesQuery)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              date: doc.data()['date'].toDate(),
            } as Purchase)
        )
      )
    );
  }

  getCustomerLoyaltyPoints(
    businessId: string,
    customerId: string
  ): Observable<number> {
    const customerDoc = doc(
      this.firestore,
      `businesses/${businessId}/customers/${customerId}`
    );
    return from(getDoc(customerDoc)).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          return docSnapshot.data()['loyaltyPoints'] || 0;
        }
        return 0;
      })
    );
  }
}
