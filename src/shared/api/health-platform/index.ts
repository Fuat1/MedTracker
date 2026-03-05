import { Platform } from 'react-native';
import { AppleHealthService } from './apple-health';
import { HealthConnectService } from './health-connect';
import type { BPRecord } from '../bp-repository';

export interface IHealthPlatform {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  hasPermissions(): Promise<boolean>;
  saveBloodPressure(record: BPRecord): Promise<string | null>;
  getBloodPressureRecords(startDate: Date, endDate: Date): Promise<BPRecord[]>;
}

class FallbackHealthService implements IHealthPlatform {
  async isAvailable() { return false; }
  async requestPermissions() { return false; }
  async hasPermissions() { return false; }
  async saveBloodPressure() { return null; }
  async getBloodPressureRecords() { return []; }
}

export const healthPlatform: IHealthPlatform = Platform.select({
  ios: new AppleHealthService(),
  android: new HealthConnectService(),
  default: new FallbackHealthService(),
});
