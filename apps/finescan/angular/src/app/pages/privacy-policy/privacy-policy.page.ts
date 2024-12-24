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
        <ion-card-content>
          <div class="policy-content">
            <section>
              <h2>1. Introduction</h2>
              <p>
                Welcome to FineScan! Your privacy is important to us. This Privacy Policy explains how we collect, use,
                and protect your personal information in compliance with South African laws, including the Protection of
                Personal Information Act (POPIA).
              </p>
              <p>By using our app, you agree to the terms outlined in this Privacy Policy.</p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <h3>2.1 Personal Information</h3>
              <ul>
                <li>Full name</li>
                <li>Email address</li>
                <li>Authentication details (for login purposes)</li>
              </ul>

              <h3>2.2 Document and Image Data</h3>
              <ul>
                <li>Uploaded images for analysis</li>
                <li>Metadata related to uploaded content (e.g., timestamps)</li>
              </ul>

              <h3>2.3 Technical Information</h3>
              <ul>
                <li>Device information (e.g., model, operating system)</li>
                <li>IP address and browser type</li>
                <li>Usage statistics (e.g., feature interactions)</li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul>
                <li>Analyze uploaded images and generate insights</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve app performance and features</li>
                <li>Enforce security measures and prevent fraud</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2>4. Data Storage and Security</h2>
              <ul>
                <li>All data is stored securely using Google Firebase with encryption</li>
                <li>Uploaded images are automatically deleted after analysis unless explicitly saved by the user</li>
                <li>Access to your data is restricted based on role-based permissions</li>
                <li>Regular audits are conducted to ensure compliance with POPIA</li>
              </ul>
            </section>

            <section>
              <h2>5. Sharing of Information</h2>
              <p>We do not sell your data to third parties. Information may only be shared:</p>
              <ul>
                <li>With service providers who assist in app functionality (e.g., Firebase, OpenAI)</li>
                <li>When required by law or to protect legal rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2>6. Third-Party Services</h2>
              <p>
                FineScan uses Google Firebase for authentication, hosting, storage, and AI processing. Firebase complies
                with global security standards, including ISO 27001 and SOC 2. Your data is encrypted both in transit
                and at rest.
              </p>
              <p>
                While some data may be processed outside South Africa, we ensure equivalent levels of protection as
                required under POPIA.
              </p>
            </section>

            <section>
              <h2>7. Your Rights Under POPIA</h2>
              <p>You have the following rights:</p>
              <ul>
                <li><strong>Access:</strong> Request access to the personal information we store about you</li>
                <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your data, subject to legal limitations</li>
                <li><strong>Objection:</strong> Object to data processing for specific purposes</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
              </ul>
              <p>To exercise any of these rights, contact us at privacy&#64;finescan.co.za</p>
            </section>

            <section>
              <h2>8. Data Retention</h2>
              <ul>
                <li>Uploaded images are deleted immediately after analysis unless explicitly saved by the user</li>
                <li>User account data is retained as long as the account is active or required by law</li>
              </ul>
            </section>

            <section>
              <h2>9. International Transfers</h2>
              <p>
                Your data may be processed outside South Africa, but we ensure it receives the same level of protection
                as required by POPIA.
              </p>
            </section>

            <section>
              <h2>10. Updates to this Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Updates will be communicated via email or app
                notifications.
              </p>
            </section>

            <section>
              <h2>11. Contact Us</h2>
              <p>For questions, concerns, or requests related to this Privacy Policy, please contact us at:</p>
              <p><strong>Email:</strong> privacy&#64;finescan.co.za</p>
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

        .effective-date {
          color: var(--ion-color-medium);
          font-style: italic;
          margin-bottom: 24px;
        }

        section {
          margin-bottom: 32px;

          h2 {
            color: var(--ion-color-dark);
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
          }

          h3 {
            color: var(--ion-color-dark);
            font-size: 1.1rem;
            font-weight: 500;
            margin: 16px 0 12px;
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
