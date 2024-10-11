import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  FirebaseAuthService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

interface BusinessUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.component.html',
  styleUrls: ['./business-user-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    FormsModule,
  ],
})
export class BusinessUserManagementComponent implements OnInit {
  businessId: string;
  businessUsers: BusinessUser[] = [];
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
    this.loadBusinessUsers();
  }

  async loadBusinessUsers() {
    try {
      this.loading = true;
      this.businessUsers = await this.businessService.getBusinessUsers(
        this.businessId
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'Error loading business users');
    } finally {
      this.loading = false;
    }
  }

  async updateUserRole(userId: string, newRole: string) {
    try {
      await this.businessService.updateUserRole(
        this.businessId,
        userId,
        newRole
      );
      await this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error updating user role');
    }
  }

  async removeUser(userId: string) {
    try {
      await this.businessService.removeUserFromBusiness(
        this.businessId,
        userId
      );
      await this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error removing user from business');
    }
  }
}
