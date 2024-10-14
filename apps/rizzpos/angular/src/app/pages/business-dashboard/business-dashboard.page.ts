import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import {
  BusinessService,
  ProductService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { Observable, of, catchError, finalize, from } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { BusinessData, Product, Transaction } from '@rizzpos/shared/interfaces';
import {
  IonSkeletonText,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-business-dashboard',
  templateUrl: './business-dashboard.page.html',
  styleUrls: ['./business-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    IonSkeletonText,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonContent,
  ],
})
export class BusinessDashboardComponent implements OnInit {
  businessId: string;
  businessData$: Observable<BusinessData | null>;
  lowStockProducts$: Observable<Product[]>;
  recentTransactions$: Observable<Transaction[]>;
  todaySales = 0;
  monthSales = 0;
  totalProducts = 0;
  currentYear: number = new Date().getFullYear();
  isLoading = true;

  quickActions = [
    { label: 'Inventory', icon: 'cube', route: 'inventory' },
    { label: 'Sales', icon: 'cash', route: 'sales' },
    { label: 'Reports', icon: 'bar-chart', route: 'reports' },
    { label: 'User Management', icon: 'people', route: 'user-management' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private productService: ProductService,
    private clipboard: Clipboard,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.businessData$ = new Observable<BusinessData | null>();
    this.lowStockProducts$ = new Observable<Product[]>();
    this.recentTransactions$ = new Observable<Transaction[]>();
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.businessData$ = from(
      this.businessService.getBusinessData(this.businessId)
    ).pipe(
      catchError((error) => {
        this.errorHandler.handleError(error, 'Error loading business data');
        return of(null);
      }),
      finalize(() => (this.isLoading = false))
    );

    this.lowStockProducts$ = this.businessService
      .getLowStockProducts(this.businessId)
      .pipe(
        catchError((error) => {
          this.errorHandler.handleError(
            error,
            'Error loading low stock products'
          );
          return of([]);
        })
      );

    this.recentTransactions$ = this.businessService
      .getRecentTransactions(this.businessId)
      .pipe(
        catchError((error) => {
          this.errorHandler.handleError(
            error,
            'Error loading recent transactions'
          );
          return of([]);
        })
      );

    this.loadSalesData();
    this.loadProductCount();
  }

  loadSalesData() {
    // TODO: Implement actual sales data loading from a sales service
    this.todaySales = 1234.56;
    this.monthSales = 45678.9;
  }

  loadProductCount() {
    // TODO: Implement actual product count loading from the product service
    this.totalProducts = 100;
  }

  navigateTo(route: string) {
    this.router.navigate(['/business', this.businessId, route]);
  }

  generateRoleURL(role: 'cashier' | 'manager'): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?businessId=${this.businessId}&role=${role}`;
  }

  generateCustomerURL(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?businessId=${this.businessId}`;
  }

  copyURL(role: 'cashier' | 'manager' | 'customer') {
    let url: string;
    if (role === 'customer') {
      url = this.generateCustomerURL();
    } else {
      url = this.generateRoleURL(role);
    }

    this.clipboard.copy(url);
    this.errorHandler.showSuccess(
      `${role.charAt(0).toUpperCase() + role.slice(1)} URL copied to clipboard`
    );
  }
}
