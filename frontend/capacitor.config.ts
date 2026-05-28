import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsinitlabs.whatsinit',
  appName: 'Whats In It',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Whats In It'
  }
};

export default config;
