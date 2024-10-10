import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { BusinessService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-business-setup',
  templateUrl: './business-setup.component.html',
  styleUrls: ['./business-setup.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class BusinessSetupComponent {
  businessForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private router: Router
  ) {
    this.businessForm = this.fb.group({
      businessName: ['', Validators.required],
      businessType: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.businessForm.valid) {
      try {
        const businessId = await this.businessService.setupBusiness(
          this.businessForm.value
        );
        this.router.navigate(['/business', businessId, 'dashboard']);
      } catch (error) {
        console.error('Error setting up business:', error);
        // Handle error (show message to user)
      }
    }
  }
}
