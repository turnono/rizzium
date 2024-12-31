import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  cloudOffline,
  logIn,
  personCircle,
  shieldCheckmark,
  analytics,
  phonePortrait,
  cloudUpload,
  documentText,
  flash,
  rocket,
  pricetag,
  lockClosed,
  server,
  warning,
  cloudDone,
  settingsOutline,
  logOutOutline,
} from 'ionicons/icons';
import { PopoverController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-user-menu',
  template: `
    <ion-list lines="none" class="ion-no-padding">
      <ion-item button (click)="navigate('/settings')" detail="false" class="menu-item">
        <ion-icon name="settings-outline" slot="start" color="medium"></ion-icon>
        <ion-label>Settings</ion-label>
      </ion-item>
      <ion-item button (click)="logout()" detail="false" class="menu-item">
        <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
        <ion-label color="danger">Sign Out</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 200px;
        padding: 8px 0;
      }
      .menu-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --padding-top: 10px;
        --padding-bottom: 10px;
        --background-hover: var(--ion-color-light);
        --ripple-color: var(--ion-color-primary);
        font-size: 14px;
        border-radius: 4px;
        margin: 0 4px;
      }
      ion-icon {
        font-size: 18px;
        margin-right: 8px;
      }
    `,
  ],
  standalone: true,
  imports: [IonicModule],
})
export class UserMenuComponent {
  private router = inject(Router);
  private popoverCtrl = inject(PopoverController);
  private authService = inject(FirebaseAuthService);

  async navigate(path: string) {
    await this.popoverCtrl.dismiss();
    this.router.navigate([path]);
  }

  async logout() {
    await this.popoverCtrl.dismiss();
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
})
export class HomePageComponent implements OnInit {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private popoverCtrl = inject(PopoverController);

  isLoggedIn$ = this.authService.user$.pipe(map((user) => !!user));
  displayName$ = this.authService.user$.pipe(map((user) => user?.displayName || 'User'));
  photoURL$ = this.authService.user$.pipe(map((user) => user?.photoURL));
  isOnline = navigator.onLine;
  isMobile = true; // Default to mobile view

  constructor() {
    addIcons({
      cloudOffline,
      logIn,
      personCircle,
      shieldCheckmark,
      analytics,
      phonePortrait,
      cloudUpload,
      documentText,
      flash,
      rocket,
      pricetag,
      lockClosed,
      server,
      warning,
      cloudDone,
      settingsOutline,
      logOutOutline,
    });

    window.addEventListener('online', () => (this.isOnline = true));
    window.addEventListener('offline', () => (this.isOnline = false));
  }

  ngOnInit() {
    // Subscribe to breakpoint changes
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .pipe(map((result) => result.matches))
      .subscribe((isMobile) => {
        this.isMobile = isMobile;
      });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  async showUserMenu(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: UserMenuComponent,
      event,
      alignment: 'end',
      side: 'bottom',
      size: 'auto',
      dismissOnSelect: true,
      translucent: false,
      cssClass: 'user-menu-popover',
      arrow: false,
    });

    await popover.present();
  }
}
