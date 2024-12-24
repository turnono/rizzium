import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonContent } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { BehaviorSubject } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp, IonContent, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  title = 'finescan';

  private lastScrollTop = 0;
  showFooter$ = new BehaviorSubject<boolean>(true);
  private scrollThreshold = 50;

  ngOnInit() {
    this.showFooter$.next(false);
  }

  handleScroll(event: any) {
    const scrollTop = event.detail.scrollTop;

    // Show footer when scrolling down past threshold
    if (scrollTop > this.lastScrollTop && scrollTop > this.scrollThreshold) {
      this.showFooter$.next(true);
    }
    // Hide footer when at top
    else if (scrollTop < this.scrollThreshold) {
      this.showFooter$.next(false);
    }

    this.lastScrollTop = scrollTop;
  }
}
