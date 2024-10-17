import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';

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
  selector: 'rizzpos-header',
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

  constructor() {
    addIcons({ arrowBackOutline, logOutOutline });
  }

  buttonClick(type: string) {
    console.log('button clicked', type);
    // output event
    this.buttonClicked.emit(type);
  }
}
