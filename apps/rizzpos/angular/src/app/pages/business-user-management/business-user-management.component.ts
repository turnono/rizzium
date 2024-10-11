import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { BusinessService, FirebaseAuthService } from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.component.html',
  styleUrl: './business-user-management.component.scss',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class BusinessUserManagementComponent implements OnInit {
  businessId: string;
  businessUsers: any[] = []; // Replace 'any' with a proper BusinessUser interface

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private authService: FirebaseAuthService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadBusinessUsers();
  }

  async loadBusinessUsers() {
    // TODO: Implement loading business users from a service
    this.businessUsers = [
      { id: 'U001', name: 'John Doe', role: 'cashier' },
      { id: 'U002', name: 'Jane Smith', role: 'manager' },
    ];
  }

  async updateUserRole(userId: string, newRole: string) {
    // TODO: Implement updating user role in the service
    console.log(`Updating user ${userId} to role ${newRole}`);
  }

  async removeUser(userId: string) {
    // TODO: Implement removing user from the business in the service
    console.log(`Removing user ${userId} from the business`);
  }
}
