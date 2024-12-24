import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonFooter, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoFacebook, logoTwitter, logoLinkedin, logoInstagram } from 'ionicons/icons';

@Component({
  selector: 'rizzium-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, IonFooter, IonToolbar, IonIcon],
  templateUrl: './footer.component.html',
  styles: [
    `
      :host {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
        background: var(--ion-color-light);
      }

      ion-footer {
        --ion-toolbar-background: var(--ion-color-light);
        --ion-toolbar-color: var(--ion-color-dark);
      }

      .footer-content {
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        max-height: 140px;
      }

      .footer-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;

        a {
          color: var(--ion-color-dark);
          text-decoration: none;
          font-size: 12px;
          opacity: 0.7;
          padding: 4px;
        }
      }

      .social-links {
        display: flex;
        gap: 16px;

        a {
          color: var(--ion-color-dark);
          opacity: 0.7;
          padding: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);

          ion-icon {
            font-size: 18px;
          }

          &:active {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }

      .copyright {
        font-size: 12px;
        opacity: 0.7;
        text-align: center;
      }

      @media (min-width: 768px) {
        .footer-content {
          flex-direction: row;
          justify-content: space-between;
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
          max-height: 80px;
        }

        .footer-links a {
          font-size: 14px;
        }

        .social-links a ion-icon {
          font-size: 20px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  @Input() appName = 'rizzium';

  constructor() {
    addIcons({
      logoFacebook,
      logoTwitter,
      logoLinkedin,
      logoInstagram,
    });
  }
}
