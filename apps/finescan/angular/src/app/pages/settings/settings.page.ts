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
  IonToast,
  IonBadge,
  AlertController,
  IonBackButton,
  IonButtons,
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
  colorPalette,
  speedometer,
  informationCircleOutline,
  checkmarkCircleOutline,
  checkmark,
  alertCircleOutline,
  warning,
  shieldCheckmarkOutline,
  eyeOffOutline,
  timeOutline,
  arrowForwardOutline,
  helpCircleOutline,
  lockClosedOutline,
  serverOutline,
  arrowForward,
  informationCircle,
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
    IonToast,
    IonBadge,
    IonBackButton,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title role="heading" aria-level="1">Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (settingsSaved) {
      <ion-toast
        message="Settings saved successfully"
        duration="2000"
        color="success"
        position="top"
        [isOpen]="true"
        role="alert"
        aria-live="polite"
      ></ion-toast>
      }

      <div class="settings-section" role="region" aria-label="Appearance Settings">
        <ion-card>
          <ion-card-header>
            <ion-card-title role="heading" aria-level="2">
              <ion-icon name="color-palette" aria-hidden="true"></ion-icon>
              Appearance
              <ion-badge color="primary" class="new-feature">New</ion-badge>
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <ion-list role="list">
              <ion-item role="listitem">
                <ion-icon name="moon-outline" slot="start" aria-hidden="true"></ion-icon>
                <ion-label id="dark-mode-label">
                  Dark Mode
                  <p class="setting-description">Reduce eye strain in low light</p>
                </ion-label>
                <ion-toggle
                  [(ngModel)]="settings.darkMode"
                  (ionChange)="updateSettings()"
                  [attr.aria-labelledby]="'dark-mode-label'"
                  [attr.aria-label]="'Dark Mode'"
                ></ion-toggle>
              </ion-item>

              <ion-item role="listitem">
                <ion-icon name="color-palette-outline" slot="start" aria-hidden="true"></ion-icon>
                <ion-label id="theme-label">
                  Theme Color
                  <p class="setting-description">Choose your preferred color scheme</p>
                </ion-label>
                <ion-select
                  [(ngModel)]="settings.theme"
                  (ionChange)="updateSettings()"
                  [attr.aria-labelledby]="'theme-label'"
                  interface="popover"
                >
                  <ion-select-option value="default">Default</ion-select-option>
                  <ion-select-option value="purple">Purple</ion-select-option>
                  <ion-select-option value="green">Green</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <div class="settings-section" role="region" aria-label="Data Saver Settings">
        <ion-card>
          <ion-card-header>
            <ion-card-title role="heading" aria-level="2">
              <ion-icon name="save-outline" aria-hidden="true"></ion-icon>
              Data Saver
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <ion-list role="list">
              <div class="data-saver-section" [class.active]="dataSaverSettings.enabled">
                <ion-item class="data-saver-toggle" role="listitem">
                  <ion-icon name="save-outline" slot="start" aria-hidden="true"></ion-icon>
                  <ion-label id="data-saver-label">
                    Data Saver Mode
                    <p class="setting-description">Reduce data usage and improve performance</p>
                  </ion-label>
                  <ion-toggle
                    [(ngModel)]="dataSaverSettings.enabled"
                    (ionChange)="updateDataSaverSettings()"
                    [attr.aria-labelledby]="'data-saver-label'"
                    [attr.aria-label]="'Data Saver Mode'"
                  ></ion-toggle>
                </ion-item>

                @if (dataSaverSettings.enabled) {
                <div class="data-saver-info" role="status" aria-live="polite">
                  <ion-icon name="speedometer" aria-hidden="true"></ion-icon>
                  <div class="info-content">
                    <h4>Data Saver is Active</h4>
                    <p>Optimizing performance and reducing data usage</p>
                  </div>
                </div>
                }
              </div>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <div class="settings-section" role="region" aria-label="Privacy & Security Settings">
        <ion-card>
          <ion-card-header>
            <ion-card-title role="heading" aria-level="2">
              <ion-icon name="shield-checkmark" aria-hidden="true"></ion-icon>
              Privacy & Security
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <ion-list role="list">
              <ion-item role="listitem">
                <ion-icon name="time-outline" slot="start" aria-hidden="true"></ion-icon>
                <ion-label id="retention-label">
                  Data Retention
                  <p class="setting-description">Automatically delete documents after</p>
                </ion-label>
                <ion-select
                  [(ngModel)]="settings.dataRetention"
                  (ionChange)="updateSettings()"
                  [attr.aria-labelledby]="'retention-label'"
                  interface="popover"
                >
                  <ion-select-option value="7">7 days</ion-select-option>
                  <ion-select-option value="30">30 days</ion-select-option>
                  <ion-select-option value="90">90 days</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item role="listitem">
                <ion-icon name="eye-off-outline" slot="start" aria-hidden="true"></ion-icon>
                <ion-label id="privacy-mode-label">
                  Enhanced Privacy Mode
                  <p class="setting-description">Additional encryption and privacy features</p>
                </ion-label>
                <ion-toggle
                  [(ngModel)]="settings.enhancedPrivacy"
                  (ionChange)="updateSettings()"
                  [attr.aria-labelledby]="'privacy-mode-label'"
                ></ion-toggle>
              </ion-item>

              <div class="privacy-info" role="note">
                <ion-icon name="information-circle" aria-hidden="true"></ion-icon>
                <div class="info-content">
                  <h4>Your Privacy is Protected</h4>
                  <p>All documents are encrypted and stored securely. We never share your data with third parties.</p>
                  <ion-button fill="clear" size="small" (click)="showPrivacyPolicy()">
                    View Privacy Policy
                    <ion-icon name="arrow-forward" slot="end"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <div class="help-section">
        <ion-icon name="help-circle-outline"></ion-icon>
        <span>Need help with settings?</span>
      </div>

      <div class="info-section">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Important privacy information</span>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --padding: 8px;
      }

      ion-card {
        margin: 8px 0 16px;
        border-radius: 12px;
        box-shadow: none;
        background: var(--ion-color-light);

        ion-card-header {
          padding: 16px;
        }

        ion-card-content {
          padding: 0;
        }
      }

      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 56px;

        ion-icon {
          font-size: 20px;
          margin-right: 16px;
        }

        ion-label {
          font-size: 14px;
        }

        ion-select {
          font-size: 14px;
          --padding-start: 8px;
          --padding-end: 8px;
        }

        ion-toggle {
          padding-right: 0;
        }
      }

      .data-saver-info {
        margin: 16px;
        padding: 12px;
        border-radius: 8px;
        background: rgba(var(--ion-color-medium-rgb), 0.1);

        ion-note {
          font-size: 12px;
        }
      }

      @media (min-width: 768px) {
        ion-content {
          --padding: 16px;
        }

        ion-card {
          max-width: 600px;
          margin: 16px auto;
        }

        ion-item {
          --min-height: 64px;

          ion-label {
            font-size: 16px;
          }
        }
      }

      .setting-item {
        margin-bottom: 16px;
      }

      .setting-description {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }

      .setting-help {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 16px;
        font-size: 12px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 16px;
        }
      }

      .new-feature {
        font-size: 10px;
        padding: 4px 8px;
        margin-left: 8px;
        vertical-align: middle;
      }

      .data-saver-section {
        &.active {
          .data-saver-toggle {
            --background: rgba(var(--ion-color-success-rgb), 0.1);
          }
        }
      }

      .data-saver-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 8px 16px;
        padding: 12px;
        background: rgba(var(--ion-color-success-rgb), 0.1);
        border-radius: 8px;

        ion-icon {
          font-size: 24px;
          color: var(--ion-color-success);
        }

        .info-content {
          h4 {
            margin: 0;
            font-size: 14px;
            color: var(--ion-color-success);
          }

          p {
            margin: 4px 0 0;
            font-size: 12px;
            color: var(--ion-color-medium);
          }
        }
      }

      // Accessibility-focused styles
      :host {
        --min-touch-target: 44px;
        --focus-outline-color: var(--ion-color-primary);
      }

      // High contrast mode
      @media (prefers-contrast: more) {
        ion-card {
          border: 2px solid var(--ion-color-dark);
        }

        .setting-description {
          color: var(--ion-color-dark);
        }

        ion-item {
          --background: var(--ion-color-light);
          --border-color: var(--ion-color-dark);
        }
      }

      // Larger text support
      @media (prefers-reduced-motion: no-preference) {
        ion-label {
          font-size: 1.1rem;
        }

        .setting-description {
          font-size: 0.9rem;
        }
      }

      // Focus indicators
      ion-item:focus-within {
        outline: 2px solid var(--focus-outline-color);
        outline-offset: -2px;
      }

      // Touch targets
      ion-item {
        min-height: var(--min-touch-target);
      }

      ion-toggle {
        padding: calc(var(--min-touch-target) - 24px);
        margin: calc((var(--min-touch-target) - 24px) * -1);
      }

      // Color contrast helpers
      .setting-description {
        color: var(--ion-color-dark);
        font-weight: 500;
      }

      .new-feature {
        background: var(--ion-color-primary-shade);
        color: var(--ion-color-light);
      }

      .privacy-info {
        margin: 16px;
        padding: 12px;
        background: rgba(var(--ion-color-success-rgb), 0.1);
        border-radius: 8px;
        display: flex;
        gap: 12px;

        ion-icon {
          font-size: 24px;
          color: var(--ion-color-success);
        }

        .info-content {
          h4 {
            margin: 0;
            font-size: 14px;
            color: var(--ion-color-success);
          }

          p {
            margin: 4px 0;
            font-size: 12px;
            color: var(--ion-color-medium);
          }

          ion-button {
            margin: 8px 0 0;
            font-size: 12px;
          }
        }
      }
    `,
  ],
})
export class SettingsPage {
  private dataSaverService = inject(DataSaverService);
  private alertController = inject(AlertController);

  settings = {
    darkMode: false,
    notifications: true,
    autoDownload: false,
    theme: 'default',
    language: 'en',
    dataRetention: '30',
    enhancedPrivacy: false,
  };

  dataSaverSettings = {
    enabled: false,
    imageQuality: 100,
    disableAnimations: false,
    textOnlyMode: false,
  };

  settingsSaved = false;

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
      colorPalette,
      speedometer,
      informationCircleOutline,
      checkmarkCircleOutline,
      checkmark,
      alertCircleOutline,
      warning,
      shieldCheckmarkOutline,
      eyeOffOutline,
      timeOutline,
      arrowForwardOutline,
      helpCircleOutline,
      lockClosedOutline,
      serverOutline,
      arrowForward,
      informationCircle,
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
    this.applySettings();
    this.settingsSaved = true;
    setTimeout(() => {
      this.settingsSaved = false;
    }, 2000);
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

  async showPrivacyPolicy() {
    const alert = await this.alertController.create({
      header: 'Privacy Policy',
      message: `
        <div class="privacy-policy">
          <h3>Data Collection</h3>
          <p>We collect only essential data needed for document analysis.</p>

          <h3>Data Storage</h3>
          <p>Documents are encrypted and stored in secure Firebase servers.</p>

          <h3>Data Deletion</h3>
          <p>You can delete your data at any time. Documents are automatically deleted based on your retention settings.</p>

          <h3>Your Control</h3>
          <p>You have full control over your data and can export or delete it at any time.</p>
        </div>
      `,
      cssClass: 'privacy-policy-alert',
      buttons: ['Close'],
    });

    await alert.present();
  }
}
