import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Analysis Reports</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Your Analysis History</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <!-- Reports will be listed here -->
            <ion-item>
              <ion-label>No reports available yet</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
export class ReportsPage {}
