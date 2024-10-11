import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class ReportsComponent implements OnInit {
  businessId: string = '';
  userRole: string = '';

  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.businessId = await this.businessService.getUserBusiness(user.uid);
      this.userRole = await this.businessService.getUserRole(
        this.businessId,
        user.uid
      );
    }
  }

  // Implement report-related methods here
}
