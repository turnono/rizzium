import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { Observable, Subscription } from 'rxjs';
import { BusinessData } from '@rizzpos/shared/interfaces';
import { addIcons } from 'ionicons';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonFab,
    IonFabButton,
  ],
})
export class HomePageComponent implements OnInit, OnDestroy {
  businesses$: Observable<BusinessData[]>;
  loading = true;
  error: string | null = null;
  private subscription?: Subscription;
  private alertController: AlertController = inject(AlertController);

  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService,
    private router: Router
  ) {
    addIcons({ addOutline });
    this.businesses$ = this.businessService.userBusinesses$;
  }

  ngOnInit() {
    this.subscription = this.businesses$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading businesses:', err);
        this.error = 'Failed to load businesses. Please try again.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  goToBusiness(businessId: string) {
    this.router.navigate(['/business', businessId]);
  }

  createNewBusiness() {
    this.router.navigate(['/business-setup']);
  }

  async headerButtonClicked(event: string) {
    console.log('header button clicked', event);
    if (event === 'logout') {
      const alert = await this.alertController.create({
        header: 'Logout',
        message: 'Are you sure you want to logout?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Logout',
            role: 'confirm',
            handler: () => {
              this.authService
                .signOut()
                .then(() => {
                  this.router.navigate(['/login']);
                })
                .catch((error) => {
                  console.error('Error during logout:', error);
                });
            },
          },
        ],
      });
      await alert.present();
    }
  }
}
