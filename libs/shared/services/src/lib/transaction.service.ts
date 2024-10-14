import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Transaction } from '@rizzpos/shared/interfaces';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private firestore: Firestore) {}

  getTransactions(businessId: string): Observable<Transaction[]> {
    console.log(`Fetching transactions for business: ${businessId}`);
    return of([]);
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    console.log(`Creating transaction: ${JSON.stringify(transaction)}`);
    return of(transaction);
  }
}
