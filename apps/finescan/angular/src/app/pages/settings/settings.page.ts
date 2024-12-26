import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
  colorPaletteOutline as colorPalette,
  speedometerOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  alertCircleOutline,
  warningOutline,
  shieldCheckmarkOutline,
  eyeOffOutline,
  timeOutline,
  arrowForwardOutline,
  helpCircleOutline,
  lockClosedOutline,
  serverOutline,
  arrowForwardOutline as arrowForward,
  informationCircleOutline as informationCircle,
} from 'ionicons/icons';
import { DataSaverService } from '@rizzium/shared/services';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { Firestore, doc, setDoc, getDoc, Timestamp } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { Subject, takeUntil, filter } from 'rxjs';
import { FirebaseError } from '@angular/fire/app';
import type { AlertButton } from '@ionic/angular/standalone';

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
    FooterComponent,
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
              <ion-icon name="color-palette-outline" aria-hidden="true"></ion-icon>
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
                  <ion-icon name="speedometer-outline" aria-hidden="true"></ion-icon>
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
              <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
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
                <ion-icon name="information-circle-outline" aria-hidden="true"></ion-icon>
                <div class="info-content">
                  <h4>Your Privacy is Protected</h4>
                  <p>All documents are encrypted and stored securely. We never share your data with third parties.</p>
                  <ion-button fill="clear" size="small" (click)="showPrivacyPolicy()">
                    View Privacy Policy
                    <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Region Settings -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="language-outline"></ion-icon>
            Regional Settings
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>Region</ion-label>
              <ion-select [(ngModel)]="settings.region" interface="action-sheet">
                <ion-select-option value="global">Global</ion-select-option>
                <ion-select-option value="us">United States</ion-select-option>
                <ion-select-option value="eu">European Union</ion-select-option>
                <ion-select-option value="uk">United Kingdom</ion-select-option>
                <ion-select-option value="au">Australia</ion-select-option>
                <ion-select-option value="ca">Canada</ion-select-option>
                <ion-select-option value="za">South Africa</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>Language</ion-label>
              <ion-select [(ngModel)]="settings.locale" interface="action-sheet">
                <ion-select-option value="en">English</ion-select-option>
                <ion-select-option value="es">Español</ion-select-option>
                <ion-select-option value="fr">Français</ion-select-option>
                <ion-select-option value="de">Deutsch</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>Time Zone</ion-label>
              <ion-select [(ngModel)]="settings.timezone" interface="action-sheet">
                <ion-select-option value="UTC">UTC</ion-select-option>
                <ion-select-option value="America/New_York">Eastern Time</ion-select-option>
                <ion-select-option value="America/Chicago">Central Time</ion-select-option>
                <ion-select-option value="America/Denver">Mountain Time</ion-select-option>
                <ion-select-option value="America/Los_Angeles">Pacific Time</ion-select-option>
                <ion-select-option value="Europe/London">London</ion-select-option>
                <ion-select-option value="Europe/Paris">Paris</ion-select-option>
                <ion-select-option value="Asia/Tokyo">Tokyo</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>Date Format</ion-label>
              <ion-select [(ngModel)]="settings.dateFormat" interface="action-sheet">
                <ion-select-option value="MM/DD/YYYY">MM/DD/YYYY</ion-select-option>
                <ion-select-option value="DD/MM/YYYY">DD/MM/YYYY</ion-select-option>
                <ion-select-option value="YYYY-MM-DD">YYYY-MM-DD</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label>Currency</ion-label>
              <ion-select [(ngModel)]="settings.currencyCode" interface="action-sheet">
                <ion-select-option value="USD">USD ($)</ion-select-option>
                <ion-select-option value="EUR">EUR (€)</ion-select-option>
                <ion-select-option value="GBP">GBP (£)</ion-select-option>
                <ion-select-option value="AUD">AUD ($)</ion-select-option>
                <ion-select-option value="CAD">CAD ($)</ion-select-option>
                <ion-select-option value="ZAR">ZAR (R)</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
    <rizzium-footer [appName]="'finescan'"></rizzium-footer>
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

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      ion-icon {
        font-size: 24px;
      }
    `,
  ],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private firestore = inject(Firestore);
  private dataSaverService = inject(DataSaverService);
  private alertController = inject(AlertController);
  private authService = inject(FirebaseAuthService);
  private settingsLoaded = false;

  settings = {
    region: 'global',
    locale: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currencyCode: 'USD',
    theme: 'system',
    notifications: true,
    autoSave: true,
    imageQuality: 'high',
    privacyMode: false,
    darkMode: false,
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

  ngOnInit() {
    // Wait for authenticated user before loading settings
    this.authService.user$
      .pipe(
        filter((user) => user !== null), // Only proceed when we have a user
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        console.log('Auth state in settings:', user);
        if (!this.settingsLoaded) {
          this.loadSettings(user!.uid);
        }
      });

    // Subscribe to data saver settings
    this.dataSaverService.settings$.pipe(takeUntil(this.destroy$)).subscribe((settings) => {
      this.dataSaverSettings = settings;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetToDefaults() {
    this.settings = {
      region: 'global',
      locale: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currencyCode: 'USD',
      theme: 'system',
      notifications: true,
      autoSave: true,
      imageQuality: 'high',
      privacyMode: false,
      darkMode: false,
      dataRetention: '30',
      enhancedPrivacy: false,
    };
  }

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
      speedometerOutline,
      informationCircleOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      alertCircleOutline,
      warningOutline,
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
  }

  private async initializeUserSettings(userId: string): Promise<void> {
    console.log('Initializing user settings for:', userId);
    const userRef = doc(this.firestore, `users/${userId}`);
    const settingsRef = doc(this.firestore, `users/${userId}/settings/preferences`);

    try {
      // First ensure user document exists
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log('Creating user document');
        await setDoc(userRef, {
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // Then create settings document
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        console.log('Creating settings document');
        await setDoc(settingsRef, {
          ...this.settings,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error initializing user settings:', error);
      throw error;
    }
  }

  async loadSettings(userId: string) {
    console.log('Loading settings for user:', userId);
    try {
      // Initialize user and settings documents
      await this.initializeUserSettings(userId);

      // Now load the settings
      const settingsDoc = doc(this.firestore, `users/${userId}/settings/preferences`);
      const settingsSnapshot = await getDoc(settingsDoc);

      if (settingsSnapshot.exists()) {
        console.log('Settings found:', settingsSnapshot.data());
        const data = settingsSnapshot.data();
        this.settings = {
          ...this.settings,
          region: this.validateRegion(data['region']),
          locale: this.validateLocale(data['locale']),
          timezone: this.validateTimezone(data['timezone']),
          dateFormat: this.validateDateFormat(data['dateFormat']),
          currencyCode: this.validateCurrencyCode(data['currencyCode']),
          theme: data['theme'] || this.settings.theme,
          notifications: Boolean(data['notifications']),
          autoSave: Boolean(data['autoSave']),
          imageQuality: data['imageQuality'] || this.settings.imageQuality,
          privacyMode: Boolean(data['privacyMode']),
          darkMode: Boolean(data['darkMode']),
          dataRetention: this.validateDataRetention(data['dataRetention']),
          enhancedPrivacy: Boolean(data['enhancedPrivacy']),
        };
        this.applySettings();
      }
      this.settingsLoaded = true;
    } catch (error) {
      console.error('Error loading settings:', error);
      if (error instanceof FirebaseError) {
        console.error('Firebase error code:', error.code);
        console.error('Firebase error message:', error.message);
        const alert = await this.alertController.create({
          header: 'Settings Error',
          message: `Error: ${error.message}`,
          buttons: [
            {
              text: 'Try Again',
              handler: () => {
                this.loadSettings(userId);
              },
            },
            {
              text: 'Use Defaults',
              role: 'cancel',
              handler: () => {
                this.resetToDefaults();
                this.settingsLoaded = true;
              },
            },
          ],
        });
        await alert.present();
      } else {
        this.resetToDefaults();
        this.settingsLoaded = true;
      }
    }
  }

  // Validation methods to ensure data integrity
  private validateRegion(region: string): string {
    const validRegions = ['global', 'us', 'eu', 'uk', 'au', 'ca', 'za'];
    return validRegions.includes(region) ? region : 'global';
  }

  private validateLocale(locale: string): string {
    const validLocales = ['en', 'es', 'fr', 'de'];
    return validLocales.includes(locale) ? locale : 'en';
  }

  private validateTimezone(timezone: string): string {
    const validTimezones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
    ];
    return validTimezones.includes(timezone) ? timezone : 'UTC';
  }

  private validateDateFormat(format: string): string {
    const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
    return validFormats.includes(format) ? format : 'MM/DD/YYYY';
  }

  private validateCurrencyCode(code: string): string {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'ZAR'];
    return validCurrencies.includes(code) ? code : 'USD';
  }

  private validateDataRetention(retention: string): string {
    const validRetentions = ['7', '30', '90'];
    return validRetentions.includes(retention) ? retention : '30';
  }

  async updateSettings(isInitial = false) {
    try {
      const user = await firstValueFrom(this.authService.user$);
      if (!user) {
        throw new Error('No authenticated user');
      }

      const settingsDoc = doc(this.firestore, `users/${user.uid}/settings/preferences`);

      // Validate all settings before saving
      const validatedSettings = {
        ...this.settings,
        region: this.validateRegion(this.settings.region),
        locale: this.validateLocale(this.settings.locale),
        timezone: this.validateTimezone(this.settings.timezone),
        dateFormat: this.validateDateFormat(this.settings.dateFormat),
        currencyCode: this.validateCurrencyCode(this.settings.currencyCode),
        dataRetention: this.validateDataRetention(this.settings.dataRetention),
        updatedAt: Timestamp.now(),
      };

      await setDoc(settingsDoc, validatedSettings, { merge: true });
      this.applySettings();

      if (!isInitial) {
        this.settingsSaved = true;
        setTimeout(() => {
          this.settingsSaved = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);

      let errorMessage = 'Failed to save settings. Please try again.';
      let buttons: AlertButton[] = [{ text: 'OK' }];

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'permission-denied':
            errorMessage = 'You do not have permission to update settings. Please sign out and sign in again.';
            buttons = [
              {
                text: 'Try Again',
                handler: () => {
                  this.updateSettings(isInitial);
                },
              },
              {
                text: 'Sign Out',
                handler: () => {
                  this.authService.signOut();
                },
              },
            ];
            break;
          case 'not-found':
            errorMessage = 'Settings document not found. Creating new settings...';
            // Try to create the settings document
            await setDoc(
              doc(this.firestore, `users/${(await firstValueFrom(this.authService.user$))!.uid}/settings/preferences`),
              this.settings,
              { merge: false }
            );
            return;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }

      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons,
      });
      await alert.present();
    }
  }

  private applySettings() {
    // Apply dark mode
    document.body.classList.toggle('dark', this.settings.darkMode);

    // Apply theme color
    document.body.className = document.body.className
      .split(' ')
      .filter((c) => !c.startsWith('theme-'))
      .join(' ');
    document.body.classList.add(`theme-${this.settings.theme}`);

    // Apply data saver settings if enabled
    if (this.settings.privacyMode) {
      this.dataSaverSettings.imageQuality = 70; // Reduce image quality
      this.updateDataSaverSettings();
    }

    // Emit settings change event for other components
    document.dispatchEvent(
      new CustomEvent('settingsChanged', {
        detail: {
          region: this.settings.region,
          locale: this.settings.locale,
          timezone: this.settings.timezone,
          dateFormat: this.settings.dateFormat,
          currencyCode: this.settings.currencyCode,
        },
      })
    );
  }

  updateDataSaverSettings() {
    this.dataSaverService.updateSettings(this.dataSaverSettings);
  }

  async showPrivacyPolicy() {
    const alert = await this.alertController.create({
      header: 'Privacy Policy',
      message: `
        Data Collection:
        We collect only essential data needed for document analysis.

        Data Storage:
        Documents are encrypted and stored in secure Firebase servers.

        Data Deletion:
        You can delete your data at any time. Documents are automatically deleted based on your retention settings.

        Your Control:
        You have full control over your data and can export or delete it at any time.
      `,
      cssClass: 'privacy-policy-alert',
      buttons: ['Close'],
    });

    await alert.present();
  }
}
