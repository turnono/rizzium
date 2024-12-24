import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Terms of Service</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Terms of Service</h1>
      <p>Your terms of service content goes here...</p>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }
    `,
  ],
})
export class TermsOfServicePage {}
