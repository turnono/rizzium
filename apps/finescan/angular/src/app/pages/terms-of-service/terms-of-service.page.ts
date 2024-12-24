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
  IonCardContent,
} from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';

@Component({
  selector: 'app-terms-of-service',
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
    IonCardContent,
    FooterComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Terms of Service</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="terms-card">
        <ion-card-content>
          <div class="terms-content">
            <section>
              <h2>1. Introduction</h2>
              <p>
                Welcome to FineScan! These Terms and Conditions govern your use of our application and services. By
                accessing or using FineScan, you agree to comply with and be bound by these terms. If you do not agree,
                please do not use our services.
              </p>
            </section>

            <section>
              <h2>2. Definitions</h2>
              <ul>
                <li>"Service" refers to the FineScan application and related features.</li>
                <li>"User" refers to anyone accessing or using the FineScan application.</li>
                <li>"Content" refers to any documents, images, or data uploaded by the user.</li>
              </ul>
            </section>

            <section>
              <h2>3. Eligibility</h2>
              <p>
                You must be at least 18 years old or have the consent of a legal guardian to use this service. By using
                FineScan, you confirm that you meet these requirements.
              </p>
            </section>

            <section>
              <h2>4. Use of the Service</h2>
              <p>
                FineScan is provided for informational purposes only. It does not offer legal, financial, or
                professional advice.
              </p>
              <p>You agree not to misuse the service, including but not limited to:</p>
              <ul>
                <li>Uploading illegal, harmful, or offensive content</li>
                <li>Attempting to access or modify data that does not belong to you</li>
                <li>Engaging in activities that may harm the service or other users</li>
              </ul>
            </section>

            <section>
              <h2>5. User Content</h2>
              <ul>
                <li>You retain ownership of the content you upload to FineScan</li>
                <li>By uploading content, you grant FineScan permission to process it for analysis purposes</li>
                <li>Uploaded content will be deleted immediately after analysis unless explicitly saved by the user</li>
              </ul>
            </section>

            <section>
              <h2>6. Privacy</h2>
              <p>
                Your use of FineScan is also governed by our Privacy Policy, which explains how we collect, use, and
                protect your data. By using the service, you agree to the terms outlined in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2>7. Limitation of Liability</h2>
              <ul>
                <li>
                  FineScan is provided "as is" and "as available." While we strive for accuracy, we do not guarantee
                  that the analysis provided is free from errors.
                </li>
                <li>We are not responsible for decisions made based on the results provided by the service.</li>
                <li>
                  FineScan, its developers, and affiliates shall not be liable for any direct, indirect, or
                  consequential damages arising from the use of the service.
                </li>
              </ul>
            </section>

            <section>
              <h2>8. Modifications to the Service</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service at any time without
                prior notice.
              </p>
            </section>

            <section>
              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your access to the service without prior notice if you violate these Terms
                and Conditions or for any other reason deemed necessary.
              </p>
            </section>

            <section>
              <h2>10. Governing Law</h2>
              <p>
                These Terms and Conditions are governed by and interpreted in accordance with the laws of South Africa.
                Any disputes shall be resolved in South African courts.
              </p>
            </section>

            <section>
              <h2>11. Contact Us</h2>
              <p>For questions or concerns about these Terms and Conditions, please contact us at:</p>
              <p><strong>Email:</strong> support&#64;finescan.co.za</p>
              <p><strong>Address:</strong> 123 Main Street, Cape Town, 8001, South Africa</p>
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

      .terms-card {
        max-width: 800px;
        margin: 16px auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background: var(--ion-color-light);
      }

      .terms-content {
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

          ul {
            list-style-type: disc;
            padding-left: 24px;
            margin-bottom: 16px;

            li {
              color: var(--ion-color-medium);
              margin-bottom: 8px;
              line-height: 1.5;
            }
          }

          strong {
            color: var(--ion-color-dark);
            font-weight: 500;
          }
        }
      }

      @media (max-width: 768px) {
        .terms-card {
          margin: 8px;
        }

        .terms-content {
          padding: 12px;

          section {
            margin-bottom: 20px;

            h2 {
              font-size: 1.1rem;
            }

            p,
            li {
              font-size: 0.9rem;
            }
          }
        }
      }
    `,
  ],
})
export class TermsOfServicePage {}
