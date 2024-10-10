import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { ReactiveFormsModule } from '@angular/forms';

interface QuickAction {
  label: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent, RouterModule, ReactiveFormsModule],
})
export class HomePageComponent implements OnInit {
  userName = 'Guest';
  isAnonymous = true;
  quickActions: QuickAction[] = [
    {
      label: 'New Sale',
      icon: 'cart',
      action: () => this.newSale()
    },
    {
      label: 'Inventory',
      icon: 'cube',
      action: () => this.openInventory()
    },
    {
      label: 'Reports',
      icon: 'bar-chart',
      action: () => this.openReports()
    }
  ];

  constructor(
    private authService: FirebaseAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.displayName || 'User';
        this.isAnonymous = user.isAnonymous;
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  newSale() {
    // Implement new sale functionality
    console.log('New sale initiated');
  }

  openInventory() {
    // Implement inventory opening functionality
    console.log('Opening inventory');
  }

  openReports() {
    // Implement reports opening functionality
    console.log('Opening reports');
  }

  onLogout() {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
