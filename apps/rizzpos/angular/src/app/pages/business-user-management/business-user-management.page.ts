import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { BusinessService } from '@rizzpos/shared/services';
import { Observable, Subscription, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ActivatedRoute } from '@angular/router';
import { BusinessUser } from '@rizzpos/shared/interfaces';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-business-user-management',
  templateUrl: './business-user-management.page.html',
  styleUrls: ['./business-user-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonInput,
    IonText,
  ],
})
export class BusinessUserManagementPageComponent implements OnInit, OnDestroy {
  businessId: string;
  businessUsers$: Observable<BusinessUser[]> = of([]);
  isAddUserModalOpen = false;
  addUserForm: FormGroup;
  errorMessage: string | null = null;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private fb: FormBuilder
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.addUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadBusinessUsers();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadBusinessUsers() {
    this.businessUsers$ = this.businessService.getBusinessUsersRealtime(
      this.businessId
    );
    this.subscription = this.businessUsers$.subscribe(
      (users) => console.log('Loaded business users:', users),
      (error) => console.error('Error loading business users:', error)
    );
  }

  updateUserRole(userId: string, newRole: string) {
    this.businessService
      .updateBusinessUserRole(this.businessId, userId, newRole)
      .subscribe({
        next: () => {
          // Handle success (e.g., show a success message)
        },
        error: (error) => {
          this.errorMessage = 'Error updating user role';
          console.error('Error updating user role:', error);
        },
      });
  }

  removeUser(userId: string) {
    console.log('Attempting to remove user:', userId);
    this.businessService.removeBusinessUser(this.businessId, userId).subscribe({
      next: () => {
        console.log('User removed successfully');
        // Update the businessUsers$ observable
        this.businessUsers$ = this.businessUsers$.pipe(
          map((users) => users.filter((user) => user.userId !== userId))
        );
      },
      error: (error) => {
        this.errorMessage = 'Error removing user';
        console.error('Error removing user:', error);
      },
    });
  }

  openAddUserModal() {
    this.isAddUserModalOpen = true;
  }

  closeAddUserModal() {
    this.isAddUserModalOpen = false;
    this.addUserForm.reset();
  }

  addUser() {
    if (this.addUserForm.valid) {
      const newUser = this.addUserForm.value;
      console.log('Adding new user:', newUser);
      this.businessService.addBusinessUser(this.businessId, newUser).subscribe(
        () => {
          console.log('User added successfully');
          this.closeAddUserModal();
          this.loadBusinessUsers(); // Reload the user list
          this.errorMessage = null; // Clear any previous error messages
        },
        (error) => {
          console.error('Error adding user:', error);
          this.errorMessage = 'Failed to add user. Please try again.';
        }
      );
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }
}
