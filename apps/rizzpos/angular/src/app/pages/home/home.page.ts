import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  FirebaseAuthService,
  BusinessService,
  BusinessData,
} from '@rizzpos/shared/services';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    RouterModule,
  ],
})
export class HomePageComponent implements OnInit {
  businesses: BusinessData[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBusinesses();
  }

  async loadBusinesses() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.businesses = await this.businessService.getUserBusinesses(
          user.uid
        );
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
      this.error = 'Failed to load businesses. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  goToBusiness(businessId: string) {
    this.router.navigate(['/business', businessId]);
  }

  createNewBusiness() {
    this.router.navigate(['/business-setup']);
  }
}
