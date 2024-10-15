import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ProductService, ErrorHandlerService } from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
  IonInput,
  IonBadge,
  IonAlert,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonContent,
    IonInput,
    IonBadge,
    IonAlert,
  ],
})
export class InventoryPageComponent implements OnInit {
  businessId: string;
  products$?: Observable<Product[]>;
  bulkUpdateQuantity = 0;
  lowStockThreshold = 10;
  showLowStockAlert = false;
  lowStockProduct: Product | null = null;

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

  updateStock(product: Product, newQuantity: number) {
    if (isNaN(newQuantity)) {
      this.errorHandler.handleError(
        'Invalid quantity',
        'Please enter a valid number'
      );
      return;
    }

    this.productService
      .updateProduct(product.id!, { stockQuantity: newQuantity })
      .then(() => {
        this.errorHandler.showSuccess('Stock updated successfully');
        this.checkLowStock(product, newQuantity);
      })
      .catch((error: unknown) => {
        this.errorHandler.handleError(error, 'Error updating stock');
      });
  }

  bulkUpdateStock() {
    this.products$?.subscribe((products) => {
      products.forEach((product) => {
        const newQuantity = product.stockQuantity + this.bulkUpdateQuantity;
        this.updateStock(product, newQuantity);
      });
    });
  }

  checkLowStock(product: Product, newQuantity: number) {
    if (newQuantity <= this.lowStockThreshold) {
      this.lowStockProduct = product;
      this.showLowStockAlert = true;
    }
  }
}
