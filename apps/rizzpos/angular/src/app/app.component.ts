import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'RizzPOS';
  test = 'test1';
}
