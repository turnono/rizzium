import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  FirebaseAuthService,
  Purchase,
  Promotion,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
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
  pastPurchases: Purchase[] = [];
  loyaltyPoints: number = 0;
  promotions: Promotion[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private authService: FirebaseAuthService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadCustomerData();
  }

  async loadCustomerData() {
    try {
      this.loading = true;
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const [businessData, pastPurchases, loyaltyPoints, promotions] =
        await Promise.all([
          this.businessService.getBusinessData(this.businessId),
          this.businessService.getPastPurchases(this.businessId, user.uid),
          this.businessService.getLoyaltyPoints(this.businessId, user.uid),
          this.businessService.getPromotions(this.businessId),
        ]);

      this.businessName = businessData?.businessName || '';
      this.pastPurchases = pastPurchases;
      this.loyaltyPoints = loyaltyPoints;
      this.promotions = promotions;
    } catch (error) {
      this.errorHandler.handleError(error, 'Error loading customer data');
    } finally {
      this.loading = false;
    }
  }
}
