import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { BusinessService, ProductService } from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class CustomerDashboardComponent implements OnInit {
  businessId: string;
  businessName: string = '';
  pastPurchases: any[] = []; // Replace 'any' with a proper Purchase interface
  loyaltyPoints: number = 0;
  promotions: any[] = []; // Replace 'any' with a proper Promotion interface

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private productService: ProductService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadBusinessData();
    this.loadPastPurchases();
    this.loadLoyaltyPoints();
    this.loadPromotions();
  }

  async loadBusinessData() {
    const businessData = await this.businessService.getBusinessData(
      this.businessId
    );
    if (businessData) {
      this.businessName = businessData.businessName;
    }
  }

  loadPastPurchases() {
    // TODO: Implement loading past purchases from a service
    this.pastPurchases = [
      { id: 'P001', date: new Date(), total: 50.0 },
      { id: 'P002', date: new Date(), total: 75.5 },
    ];
  }

  loadLoyaltyPoints() {
    // TODO: Implement loading loyalty points from a service
    this.loyaltyPoints = 100;
  }

  loadPromotions() {
    // TODO: Implement loading promotions from a service
    this.promotions = [
      {
        id: 'PROMO1',
        description: '10% off on all items',
        validUntil: new Date(),
      },
      {
        id: 'PROMO2',
        description: 'Buy one get one free',
        validUntil: new Date(),
      },
    ];
  }
}
