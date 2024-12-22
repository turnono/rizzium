import { Component, EventEmitter, Input, Output, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="file-upload-container" data-cy="file-upload-page">
      <div class="upload-info">
        <ion-text color="medium">
          <p>Maximum file size: 5MB</p>
          <p>Accepted formats: PDF, Text, JPEG, PNG</p>
        </ion-text>
      </div>

      <ion-button (click)="fileInput.click()" [disabled]="isUploading">
        <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
        Select File
      </ion-button>

      <input
        #fileInput
        type="file"
        (change)="onFileSelected($event)"
        [accept]="accept"
        data-cy="file-input"
        style="display: none"
      />

      @if (selectedFile && !uploadComplete) {
      <div class="file-info">
        <ion-chip>
          <ion-icon name="document-outline"></ion-icon>
          <ion-label>{{ selectedFile.name }}</ion-label>
          <ion-icon name="close-circle" (click)="clearFile()"></ion-icon>
        </ion-chip>
      </div>
      } @if (isUploading) {
      <div class="upload-progress" data-cy="upload-progress">
        <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
        <ion-text color="medium">Uploading: {{ uploadProgress | percent }}</ion-text>
      </div>
      } @if (uploadComplete) {
      <div data-cy="success-message" class="success-message">
        <ion-item color="success" lines="none">
          <ion-icon name="checkmark-circle" slot="start"></ion-icon>
          <ion-label>File uploaded successfully!</ion-label>
        </ion-item>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .file-upload-container {
        padding: 1rem;
      }
      .upload-info {
        margin-bottom: 1rem;
      }
      .file-info {
        margin: 1rem 0;
      }
      .upload-progress {
        margin: 1rem 0;
      }
      .error-message,
      .success-message {
        margin: 1rem 0;
      }
    `,
  ],
})
export class FileUploadComponent {
  private storage = inject(Storage);
  private ngZone = inject(NgZone);

  @Input() path = 'uploads';
  @Input() accept = 'application/pdf,text/plain,image/jpeg,image/png';
  @Output() urlGenerated = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();

  isUploading = false;
  uploadProgress = 0;
  uploadComplete = false;
  downloadUrl = '';
  errorMessage = '';
  selectedFile: File | null = null;

  validateFile(file: File): string | null {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit';
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF, Text, JPEG, and PNG files are allowed';
    }

    return null;
  }

  clearFile() {
    this.selectedFile = null;
    this.errorMessage = '';
    this.downloadUrl = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadComplete = false;
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.clearFile(); // Reset all states
    this.selectedFile = file;

    // Validate file
    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadComplete = false;

    try {
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const storageRef = ref(this.storage, `${this.path}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.ngZone.run(() => {
            this.uploadProgress = snapshot.bytesTransferred / snapshot.totalBytes;
          });
        },
        (error) => {
          this.ngZone.run(() => {
            this.errorMessage = 'Upload failed: ' + error.message;
            this.validationError.emit(this.errorMessage);
            this.isUploading = false;
            this.uploadComplete = false;
          });
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            this.ngZone.run(() => {
              this.downloadUrl = url;
              this.urlGenerated.emit(this.downloadUrl);
              this.isUploading = false;
              this.uploadComplete = true;
              this.uploadProgress = 0;

              // Clear the file input to allow new uploads
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) {
                fileInput.value = '';
              }
            });
          } catch (error) {
            this.ngZone.run(() => {
              this.errorMessage = 'Failed to get download URL';
              this.validationError.emit(this.errorMessage);
              this.isUploading = false;
              this.uploadComplete = false;
            });
          }
        }
      );
    } catch (error) {
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validationError.emit(this.errorMessage);
      this.isUploading = false;
      this.uploadComplete = false;
    }
  }
}
