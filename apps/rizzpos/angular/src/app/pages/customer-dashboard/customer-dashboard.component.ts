import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  CustomerService,
  ErrorHandlerService,
  PromotionService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable } from 'rxjs';
import { Transaction, Promotion } from '@rizzpos/shared/interfaces';

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
  customerData$: Observable<any>;
  recentTransactions$: Observable<Transaction[]>;
  promotions$: Observable<Promotion[]>;
  loyaltyPoints: number = 0;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private promotionService: PromotionService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.customerId = this.route.snapshot.paramMap.get('customerId') || '';
  }

  ngOnInit() {
    this.loadCustomerData();
    this.loadRecentTransactions();
    this.loadPromotions();
  }

  loadCustomerData() {
    this.customerData$ = this.customerService.getCustomerData(
      this.businessId,
      this.customerId
    );
    this.customerData$.subscribe(
      (data) => {
        this.loyaltyPoints = data.loyaltyPoints || 0;
      },
      (error) => {
        this.errorHandler.handleError(error, 'Error loading customer data');
      }
    );
  }

  loadRecentTransactions() {
    this.recentTransactions$ = this.customerService.getRecentTransactions(
      this.businessId,
      this.customerId
    );
  }

  loadPromotions() {
    this.promotions$ = this.promotionService.getActivePromotions(
      this.businessId
    );
  }
}
