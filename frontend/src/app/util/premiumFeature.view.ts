import { model } from 'wuzinit-common';

export interface PremiumFeatureView extends model.PremiumFeature {
  isActive: boolean;
}
