import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { ProAuthService, ProProfile, ProMealPlan, ProStats } from '../util/pro-auth.service';

@Component({
  selector: 'app-pro-dashboard',
  templateUrl: './pro-dashboard.page.html',
  styleUrls: ['./pro-dashboard.page.scss'],
})
export class ProDashboardPage implements OnInit {
  pro: ProProfile | null = null;
  plans: ProMealPlan[] = [];
  stats: ProStats = { meal_plan_count: 0, invite_count: 0, conversion_count: 0, active_count: 0 };
  loading = true;
  activeTab: 'plans' | 'profile' | 'referrals' = 'plans';

  editMode = false;
  editName = '';
  editTitle = '';
  editBio = '';
  editWebsite = '';
  editCerts = '';
  saving = false;

  showNewPlan = false;
  newPlanName = '';
  newPlanDesc = '';
  creatingPlan = false;

  constructor(
    private proAuth: ProAuthService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  async ngOnInit() {
    const session = await this.proAuth.restoreSession();
    if (!session) {
      this.navCtrl.navigateRoot('/pro-login');
      return;
    }
    this.pro = session.professional;
    await this.loadData();
    this.loading = false;
  }

  private async loadData() {
    if (!this.pro) return;
    try {
      const [profile, plans] = await Promise.all([
        this.proAuth.getProfile(),
        this.proAuth.getMealPlans(this.pro.id),
      ]);
      this.pro = profile;
      this.stats = profile.stats ?? this.stats;
      this.plans = plans;
    } catch {}
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  startEdit() {
    if (!this.pro) return;
    this.editName = this.pro.name;
    this.editTitle = this.pro.title ?? '';
    this.editBio = this.pro.bio ?? '';
    this.editWebsite = this.pro.website ?? '';
    this.editCerts = (this.pro.certifications ?? []).join(', ');
    this.editMode = true;
  }

  async saveProfile() {
    if (!this.editName.trim()) {
      await this.toast('Name is required', 'warning');
      return;
    }
    this.saving = true;
    try {
      this.pro = await this.proAuth.updateProfile({
        name: this.editName.trim(),
        title: this.editTitle.trim() || undefined,
        bio: this.editBio.trim() || undefined,
        website: this.editWebsite.trim() || undefined,
        certifications: this.editCerts.split(',').map(s => s.trim()).filter(Boolean),
      } as any);
      this.editMode = false;
      await this.toast('Profile saved!', 'success');
    } catch (e: any) {
      await this.toast(e.message ?? 'Save failed', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async createPlan() {
    if (!this.newPlanName.trim() || !this.pro) return;
    this.creatingPlan = true;
    try {
      const plan = await this.proAuth.createMealPlan(this.pro.id, this.newPlanName.trim(), this.newPlanDesc.trim() || undefined);
      this.plans.unshift(plan);
      this.stats.meal_plan_count++;
      this.showNewPlan = false;
      this.newPlanName = '';
      this.newPlanDesc = '';
      await this.toast('Meal plan created!', 'success');
    } catch (e: any) {
      await this.toast(e.message ?? 'Failed to create plan', 'danger');
    } finally {
      this.creatingPlan = false;
    }
  }

  async toggleVisibility(plan: ProMealPlan) {
    const next = !plan.is_public;
    try {
      await this.proAuth.toggleMealPlanVisibility(plan.id, next);
      plan.is_public = next;
      await this.toast(next ? 'Plan is now public' : 'Plan set to private', 'success');
    } catch {
      await this.toast('Failed to update visibility', 'danger');
    }
  }

  async deletePlan(plan: ProMealPlan) {
    const a = await this.alertCtrl.create({
      header: 'Delete plan?',
      message: `"${plan.name}" will be permanently deleted.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.proAuth.deleteMealPlan(plan.id);
            this.plans = this.plans.filter(p => p.id !== plan.id);
            this.stats.meal_plan_count = Math.max(0, this.stats.meal_plan_count - 1);
          },
        },
      ],
    });
    await a.present();
  }

  async shareProfile() {
    if (!this.pro) return;
    const url = this.proAuth.buildShareUrl(this.pro.slug);
    try {
      await navigator.clipboard.writeText(url);
      await this.toast('Profile link copied!', 'success');
    } catch {}
  }

  async sharePlan(plan: ProMealPlan) {
    if (!this.pro) return;
    const url = this.proAuth.buildShareUrl(this.pro.slug, plan.id);
    try {
      await navigator.clipboard.writeText(url);
      await this.toast('Plan link copied!', 'success');
    } catch {}
  }

  async logout() {
    const a = await this.alertCtrl.create({
      header: 'Sign out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Sign Out',
          handler: async () => {
            await this.proAuth.logout();
            this.navCtrl.navigateRoot('/signin');
          },
        },
      ],
    });
    await a.present();
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom', color });
    await t.present();
  }
}
