import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessService, BusinessData } from '@rizzpos/shared/services';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

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
  imports: [CommonModule, IonicModule],
})
export class BusinessDashboardComponent implements OnInit {
  businessId: string;
  businessData: BusinessData | null = null;
  quickActions: QuickAction[] = [
    { label: 'Products', icon: 'cube', route: 'products' },
    { label: 'Inventory', icon: 'list', route: 'inventory' },
    { label: 'New Sale', icon: 'cart', route: 'sale' },
    { label: 'Reports', icon: 'bar-chart', route: 'reports' },
  ];

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
      this.businessData = await this.businessService.getBusinessData(
        this.businessId
      );
    } catch (error) {
      console.error('Error loading business data:', error);
      // Handle error (show message to user)
    }
  }

  navigateTo(route: string) {
    this.router.navigate(['/business', this.businessId, route]);
  }
}
