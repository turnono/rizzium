import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable } from 'rxjs';
import { Transaction } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class SalesComponent implements OnInit {
  businessId: string;
  transactions$: Observable<Transaction[]>;
  totalSales: number = 0;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactions$ = this.transactionService.getTransactions(
      this.businessId
    );
    this.transactions$.subscribe(
      (transactions) => {
        this.totalSales = transactions.reduce((total, t) => total + t.total, 0);
      },
      (error) => {
        this.errorHandler.handleError(error, 'Error loading transactions');
      }
    );
  }
}
