import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductService, Product } from '@rizzpos/shared/services';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
  ],
})
export class ProductManagementComponent implements OnInit {
  products$: Observable<Product[]>;
  businessId: string;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.products$ = this.productService.getProducts(this.businessId);
  }

  ngOnInit() {
    // You can add initialization logic here if needed
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    this.productService.addProduct(product);
  }

  updateProduct(id: string, product: Partial<Product>) {
    this.productService.updateProduct(id, product);
  }

  deleteProduct(id: string | undefined) {
    if (id) {
      this.productService.deleteProduct(id);
    }
  }

  openAddProductModal() {
    // Implement this method to open a modal for adding a new product
    console.log('Open add product modal');
  }

  editProduct(product: Product) {
    // Implement this method to edit a product
    console.log('Edit product', product);
  }
}
