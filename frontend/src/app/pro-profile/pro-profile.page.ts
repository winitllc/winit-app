import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { ProAuthService, ProProfile, ProMealPlan } from '../util/pro-auth.service';

@Component({
  selector: 'app-pro-profile',
  templateUrl: './pro-profile.page.html',
  styleUrls: ['./pro-profile.page.scss'],
})
export class ProProfilePage implements OnInit {
  pro: (ProProfile & { meal_plans: ProMealPlan[] }) | null = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private proAuth: ProAuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
  ) {}

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')
      ?? this.route.parent?.snapshot.paramMap.get('slug')
      ?? '';
    try {
      this.pro = await this.proAuth.getPublicProfile(slug);
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  async copyProfileUrl() {
    if (!this.pro) return;
    const url = `https://winit.com/pro/${this.pro.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      const toast = await this.toastCtrl.create({
        message: 'Profile link copied!',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch {}
  }

  goBack() { this.navCtrl.back(); }

  downloadApp() {
    window.open('https://winit.com/download', '_blank');
  }
}
