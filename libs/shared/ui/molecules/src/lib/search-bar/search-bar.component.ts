import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent, ButtonComponent } from '../../../../atoms/src';

@Component({
  selector: 'rizzium-search-bar',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent],
  template: `
    <div class="search-bar">
      <rizzium-input
        [placeholder]="'Search...'"
        (valueChange)="onInputChange($event)"
      ></rizzium-input>
      <rizzium-button (clicked)="onSearch()">Search</rizzium-button>
    </div>
  `,
  styles: [
    `
      .search-bar {
        display: flex;
        gap: 8px;
      }
    `,
  ],
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>();
  private searchTerm = '';

  onInputChange(value: string) {
    this.searchTerm = value;
  }

  onSearch() {
    this.search.emit(this.searchTerm);
  }
}
