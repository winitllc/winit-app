import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../util/auth.service';
import { ProfileSetupService } from '../util/profile-setup.service';
import { ProfileSetupModalComponent } from './profile-setup-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {

  constructor(
    private authService: AuthService,
    private modalCtrl: ModalController,
    private setupService: ProfileSetupService,
  ) {
    this.authService.setup();
  }

  async ngOnInit(): Promise<void> {
    const should = await this.setupService.shouldShow();
    if (should) {
      await this.showSetupModal();
    }
  }

  private async showSetupModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ProfileSetupModalComponent,
      cssClass: 'profile-setup-modal',
      backdropDismiss: false,
      breakpoints: [0, 0.92],
      initialBreakpoint: 0.92,
      handle: false,
    });
    await modal.present();
    await modal.onDidDismiss();
  }
}
