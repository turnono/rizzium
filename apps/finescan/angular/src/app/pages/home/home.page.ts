import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { map } from 'rxjs/operators';
import { Subscription, fromEvent, merge } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  listOutline,
  settingsOutline,
  homeOutline,
  logInOutline,
  logOutOutline,
  cloudUploadOutline,
  warningOutline,
  shieldCheckmarkOutline,
  analyticsOutline,
  personCircleOutline,
  homeSharp,
  shieldCheckmarkSharp,
  warningSharp,
  analyticsSharp,
  settingsSharp,
  personCircleSharp,
  cloudUploadSharp,
  documentTextSharp,
  cloudOfflineOutline,
  flashOutline,
  phonePortraitOutline,
  shieldCheckmark,
  flash,
  phonePortrait,
  logIn,
  personOutline,
  cameraOutline,
  documentOutline,
} from 'ionicons/icons';
import { FooterComponent } from '@rizzium/shared/ui/organisms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FooterComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePageComponent implements OnDestroy {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  isLoggedIn$ = this.authService.user$.pipe(map((user) => !!user));
  displayName$ = this.authService.user$.pipe(map((user) => user?.displayName || 'User'));
  isOnline = navigator.onLine;
  private networkSubscription: Subscription;

  constructor() {
    // Register all icons
    addIcons({
      documentTextOutline,
      listOutline,
      settingsOutline,
      homeOutline,
      logInOutline,
      logOutOutline,
      cloudUploadOutline,
      warningOutline,
      shieldCheckmarkOutline,
      analyticsOutline,
      personCircleOutline,
      homeSharp,
      shieldCheckmarkSharp,
      warningSharp,
      analyticsSharp,
      settingsSharp,
      personCircleSharp,
      cloudUploadSharp,
      documentTextSharp,
      cloudOfflineOutline,
      flashOutline,
      phonePortraitOutline,
      shieldCheckmark,
      flash,
      'phone-portrait': phonePortrait,
      'log-in': logIn,
      person: personOutline,
      camera: cameraOutline,
      'document-outline': documentOutline,
      document: documentOutline,
    });

    // Network subscription
    this.networkSubscription = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe((status) => {
      this.isOnline = status;
    });
  }

  ngOnDestroy() {
    this.networkSubscription?.unsubscribe();
  }

  async showUserMenu() {
    const displayName = await firstValueFrom(this.displayName$);
    const alert = await this.alertController.create({
      header: 'Account',
      message: `Signed in as ${displayName}`,
      buttons: [
        {
          text: 'Settings',
          handler: () => {
            this.router.navigate(['/settings']);
          },
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: () => {
            this.confirmLogout();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
      cssClass: 'user-menu',
    });

    await alert.present();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      cssClass: 'alert-logout',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Logout',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
