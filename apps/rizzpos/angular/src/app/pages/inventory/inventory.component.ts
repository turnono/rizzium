import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import {
  FirebaseAuthService,
  BusinessService,
  ProductService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    FormsModule,
  ],
})
export class InventoryComponent implements OnInit {
  businessId: string = '';
  userRole: string = '';
  products: any[] = []; // Replace 'any' with a proper Product interface
  newProduct: any = { name: '', price: 0, stockQuantity: 0 };

  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService,
    private productService: ProductService,
    private errorHandler: ErrorHandlerService
  ) {}

  async ngOnInit() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.businessId = await this.businessService.getUserBusiness(user.uid);
        this.userRole = await this.businessService.getUserRole(
          this.businessId,
          user.uid
        );
        await this.loadProducts();
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'Error initializing inventory page');
    }
  }

  async loadProducts() {
    try {
      this.products = await this.productService.getProducts(this.businessId);
    } catch (error) {
      this.errorHandler.handleError(error, 'Error loading products');
    }
  }

  async addProduct() {
    try {
      await this.productService.addProduct(this.businessId, this.newProduct);
      this.newProduct = { name: '', price: 0, stockQuantity: 0 };
      await this.loadProducts();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error adding product');
    }
  }

  async updateProduct(product: any) {
    try {
      await this.productService.updateProduct(this.businessId, product);
      await this.loadProducts();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error updating product');
    }
  }

  async deleteProduct(productId: string) {
    try {
      await this.productService.deleteProduct(this.businessId, productId);
      await this.loadProducts();
    } catch (error) {
      this.errorHandler.handleError(error, 'Error deleting product');
    }
  }

  // Implement inventory-related methods here
}
