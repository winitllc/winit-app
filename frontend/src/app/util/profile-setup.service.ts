import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

const STORAGE_KEY = 'profileSetupDismissed';

@Injectable({ providedIn: 'root' })
export class ProfileSetupService {
  constructor(private storage: Storage) {}

  async shouldShow(): Promise<boolean> {
    const dismissed = await this.storage.get(STORAGE_KEY);
    return !dismissed;
  }

  async markDismissed(): Promise<void> {
    await this.storage.set(STORAGE_KEY, true);
  }

  reset(): Promise<void> {
    return this.storage.remove(STORAGE_KEY);
  }
}
