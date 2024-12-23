import { Component, OnDestroy, OnInit } from '@angular/core';
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
  IonChip,
  IonLabel,
  IonText,
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
  cloudOfflineOutline,
  flashOutline,
  phonePortraitOutline,
  shieldCheckmark,
  flash,
  phonePortrait,
  logIn,
  personOutline,
  cameraOutline,
  documentOutline,
  person,
  camera,
  document,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { merge } from 'rxjs';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

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
    IonChip,
    IonLabel,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <div class="logo-container">
          <img src="assets/finescan_logo.png" alt="FineScan Logo" class="header-logo" />
          <ion-text>FineScan</ion-text>
        </div>
        @if (!isOnline) {
        <ion-chip color="warning" class="offline-chip">
          <ion-icon name="cloud-offline"></ion-icon>
          <ion-label>Offline</ion-label>
        </ion-chip>
        }
        <ion-buttons slot="end">
          @if (isLoggedIn) {
          <ion-button class="user-button" (click)="showUserMenu($event)">
            <ion-icon slot="start" name="person"></ion-icon>
            <ion-label class="hide-sm">{{ displayName }}</ion-label>
          </ion-button>
          } @else {
          <ion-button class="login-button" (click)="navigateToLogin()">
            <ion-icon slot="start" name="log-in"></ion-icon>
            <ion-label>Sign In</ion-label>
          </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Offline Warning -->
      @if (!isOnline) {
      <ion-card color="warning" class="offline-warning">
        <ion-card-content>
          <ion-icon name="warning"></ion-icon>
          <p>You're currently offline. Some features may be limited.</p>
        </ion-card-content>
      </ion-card>
      }

      <div class="main-content">
        <ion-card class="welcome-card">
          <ion-card-header>
            <ion-card-title class="ion-text-center">Document Analysis Made Easy</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <div class="feature-grid">
              <div class="feature-item">
                <ion-icon name="shield-checkmark" color="success" size="large"></ion-icon>
                <h3>Safe & Secure</h3>
                <p>Your documents are protected</p>
              </div>

              <div class="feature-item">
                <ion-icon name="flash" color="warning" size="large"></ion-icon>
                <h3>Works Offline</h3>
                <p>Continue working without internet</p>
              </div>

              <div class="feature-item">
                <ion-icon name="phone-portrait" color="primary" size="large"></ion-icon>
                <h3>Mobile Friendly</h3>
                <p>Works on all devices</p>
              </div>
            </div>

            <div class="action-buttons">
              @if (isLoggedIn) {
              <ion-button expand="block" size="large" class="main-action" [routerLink]="['/file-upload']">
                <ion-icon slot="start" name="camera"></ion-icon>
                Scan Document
              </ion-button>

              <ion-button expand="block" size="large" fill="outline" [routerLink]="['/reports']">
                <ion-icon slot="start" name="document"></ion-icon>
                View Reports
              </ion-button>
              } @else {
              <ion-button expand="block" size="large" class="main-action" (click)="navigateToLogin()">
                Get Started - It's Free
              </ion-button>
              }
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ion-header ion-toolbar {
        --padding-start: 8px;
        --padding-end: 8px;
      }

      .offline-chip {
        margin-left: 8px;
        font-size: 12px;
      }

      .main-content {
        max-width: 100%;
        margin: 0 auto;
        padding: 8px;
      }

      .welcome-card {
        margin: 0;
        box-shadow: none;
        background: transparent;

        ion-card-title {
          font-size: 1.5rem;
          line-height: 1.2;
          margin-bottom: 8px;
        }
      }

      .feature-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin: 16px 0;
      }

      .feature-item {
        text-align: center;
        padding: 16px;
        background: var(--ion-color-light);
        border-radius: 12px;
        min-height: 120px;

        ion-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        h3 {
          margin: 8px 0;
          font-size: 16px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .action-buttons {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        ion-button {
          margin: 0;
          height: 44px;
          --border-radius: 12px;
          font-size: 16px;
        }
      }

      @media (min-width: 768px) {
        .main-content {
          max-width: 600px;
          padding: 16px;
        }

        .feature-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .action-buttons {
          flex-direction: row;
        }
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;

        .header-logo {
          height: 32px;
          width: auto;
        }

        ion-text {
          font-size: 1.2rem;
          font-weight: 600;
        }
      }
    `,
  ],
})
export class LandingComponent implements OnDestroy {
  isLoggedIn = false;
  displayName = 'User';
  isOnline = navigator.onLine;
  private authSubscription: Subscription;
  private networkSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: FirebaseAuthService,
    private alertController: AlertController
  ) {
    // Register all icons
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
      homeSharp,
      shieldCheckmarkSharp,
      warningSharp,
      analyticsSharp,
      settingsSharp,
      personCircleSharp,
      cloudUploadSharp,
      documentTextSharp,
      cloudOfflineOutline,
      flashOutline,
      phonePortraitOutline,
      shieldCheckmark,
      flash,
      'phone-portrait': phonePortrait,
      'log-in': logIn,
      person: personOutline,
      camera: cameraOutline,
      document: documentOutline,
    });

    // Auth subscription
    this.networkSubscription = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe((status) => {
      this.isOnline = status;
    });

    this.authSubscription = this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.displayName = user?.displayName || 'User';
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.networkSubscription?.unsubscribe();
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
}
