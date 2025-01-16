import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonBackButton,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Content</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Topic/Idea</ion-label>
          <ion-input [(ngModel)]="topic" placeholder="Enter your content topic or idea" type="text"></ion-input>
        </ion-item>

        <ion-item lines="none">
          <ion-button (click)="generateContent()" [disabled]="!topic" expand="block" class="ion-margin-top">
            Generate Content
          </ion-button>
        </ion-item>
      </ion-list>

      <div *ngIf="generatedContent()">
        <ion-card>
          <ion-card-header>
            <ion-card-title>TikTok Caption</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ generatedContent()?.caption }}
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Hashtags</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ generatedContent()?.hashtags }}
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Video Ideas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ul>
              <li *ngFor="let idea of generatedContent()?.videoIdeas">
                {{ idea }}
              </li>
            </ul>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-button {
        width: 100%;
      }
      ul {
        padding-left: 20px;
        margin: 0;
      }
      li {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class CreatePageComponent {
  topic = '';
  generatedContent = signal<{
    caption: string;
    hashtags: string;
    videoIdeas: string[];
  } | null>(null);

  generateContent() {
    // Placeholder data - this would typically come from an AI service
    this.generatedContent.set({
      caption: '🔥 Unleashing the power of ' + this.topic + '! Watch how this changes everything...',
      hashtags: '#' + this.topic.replace(/\s+/g, '') + ' #TikTokTrends #Viral #FYP #TrendAlert',
      videoIdeas: [
        'Start with a hook showing the problem that ' + this.topic + ' solves',
        'Do a before/after transition showcasing the impact',
        'Create a POV scenario demonstrating the key benefits',
        'Share 3 quick tips related to ' + this.topic,
      ],
    });
  }
}
