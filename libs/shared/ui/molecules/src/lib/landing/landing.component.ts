import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
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
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ui-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
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
          <ion-button [routerLink]="['/reports']">
            <ion-icon slot="icon-only" name="analytics"></ion-icon>
          </ion-button>
          <ion-button [routerLink]="['/settings']">
            <ion-icon slot="icon-only" name="settings"></ion-icon>
          </ion-button>
          <ion-button (click)="handleAuth()">
            <ion-icon slot="icon-only" [name]="isLoggedIn ? 'log-out' : 'log-in'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center">FineScan AI</ion-card-title>
          <ion-card-subtitle class="ion-text-center"> Your AI-Powered Fine Print Analysis Tool </ion-card-subtitle>
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
            <ion-button expand="block" color="primary" [routerLink]="['/file-upload']" class="ion-margin-bottom">
              <ion-icon slot="start" name="cloud-upload"></ion-icon>
              Analyze Document
            </ion-button>

            <ion-button expand="block" color="secondary" [routerLink]="['/reports']">
              <ion-icon slot="start" name="document-text"></ion-icon>
              View Analysis History
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ion-card {
        margin-top: 2rem;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
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

        ion-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--ion-color-dark);
        }

        p {
          color: var(--ion-color-medium);
          line-height: 1.4;
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
      }
    `,
  ],
})
export class LandingComponent implements OnDestroy {
  isLoggedIn = false;
  private authSubscription: Subscription;

  constructor(private router: Router, private authService: FirebaseAuthService) {
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
    });

    // Subscribe to auth state
    this.authSubscription = this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  async handleAuth() {
    if (this.isLoggedIn) {
      await this.authService.signOut();
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
