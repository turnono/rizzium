import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonContent } from '@ionic/angular/standalone';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { BehaviorSubject } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp, IonContent, FooterComponent],
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-content class="main-content" [scrollEvents]="true" (ionScroll)="handleScroll($event)" [fullscreen]="true">
        <div class="scroll-content">
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-content>
      <rizzium-footer
        [class.footer-hidden]="!(showFooter$ | async)"
        [class.footer-visible]="showFooter$ | async"
      ></rizzium-footer>
    </ion-app>
  `,
  styles: [
    `
      ion-app {
        background-color: var(--ion-color-dark);
      }

      .main-content {
        --padding-bottom: 140px;
      }

      .scroll-content {
        min-height: 110vh; /* Ensure there's always scrollable content */
        position: relative;
      }

      rizzium-footer {
        transition: transform 0.3s ease-in-out;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .footer-hidden {
        transform: translateY(100%);
      }

      .footer-visible {
        transform: translateY(0);
      }

      @media (min-width: 768px) {
        .main-content {
          --padding-bottom: 80px;
        }
      }
    `,
  ],
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
