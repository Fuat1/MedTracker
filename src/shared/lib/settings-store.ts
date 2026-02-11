import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BPUnit, BPGuideline } from '../config/settings';
import { BP_UNITS, BP_GUIDELINES } from '../config/settings';
import type { MeasurementLocation, MeasurementPosture } from '../config';
import { MEASUREMENT_LOCATIONS, MEASUREMENT_POSTURES } from '../config';
import i18n from './i18n';

export type Language = 'en' | 'id' | 'sr' | 'tr';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  unit: BPUnit;
  guideline: BPGuideline;
  defaultLocation: MeasurementLocation;
  defaultPosture: MeasurementPosture;
  language: Language;
  theme: ThemeMode;
  seniorMode: boolean;
  highContrast: boolean;
  setUnit: (unit: BPUnit) => void;
  setGuideline: (guideline: BPGuideline) => void;
  setDefaultLocation: (location: MeasurementLocation) => void;
  setDefaultPosture: (posture: MeasurementPosture) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  setSeniorMode: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unit: BP_UNITS.MMHG,
      guideline: BP_GUIDELINES.AHA_ACC,
      defaultLocation: MEASUREMENT_LOCATIONS.LEFT_ARM,
      defaultPosture: MEASUREMENT_POSTURES.SITTING,
      language: 'en',
      theme: 'system',
      seniorMode: false,
      highContrast: false,
      setUnit: (unit) => set({ unit }),
      setGuideline: (guideline) => set({ guideline }),
      setDefaultLocation: (location) => set({ defaultLocation: location }),
      setDefaultPosture: (posture) => set({ defaultPosture: posture }),
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },
      setTheme: (theme) => set({ theme }),
      setSeniorMode: (enabled) => set({ seniorMode: enabled }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
    }),
    {
      name: 'medtracker-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
