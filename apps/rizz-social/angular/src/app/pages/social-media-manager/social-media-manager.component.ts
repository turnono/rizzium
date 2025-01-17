import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TikTokContentService } from '@rizzium/shared/services';
import { TikTokContent } from '@rizzium/shared/interfaces';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-social-media-manager',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  providers: [TikTokContentService],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>TikTok Content Manager</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col size="12" sizeMd="8">
            <!-- Calendar View -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Content Calendar</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  @for (content of contents$ | async; track content.id) {
                  <ion-item>
                    <ion-label>
                      <h2>{{ content.title }}</h2>
                      <p>{{ content.scheduledDate | date }}</p>
                      <ion-chip *ngFor="let tag of content.tags">{{ tag }}</ion-chip>
                    </ion-label>
                    <ion-note slot="end">
                      <ion-icon name="eye"></ion-icon> {{ content.metrics?.views || 0 }}
                      <ion-icon name="heart"></ion-icon> {{ content.metrics?.likes || 0 }}
                    </ion-note>
                    <ion-buttons slot="end">
                      <ion-button (click)="editContent(content)">
                        <ion-icon name="create"></ion-icon>
                      </ion-button>
                      <ion-button (click)="deleteContent(content.id)">
                        <ion-icon name="trash"></ion-icon>
                      </ion-button>
                    </ion-buttons>
                  </ion-item>
                  }
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" sizeMd="4">
            <!-- Content Form -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ isEditing ? 'Edit Content' : 'Add Content' }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <form [formGroup]="contentForm" (ngSubmit)="onSubmit()">
                  <ion-item>
                    <ion-label position="stacked">Title</ion-label>
                    <ion-input formControlName="title" type="text"></ion-input>
                  </ion-item>

                  <ion-item>
                    <ion-label position="stacked">Description</ion-label>
                    <ion-textarea formControlName="description" rows="3"></ion-textarea>
                  </ion-item>

                  <ion-item>
                    <ion-label position="stacked">Scheduled Date</ion-label>
                    <ion-datetime-button datetime="scheduledDate"></ion-datetime-button>
                    <ion-modal [keepContentsMounted]="true">
                      <ng-template>
                        <ion-datetime
                          id="scheduledDate"
                          formControlName="scheduledDate"
                          presentation="date-time"
                        ></ion-datetime>
                      </ng-template>
                    </ion-modal>
                  </ion-item>

                  <ion-item>
                    <ion-label position="stacked">Tags (comma-separated)</ion-label>
                    <ion-input formControlName="tags" type="text"></ion-input>
                  </ion-item>

                  <ion-button expand="block" type="submit" [disabled]="!contentForm.valid">
                    {{ isEditing ? 'Update' : 'Add' }} Content
                  </ion-button>

                  @if (isEditing) {
                  <ion-button expand="block" fill="clear" (click)="cancelEdit()"> Cancel </ion-button>
                  }
                </form>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      ion-chip {
        margin: 4px;
      }
      ion-note {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      ion-icon {
        margin-right: 4px;
      }
    `,
  ],
})
export class SocialMediaManagerComponent {
  private tikTokService: TikTokContentService = inject(TikTokContentService);
  private fb = inject(FormBuilder);

  contents$: Observable<TikTokContent[]>;
  contentForm: FormGroup;
  isEditing = false;
  editingId: string | null = null;

  constructor() {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1);

    this.contents$ = this.tikTokService.getContentCalendar(today, endDate);

    this.contentForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      scheduledDate: [new Date(), Validators.required],
      tags: [''],
    });
  }

  onSubmit() {
    if (this.contentForm.valid) {
      const formValue = this.contentForm.value;
      const content = {
        ...formValue,
        tags: formValue.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
        status: 'scheduled',
      };

      if (this.isEditing && this.editingId) {
        this.tikTokService.updateContent(this.editingId, content).subscribe(() => {
          this.resetForm();
        });
      } else {
        this.tikTokService.addContent(content).subscribe(() => {
          this.resetForm();
        });
      }
    }
  }

  editContent(content: TikTokContent) {
    this.isEditing = true;
    this.editingId = content.id;
    this.contentForm.patchValue({
      title: content.title,
      description: content.description,
      scheduledDate: content.scheduledDate,
      tags: content.tags.join(', '),
    });
  }

  deleteContent(id: string | undefined) {
    if (id) {
      this.tikTokService.deleteContent(id).subscribe();
    }
  }

  cancelEdit() {
    this.resetForm();
  }

  private resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.contentForm.reset({
      scheduledDate: new Date(),
    });
  }
}
