import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonContent } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp, IonContent, FooterComponent],
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-content>
        <ion-router-outlet></ion-router-outlet>
      </ion-content>
      <rizzium-footer></rizzium-footer>
    </ion-app>
  `,
  styles: [
    `
      ion-app {
        background-color: var(--ion-color-dark);
      }

      ion-content {
        --padding-bottom: 60px;
      }
    `,
  ],
})
export class AppComponent {
  title = 'finescan';
}
