import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WinitAuthService } from '../util/winit-auth.service';
import { ProfileSetupModalComponent } from './profile-setup-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {

  constructor(
    private winitAuth: WinitAuthService,
    private modalCtrl: ModalController,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.winitAuth.getProfile();
      if (profile?.onboarding_completed) return;
    } catch {
      // If we can't fetch profile (not logged in, network error), skip the modal
      return;
    }
    await this.showSetupModal();
  }

  private async showSetupModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ProfileSetupModalComponent,
      cssClass: 'profile-setup-modal',
      backdropDismiss: false,
      handle: false,
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.completed) {
      try {
        await this.winitAuth.updateProfile({
          allergy_ids: data.allergies ?? [],
          diet_ids: data.diets ?? [],
          condition_ids: data.conditions ?? [],
          onboarding_completed: true,
        } as any);
      } catch (e) {
        console.error('TabsPage: failed to save profile setup', e);
      }
    }
  }
}
