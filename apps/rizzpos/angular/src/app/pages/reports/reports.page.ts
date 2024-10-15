import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Transaction } from '@rizzpos/shared/interfaces';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class ReportsPageComponent implements OnInit {
  businessId: string;
  transactions$?: Observable<Transaction[]>;
  dailySalesData: any;
  monthlySalesData: any;

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
    this.transactions$ = this.transactionService
      .getTransactions(this.businessId)
      .pipe(
        map((transactions) => {
          this.prepareDailySalesData(transactions);
          this.prepareMonthlySalesData(transactions);
          return transactions;
        })
      );
  }

  prepareDailySalesData(transactions: Transaction[]) {
    const dailySales = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + transaction.total;
      return acc;
    }, {} as { [key: string]: number });

    this.dailySalesData = {
      labels: Object.keys(dailySales),
      datasets: [
        {
          label: 'Daily Sales',
          data: Object.values(dailySales),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  prepareMonthlySalesData(transactions: Transaction[]) {
    const monthlySales = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      acc[monthYear] = (acc[monthYear] || 0) + transaction.total;
      return acc;
    }, {} as { [key: string]: number });

    this.monthlySalesData = {
      labels: Object.keys(monthlySales),
      datasets: [
        {
          label: 'Monthly Sales',
          data: Object.values(monthlySales),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  }
}
