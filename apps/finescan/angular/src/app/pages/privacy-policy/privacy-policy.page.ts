import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Privacy Policy</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Privacy Policy</h1>
      <p>Your privacy policy content goes here...</p>
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
export class PrivacyPolicyPage {}
