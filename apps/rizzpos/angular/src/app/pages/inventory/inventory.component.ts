import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ProductService, ErrorHandlerService } from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable } from 'rxjs';
import { Product } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class InventoryComponent implements OnInit {
  businessId: string;
  products$: Observable<Product[]>;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products$ = this.productService.getProducts(this.businessId);
  }

  updateStock(product: Product, newStock: number) {
    this.productService
      .updateProductStock(this.businessId, product.id, newStock)
      .subscribe(
        () => {
          this.errorHandler.showSuccess('Stock updated successfully');
          this.loadProducts(); // Reload products to reflect the change
        },
        (error) => {
          this.errorHandler.handleError(error, 'Error updating stock');
        }
      );
  }
}
