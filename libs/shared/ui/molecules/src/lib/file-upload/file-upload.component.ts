import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonProgressBar,
  IonText,
  IonCard,
  IonCardContent,
  IonChip,
  IonLabel,
  IonItem,
} from '@ionic/angular/standalone';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, closeCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonText,
    IonCard,
    IonCardContent,
    IonChip,
    IonLabel,
    IonItem,
  ],
  template: `
    <div class="upload-container" [class.is-dragging]="isDragging" [class.is-uploading]="isUploading">
      <input
        #fileInput
        type="file"
        [accept]="accept"
        (change)="onFileSelected($event)"
        style="display: none"
        data-cy="file-input"
      />

      <div
        class="upload-area"
        (click)="triggerFileUpload()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.is-dragging]="isDragging"
        role="button"
        tabindex="0"
        (keydown.enter)="triggerFileUpload()"
        (keydown.space)="triggerFileUpload()"
        data-cy="upload-area"
      >
        @if (!selectedFile && !isUploading) {
        <div class="upload-content">
          <ion-icon name="cloud-upload" size="large" class="upload-icon"></ion-icon>
          <h2 style="color: white">Upload Your Document</h2>
          <p>Drag and drop your file here or click to browse</p>
          <div class="file-types">
            <ion-chip>
              <ion-icon name="document"></ion-icon>
              <ion-label>PDF</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-icon name="document"></ion-icon>
              <ion-label>DOC</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-icon name="document"></ion-icon>
              <ion-label>TXT</ion-label>
            </ion-chip>
          </div>
          <p class="size-limit">Maximum file size: 5MB</p>
        </div>
        } @if (selectedFile && !isUploading && !uploadComplete) {
        <div class="upload-content">
          <ion-icon name="document" class="file-icon"></ion-icon>
          <h3>{{ selectedFile.name }}</h3>
          <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
          <ion-button (click)="clearFile($event)" fill="clear" color="medium">
            <ion-icon name="close-circle" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
        } @if (isUploading) {
        <div class="upload-content">
          <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
          <h3>Uploading... {{ (uploadProgress * 100).toFixed(0) }}%</h3>
          <p>Please keep this window open</p>
        </div>
        } @if (uploadComplete) {
        <div class="upload-content success">
          <ion-icon name="checkmark-circle" color="success" size="large"></ion-icon>
          <h3>Upload Complete!</h3>
          <p>Your document has been uploaded successfully</p>
        </div>
        } @if (errorMessage) {
        <div class="upload-content error">
          <ion-icon name="alert-circle" color="danger" size="large"></ion-icon>
          <h3>Upload Failed</h3>
          <p>{{ errorMessage }}</p>
          <ion-button fill="clear" (click)="clearFile($event)">Try Again</ion-button>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .upload-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .upload-area {
        border: 2px dashed var(--ion-color-medium);
        border-radius: 12px;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: rgba(var(--ion-color-light-rgb), 0.05);
        backdrop-filter: blur(10px);

        &:hover,
        &.is-dragging {
          border-color: var(--ion-color-primary);
          background: rgba(var(--ion-color-primary-rgb), 0.05);
        }

        &:focus {
          outline: none;
          border-color: var(--ion-color-primary);
          box-shadow: 0 0 0 2px var(--ion-color-primary);
        }
      }

      .upload-content {
        text-align: center;
        padding: 2rem;
        width: 100%;
        max-width: 400px;

        ion-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: var(--ion-color-primary);
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 500;
          margin: 0 0 0.5rem;
          color: var(--ion-color-light);
        }

        h3 {
          font-size: 1.2rem;
          margin: 0 0 0.5rem;
          color: var(--ion-color-light);
        }

        p {
          margin: 0.5rem 0;
          color: var(--ion-color-medium);
        }

        &.success {
          ion-icon {
            color: var(--ion-color-success);
          }
        }

        &.error {
          ion-icon {
            color: var(--ion-color-danger);
          }
        }
      }

      .file-types {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin: 1rem 0;

        ion-chip {
          --background: rgba(var(--ion-color-light-rgb), 0.1);
          --color: var(--ion-color-light);
        }
      }

      .size-limit {
        font-size: 0.9rem;
        opacity: 0.7;
      }

      ion-progress-bar {
        margin: 1rem 0;
        height: 6px;
        border-radius: 3px;
        --buffer-background: rgba(var(--ion-color-light-rgb), 0.1);
        --progress-background: var(--ion-color-primary);
      }

      @media (max-width: 576px) {
        .upload-container {
          padding: 1rem;
        }

        .upload-area {
          min-height: 250px;
        }

        .upload-content {
          padding: 1rem;

          h2 {
            font-size: 1.2rem;
          }

          h3 {
            font-size: 1rem;
          }
        }

        .file-types {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  private storage = inject(Storage);
  private ngZone = inject(NgZone);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);

  @Input() path = 'uploads';
  @Input() accept = '.pdf,.doc,.docx,.txt';
  @Output() urlGenerated = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();
  @Output() progressChange = new EventEmitter<number>();

  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  uploadComplete = false;
  downloadUrl = '';
  errorMessage = '';
  selectedFile: File | null = null;

  constructor() {
    addIcons({ cloudUploadOutline, documentOutline, closeCircleOutline, checkmarkCircleOutline });
  }

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

  clearFile(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFile = null;
    this.errorMessage = '';
    this.downloadUrl = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadComplete = false;
    this.isDragging = false;
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.clearFile();
    this.selectedFile = file;

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
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const storageRef = ref(this.storage, `users/${user.uid}/${this.path}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.ngZone.run(() => {
            const progress = snapshot.bytesTransferred / snapshot.totalBytes;
            this.uploadProgress = progress;
            this.progressChange.emit(progress);
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

      // After successful upload, create an analysis document
      const analysisRef = collection(this.firestore, `users/${user.uid}/analyses`);
      await addDoc(analysisRef, {
        userId: user.uid,
        fileName: file.name,
        fileUrl: this.downloadUrl,
        status: 'uploaded',
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validationError.emit(this.errorMessage);
      this.isUploading = false;
      this.uploadComplete = false;
    }
  }

  openFileDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.accept;
    input.multiple = false;

    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files?.length) {
        this.handleFileSelection(files[0]);
      }
    };

    input.click();
  }

  private handleFileSelection(file: File) {
    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    this.selectedFile = file;
    this.onFileSelected({ target: { files: [file] } } as unknown as Event);
  }

  uploadFile(file: File) {
    this.handleFileSelection(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0]);
    }
  }

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }
}
