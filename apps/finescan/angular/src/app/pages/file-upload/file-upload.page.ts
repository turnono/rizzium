import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FileUploadComponent } from '@rizzium/shared/ui/molecules';

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
            path="finescan-uploads"
            accept="image/*,.pdf"
            (urlGenerated)="onUrlGenerated($event)"
          ></ui-file-upload>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
export class FileUploadPage {
  onUrlGenerated(url: string) {
    console.log('File uploaded successfully:', url);
  }
}
