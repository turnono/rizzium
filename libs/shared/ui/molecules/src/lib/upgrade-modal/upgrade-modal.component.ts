import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  ModalController,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { rocketOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'rizzium-upgrade-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-button slot="end" fill="clear" (click)="dismiss()">
          <ion-icon name="close-outline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon
              [name]="isWarning ? 'warning-outline' : 'rocket-outline'"
              [color]="isWarning ? 'warning' : 'primary'"
            ></ion-icon>
            {{ title }}
          </ion-card-title>
          <ion-card-subtitle>
            {{ subtitle }}
          </ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <p>{{ message }}</p>
          @if (!isWarning) {
          <ul>
            <li>Analyze more documents</li>
            <li>Get more storage</li>
            <li>Access advanced AI features</li>
            <li>Extend retention period</li>
          </ul>
          }

          <div class="button-container">
            <ion-button expand="block" [color]="isWarning ? 'warning' : 'primary'" (click)="viewPlans()">
              View Plans
            </ion-button>
            <ion-button expand="block" fill="clear" (click)="dismiss()">
              {{ isWarning ? 'Continue' : 'Maybe Later' }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      // ion-card-title {
      //   display: flex;
      //   align-items: center;
      //   gap: 8px;
      //   font-size: 1.5rem;
      // }

      .button-container {
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
        li {
          margin: 0.5rem 0;
          color: var(--ion-color-medium);
        }
      }
    `,
  ],
})
export class UpgradeModalComponent {
  @Input() isWarning = false;
  @Input() title = this.isWarning ? 'Last Free Scan Used' : 'Upgrade Required';
  @Input() subtitle = this.isWarning ? 'Consider upgrading soon' : 'Upgrade to continue analyzing documents';
  @Input() message = this.isWarning
    ? 'You have used your last free scan for this month. Upgrade now to continue analyzing documents.'
    : "You've used all 3 free analyses for this month. Upgrade to one of our paid plans to:";

  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ rocketOutline, closeOutline });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  viewPlans() {
    this.modalCtrl.dismiss({ action: 'viewPlans' });
  }
}
