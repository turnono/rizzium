import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.component.html',
  styleUrls: ['./business-user-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class BusinessUserManagementComponent implements OnInit, OnDestroy {
  businessId: string;
  businessUsers$: Observable<BusinessUser[]>;
  private businessUsersSubscription: Subscription;

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
      this.loadBusinessUsers();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error initializing component');
    }
  }

  ngOnDestroy() {
    if (this.businessUsersSubscription) {
      this.businessUsersSubscription.unsubscribe();
    }
  }

  loadBusinessUsers() {
    this.businessUsers$ = this.businessService.getBusinessUsersRealtime(
      this.businessId
    );
    this.businessUsersSubscription = this.businessUsers$.subscribe(
      () => {},
      (error) => {
        this.errorHandler.handleError(error, 'Error loading business users');
      }
    );
  }

  updateUserRole(userId: string, newRole: string) {
    this.businessService
      .updateBusinessUserRole(this.businessId, userId, newRole)
      .subscribe(
        () => {
          this.errorHandler.showSuccess('User role updated successfully');
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

    this.businessService.removeBusinessUser(this.businessId, userId).subscribe(
      () => {
        this.errorHandler.showSuccess('User removed successfully');
      },
      (error) => {
        this.errorHandler.handleError(error, 'Error removing user');
      }
    );
  }
}
