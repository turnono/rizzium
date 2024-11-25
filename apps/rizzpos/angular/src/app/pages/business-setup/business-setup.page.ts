import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessService } from '@rizzium/shared/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-business-setup',
  templateUrl: './business-setup.page.html',
  styleUrls: ['./business-setup.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class BusinessSetupComponent {
  businessForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private router: Router
  ) {
    this.businessForm = this.fb.group({
      businessName: ['', Validators.required],
      businessType: ['', Validators.required],
      address: [''],
      phoneNumber: [''],
    });
  }

  async onSubmit() {
    if (this.businessForm.valid) {
      try {
        console.log('Submitting business form:', this.businessForm.value);
        const businessId = await this.businessService.setupBusiness(
          this.businessForm.value
        );
        console.log('Business created with ID:', businessId);
        this.successMessage = 'Business created successfully. Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/business', businessId, 'dashboard']);
        }, 2000);
      } catch (error) {
        console.error('Error setting up business:', error);
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create business. Please try again.';
      }
    } else {
      console.log('Form is invalid:', this.businessForm.errors);
      this.errorMessage = 'Please fill in all required fields.';
    }
  }
}
