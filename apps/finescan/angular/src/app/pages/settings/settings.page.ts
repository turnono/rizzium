import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  moonOutline,
  notificationsOutline,
  languageOutline,
  colorPaletteOutline,
  downloadOutline,
  saveOutline,
  imageOutline,
  flashOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { DataSaverService } from '@rizzium/shared/services';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Appearance</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="moon-outline" slot="start"></ion-icon>
              <ion-label>Dark Mode</ion-label>
              <ion-toggle [(ngModel)]="settings.darkMode" (ionChange)="updateSettings()"></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="color-palette-outline" slot="start"></ion-icon>
              <ion-label>Theme Color</ion-label>
              <ion-select [(ngModel)]="settings.theme" (ionChange)="updateSettings()">
                <ion-select-option value="default">Default</ion-select-option>
                <ion-select-option value="purple">Purple</ion-select-option>
                <ion-select-option value="green">Green</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Notifications</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="notifications-outline" slot="start"></ion-icon>
              <ion-label>Push Notifications</ion-label>
              <ion-toggle [(ngModel)]="settings.notifications" (ionChange)="updateSettings()"></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="download-outline" slot="start"></ion-icon>
              <ion-label>Auto-download Reports</ion-label>
              <ion-toggle [(ngModel)]="settings.autoDownload" (ionChange)="updateSettings()"></ion-toggle>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Language & Region</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="language-outline" slot="start"></ion-icon>
              <ion-label>Language</ion-label>
              <ion-select [(ngModel)]="settings.language" (ionChange)="updateSettings()">
                <ion-select-option value="en">English</ion-select-option>
                <ion-select-option value="es">Español</ion-select-option>
                <ion-select-option value="fr">Français</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Data Saving</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon name="save-outline" slot="start"></ion-icon>
              <ion-label>Data Saver Mode</ion-label>
              <ion-toggle [(ngModel)]="dataSaverSettings.enabled" (ionChange)="updateDataSaverSettings()"></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="image-outline" slot="start"></ion-icon>
              <ion-label>Image Quality</ion-label>
              <ion-select
                [(ngModel)]="dataSaverSettings.imageQuality"
                (ionChange)="updateDataSaverSettings()"
                [disabled]="!dataSaverSettings.enabled"
              >
                <ion-select-option value="100">High (100%)</ion-select-option>
                <ion-select-option value="75">Medium (75%)</ion-select-option>
                <ion-select-option value="50">Low (50%)</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-icon name="flash-outline" slot="start"></ion-icon>
              <ion-label>Disable Animations</ion-label>
              <ion-toggle
                [(ngModel)]="dataSaverSettings.disableAnimations"
                (ionChange)="updateDataSaverSettings()"
                [disabled]="!dataSaverSettings.enabled"
              ></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="document-text-outline" slot="start"></ion-icon>
              <ion-label>Text-Only Mode</ion-label>
              <ion-toggle
                [(ngModel)]="dataSaverSettings.textOnlyMode"
                (ionChange)="updateDataSaverSettings()"
                [disabled]="!dataSaverSettings.enabled"
              ></ion-toggle>
            </ion-item>
          </ion-list>

          @if (dataSaverSettings.enabled) {
          <div class="data-saver-info">
            <ion-note>
              Data saver mode reduces bandwidth usage by optimizing images and disabling certain features. This may
              affect the visual quality of the application.
            </ion-note>
          </div>
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      ion-card {
        margin-bottom: 1rem;
      }

      ion-item {
        --padding-start: 0;

        ion-icon {
          color: var(--ion-color-medium);
          margin-right: 1rem;
        }
      }

      ion-select {
        max-width: 45%;
      }

      @media (max-width: 576px) {
        ion-card {
          margin: 0 0 1rem;
        }
      }

      .data-saver-info {
        margin-top: 16px;
        padding: 8px;
        background: var(--ion-color-light);
        border-radius: 8px;

        ion-note {
          color: var(--ion-color-medium);
          font-size: 14px;
        }
      }
    `,
  ],
})
export class SettingsPage {
  private dataSaverService = inject(DataSaverService);

  settings = {
    darkMode: false,
    notifications: true,
    autoDownload: false,
    theme: 'default',
    language: 'en',
  };

  dataSaverSettings = {
    enabled: false,
    imageQuality: 100,
    disableAnimations: false,
    textOnlyMode: false,
  };

  constructor() {
    addIcons({
      moonOutline,
      notificationsOutline,
      languageOutline,
      colorPaletteOutline,
      downloadOutline,
      saveOutline,
      imageOutline,
      flashOutline,
      documentTextOutline,
    });
    this.loadSettings();
    this.dataSaverService.settings$.subscribe((settings) => {
      this.dataSaverSettings = settings;
    });
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('finescan-settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  updateSettings() {
    localStorage.setItem('finescan-settings', JSON.stringify(this.settings));
    // Apply settings changes (theme, language, etc.)
    this.applySettings();
  }

  private applySettings() {
    // Apply dark mode
    document.body.classList.toggle('dark', this.settings.darkMode);

    // Apply theme color
    document.body.className = document.body.className.replace(/theme-\w+/, '');
    document.body.classList.add(`theme-${this.settings.theme}`);

    // Apply language
    // Implement language change logic here
  }

  updateDataSaverSettings() {
    this.dataSaverService.updateSettings(this.dataSaverSettings);
  }
}
