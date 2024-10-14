import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ProductService, ErrorHandlerService } from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
  ],
})
export class InventoryPageComponent implements OnInit {
  businessId: string;
  products$?: Observable<Product[]>;

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
      .updateProduct(product.id as string, { stockQuantity: newStock })
      .then(
        () => {
          this.errorHandler.showSuccess('Stock updated successfully');
          this.loadProducts(); // Reload products to reflect the changes
        },
        (error) => {
          this.errorHandler.handleError(error, 'Error updating stock');
        }
      );
  }
}
