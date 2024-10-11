import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BusinessService,
  BusinessData,
  ProductService,
  Product,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
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
  businessData: BusinessData | null = null;
  lowStockProducts$: Observable<Product[]>;
  todaySales = 0;
  monthSales = 0;
  totalProducts = 0;
  recentTransactions: any[] = []; // Replace 'any' with a proper Transaction interface
  quickActions: QuickAction[] = [
    { label: 'New Sale', icon: 'cart', route: 'sale' },
    { label: 'Products', icon: 'cube', route: 'products' },
    { label: 'Inventory', icon: 'list', route: 'inventory' },
    { label: 'Reports', icon: 'bar-chart', route: 'reports' },
    { label: 'Settings', icon: 'settings', route: 'settings' },
  ];
  currentYear: number = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private productService: ProductService,
    private clipboard: Clipboard,
    private toastController: ToastController,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.lowStockProducts$ = this.productService.getLowStockProducts(
      this.businessId
    );
  }

  ngOnInit() {
    this.loadBusinessData();
    this.loadSalesData();
    this.loadProductCount();
    this.loadRecentTransactions();
  }

  async loadBusinessData() {
    try {
      this.businessData = await this.businessService.getBusinessData(
        this.businessId
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'Error loading business data');
    }
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

  async loadRecentTransactions() {
    // TODO: Implement actual recent transactions loading from a transaction service
    this.recentTransactions = [
      { id: 'T001', date: new Date(), total: 123.45 },
      { id: 'T002', date: new Date(), total: 67.89 },
      { id: 'T003', date: new Date(), total: 234.56 },
    ];
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

  async copyURL(role: 'cashier' | 'manager' | 'customer'): Promise<void> {
    const url =
      role === 'customer'
        ? this.generateCustomerURL()
        : this.generateRoleURL(role as 'cashier' | 'manager');
    this.clipboard.copy(url);
    const toast = await this.toastController.create({
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } URL copied to clipboard`,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
