import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonContent } from '@ionic/angular/standalone';

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

    this.authService.user$.subscribe((user) => {
      if (user) {
        this.handleJoin();
      } else {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url },
        });
      }
    });
  }

  async handleJoin() {
    if (!this.businessId) return;

    try {
      await this.authService.handleRoleBasedURL(
        this.businessId,
        this.role || undefined
      );
      const userRole = await this.authService.getUserRoleForBusiness(
        this.businessId
      );

      switch (userRole) {
        case 'cashier':
          this.router.navigate(['/business', this.businessId, 'sales']);
          break;
        case 'manager':
          this.router.navigate(['/business', this.businessId, 'inventory']);
          break;
        case 'owner':
          this.router.navigate(['/business', this.businessId, 'dashboard']);
          break;
        case 'customer':
          this.router.navigate([
            '/business',
            this.businessId,
            'customer-dashboard',
          ]);
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
