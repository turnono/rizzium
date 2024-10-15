import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
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
  products$: Observable<Product[]> = new Observable<Product[]>(); // Initialize here
  private pageSize = 20;
  private lastVisible$ = new BehaviorSubject<Product | null>(null);
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
    this.products$ = this.lastVisible$.pipe(
      switchMap((lastVisible) =>
        this.productService.getProducts(
          this.businessId,
          this.pageSize,
          lastVisible
        )
      )
    );
  }

  loadMore() {
    this.products$.pipe(take(1)).subscribe((products) => {
      if (products.length > 0) {
        this.lastVisible$.next(products[products.length - 1]);
      }
    });
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
      .updateProduct(product.id as string, { stockQuantity: newQuantity })
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
