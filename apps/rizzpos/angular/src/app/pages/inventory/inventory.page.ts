import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ProductService, ErrorHandlerService } from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';
import { IonCardTitle } from '@ionic/angular/standalone';
import { IonCard } from '@ionic/angular/standalone';
import { IonCardHeader } from '@ionic/angular/standalone';
import { IonCardContent } from '@ionic/angular/standalone';
import { IonList } from '@ionic/angular/standalone';
import { IonItem } from '@ionic/angular/standalone';
import { IonLabel } from '@ionic/angular/standalone';
import { IonInput } from '@ionic/angular/standalone';
import { IonButton } from '@ionic/angular/standalone';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonContent,
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
