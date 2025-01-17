import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VideoQueueService } from '../../services/video-queue.service';
import { VideoSegment, FinalVideo } from '../../interfaces/video-queue.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-video-status',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Video Generation Status</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let segment of segments() || []">
              <ion-label>
                <h2>Segment {{ segment.segmentIndex + 1 }}</h2>
                <p>Status: {{ segment.status }}</p>
                <p *ngIf="segment.error" class="error-text">Error: {{ segment.error }}</p>
              </ion-label>
              <ion-spinner *ngIf="segment.status === 'in-progress'" slot="end"></ion-spinner>
              <ion-icon
                *ngIf="segment.status === 'completed'"
                name="checkmark-circle"
                color="success"
                slot="end"
              ></ion-icon>
              <ion-icon *ngIf="segment.status === 'error'" name="alert-circle" color="danger" slot="end"></ion-icon>
            </ion-item>
          </ion-list>

          <div class="progress-section" *ngIf="finalVideo()">
            <ion-progress-bar [value]="progressValue()"></ion-progress-bar>
            <p>
              {{ finalVideo()?.completedSegments || 0 }} of {{ finalVideo()?.totalSegments || 0 }} segments completed
            </p>
          </div>

          <ion-button *ngIf="finalVideo()?.status === 'completed'" expand="block" (click)="downloadVideo()">
            Download Final Video
          </ion-button>

          <ion-text color="danger" *ngIf="finalVideo()?.status === 'error'">
            <p>Error: {{ finalVideo()?.error }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .error-text {
        color: var(--ion-color-danger);
      }
      .progress-section {
        margin: 20px 0;
        text-align: center;
      }
    `,
  ],
})
export class VideoStatusComponent {
  @Input() scriptId!: string;

  private videoQueueService = inject(VideoQueueService);

  segments = toSignal<VideoSegment[]>(this.videoQueueService.getVideoSegments(this.scriptId));
  finalVideo = toSignal<FinalVideo>(this.videoQueueService.getFinalVideo(this.scriptId));

  progressValue = computed(() => {
    const video = this.finalVideo();
    return video ? video.completedSegments / video.totalSegments : 0;
  });

  downloadVideo() {
    const videoUrl = this.finalVideo()?.videoUrl;
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  }
}
