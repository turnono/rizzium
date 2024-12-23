import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonFooter, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoFacebook, logoTwitter, logoLinkedin, logoInstagram } from 'ionicons/icons';

@Component({
  selector: 'rizzium-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, IonFooter, IonToolbar, IonIcon],
  template: `
    <ion-footer collapse="fade" class="ion-no-border">
      <ion-toolbar color="dark">
        <div class="footer-content">
          <div class="footer-links">
            <a routerLink="/privacy">Privacy Policy</a>
            <a routerLink="/terms">Terms of Service</a>
            <a routerLink="/contact">Contact Us</a>
          </div>
          <div class="social-links">
            <a href="https://facebook.com/finescan" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <ion-icon name="logo-facebook"></ion-icon>
            </a>
            <a href="https://twitter.com/finescan" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <ion-icon name="logo-twitter"></ion-icon>
            </a>
            <a
              href="https://linkedin.com/company/finescan"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <ion-icon name="logo-linkedin"></ion-icon>
            </a>
            <a href="https://instagram.com/finescan" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <ion-icon name="logo-instagram"></ion-icon>
            </a>
          </div>
          <div class="copyright">© {{ currentYear }} FineScan. All rights reserved.</div>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      :host {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
      }

      ion-footer {
        --ion-toolbar-background: var(--ion-color-dark);
        --ion-toolbar-color: var(--ion-color-light);
        position: relative;
        background: var(--ion-color-dark);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      ion-toolbar {
        --min-height: auto;
        --padding-top: 0;
        --padding-bottom: 0;
        --background: var(--ion-color-dark);
        --color: var(--ion-color-light);
        --border-color: rgba(255, 255, 255, 0.1);
      }

      .footer-content {
        padding: 16px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        max-width: 1200px;
        margin: 0 auto;
        color: var(--ion-color-light);
      }

      .footer-links {
        display: flex;
        gap: 24px;

        a {
          color: var(--ion-color-light);
          text-decoration: none;
          font-size: 14px;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          white-space: nowrap;

          &:hover {
            opacity: 1;
          }
        }
      }

      .social-links {
        display: flex;
        gap: 16px;
        justify-content: center;

        a {
          color: var(--ion-color-light);
          text-decoration: none;
          opacity: 0.7;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);

          ion-icon {
            font-size: 20px;
          }

          &:hover {
            opacity: 1;
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.1);
          }

          &[aria-label='Facebook']:hover {
            color: #1877f2;
            background: rgba(24, 119, 242, 0.1);
          }

          &[aria-label='Twitter']:hover {
            color: #1da1f2;
            background: rgba(29, 161, 242, 0.1);
          }

          &[aria-label='LinkedIn']:hover {
            color: #0a66c2;
            background: rgba(10, 102, 194, 0.1);
          }

          &[aria-label='Instagram']:hover {
            color: #e4405f;
            background: rgba(228, 64, 95, 0.1);
          }
        }
      }

      .copyright {
        font-size: 14px;
        opacity: 0.7;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .footer-content {
          flex-direction: column;
          gap: 16px;
          text-align: center;
          padding: 16px;
        }

        .footer-links {
          flex-direction: column;
          gap: 12px;
        }

        .social-links {
          gap: 16px;
        }

        .copyright {
          font-size: 12px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor() {
    addIcons({
      logoFacebook,
      logoTwitter,
      logoLinkedin,
      logoInstagram,
    });
  }
}
