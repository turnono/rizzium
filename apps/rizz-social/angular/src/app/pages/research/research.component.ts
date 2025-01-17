import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonChip,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { analyticsOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-research',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonChip,
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
        <ion-title>Research Agent</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Market Research</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Analyze market trends and gather insights for your content strategy.</p>
          <ion-button expand="block" (click)="startResearch()">
            <ion-icon slot="start" name="analytics-outline"></ion-icon>
            Start Research
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Recent Insights</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>
                <h2>No research data available</h2>
                <p>Start a new research to gather insights</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      ion-card {
        margin-bottom: 1rem;
      }

      ion-button {
        margin-top: 1rem;
      }
    `,
  ],
})
export class ResearchComponent {
  constructor() {
    addIcons({ analyticsOutline, searchOutline });
  }

  startResearch() {
    // TODO: Implement research functionality
    console.log('Starting research...');
  }
}
