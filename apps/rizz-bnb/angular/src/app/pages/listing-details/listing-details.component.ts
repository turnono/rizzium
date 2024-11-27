import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  beds: number;
}

@Component({
  selector: 'app-listing-details',
  templateUrl: './listing-details.component.html',
  styleUrls: ['./listing-details.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonBackButton, IonButtons],
})
export class ListingDetailsComponent {
  listing: Listing | null = null;

  constructor(private route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadListing(id);
  }

  private loadListing(id: string | null): void {
    // Mock data - in a real app, this would come from a service
    this.listing = {
      id: id || '1',
      title: 'Beachfront Villa',
      location: 'Miami Beach, FL',
      price: 299,
      image: 'https://picsum.photos/400/300?random=1',
      beds: 3,
    };
  }
}
