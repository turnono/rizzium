import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonButtons,
  AlertController,
  PopoverController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  listOutline,
  settingsOutline,
  homeOutline,
  logInOutline,
  logOutOutline,
  cloudUploadOutline,
  warningOutline,
  shieldCheckmarkOutline,
  analyticsOutline,
  personCircleOutline,
  homeSharp,
  shieldCheckmarkSharp,
  warningSharp,
  analyticsSharp,
  settingsSharp,
  personCircleSharp,
  cloudUploadSharp,
  documentTextSharp,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ui-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FooterComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>FineScan</ion-title>
        <ion-buttons slot="end">
          <ion-button [routerLink]="['/']">
            <ion-icon slot="icon-only" name="home"></ion-icon>
          </ion-button>

          @if (isLoggedIn) {
          <ion-button [routerLink]="['/reports']">
            <ion-icon slot="icon-only" name="analytics"></ion-icon>
          </ion-button>
          <ion-button [routerLink]="['/settings']">
            <ion-icon slot="icon-only" name="settings"></ion-icon>
          </ion-button>

          <!-- User Profile Button -->
          <ion-button (click)="showUserMenu($event)" data-cy="user-profile-button">
            <ion-icon slot="start" name="person-circle"></ion-icon>
            {{ displayName }}
          </ion-button>
          } @else {
          <ion-button (click)="navigateToLogin()" color="secondary" data-cy="login-button">
            <ion-icon slot="start" name="log-in"></ion-icon>
            Sign In
          </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center">FineScan AI</ion-card-title>
          <ion-card-subtitle class="ion-text-center">Your AI-Powered Fine Print Analysis Tool</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <div class="features">
            <ion-card class="feature-card">
              <ion-card-content>
                <ion-icon name="shield-checkmark" color="success"></ion-icon>
                <h3>Secure Analysis</h3>
                <p>Upload documents securely with end-to-end encryption</p>
              </ion-card-content>
            </ion-card>

            <ion-card class="feature-card">
              <ion-card-content>
                <ion-icon name="warning" color="warning"></ion-icon>
                <h3>Red Flag Detection</h3>
                <p>Identify potential issues and concerning clauses</p>
              </ion-card-content>
            </ion-card>

            <ion-card class="feature-card">
              <ion-card-content>
                <ion-icon name="analytics" color="primary"></ion-icon>
                <h3>Smart Insights</h3>
                <p>Get AI-powered analysis and recommendations</p>
              </ion-card-content>
            </ion-card>
          </div>

          <div class="action-buttons">
            @if (isLoggedIn) {
            <ion-button expand="block" color="primary" [routerLink]="['/file-upload']" class="ion-margin-bottom">
              <ion-icon slot="start" name="cloud-upload"></ion-icon>
              Analyze Document
            </ion-button>

            <ion-button expand="block" color="secondary" [routerLink]="['/reports']">
              <ion-icon slot="start" name="document-text"></ion-icon>
              View Analysis History
            </ion-button>
            } @else {
            <ion-button expand="block" color="primary" (click)="navigateToLogin()" class="ion-margin-bottom">
              <ion-icon slot="start" name="log-in"></ion-icon>
              Get Started
            </ion-button>
            }
          </div>
        </ion-card-content>
      </ion-card>

      <rizzium-footer></rizzium-footer>
    </ion-content>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ion-content {
        --background: #1c1c1c;
      }

      ion-card {
        margin-top: 2rem;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 6rem; // More space for fixed footer
      }

      ion-card-title {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--ion-color-primary);
        margin-bottom: 0.5rem;
      }

      ion-card-subtitle {
        font-size: 1.2rem;
        color: var(--ion-color-medium);
        margin-bottom: 2rem;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .feature-card {
        text-align: center;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin: 0;

        ion-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--ion-color-light);
        }

        p {
          color: var(--ion-color-medium);
          line-height: 1.4;
          font-size: 1rem;
        }
      }

      .action-buttons {
        max-width: 400px;
        margin: 2rem auto;

        ion-button {
          margin-bottom: 1rem;
          --border-radius: 8px;
          height: 48px;
          font-size: 1.1rem;
        }
      }

      @media (max-width: 576px) {
        ion-card-title {
          font-size: 2rem;
        }

        ion-card-subtitle {
          font-size: 1rem;
        }

        .features {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        ion-card {
          margin: 1rem;
          margin-bottom: 6rem; // More space for fixed footer
        }
      }
    `,
  ],
})
export class LandingComponent implements OnDestroy {
  isLoggedIn = false;
  displayName = 'User';
  private authSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: FirebaseAuthService,
    private alertController: AlertController,
    private popoverController: PopoverController
  ) {
    addIcons({
      documentTextOutline,
      listOutline,
      settingsOutline,
      homeOutline,
      logInOutline,
      logOutOutline,
      cloudUploadOutline,
      warningOutline,
      shieldCheckmarkOutline,
      analyticsOutline,
      personCircleOutline,
      home: homeSharp,
      'shield-checkmark': shieldCheckmarkSharp,
      warning: warningSharp,
      analytics: analyticsSharp,
      'log-in': logInOutline,
      settings: settingsSharp,
      'person-circle': personCircleSharp,
      'cloud-upload': cloudUploadSharp,
      'document-text': documentTextSharp,
    });

    // Subscribe to auth state
    this.authSubscription = this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.displayName = user?.displayName || 'User';
    });
  }

  async showUserMenu(event: Event) {
    const alert = await this.alertController.create({
      header: 'Account',
      message: `Signed in as ${this.displayName}`,
      buttons: [
        {
          text: 'Settings',
          handler: () => {
            this.router.navigate(['/settings']);
          },
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            this.confirmLogout();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
      cssClass: 'user-menu',
    });

    await alert.present();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      cssClass: 'alert-logout',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Logout',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
