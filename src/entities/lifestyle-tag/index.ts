import type { LifestyleTag } from '../../shared/types/lifestyle-tag';
export type { LifestyleTag } from '../../shared/types/lifestyle-tag';
export { computeTagCorrelations } from './lib/compute-correlations';
export type { TagCorrelation } from './lib/compute-correlations';

export interface LifestyleTagMeta {
  key: LifestyleTag;
  icon: string;
  labelKey: string; // i18n key: common:tags.<key>
}

export const LIFESTYLE_TAGS: LifestyleTagMeta[] = [
  { key: 'salt',       icon: 'fast-food-outline',  labelKey: 'tags.salt' },
  { key: 'stress',     icon: 'flash-outline',       labelKey: 'tags.stress' },
  { key: 'alcohol',    icon: 'wine-outline',         labelKey: 'tags.alcohol' },
  { key: 'exercise',   icon: 'barbell-outline',      labelKey: 'tags.exercise' },
  { key: 'medication', icon: 'medkit-outline',       labelKey: 'tags.medication' },
  { key: 'caffeine',   icon: 'cafe-outline',          labelKey: 'tags.caffeine' },
  { key: 'poor_sleep', icon: 'moon-outline',          labelKey: 'tags.poorSleep' },
];
