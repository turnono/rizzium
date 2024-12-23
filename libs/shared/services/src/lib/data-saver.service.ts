import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DataSaverSettings {
  enabled: boolean;
  imageQuality: number; // 0-100
  disableAnimations: boolean;
  textOnlyMode: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DataSaverService {
  private readonly STORAGE_KEY = 'finescan-data-saver';
  private defaultSettings: DataSaverSettings = {
    enabled: false,
    imageQuality: 100,
    disableAnimations: false,
    textOnlyMode: false,
  };

  private settingsSubject = new BehaviorSubject<DataSaverSettings>(this.defaultSettings);
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (savedSettings) {
      this.settingsSubject.next(JSON.parse(savedSettings));
    }
  }

  updateSettings(settings: Partial<DataSaverSettings>) {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    this.settingsSubject.next(newSettings);
    this.applySettings(newSettings);
  }

  private applySettings(settings: DataSaverSettings) {
    // Apply animation settings
    document.body.classList.toggle('reduce-motion', settings.disableAnimations);
    // Apply text-only mode
    document.body.classList.toggle('text-only-mode', settings.textOnlyMode);
  }

  getImageQuality(): number {
    return this.settingsSubject.value.imageQuality;
  }

  isEnabled(): boolean {
    return this.settingsSubject.value.enabled;
  }
}
