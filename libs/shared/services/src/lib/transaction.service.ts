import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Transaction } from '@rizzpos/shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  getTransactions(businessId: string): Observable<Transaction[]> {
    console.log(`Fetching transactions for business: ${businessId}`);
    return of([]);
  }
}
