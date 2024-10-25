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

    await this.showToast(errorMessage, 'danger');
  }

  async showSuccess(message: string) {
    await this.showToast(message, 'success');
  }

  async showWarning(message: string) {
    await this.showToast(message, 'warning');
  }

  async showInfo(message: string) {
    await this.showToast(message, 'info');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
    });
    await toast.present();
  }

  handleHttpError(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status === 401) {
      return 'You are not authorized to perform this action. Please log in again.';
    } else if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      return 'The requested resource was not found.';
    } else if (error.status >= 500) {
      return 'A server error occurred. Please try again later.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
