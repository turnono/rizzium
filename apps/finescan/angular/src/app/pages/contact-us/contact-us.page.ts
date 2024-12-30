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
  IonIcon,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  locationOutline,
  callOutline,
  logoFacebook,
  logoInstagram,
  logoTiktok,
  logoLinkedin,
  timeOutline,
  helpCircleOutline,
  cloudOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-contact-us',
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
    IonIcon,
    IonItem,
    IonLabel,
    FooterComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Contact Us</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="contact-card">
        <ion-card-content>
          <div class="contact-content">
            <p class="intro">
              We value your feedback and are here to assist you with any questions or concerns you may have about
              FineScan AI. Please feel free to reach out to us through any of the following methods:
            </p>

            <section>
              <h2>
                <ion-icon name="mail-outline"></ion-icon>
                Email Support
              </h2>
              <p>For general inquiries, technical support, or feedback, you can email us at:</p>
              <ion-item lines="none" class="contact-item">
                <ion-label>
                  <strong>Support Email:</strong>
                  <p>taajirah0&#64;gmail.com</p>
                </ion-label>
              </ion-item>
              <p class="note">We aim to respond to all emails within 24-48 hours during business days.</p>
            </section>

            <section>
              <h2>
                <ion-icon name="location-outline"></ion-icon>
                Physical Address
              </h2>
              <p>You can visit or send correspondence to our physical office:</p>
              <ion-item lines="none" class="contact-item">
                <ion-label>
                  <strong>Office Address:</strong>
                  <p>35 Klip Cresent</p>
                  <p>Eldorado Park</p>
                  <p>Soweto, 1811</p>
                  <p>Gauteng, South Africa</p>
                </ion-label>
              </ion-item>
            </section>

            <section>
              <h2>
                <ion-icon name="call-outline"></ion-icon>
                Phone Support
              </h2>
              <ion-item lines="none" class="contact-item">
                <ion-label>
                  <strong>Phone Number:</strong>
                  <p>+27 65 862 3499</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none" class="contact-item">
                <ion-icon name="time-outline" slot="start"></ion-icon>
                <ion-label>
                  <strong>Business Hours:</strong>
                  <p>Monday to Friday, 9 AM – 5 PM (SAST)</p>
                </ion-label>
              </ion-item>
            </section>

            <section>
              <h2>
                <ion-icon name="help-circle-outline"></ion-icon>
                Social Media
              </h2>
              <p>Stay connected with us through our social media channels for updates and announcements:</p>
              <div class="social-links">
                <a href="https://facebook.com/taajirah0" target="_blank" rel="noopener noreferrer">
                  <ion-icon name="logo-facebook"></ion-icon>
                  <span>Facebook</span>
                </a>
                <a href="https://instagram.com/taajirah0" target="_blank" rel="noopener noreferrer">
                  <ion-icon name="logo-instagram"></ion-icon>
                  <span>Instagram</span>
                </a>
                <a href="https://tiktok.com/@taajirah0" target="_blank" rel="noopener noreferrer">
                  <ion-icon name="logo-tiktok"></ion-icon>
                  <span>TikTok</span>
                </a>
                <a href="https://linkedin.com/in/taajirah0" target="_blank" rel="noopener noreferrer">
                  <ion-icon name="logo-linkedin"></ion-icon>
                  <span>LinkedIn</span>
                </a>
                <a href="https://bsky.app/profile/taajirah0.bsky.social" target="_blank" rel="noopener noreferrer">
                  <ion-icon name="cloud-outline"></ion-icon>
                  <span>Bluesky</span>
                </a>
              </div>
            </section>

            <section>
              <h2>Support Form</h2>
              <p>
                You can also submit your questions or feedback directly through our in-app contact form under the Help
                section.
              </p>
            </section>

            <p class="outro">Thank you for choosing FineScan AI! We look forward to hearing from you.</p>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }

      .contact-card {
        max-width: 800px;
        margin: 16px auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background: var(--ion-color-light);
      }

      .contact-content {
        padding: 16px;

        .intro,
        .outro {
          color: var(--ion-color-medium);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        section {
          margin-bottom: 32px;

          h2 {
            color: var(--ion-color-dark);
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;

            ion-icon {
              font-size: 1.5rem;
              color: var(--ion-color-primary);
            }
          }

          p {
            color: var(--ion-color-medium);
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 16px;
          }
        }

        .contact-item {
          --background: transparent;
          margin-bottom: 8px;

          ion-icon {
            color: var(--ion-color-primary);
            font-size: 1.25rem;
            margin-right: 8px;
          }

          ion-label {
            strong {
              color: var(--ion-color-dark);
              font-weight: 500;
              display: block;
              margin-bottom: 4px;
            }

            p {
              color: var(--ion-color-medium);
              margin: 0;
              font-size: 0.95rem;
            }
          }
        }

        .social-links {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 16px;

          a {
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            color: var(--ion-color-medium);
            padding: 8px 16px;
            border-radius: 8px;
            background: var(--ion-color-light-shade);
            transition: all 0.2s ease;

            &:hover {
              background: var(--ion-color-primary-tint);
              color: var(--ion-color-primary);
            }

            ion-icon {
              font-size: 1.25rem;
            }
          }
        }

        .note {
          font-size: 0.9rem;
          color: var(--ion-color-medium);
          font-style: italic;
          margin-top: 8px;
        }
      }

      @media (max-width: 768px) {
        .contact-card {
          margin: 8px;
        }

        .contact-content {
          padding: 12px;

          section {
            margin-bottom: 24px;

            h2 {
              font-size: 1.1rem;
            }

            p {
              font-size: 0.9rem;
            }
          }

          .social-links {
            flex-direction: column;
            gap: 8px;

            a {
              width: 100%;
              justify-content: center;
            }
          }
        }
      }
    `,
  ],
})
export class ContactUsComponent {
  constructor() {
    addIcons({
      mailOutline,
      locationOutline,
      callOutline,
      logoFacebook,
      logoInstagram,
      logoTiktok,
      logoLinkedin,
      timeOutline,
      helpCircleOutline,
      cloudOutline,
    });
  }
}
