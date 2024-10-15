import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction } from '@rizzpos/shared/interfaces';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Query,
  DocumentData,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private firestore: Firestore) {}

  getTransactions(
    businessId: string,
    startDate?: Date
  ): Observable<Transaction[]> {
    const transactionsRef = collection(this.firestore, 'transactions');
    let q: Query<DocumentData> = query(
      transactionsRef,
      where('businessId', '==', businessId),
      orderBy('date', 'desc')
    );

    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }

    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as Transaction)
        )
      )
    );
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    console.log(`Creating transaction: ${JSON.stringify(transaction)}`);
    return of(transaction);
  }
}
