import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FileUploadComponent } from '@rizzium/shared/ui/molecules';
import { Storage } from '@angular/fire/storage';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, IonicModule, FileUploadComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>File Upload</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Upload Files</ion-card-title>
          <ion-card-subtitle>Select files to upload to Firebase Storage</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <ui-file-upload
            #fileUpload
            path="finescan-uploads"
            accept="image/*,.pdf"
            (urlGenerated)="onUrlGenerated($event)"
          ></ui-file-upload>

          @if (lastUploadedUrl) {
          <div class="upload-success ion-margin-top">
            <ion-text color="success">
              <h4>File uploaded successfully!</h4>
            </ion-text>
            <ion-button fill="clear" (click)="openFile()">View File</ion-button>
          </div>
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .upload-success {
        text-align: center;
        margin-top: 1rem;
      }
    `,
  ],
})
export class FileUploadPage {
  lastUploadedUrl: string | null = null;

  constructor(private storage: Storage) {}

  onUrlGenerated(url: string) {
    console.log('File uploaded successfully:', url);
    this.lastUploadedUrl = url;
  }

  openFile() {
    if (this.lastUploadedUrl) {
      window.open(this.lastUploadedUrl, '_blank');
    }
  }
}
