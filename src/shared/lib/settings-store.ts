import { create } from 'zustand';
import type { BPUnit, BPGuideline } from '../config/settings';
import { BP_UNITS, BP_GUIDELINES } from '../config/settings';

interface SettingsState {
  unit: BPUnit;
  guideline: BPGuideline;
  setUnit: (unit: BPUnit) => void;
  setGuideline: (guideline: BPGuideline) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  unit: BP_UNITS.MMHG,
  guideline: BP_GUIDELINES.AHA_ACC,
  setUnit: (unit) => set({ unit }),
  setGuideline: (guideline) => set({ guideline }),
}));
