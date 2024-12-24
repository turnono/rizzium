import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    FooterComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Privacy Policy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="policy-card">
        <ion-card-header>
          <ion-card-title>Privacy Policy</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="policy-content">
            <section>
              <h2>Information We Collect</h2>
              <p>Your privacy policy content goes here...</p>
            </section>

            <section>
              <h2>How We Use Your Information</h2>
              <p>Your privacy policy content goes here...</p>
            </section>

            <section>
              <h2>Data Security</h2>
              <p>Your privacy policy content goes here...</p>
            </section>

            <section>
              <h2>Your Rights</h2>
              <p>Your privacy policy content goes here...</p>
            </section>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
    <rizzium-footer [appName]="'finescan'"></rizzium-footer>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }

      .policy-card {
        max-width: 800px;
        margin: 16px auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background: var(--ion-color-light);
      }

      ion-card-header {
        background-color: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
        padding: 16px;

        ion-card-title {
          font-size: 1.5rem;
          font-weight: 600;
        }
      }

      .policy-content {
        padding: 16px;

        section {
          margin-bottom: 24px;

          h2 {
            color: var(--ion-color-dark);
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 12px;
          }

          p {
            color: var(--ion-color-medium);
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 16px;
          }
        }
      }

      @media (max-width: 768px) {
        .policy-card {
          margin: 8px;
        }

        ion-card-header ion-card-title {
          font-size: 1.25rem;
        }

        .policy-content {
          padding: 12px;

          section {
            margin-bottom: 20px;

            h2 {
              font-size: 1.1rem;
            }

            p {
              font-size: 0.9rem;
            }
          }
        }
      }
    `,
  ],
})
export class PrivacyPolicyPage {}
