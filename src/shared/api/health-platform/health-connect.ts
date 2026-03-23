import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  insertRecords,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect';
import type { IHealthPlatform } from './index';
import type { BPRecord } from '../bp-repository';
import { generateUUID } from '../../lib';

const PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'write', recordType: 'BloodPressure' }
];

export class HealthConnectService implements IHealthPlatform {
  private isInitialized = false;

  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) return true;
    try {
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        await initialize();
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const status = await getSdkStatus();
      return status === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    const initialized = await this.ensureInitialized();
    if (!initialized) return false;

    try {
      const granted = await requestPermission(PERMISSIONS);
      return granted.length > 0;
    } catch {
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    const initialized = await this.ensureInitialized();
    if (!initialized) return false;

    try {
      const granted = await getGrantedPermissions();
      const hasRead = granted.some(p => p.accessType === 'read' && p.recordType === 'BloodPressure');
      const hasWrite = granted.some(p => p.accessType === 'write' && p.recordType === 'BloodPressure');
      return hasRead && hasWrite;
    } catch {
      return false;
    }
  }

  async saveBloodPressure(record: BPRecord): Promise<string | null> {
    const initialized = await this.ensureInitialized();
    if (!initialized) return null;

    try {
      const p = await this.hasPermissions();
      if (!p) return null;

      const results = await insertRecords([{
        recordType: 'BloodPressure',
        systolic: { value: record.systolic, unit: 'millimetersOfMercury' },
        diastolic: { value: record.diastolic, unit: 'millimetersOfMercury' },
        time: new Date(record.timestamp).toISOString(),
        // Defaults per HealthConnect guidelines
        bodyPosition: 1, // 1 = SITTING
        measurementLocation: 1, // 1 = LEFT_ARM
      }]);
      
      return results && results.length > 0 ? results[0] : null;
    } catch (e) {
      if (__DEV__) console.warn('saveBloodPressure error:', e);
      return null;
    }
  }

  async getBloodPressureRecords(startDate: Date, endDate: Date): Promise<BPRecord[]> {
    const initialized = await this.ensureInitialized();
    if (!initialized) return [];

    try {
      const p = await this.hasPermissions();
      if (!p) return [];

      const result = await readRecords('BloodPressure', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      return result.records.map((sample: any) => {
        const dt = sample.time ? new Date(sample.time) : new Date();
        return {
          id: sample.metadata?.id || generateUUID(),
          systolic: sample.systolic?.inMillimetersOfMercury || 0,
          diastolic: sample.diastolic?.inMillimetersOfMercury || 0,
          pulse: null,
          timestamp: dt.getTime(),
          timezoneOffset: dt.getTimezoneOffset(),
          location: 'left_arm',
          posture: 'sitting',
          notes: 'Imported from Health Connect',
          weight: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSynced: true,
        } as BPRecord;
      }).filter(r => r.systolic > 0 && r.diastolic > 0);
    } catch (e) {
      if (__DEV__) console.warn('getBloodPressureRecords error:', e);
      return [];
    }
  }
}
