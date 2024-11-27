import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bedOutline, cashOutline, locationOutline } from 'ionicons/icons';
import { SearchbarCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonText,
    IonIcon,
  ],
})
export class HomeComponent {
  featuredListings = [
    {
      id: '1',
      title: 'Beachfront Villa',
      location: 'Miami Beach, FL',
      price: 299,
      image: 'https://picsum.photos/400/300?random=1',
      beds: 3,
    },
    {
      id: '2',
      title: 'Mountain Cabin',
      location: 'Aspen, CO',
      price: 199,
      image: 'https://picsum.photos/400/300?random=2',
      beds: 2,
    },
    {
      id: '3',
      title: 'City Loft',
      location: 'New York, NY',
      price: 159,
      image: 'https://picsum.photos/400/300?random=3',
      beds: 1,
    },
  ];

  constructor() {
    addIcons({ bedOutline, cashOutline, locationOutline });
  }

  onSearch(event: SearchbarCustomEvent): void {
    console.log('Search query:', event.detail.value);
  }
}
