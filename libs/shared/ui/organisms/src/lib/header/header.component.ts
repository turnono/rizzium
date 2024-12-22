import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { map } from 'rxjs/operators';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonRouterLink,
  IonButton,
  IonRouterLinkWithHref,
  IonRouterOutlet,
} from '@ionic/angular/standalone';

@Component({
  selector: 'rizzium-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonIcon,
    IonRouterLink,
    IonButton,
    IonRouterLinkWithHref,
    IonRouterOutlet,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() title = '';
  @Input() showBackButton = true;
  @Output() buttonClicked = new EventEmitter<string>();
  @Input() showLogoutButton = true;
  @Input() authMode: 'login' | 'register' = 'login';
  @Output() authModeChange = new EventEmitter<'login' | 'register'>();

  authService = inject(FirebaseAuthService);
  isAuthenticated$ = this.authService.user$.pipe(map((user) => !!user));

  constructor() {
    addIcons({ arrowBackOutline, logOutOutline });
  }

  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    this.authModeChange.emit(this.authMode);
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.buttonClicked.emit('logout');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
