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
import {
  cloudUploadOutline,
  documentOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  cloudUpload,
  lockClosedOutline,
  serverOutline,
  timeOutline,
  arrowForwardOutline,
  helpCircleOutline,
} from 'ionicons/icons';
import { DataSaverService } from '@rizzium/shared/services';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

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
    <div
      class="upload-container"
      [class.is-dragging]="isDragging"
      [class.is-uploading]="isUploading"
      role="region"
      aria-label="File upload section"
    >
      <input
        #fileInput
        type="file"
        [accept]="accept"
        (change)="onFileSelected($event)"
        style="display: none"
        aria-hidden="true"
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
        aria-label="Click or drag files here to upload"
        (keydown.enter)="triggerFileUpload()"
        (keydown.space)="triggerFileUpload()"
        data-cy="upload-area"
      >
        @if (!selectedFile && !isUploading) {
        <div class="upload-content" role="status">
          <ion-icon name="cloud-upload" size="large" class="upload-icon" aria-hidden="true"></ion-icon>
          <h2 class="visually-accessible">Upload Your Document</h2>
          <p>Tap here or drag a file to upload</p>
          <div class="file-types" role="list" aria-label="Accepted file types">
            <ion-chip role="listitem">
              <ion-icon name="document" aria-hidden="true" size="small"></ion-icon>
              <ion-label>PDF</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-icon name="document" aria-hidden="true" size="small"></ion-icon>
              <ion-label>DOC</ion-label>
            </ion-chip>
            <ion-chip>
              <ion-icon name="document" aria-hidden="true" size="small"></ion-icon>
              <ion-label>TXT</ion-label>
            </ion-chip>
          </div>
          <div class="help-text">
            <ion-icon name="information-circle-outline" color="medium"></ion-icon>
            <span>Maximum file size: 5MB</span>
          </div>
        </div>
        } @if (selectedFile && !isUploading && !uploadComplete) {
        <div class="upload-content">
          <ion-icon name="document" class="file-icon"></ion-icon>
          <h3>{{ selectedFile.name }}</h3>
          <p class="file-info">
            <ion-icon name="information-circle"></ion-icon>
            {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
          </p>
          <ion-button (click)="startUpload()" expand="block" class="start-upload">
            <ion-icon name="cloud-upload"></ion-icon>
            Start Upload
          </ion-button>
          <ion-button (click)="clearFile($event)" fill="clear" color="medium"> Choose Different File </ion-button>
        </div>
        } @if (isUploading) {
        <div class="upload-content uploading" role="status" aria-live="polite">
          <ion-progress-bar
            [value]="uploadProgress"
            aria-label="Upload progress"
            [attr.aria-valuenow]="uploadProgress * 100"
            aria-valuemin="0"
            aria-valuemax="100"
          ></ion-progress-bar>
          <h3>Uploading... {{ (uploadProgress * 100).toFixed(0) }}%</h3>
          <p class="status-message">
            <ion-icon name="time"></ion-icon>
            Please keep this window open
          </p>
        </div>
        } @if (uploadComplete) {
        <div class="upload-content success" role="status" aria-live="polite">
          <div class="success-animation" aria-hidden="true">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
          </div>
          <h3>Upload Complete!</h3>
          <p class="status-message">
            <ion-icon name="checkmark"></ion-icon>
            Your document has been uploaded successfully
          </p>
          <ion-button (click)="clearFile($event)" fill="clear"> Upload Another File </ion-button>
        </div>
        } @if (errorMessage) {
        <div class="upload-content error" role="alert" aria-live="assertive">
          <ion-icon name="alert-circle" color="danger" aria-hidden="true"></ion-icon>
          <h3>Upload Failed</h3>
          <p class="error-message">
            <ion-icon name="warning"></ion-icon>
            {{ errorMessage }}
          </p>
          <div class="error-actions">
            <ion-button (click)="retryUpload()" color="primary"> Try Again </ion-button>
            <ion-button (click)="clearFile($event)" fill="clear" color="medium"> Choose Different File </ion-button>
          </div>
        </div>
        }
      </div>

      <!-- Help tooltip -->
      @if (needsHelp) {
      <div class="help-tooltip">
        <ion-icon name="help-circle-outline"></ion-icon>
        <span>Need help? Click for upload instructions</span>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .upload-container {
        padding: 8px;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
      }

      .upload-area {
        border: 2px dashed var(--ion-color-medium);
        border-radius: 12px;
        min-height: 200px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        background: rgba(var(--ion-color-light-rgb), 0.05);

        &:active {
          background: rgba(var(--ion-color-primary-rgb), 0.05);
        }
      }

      .upload-content {
        text-align: center;
        padding: 16px;
        width: 100%;

        ion-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        h2 {
          font-size: 1.2rem;
          margin: 0 0 8px;
        }

        h3 {
          font-size: 1rem;
          margin: 0 0 8px;
        }

        p {
          margin: 4px 0;
          font-size: 0.9rem;
        }
      }

      .file-types {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin: 12px 0;

        ion-chip {
          height: 32px;
          font-size: 12px;
        }
      }

      .size-limit {
        font-size: 0.9rem;
        opacity: 0.7;
      }

      ion-progress-bar {
        margin: 12px 0;
        height: 4px;
        border-radius: 2px;
      }

      @media (min-width: 768px) {
        .upload-container {
          padding: 16px;
          max-width: 600px;
        }

        .upload-area {
          min-height: 300px;
        }

        .upload-content {
          padding: 24px;

          ion-icon {
            font-size: 3rem;
          }

          h2 {
            font-size: 1.5rem;
          }
        }
      }

      .help-text {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-medium);
        font-size: 12px;
        margin-top: 8px;

        ion-icon {
          font-size: 16px;
        }
      }

      .status-message {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 8px 0;

        ion-icon {
          font-size: 16px;
        }
      }

      .success-animation {
        animation: scaleIn 0.3s ease-out;

        ion-icon {
          font-size: 48px;
        }
      }

      .error-message {
        color: var(--ion-color-danger);
        font-weight: 500;
      }

      .error-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }

      .help-tooltip {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        padding: 8px;
        background: rgba(var(--ion-color-light-rgb), 0.1);
        border-radius: 8px;
        font-size: 12px;
        color: var(--ion-color-medium);
        cursor: pointer;

        &:active {
          background: rgba(var(--ion-color-light-rgb), 0.2);
        }
      }

      @keyframes scaleIn {
        from {
          transform: scale(0.5);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      // Accessibility-focused styles
      .visually-accessible {
        font-size: var(--accessible-font-size, 1.2rem);
        font-weight: 500;
        color: var(--accessible-text-color, var(--ion-color-light));
        margin-bottom: 1rem;
      }

      // High contrast mode styles
      @media (prefers-contrast: more) {
        .upload-area {
          border: 3px solid var(--ion-color-dark);
          background: var(--ion-color-light);
        }

        .upload-content {
          color: var(--ion-color-dark);
        }

        ion-progress-bar {
          --progress-background: var(--ion-color-dark);
          height: 8px;
        }

        .error-message {
          color: var(--ion-color-danger-shade);
          font-weight: bold;
        }
      }

      // Reduced motion preferences
      @media (prefers-reduced-motion: reduce) {
        .success-animation {
          animation: none;
        }

        * {
          transition: none !important;
        }
      }

      // Focus indicators
      .upload-area:focus {
        outline: 3px solid var(--ion-color-primary);
        outline-offset: 2px;
      }

      // Large text support
      @media (prefers-reduced-motion: no-preference) {
        :root {
          --accessible-font-size: 1.4rem;
        }
      }

      // Screen reader only text
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
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
  private dataSaverService = inject(DataSaverService);
  private alertController = inject(AlertController);

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
  needsHelp = false;

  constructor() {
    addIcons({
      cloudUploadOutline,
      documentOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      cloudUpload,
      lockClosedOutline,
      serverOutline,
      timeOutline,
      arrowForwardOutline,
      helpCircleOutline,
    });
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

  private async handleFileSelection(file: File) {
    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    // If it's an image and data saver is enabled, optimize it
    if (file.type.startsWith('image/') && this.dataSaverService.isEnabled()) {
      try {
        const optimizedFile = await this.optimizeImage(file);
        this.selectedFile = optimizedFile;
        this.onFileSelected({ target: { files: [optimizedFile] } } as unknown as Event);
      } catch (error) {
        console.error('Image optimization failed:', error);
        // Fallback to original file
        this.selectedFile = file;
        this.onFileSelected({ target: { files: [file] } } as unknown as Event);
      }
    } else {
      this.selectedFile = file;
      this.onFileSelected({ target: { files: [file] } } as unknown as Event);
    }
  }

  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const quality = this.dataSaverService.getImageQuality() / 100;
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not create blob'));
                return;
              }
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            file.type,
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  startUpload() {
    if (this.selectedFile) {
      this.uploadFile(this.selectedFile);
    }
  }

  async uploadFile(file: File) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.errorMessage = 'Please sign in to upload files';
      this.validationError.emit(this.errorMessage);
      return;
    }

    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    try {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = '';

      const filePath = `${this.path}/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
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
            });

            // Create analysis document
            const analysisRef = collection(this.firestore, `users/${user.uid}/analyses`);
            await addDoc(analysisRef, {
              userId: user.uid,
              fileName: file.name,
              fileUrl: this.downloadUrl,
              status: 'uploaded',
              createdAt: Timestamp.now(),
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

  async showUploadHelp() {
    const alert = await this.alertController.create({
      header: 'How to Upload Files',
      message: `
        1. Tap the upload area or drag a file
        2. Select a document (PDF, DOC, or TXT)
        3. Confirm your selection
        4. Wait for upload to complete

        Note: Files must be under 5MB
      `,
      buttons: ['Got it!'],
    });

    await alert.present();
  }

  retryUpload() {
    if (this.selectedFile) {
      this.errorMessage = '';
      this.uploadFile(this.selectedFile);
    }
  }
}
