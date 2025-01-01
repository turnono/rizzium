import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonContent, IonFooter } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { NavigationEnd } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp, IonContent, IonFooter, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'FineScan AI';
  path: string;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.path = event.url;
      }
    });
  }
}
