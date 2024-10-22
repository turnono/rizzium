import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'rizzium-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [class]="'rizzium-button ' + variant" (click)="onClick()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      .rizzium-button {
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
      }
      .primary {
        background-color: #007bff;
        color: white;
        border: none;
      }
      .secondary {
        background-color: #6c757d;
        color: white;
        border: none;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}
