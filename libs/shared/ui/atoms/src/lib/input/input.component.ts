import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rizzium-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      [type]="type"
      [placeholder]="placeholder"
      [(ngModel)]="value"
      (ngModelChange)="onValueChange($event)"
    />
  `,
  styles: [
    `
      input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
      }
    `,
  ],
})
export class InputComponent {
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onValueChange(newValue: string) {
    this.valueChange.emit(newValue);
  }
}
