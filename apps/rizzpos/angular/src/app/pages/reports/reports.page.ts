import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  TransactionService,
  ErrorHandlerService,
  ReportService,
} from '@rizzpos/shared/services';
import { Transaction, SalesReport } from '@rizzpos/shared/interfaces';
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
export class ReportsPageComponent implements OnInit, OnDestroy {
  businessId: string;
  transactions$?: Observable<Transaction[]>;
  dailySalesData: any;
  monthlySalesData: any;
  dailySalesReport$: Observable<SalesReport>;
  private realtimeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private errorHandler: ErrorHandlerService,
    private reportService: ReportService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.dailySalesReport$ = this.reportService.getDailySalesReport(
      this.businessId
    );
  }

  ngOnInit() {
    this.loadTransactions();
    this.loadDailySalesReport();
    this.subscribeToRealtimeUpdates();
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

  loadDailySalesReport() {
    this.dailySalesReport$ = this.reportService.getDailySalesReport(
      this.businessId
    );
  }

  subscribeToRealtimeUpdates() {
    this.realtimeSubscription = this.reportService
      .getRealtimeSalesUpdates(this.businessId)
      .subscribe((update) => {
        // Handle real-time updates
        console.log('Received real-time update:', update);
      });
  }

  ngOnDestroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
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
