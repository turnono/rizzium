import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  TransactionService,
  ProductService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction, Product } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class ReportsComponent implements OnInit {
  businessId: string;
  totalSales: number = 0;
  topProducts: { name: string; totalSold: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private productService: ProductService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    forkJoin({
      transactions: this.transactionService.getTransactions(this.businessId),
      products: this.productService.getProducts(this.businessId),
    }).subscribe(
      ({ transactions, products }) => {
        this.calculateTotalSales(transactions);
        this.calculateTopProducts(transactions, products);
      },
      (error) => {
        this.errorHandler.handleError(error, 'Error loading reports data');
      }
    );
  }

  calculateTotalSales(transactions: Transaction[]) {
    this.totalSales = transactions.reduce((total, t) => total + t.total, 0);
  }

  calculateTopProducts(transactions: Transaction[], products: Product[]) {
    const productSales: { [key: string]: number } = {};
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        if (productSales[item.productId]) {
          productSales[item.productId] += item.quantity;
        } else {
          productSales[item.productId] = item.quantity;
        }
      });
    });

    this.topProducts = Object.entries(productSales)
      .map(([productId, totalSold]) => ({
        name:
          products.find((p) => p.id === productId)?.name || 'Unknown Product',
        totalSold,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
  }
}
