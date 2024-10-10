import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, IonApp, RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'RizzPOS';
}
