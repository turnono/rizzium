import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService } from '@rizzpos/shared/services';
import { BusinessData } from '@rizzpos/shared/interfaces';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { firstValueFrom } from 'rxjs';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-business-details',
  templateUrl: './business-details.page.html',
  styleUrl: './business-details.page.scss',
  standalone: true,
  imports: [
    IonText,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    IonContent,
    IonSpinner,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
  ],
})
export class BusinessDetailsComponent implements OnInit {
  businessId: string;
  businessData: BusinessData | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadBusinessData();
  }

  async loadBusinessData() {
    try {
      this.businessData = await firstValueFrom(
        this.businessService.getBusinessData(this.businessId)
      );
      if (!this.businessData) {
        throw new Error('Business not found');
      }
    } catch (err) {
      console.error('Error loading business data:', err);
      this.error = 'Failed to load business data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // Add more methods for business management here
}
