import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WinitAuthService } from '../util/winit-auth.service';
import { ProfileSetupService } from '../util/profile-setup.service';
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
    private setupService: ProfileSetupService,
  ) {}

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

    const { data } = await modal.onDidDismiss();

    // Persist selections to WINIT Supabase user profile
    if (data && !data.skipped && (data.allergies?.length || data.diets?.length || data.conditions?.length)) {
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
