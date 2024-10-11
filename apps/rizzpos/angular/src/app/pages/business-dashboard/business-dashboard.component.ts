import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BusinessService,
  ProductService,
  Product,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { from, map, Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { BusinessData } from '@rizzpos/shared/interfaces';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

interface Transaction {
  id: string;
  date: Date;
  total: number;
}

@Component({
  selector: 'app-business-dashboard',
  templateUrl: './business-dashboard.component.html',
  styleUrls: ['./business-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class BusinessDashboardComponent implements OnInit {
  businessId: string;
  businessData$: Observable<BusinessData>;
  lowStockProducts$: Observable<Product[]>;
  recentTransactions$: Observable<Transaction[]>;
  todaySales = 0;
  monthSales = 0;
  totalProducts = 0;
  currentYear: number = new Date().getFullYear();
  quickActions: QuickAction[] = [
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
    this.businessData$ = new Observable<BusinessData>();
    this.lowStockProducts$ = new Observable<Product[]>();
    this.recentTransactions$ = new Observable<Transaction[]>();
  }

  ngOnInit() {
    this.loadBusinessData();
    this.loadLowStockProducts();
    this.loadRecentTransactions();
    this.loadSalesData();
    this.loadProductCount();
  }

  loadBusinessData() {
    this.businessData$ = from(
      this.businessService.getBusinessData(this.businessId)
    ).pipe(map((data) => data as BusinessData));
  }

  loadLowStockProducts() {
    this.lowStockProducts$ = from(
      this.businessService.getLowStockProducts(this.businessId)
    ).pipe(map((data) => data as Product[]));
  }

  loadRecentTransactions() {
    this.recentTransactions$ = this.businessService.getRecentTransactions(
      this.businessId
    );
  }

  async loadSalesData() {
    // TODO: Implement actual sales data loading from a sales service
    this.todaySales = 1234.56;
    this.monthSales = 45678.9;
  }

  async loadProductCount() {
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
