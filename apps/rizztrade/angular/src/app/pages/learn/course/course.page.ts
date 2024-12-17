import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content>
      <h1>Course Content</h1>
      <!-- Add course content here -->
    </ion-content>
  `,
  styleUrls: ['./course.page.scss'],
})
export class CoursePageComponent {}
