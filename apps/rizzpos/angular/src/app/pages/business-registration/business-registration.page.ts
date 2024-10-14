import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { BusinessService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business-registration',
  templateUrl: './business-registration.page.html',
  styleUrl: './business-registration.page.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class BusinessRegistrationComponent {
  registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      businessName: ['', Validators.required],
      ownerEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.registrationForm.valid) {
      try {
        const businessId = await this.businessService.registerBusiness(
          this.registrationForm.value
        );
        this.router.navigate(['/business', businessId, 'dashboard']);
      } catch (error) {
        console.error('Error registering business:', error);
        // Handle error (show message to user)
      }
    }
  }
}
