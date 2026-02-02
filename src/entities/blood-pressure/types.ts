import {BP_CATEGORIES} from '@shared/config';

export type BPCategory = (typeof BP_CATEGORIES)[keyof typeof BP_CATEGORIES];

export type MeasurementLocation = 'left_arm' | 'right_arm' | 'wrist';

export type MeasurementPosture = 'sitting' | 'standing' | 'lying';

export interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  timestamp: number;
  timezoneOffset: number;
  location: MeasurementLocation;
  posture: MeasurementPosture;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
}

export interface BPRecordInput {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp?: number;
  location?: MeasurementLocation;
  posture?: MeasurementPosture;
  notes?: string;
}
