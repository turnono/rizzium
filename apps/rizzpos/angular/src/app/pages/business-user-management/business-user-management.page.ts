import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  FirebaseAuthService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BusinessUser } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.page.html',
  styleUrl: './business-user-management.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    FormsModule,
  ],
})
export class BusinessUserManagementPageComponent implements OnInit, OnDestroy {
  businessId: string;
  businessUsers$?: Observable<BusinessUser[]>;
  private businessUsersSubscription?: Subscription;
  currentUserId?: string;

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
      this.currentUserId = user ? user.uid : undefined;
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
    this.businessUsersSubscription = this.businessUsers$.subscribe({
      next: () => {
        // Handle successful data loading if needed
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'Error loading business users');
      },
    });
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
