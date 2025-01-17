import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentOptimizationAgent } from '@rizzium/shared/swarm-agents';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonChip,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { copyOutline } from 'ionicons/icons';

interface ContentOptimizationResponse {
  caption: string;
  hashtags: string[];
  suggestions: string[];
}

@Component({
  selector: 'app-content-optimization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonChip,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonBackButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <!-- TODO: Add back button -->
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>TikTok Content Optimization</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Script or Idea</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-textarea
            [(ngModel)]="script"
            placeholder="Enter your TikTok script or idea here..."
            [rows]="4"
            class="mb-4"
          ></ion-textarea>
          <ion-button (click)="optimize()" expand="block" [disabled]="isLoading() || !script.trim()">
            <ion-spinner *ngIf="isLoading()"></ion-spinner>
            <span *ngIf="!isLoading()">Optimize Content</span>
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ng-container *ngIf="optimization()">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Optimized Caption</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ optimization()?.caption }}</p>
            <ion-button fill="clear" (click)="copyToClipboard(optimization()?.caption || '')">
              <ion-icon slot="start" [icon]="copyIcon"></ion-icon>
              Copy
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Hashtags</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-chip *ngFor="let hashtag of optimization()?.hashtags || []"> #{{ hashtag }} </ion-chip>
            <ion-button fill="clear" (click)="copyHashtags()">
              <ion-icon slot="start" [icon]="copyIcon"></ion-icon>
              Copy All
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Optimization Suggestions</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item *ngFor="let suggestion of optimization()?.suggestions || []">
                <ion-label>{{ suggestion }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ng-container>
    </ion-content>
  `,
  styles: [
    `
      ion-textarea {
        --background: var(--ion-color-light);
        --padding-start: 10px;
        --padding-end: 10px;
        --padding-top: 10px;
        --padding-bottom: 10px;
        margin-bottom: 1rem;
        border-radius: 8px;
      }

      ion-chip {
        margin: 4px;
      }

      .mb-4 {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ContentOptimizationComponent {
  script = '';
  isLoading = signal(false);
  optimization = signal<ContentOptimizationResponse | null>(null);
  copyIcon = copyOutline;

  constructor(private optimizationAgent: ContentOptimizationAgent) {}

  async optimize() {
    if (!this.script.trim()) return;

    this.isLoading.set(true);
    try {
      const result = await this.optimizationAgent.optimizeContent(this.script);
      this.optimization.set(result);
    } catch (error) {
      console.error('Optimization failed:', error);
      // TODO: Add error handling/toast
    } finally {
      this.isLoading.set(false);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // TODO: Add success toast
  }

  copyHashtags() {
    const hashtags = this.optimization()?.hashtags || [];
    const hashtagText = hashtags.map((tag) => `#${tag}`).join(' ');
    this.copyToClipboard(hashtagText);
  }
}
