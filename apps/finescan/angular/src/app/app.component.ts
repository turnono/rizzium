import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonContent, IonFooter } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp, IonContent, IonFooter, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'FineScan AI';
}
