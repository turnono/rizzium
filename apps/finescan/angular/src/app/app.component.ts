import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp],
  selector: 'app-root',
  template: `
    <ion-app>
      <h1 data-cy="welcome-message">Welcome to FineScan</h1>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: [
    `
      h1 {
        text-align: center;
        margin: 1rem;
      }
    `,
  ],
})
export class AppComponent {
  title = 'finescan';
}
