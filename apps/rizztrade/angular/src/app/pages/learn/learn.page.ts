import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@rizzium/shared/services';
import { LearnStore } from './state/learn.signals';
import { addIcons } from 'ionicons';
import { personOutline, appsOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, MatButtonModule, MatCardModule, MatGridListModule, MatIconModule],
  template: `
    <ion-content>
      <!-- Header -->
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <ion-title>
            <img src="assets/logo.svg" alt="Logo" class="header-logo" />
          </ion-title>
          <ion-buttons slot="end">
            <ion-button routerLink="/learn">Home</ion-button>
            <ion-button routerLink="/learn/course">Learn</ion-button>
            <ion-button>About</ion-button>
            <ion-button>Contact</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-card">
          <div class="arch-decoration"></div>
          <div class="decorative-element left-pattern"></div>
          <div class="decorative-element right-pattern"></div>
          <div class="hero-content">
            <h1>Master Quranic Arabic</h1>
            <p>Join our step-by-step course and unlock the meanings of the Quran.</p>
            <div class="quran-image"></div>
            <div class="cta-buttons">
              <button mat-raised-button color="primary" (click)="startLearning()">Start Learning Now</button>
              <button mat-button (click)="scrollToCourse()">Explore the Course</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="section-container">
          <div class="feature-grid">
            <div class="feature-item">
              <div class="icon-wrapper">
                <mat-icon>start_now</mat-icon>
              </div>
              <h3>Start Now</h3>
              <p>Begin your journey to understanding the Quran</p>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">
                <mat-icon>trending_up</mat-icon>
              </div>
              <h3>Progress Now</h3>
              <p>Track your learning achievements</p>
            </div>
            <div class="feature-item">
              <div class="icon-wrapper">
                <mat-icon>group</mat-icon>
              </div>
              <h3>Community Group</h3>
              <p>Learn together with fellow students</p>
            </div>
          </div>
          <div class="feature-actions">
            <button mat-stroked-button>How It Works</button>
            <button mat-stroked-button>Community Group</button>
            <button mat-stroked-button>Part Board</button>
          </div>
        </div>
      </section>

      <!-- Course Highlights -->
      <section class="course-highlights" id="course">
        <h2>What You'll Learn</h2>
        <ul>
          <li>Basic Arabic grammar and vocabulary</li>
          <li>Sentence structures in Quranic Arabic</li>
          <li>Contextual meanings of Quranic verses</li>
        </ul>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works">
        <div class="section-container">
          <h2>How It Works</h2>
          <div class="steps-grid">
            <div class="step-item">
              <div class="icon-circle">
                <mat-icon>play_circle</mat-icon>
              </div>
              <h3>Start Now</h3>
              <p>Begin your learning journey with our structured curriculum</p>
            </div>
            <div class="step-item">
              <div class="icon-circle">
                <mat-icon>trending_up</mat-icon>
              </div>
              <h3>Progress Now</h3>
              <p>Track your progress and achievements</p>
            </div>
            <div class="step-item">
              <div class="icon-circle">
                <mat-icon>groups</mat-icon>
              </div>
              <h3>Consult Grots</h3>
              <p>Get help from our community experts</p>
            </div>
          </div>
          <div class="action-buttons">
            <button mat-stroked-button>How It Works</button>
            <button mat-stroked-button>Community Group</button>
            <button mat-stroked-button>Part Board</button>
          </div>
        </div>
      </section>

      <!-- Course Modules -->
      <section class="course-modules">
        <div class="section-container">
          <h2>Start Learning</h2>
          <div class="modules-grid">
            <div class="module-card">
              <div class="module-icon">
                <mat-icon>menu_book</mat-icon>
              </div>
              <h3>Basic Arabic Letters</h3>
              <p>Learn to read and write Arabic letters</p>
              <div class="progress-bar">
                <div class="progress" style="width: 30%"></div>
              </div>
              <button mat-stroked-button>Start Module</button>
            </div>
            <div class="module-card">
              <div class="module-icon">
                <mat-icon>record_voice_over</mat-icon>
              </div>
              <h3>Pronunciation</h3>
              <p>Master proper Arabic pronunciation</p>
              <div class="progress-bar">
                <div class="progress" style="width: 0%"></div>
              </div>
              <button mat-stroked-button>Coming Soon</button>
            </div>
            <div class="module-card">
              <div class="module-icon">
                <mat-icon>translate</mat-icon>
              </div>
              <h3>Basic Grammar</h3>
              <p>Learn fundamental Arabic grammar rules</p>
              <div class="progress-bar">
                <div class="progress" style="width: 0%"></div>
              </div>
              <button mat-stroked-button>Coming Soon</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Section -->
      <section class="community-section">
        <div class="section-container">
          <div class="community-content">
            <h2>Join Our Community</h2>
            <p>Learn together with fellow students from around the world</p>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">5,000+</div>
                <div class="stat-label">Active Students</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">50+</div>
                <div class="stat-label">Countries</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">100+</div>
                <div class="stat-label">Study Groups</div>
              </div>
            </div>
            <button mat-raised-button color="primary">Join Community</button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <ion-footer>
        <div class="footer-content">
          <div class="quick-links">
            <a routerLink="/learn">Home</a> | <a routerLink="/learn/course">Learn</a> | <a href="#">About</a> |
            <a href="#">Contact</a>
          </div>
          <p class="copyright">© 2024 Taajirah Learn. All rights reserved.</p>
        </div>
      </ion-footer>
    </ion-content>
  `,
  styleUrls: ['./learn.page.scss'],
})
export class LearnPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private learnStore = inject(LearnStore);

  readonly hasProgress = this.learnStore.hasProgress;
  readonly completedLessonsCount = this.learnStore.completedLessonsCount;

  constructor() {
    addIcons({
      personOutline,
      appsOutline,
      checkmarkCircleOutline,
      playCircle: 'play_circle',
      trendingUp: 'trending_up',
      groups: 'groups',
      menuBook: 'menu_book',
      recordVoiceOver: 'record_voice_over',
      translate: 'translate',
    });
  }

  async startLearning() {
    if (!this.authService.isAuthenticated()) {
      const success = await this.authService.signIn();
      if (!success) return;
    }
    this.router.navigate(['/learn/course']);
  }

  scrollToCourse() {
    document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
  }
}
