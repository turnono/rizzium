import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonContent } from '@ionic/angular/standalone';
import { UserRole } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner],
  templateUrl: './join.page.html',
  styleUrl: './join.page.scss',
})
export class JoinComponent implements OnInit {
  businessId: string | null = null;
  role: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: FirebaseAuthService
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.queryParamMap.get('businessId');
    this.role = this.route.snapshot.queryParamMap.get('role');

    if (!this.businessId) {
      this.router.navigate(['/']);
      return;
    }

    this.handleJoin();
  }

  async handleJoin() {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        // Redirect to login page with return URL
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url },
        });
        return;
      }

      await this.authService.handleRoleBasedURL(
        this.businessId as string,
        this.role as UserRole
      );

      // Redirect based on role
      switch (this.role) {
        case 'cashier':
          this.router.navigate(['/business', this.businessId, 'sales']);
          break;
        case 'manager':
          this.router.navigate(['/business', this.businessId, 'inventory']);
          break;
        case 'owner':
          this.router.navigate(['/business', this.businessId, 'dashboard']);
          break;
        default:
          this.router.navigate([
            '/business',
            this.businessId,
            'customer-dashboard',
          ]);
      }
    } catch (error) {
      console.error('Error handling join:', error);
      // Handle error (show message to user)
    }
  }
}
