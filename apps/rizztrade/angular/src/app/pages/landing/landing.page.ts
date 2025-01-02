import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content>
      <div class="landing-container">
        <div class="content-wrapper ion-text-center">
          <div class="video-container">
            <video autoplay loop muted [muted]="true" playsinline class="welcome-video">
              <source [src]="videoUrl" type="video/mp4" />
            </video>
            <div class="speech-bubble">
              <div class="animated-text">Coming soon!</div>
              <div class="animated-text delayed">Contact us via +27 658 62 3499</div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .landing-container {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 0;
      }

      .content-wrapper {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .video-container {
        width: 100%;
        display: flex;
        justify-content: center;
        position: relative;
      }

      .welcome-video {
        width: 100%;
        max-width: 1200px;
        border-radius: 0;
        box-shadow: none;
        object-fit: cover;
        height: 100vh;
      }

      .speech-bubble {
        position: absolute;
        top: 80%;
        right: 20%;
        background: white;
        padding: 15px 20px;
        border-radius: 20px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: left;
        animation: float 3s ease-in-out infinite;
        transform: translateY(-100%);
        z-index: 2;
      }

      .speech-bubble::before {
        content: '';
        position: absolute;
        left: -15px;
        bottom: 20px;
        width: 20px;
        height: 20px;
        background: white;
        transform: rotate(45deg);
        box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.05);
      }

      .animated-text {
        opacity: 0;
        font-size: 1.2rem;
        color: #333;
        white-space: nowrap;
        animation: textAppear 4s ease-out infinite;
      }

      .animated-text.delayed {
        animation: textAppear 4s ease-out infinite;
        animation-delay: 2s;
      }

      @keyframes textAppear {
        0%,
        100% {
          opacity: 0;
          transform: translateY(10px);
        }
        25%,
        75% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(-100%) rotate(-2deg);
        }
        50% {
          transform: translateY(calc(-100% - 10px)) rotate(2deg);
        }
      }

      @media (max-width: 768px) {
        .welcome-video {
          height: 100vh;
        }

        .speech-bubble {
          right: 10%;
          padding: 12px 15px;
          font-size: 0.9rem;
        }

        .animated-text {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class LandingComponent {
  videoUrl =
    'https://firebasestorage.googleapis.com/v0/b/taajirah.appspot.com/o/20250102_1801_Welcoming%20Contact%20Invitation_simple_compose_01jgkw06jvf3jakqwdc42ny3br.mp4?alt=media&token=3b06d087-48cc-4436-a754-ab7bfd164600';
}
