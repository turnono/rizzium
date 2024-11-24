import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
  ],
})
export class AppComponent {
  featuredCars = [
    {
      model: 'Tesla Model 3',
      price: 89,
      image: 'assets/tesla-model-3.jpg',
      type: 'Electric',
    },
    {
      model: 'Toyota Camry',
      price: 45,
      image: 'assets/toyota-camry.jpg',
      type: 'Sedan',
    },
    {
      model: 'BMW X5',
      price: 120,
      image: 'assets/bmw-x5.jpg',
      type: 'SUV',
    },
  ];
}
