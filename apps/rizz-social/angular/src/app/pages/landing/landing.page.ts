import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>RizzSocial</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-button routerLink="/create" size="large"> Create TikTok Content </ion-button>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
    `,
  ],
})
export class LandingPageComponent {}
