import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LearnStore } from '../state/learn.signals';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content>
      <ion-header>
        <ion-toolbar>
          <ion-title>Your Progress</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Completed Lessons</h2>
            <p>{{ completedLessonsCount() }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styleUrls: ['./progress.page.scss'],
})
export class ProgressPageComponent {
  private learnStore = inject(LearnStore);
  readonly completedLessonsCount = this.learnStore.completedLessonsCount;
}
