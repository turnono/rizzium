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
import { Transaction } from '@rizzpos/shared/interfaces';

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
}
