import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp],
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: [
    `
      ion-app {
        background-color: #1c1c1c;
      }
    `,
  ],
})
export class AppComponent {
  title = 'finescan';
}
