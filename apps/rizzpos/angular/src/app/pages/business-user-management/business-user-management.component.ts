import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  BusinessUser,
  FirebaseAuthService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.component.html',
  styleUrls: ['./business-user-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class BusinessUserManagementComponent implements OnInit {
  businessId: string;
  users$: Observable<BusinessUser[]>;
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

  ngOnInit() {
    try {
      const user = this.authService.getCurrentUser();
      this.currentUserId = user ? user.uid : null;
      this.loadUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error initializing component');
    }
  }

  loadUsers() {
    this.users$ = this.businessService.getBusinessUsers(this.businessId);
    this.loading = true;
  }

  updateUserRole(userId: string, newRole: string) {
    this.businessService
      .updateUserRole(this.businessId, userId, newRole)
      .subscribe(
        () => {
          this.errorHandler.showSuccess(
            `User role updated to ${newRole} successfully`
          );
          this.loadUsers(); // Reload users to reflect the change
        },
        (error) => {
          this.errorHandler.handleError(error, 'Error updating user role');
        }
      );
  }

  removeUser(userId: string) {
    if (userId === this.currentUserId) {
      this.errorHandler.showWarning(
        'You cannot remove yourself from the business'
      );
      return;
    }

    this.businessService
      .removeUserFromBusiness(this.businessId, userId)
      .subscribe(
        () => {
          this.errorHandler.showSuccess(
            'User removed from business successfully'
          );
          this.loadUsers(); // Reload users to reflect the change
        },
        (error) => {
          this.errorHandler.handleError(
            error,
            'Error removing user from business'
          );
        }
      );
  }
}
