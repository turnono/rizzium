import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Welcome to RizzPOS</h1>
      <p>You are now logged in.</p>
      <ion-button expand="block" (click)="signOut()">Sign Out</ion-button>
    </ion-content>
  `,
})
export class HomeComponent {
  constructor(private authService: FirebaseAuthService, private router: Router) {}

  async signOut() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
      // TODO: Show error message to user
    }
  }
}
