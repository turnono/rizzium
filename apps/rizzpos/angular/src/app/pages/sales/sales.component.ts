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
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    FormsModule,
  ],
})
export class SalesComponent implements OnInit {
  businessId: string = '';
  userRole: string = '';
  products: any[] = [];
  cart: any[] = [];
  total: number = 0;

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
      this.errorHandler.handleError(error, 'Error initializing sales page');
    }
  }

  async loadProducts() {
    try {
      this.products = await this.productService.getProducts(this.businessId);
    } catch (error) {
      this.errorHandler.handleError(error, 'Error loading products');
    }
  }

  addToCart(product: any) {
    const existingItem = this.cart.find((item) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }
    this.updateTotal();
  }

  removeFromCart(product: any) {
    const index = this.cart.findIndex((item) => item.id === product.id);
    if (index !== -1) {
      if (this.cart[index].quantity > 1) {
        this.cart[index].quantity -= 1;
      } else {
        this.cart.splice(index, 1);
      }
      this.updateTotal();
    }
  }

  updateTotal() {
    this.total = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  async processSale() {
    // TODO: Implement actual sale processing
    console.log('Processing sale:', this.cart, 'Total:', this.total);
    // Clear cart after successful sale
    this.cart = [];
    this.total = 0;
  }
}
