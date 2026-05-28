import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  templateUrl: 'scanName-cropperModal.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ImageCropperComponent
  ]
})
export class ScanNameCropperModalPage implements OnInit {
  
  @Input() imageInput: string = '';
  croppedImage: SafeUrl  = '';
  croppedImageBase64: string = '';

  constructor(
    private modalCtrl: ModalController,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    console.log(`ScanNameCropperModalPage.constructor: croppedImage: ${this.croppedImage}`);
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(this.croppedImageBase64, 'confirm');
  }

  imageCropped(event: ImageCroppedEvent) {
    console.log(`ScanNameCropperModalPage.imageCropped: crop event: ${JSON.stringify(event)}`);
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || '');
    this.croppedImageBase64 = event.base64 || '';
  }

  imageLoaded(image: LoadedImage) {
      // show cropper
  }

  cropperReady() {
      // cropper ready
  }

  loadImageFailed() {
      // show message
  }
}
