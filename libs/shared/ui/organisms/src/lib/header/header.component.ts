import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { arrowBackOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons'; // Import this

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'rizzpos-header',
  standalone: true,
  imports: [
    CommonModule,
    IonBackButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() title = '';
  @Input() showBackButton = true;

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
