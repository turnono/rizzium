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
      <ion-content class="main-content">
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

      .main-content {
        --padding-bottom: 140px;
      }

      @media (min-width: 768px) {
        .main-content {
          --padding-bottom: 80px;
        }
      }
    `,
  ],
})
export class AppComponent {
  title = 'finescan';
}
