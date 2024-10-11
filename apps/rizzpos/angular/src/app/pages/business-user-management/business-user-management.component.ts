import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  BusinessUser,
  FirebaseAuthService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

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
  loading = true;
  currentUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private authService: FirebaseAuthService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  async ngOnInit() {
    try {
      const user = await this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      await this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error initializing component');
    }
  }

  async loadBusinessUsers() {
    try {
      this.loading = true;
      this.businessUsers = await this.businessService.getBusinessUsers(
        this.businessId
      );
      this.errorHandler.showInfo('Business users loaded successfully');
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
      this.errorHandler.showSuccess(
        `User role updated to ${newRole} successfully`
      );
      await this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error updating user role');
    }
  }

  async removeUser(userId: string) {
    if (userId === this.currentUserId) {
      this.errorHandler.showWarning(
        'You cannot remove yourself from the business'
      );
      return;
    }

    try {
      await this.businessService.removeUserFromBusiness(
        this.businessId,
        userId
      );
      this.errorHandler.showSuccess('User removed from business successfully');
      await this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error removing user from business');
    }
  }
}
