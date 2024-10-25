import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFooter, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'rizzium-footer',
  standalone: true,
  imports: [CommonModule, IonFooter, IonToolbar, IonTitle],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {}
