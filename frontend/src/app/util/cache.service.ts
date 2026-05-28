import { Injectable } from '@angular/core';
import { KeysResult, Preferences } from '@capacitor/preferences';
import { AppConfig } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() {}

  public async clearCache(): Promise<void> {
    try {
      const storageKeys: string[] = (await Preferences.keys() as KeysResult).keys;
      for (const key of storageKeys) {
        await Preferences.remove({key});
      }
    } catch (error) {
      console.error(`CacheService.deleteItem: [ERROR] Error deleting all keys from local storage: ${JSON.stringify(error)}`);
    }
  }

  public async putItem(key: string, item: any): Promise<void> {
    try {
      const versionedKey = `${AppConfig.cache.prefix}:${key}`;
      console.log(`CacheService.putItem: [DEBUG] versioned key to store under: ${versionedKey}`);
      console.log(`CacheService.putItem: [DEBUG] item to put: ${JSON.stringify(item)}`);
      await Preferences.set({key: versionedKey, value: item});
      console.log(`CacheService.putItem: [DEBUG] finished setting item`);
    } catch (error) {
      console.error(`CacheService.putItem: [ERROR] Error setting the ${key} to be ${JSON.stringify(item)} in local storage: ${JSON.stringify(error)}`);
    }
  }

  public async getItem(key: string): Promise<any> {
    try {
      const versionedKey = `${AppConfig.cache.prefix}:${key}`;
      console.log(`CacheService.getItem: [DEBUG] versioned key to check the cache for: ${versionedKey}`);
      const storageKeys: any[] = (await Preferences.keys() as KeysResult).keys;
      console.log(`CacheService.getItem: [DEBUG] keys found in storage: ${JSON.stringify(storageKeys)}`);
      if (storageKeys.indexOf(versionedKey) > -1) {
        console.log(`CacheService.getItem: [DEBUG] found the key in the list`);
        const item = await Preferences.get({key: versionedKey});
        console.log(`CacheService.getItem: [DEBUG] item found in cache: ${JSON.stringify(item)}`);
        return item;
      } else {
        console.log(`CacheService.getItem: [DEBUG] did not find the key`);
        return null;
      }
    } catch (error) {
      console.error(`CacheService.getItem: [ERROR] Error getting the ${key} from local storage: ${JSON.stringify(error)}`);
      return null;
    }
  }
}
