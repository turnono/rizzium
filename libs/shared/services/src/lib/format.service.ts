import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RegionalSettings {
  region: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  currencyCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class FormatService {
  private settings: RegionalSettings = {
    region: 'global',
    locale: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currencyCode: 'USD',
  };

  private settingsSubject = new BehaviorSubject<RegionalSettings>(this.settings);
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    // Listen for settings changes from settings page
    document.addEventListener('settingsChanged', ((event: CustomEvent) => {
      this.updateSettings(event.detail);
    }) as EventListener);
  }

  updateSettings(settings: Partial<RegionalSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.settingsSubject.next(this.settings);
  }

  formatDate(date: Date | string | number): string {
    const d = new Date(date);

    try {
      // First try to format according to user's preferred format
      switch (this.settings.dateFormat) {
        case 'MM/DD/YYYY':
          return new Intl.DateTimeFormat(this.settings.locale, {
            timeZone: this.settings.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
        case 'DD/MM/YYYY':
          return new Intl.DateTimeFormat(this.settings.locale, {
            timeZone: this.settings.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hourCycle: 'h24',
          })
            .format(d)
            .split('/')
            .reverse()
            .join('/');
        case 'YYYY-MM-DD':
          return new Intl.DateTimeFormat(this.settings.locale, {
            timeZone: this.settings.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
            .format(d)
            .split('/')
            .join('-');
        default:
          return new Intl.DateTimeFormat(this.settings.locale, {
            timeZone: this.settings.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return d.toLocaleDateString();
    }
  }

  formatCurrency(amount: number): string {
    try {
      return new Intl.NumberFormat(this.settings.locale, {
        style: 'currency',
        currency: this.settings.currencyCode,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${this.settings.currencyCode} ${amount.toFixed(2)}`;
    }
  }

  formatTime(date: Date | string | number): string {
    const d = new Date(date);

    try {
      return new Intl.DateTimeFormat(this.settings.locale, {
        timeZone: this.settings.timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch (error) {
      console.error('Error formatting time:', error);
      return d.toLocaleTimeString();
    }
  }

  formatDateTime(date: Date | string | number): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  getLocale(): string {
    return this.settings.locale;
  }

  getTimezone(): string {
    return this.settings.timezone;
  }

  getCurrencyCode(): string {
    return this.settings.currencyCode;
  }
}
