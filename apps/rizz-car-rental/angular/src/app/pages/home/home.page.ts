import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carSportOutline, timeOutline, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
  ],
})
export class HomePage {
  features = [
    {
      icon: 'car-sport-outline',
      title: 'Wide Selection',
      description: 'Choose from our diverse fleet of vehicles',
    },
    {
      icon: 'time-outline',
      title: 'Quick Booking',
      description: 'Easy and fast rental process',
    },
    {
      icon: 'wallet-outline',
      title: 'Best Rates',
      description: 'Competitive pricing and special offers',
    },
  ];

  constructor() {
    addIcons({ carSportOutline, timeOutline, walletOutline });
  }
}
