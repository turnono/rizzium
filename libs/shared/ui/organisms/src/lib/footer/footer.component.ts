import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'rizzium-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="brand">
          <div class="brand-name">FineScan</div>
          <div class="brand-tagline">AI-Powered Document Analysis</div>
        </div>

        <div class="footer-links">
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms">Terms of Service</a>
          <a routerLink="/contact">Contact Us</a>
        </div>

        <div class="copyright">© {{ currentYear }} FineScan. All rights reserved.</div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .footer {
        background-color: #1c1c1c;
        padding: 1rem 2rem;
        width: 100%;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
        color: rgba(255, 255, 255, 0.7);
      }

      .brand {
        .brand-name {
          color: #4285f4;
          font-size: 1rem;
          font-weight: 500;
        }

        .brand-tagline {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }
      }

      .footer-links {
        display: flex;
        gap: 2rem;

        a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;

          &:hover {
            color: #4285f4;
          }
        }
      }

      .copyright {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
      }

      @media (max-width: 768px) {
        .footer-content {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .footer-links {
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
