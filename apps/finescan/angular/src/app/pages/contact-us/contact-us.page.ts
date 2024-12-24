import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, FooterComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Contact Us</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Contact Us</h1>
      <p>Your contact information goes here...</p>
    </ion-content>
    <rizzium-footer [appName]="'finescan'"></rizzium-footer>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }
    `,
  ],
})
export class ContactUsPage {}
