import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Firestore } from '@angular/fire/firestore';
import { Auth, signInAnonymously, onAuthStateChanged, User } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { personOutline, sunnyOutline, documentTextOutline, notificationsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  template: `
    <ion-content>
      <div class="app-container">
        <!-- Header Section -->
        <div class="header">
          <div class="branding">
            <h1>Flowy-</h1>
            <h1>Flowy-Clarity</h1>
            <p class="subtitle">AI-powered Journaling & Habit Tracking</p>
          </div>
          <div class="auth-buttons">
            <ion-button fill="clear" class="sign-in">Sign In</ion-button>
            <ion-button fill="clear" class="sign-up">Sign Up</ion-button>
          </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
          <h2 class="features-title">Features</h2>
          <div class="features-grid">
            <!-- Flowy Journaling -->
            <div class="feature-card">
              <div class="feature-icon person">
                <ion-icon name="person-outline"></ion-icon>
              </div>
              <h3>Flowy Journaling</h3>
              <p>Correlation journaling, strengthen relations and create better habits with ease.</p>
              <ion-button fill="clear" class="sign-in-btn">Sign In</ion-button>
            </div>

            <!-- Automated Journaling -->
            <div class="feature-card">
              <div class="feature-icon sun">
                <ion-icon name="sunny-outline"></ion-icon>
              </div>
              <h3>Automated Journaling</h3>
              <p>and build on build and build with build better habits, groove, habits with ease.</p>
              <ion-button fill="clear" class="sign-in-btn">Sign In</ion-button>
            </div>

            <!-- Smart Reminders -->
            <div class="feature-card">
              <div class="feature-icon document">
                <ion-icon name="document-text-outline"></ion-icon>
              </div>
              <h3>Smart Reminders</h3>
              <p>Smart Reminders that help you stay on track and maintain your habits.</p>
              <ion-button fill="clear" class="sign-in-btn">Sign In</ion-button>
            </div>

            <!-- Privacy Reminders -->
            <div class="feature-card">
              <div class="feature-icon notification">
                <ion-icon name="notifications-outline"></ion-icon>
              </div>
              <h3>Privacy Reminders</h3>
              <p>For better habits and better routines, stay focused on your goals.</p>
              <ion-button fill="clear" class="sign-in-btn">Sign In</ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host {
        --primary-color: #5c8d89;
        --secondary-color: #f4d5d3;
        --gradient-start: #e8f4f2;
        --gradient-end: #f4d5d3;
        --text-color: #2c3e50;
        --card-bg: rgba(255, 255, 255, 0.9);
      }

      .app-container {
        min-height: 100vh;
        background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
        padding: 2rem;
      }

      .header {
        text-align: left;
        margin-bottom: 4rem;
      }

      .branding h1 {
        font-size: 2.5rem;
        color: var(--text-color);
        margin: 0;
        line-height: 1.2;
        font-weight: 600;
      }

      .subtitle {
        font-size: 1.2rem;
        color: var(--text-color);
        margin-top: 1rem;
        opacity: 0.8;
      }

      .auth-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      .auth-buttons ion-button {
        --color: var(--text-color);
        font-weight: 500;
        text-transform: none;
        font-size: 1rem;
      }

      .auth-buttons ion-button.sign-up {
        --background: var(--primary-color);
        --color: white;
        --border-radius: 20px;
        --padding-start: 2rem;
        --padding-end: 2rem;
      }

      .features-section {
        margin-top: 4rem;
      }

      .features-title {
        font-size: 2rem;
        color: var(--text-color);
        margin-bottom: 2rem;
        text-align: center;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .feature-card {
        background: var(--card-bg);
        border-radius: 24px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .feature-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        font-size: 2rem;
        color: white;
      }

      .feature-icon.person {
        background: linear-gradient(135deg, #6e8efb, #a777e3);
      }

      .feature-icon.sun {
        background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      }

      .feature-icon.document {
        background: linear-gradient(135deg, #84fab0, #8fd3f4);
      }

      .feature-icon.notification {
        background: linear-gradient(135deg, #ffc3a0, #ffafbd);
      }

      .feature-card h3 {
        color: var(--text-color);
        font-size: 1.3rem;
        margin-bottom: 1rem;
      }

      .feature-card p {
        color: var(--text-color);
        opacity: 0.7;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .sign-in-btn {
        --color: var(--primary-color);
        font-weight: 500;
        text-transform: none;
        margin-top: auto;
      }

      @media (max-width: 1024px) {
        .features-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .features-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class JournalEntryComponent {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor() {
    // Register Ionicons
    addIcons({
      'person-outline': personOutline,
      'sunny-outline': sunnyOutline,
      'document-text-outline': documentTextOutline,
      'notifications-outline': notificationsOutline,
    });

    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticated.set(!!user);
      this.currentUser.set(user);
    });
  }

  async signInAnonymously() {
    try {
      await signInAnonymously(this.auth);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }
}
