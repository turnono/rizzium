import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@rizzpos/shared/ui/atoms';
import { InputComponent } from '@rizzpos/shared/ui/atoms';

@Component({
  selector: 'rizzpos-search-bar',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent],
  template: `
    <div class="search-bar">
      <rizzpos-input [placeholder]="'Search...'" (valueChange)="onInputChange($event)"></rizzpos-input>
      <rizzpos-button (clicked)="onSearch()">Search</rizzpos-button>
    </div>
  `,
  styles: [`
    .search-bar {
      display: flex;
      gap: 8px;
    }
  `]
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
