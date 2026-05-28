import { InputCustomEvent, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Barcode, BarcodeFormat, BarcodeScanner, LensFacing, PluginListenerHandle, StartScanOptions } from '@capacitor-mlkit/barcode-scanning';

@Component({
  templateUrl: 'barcode-scanningModal.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
  ],
  selector: 'barcode-scanning',
  styleUrls: ['barcode-scanningModal.page.scss']
})
export class BarcodeScanningModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public formats: BarcodeFormat[] = [];

  @Input()
  public lensFacing: LensFacing = LensFacing.Back;

  @ViewChild('square')
  public squareElement: ElementRef<HTMLDivElement> | undefined;

  public isTorchAvailable = false;
  public minZoomRatio: number | undefined;
  public maxZoomRatio: number | undefined;
  private barcodeScanListener: PluginListenerHandle | undefined;

  constructor(
    private modalCtrl: ModalController,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    console.log(`BarcodeScanningModalComponent.constructor: ngOnInit`);
  }

  public ngAfterViewInit(): void {
    console.log(`BarcodeScanningModalComponent.ngAfterViewInit: after view init`);
    setTimeout(() => {
      this.startScan();
    }, 500);
  }

  public ngOnDestroy(): void {
    this.stopScan();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  closeModal(barcode?: Barcode) {
    return this.modalCtrl.dismiss(barcode, 'confirm');
  }

  private async startScan(): Promise<void> {
    console.log(`BarcodeScanningModalComponent.startScan: start scan`);
    try {
      // Hide everything behind the modal (see `src/theme/variables.scss`)
      document.querySelector('body')?.classList.add('barcode-scanning-active');
      
      const permissionsResponse = await BarcodeScanner.checkPermissions();
      console.log(`BarcodeScanningModalComponent.startScan: response from permissions check permissions: ${JSON.stringify(permissionsResponse)}`);
  
      const options: StartScanOptions = {
        formats: this.formats,
        lensFacing: this.lensFacing,
      };
  
      const squareElementBoundingClientRect = this.squareElement?.nativeElement.getBoundingClientRect();
      const scaledRect = squareElementBoundingClientRect
        ? {
            left: squareElementBoundingClientRect.left * window.devicePixelRatio,
            right:
              squareElementBoundingClientRect.right * window.devicePixelRatio,
            top: squareElementBoundingClientRect.top * window.devicePixelRatio,
            bottom:
              squareElementBoundingClientRect.bottom * window.devicePixelRatio,
            width:
              squareElementBoundingClientRect.width * window.devicePixelRatio,
            height:
              squareElementBoundingClientRect.height * window.devicePixelRatio,
          }
        : undefined;
      console.log(`BarcodeScanningModalComponent.startScan: scaled rect: ${JSON.stringify(scaledRect)}`);
  
      const detectionCornerPoints = scaledRect
        ? [
            [scaledRect.left, scaledRect.top],
            [scaledRect.left + scaledRect.width, scaledRect.top],
            [
              scaledRect.left + scaledRect.width,
              scaledRect.top + scaledRect.height,
            ],
            [scaledRect.left, scaledRect.top + scaledRect.height],
          ]
        : undefined;
      console.log(`BarcodeScanningModalComponent.startScan: detection corner points: ${JSON.stringify(detectionCornerPoints)}`);
  
      this.barcodeScanListener = await BarcodeScanner.addListener('barcodeScanned', async (event) => {
        console.log(`BarcodeScanningModalComponent.startScan: in the scan listener; a barcode was scanned!`);
        this.ngZone.run(() => {
          const cornerPoints = event.barcode.cornerPoints;
          if (detectionCornerPoints && cornerPoints) {
            if (
              detectionCornerPoints[0][0] > cornerPoints[0][0] ||
              detectionCornerPoints[0][1] > cornerPoints[0][1] ||
              detectionCornerPoints[1][0] < cornerPoints[1][0] ||
              detectionCornerPoints[1][1] > cornerPoints[1][1] ||
              detectionCornerPoints[2][0] < cornerPoints[2][0] ||
              detectionCornerPoints[2][1] < cornerPoints[2][1] ||
              detectionCornerPoints[3][0] > cornerPoints[3][0] ||
              detectionCornerPoints[3][1] < cornerPoints[3][1]
            ) {
              return;
            }
          }
          console.log(`BarcodeScanningModalComponent.startScan: in the scan listener; looks in bounds`);
          this.barcodeScanListener?.remove();
          console.log(`BarcodeScanningModalComponent.startScan: in the scan listener; listener removed, closing modal`);
          this.closeModal(event.barcode);
        });
      });
      console.log(`BarcodeScanningModalComponent.startScan: listener set up`);
      console.log(`BarcodeScanningModalComponent.startScan: listener: ${JSON.stringify(listener)}`);
  
      console.log(`BarcodeScanningModalComponent.startScan: class list for body: ${document.querySelector('body')?.classList}`);
      await BarcodeScanner.startScan(options);
      void BarcodeScanner.getMinZoomRatio().then((result) => {
        this.minZoomRatio = result.zoomRatio;
      });
      void BarcodeScanner.getMaxZoomRatio().then((result) => {
        this.maxZoomRatio = result.zoomRatio;
      });
    } catch (error) {
      console.error(`BarcodeScanningModalComponent.startScan: [ERROR] ${JSON.stringify(error)}`);
    }
  }

  private async stopScan(): Promise<void> {
    // Show everything behind the modal again
    document.querySelector('body')?.classList.remove('barcode-scanning-active');

    await this.barcodeScanListener?.remove();
    this.barcodeScanListener = undefined;
    await BarcodeScanner.stopScan();
  }
}
