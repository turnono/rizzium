import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bedOutline, cashOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
  ],
})
export class ListingsComponent {
  listings = [
    {
      id: '1',
      title: 'Beachfront Villa',
      location: 'Miami Beach, FL',
      price: 299,
      image: 'https://picsum.photos/400/300?random=1',
      beds: 3,
    },
    // Add more listings...
  ];

  constructor() {
    addIcons({ bedOutline, cashOutline, locationOutline });
  }
}
