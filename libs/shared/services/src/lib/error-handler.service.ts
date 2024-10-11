import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private toastController: ToastController) {}

  async handleError(error: any, customMessage: string) {
    console.error('Error:', error);

    let errorMessage = customMessage;
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    const toast = await this.toastController.create({
      message: errorMessage,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    toast.present();
  }
}
