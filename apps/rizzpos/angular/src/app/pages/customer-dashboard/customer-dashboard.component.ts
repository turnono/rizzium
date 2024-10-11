import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  CustomerService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

interface Transaction {
  id: string;
  date: Date;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  expiryDate: Date;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class CustomerDashboardComponent implements OnInit {
  businessId: string;
  customerId: string;
  businessName: string = '';
  loyaltyPoints: number = 0;
  recentTransactions: Transaction[] = [];
  activePromotions: Promotion[] = [];

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private customerService: CustomerService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.customerId = this.route.snapshot.paramMap.get('customerId') || '';
  }

  async ngOnInit() {
    try {
      await this.loadBusinessData();
      await this.loadCustomerData();
      await this.loadRecentTransactions();
      await this.loadActivePromotions();
    } catch (error) {
      this.errorHandler.handleError(
        error,
        'Error initializing customer dashboard'
      );
    }
  }

  async loadBusinessData() {
    const businessData = await this.businessService.getBusinessData(
      this.businessId
    );
    this.businessName = businessData.businessName;
  }

  async loadCustomerData() {
    const customerData = await this.customerService.getCustomerData(
      this.businessId,
      this.customerId
    );
    this.loyaltyPoints = customerData.loyaltyPoints;
  }

  async loadRecentTransactions() {
    this.recentTransactions = await this.customerService.getRecentTransactions(
      this.businessId,
      this.customerId
    );
  }

  async loadActivePromotions() {
    this.activePromotions = await this.businessService.getActivePromotions(
      this.businessId
    );
  }
}
