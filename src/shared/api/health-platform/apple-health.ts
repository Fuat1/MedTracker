import AppleHealthKit, { HealthValue, HealthInputOptions, HealthKitPermissions } from 'react-native-health';
import type { IHealthPlatform } from './index';
import type { BPRecord } from '../bp-repository';
import { generateUUID } from '../../lib';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.BloodPressureSystolic, AppleHealthKit.Constants.Permissions.BloodPressureDiastolic],
    write: [AppleHealthKit.Constants.Permissions.BloodPressureSystolic, AppleHealthKit.Constants.Permissions.BloodPressureDiastolic],
  },
};

export class AppleHealthService implements IHealthPlatform {
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err: Object, available: boolean) => {
        if (err) resolve(false);
        resolve(available);
      });
    });
  }

  async requestPermissions(): Promise<boolean> {
    const available = await this.isAvailable();
    if (!available) return false;

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  async hasPermissions(): Promise<boolean> {
    // Apple HealthKit silently denies read queries if unauthorized, but init acts as request.
    return true; 
  }

  async saveBloodPressure(record: BPRecord): Promise<string | null> {
    return new Promise((resolve) => {
      const options = {
        value: record.systolic,
        value2: record.diastolic,
        date: new Date(record.timestamp).toISOString(),
      };
      
      AppleHealthKit.saveBloodPressure(options, (err: string, res: HealthValue) => {
        if (err) resolve(null);
        resolve(res ? res.id || 'apple_health_id' : null);
      });
    });
  }

  async getBloodPressureRecords(startDate: Date, endDate: Date): Promise<BPRecord[]> {
    return new Promise((resolve) => {
      const options: HealthInputOptions = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getBloodPressureSamples(options, (err: Object, results: any[]) => {
        if (err || !results) {
          resolve([]);
          return;
        }

        const records = results.map(sample => {
          const dt = sample.startDate ? new Date(sample.startDate) : new Date();
          return {
            id: sample.id || generateUUID(),
            systolic: sample.bloodPressureSystolicValue || sample.value || 0,
            diastolic: sample.bloodPressureDiastolicValue || sample.value2 || 0,
            pulse: null,
            timestamp: dt.getTime(),
            timezoneOffset: dt.getTimezoneOffset(),
            location: 'left_arm',
            posture: 'sitting',
            notes: 'Imported from Apple Health',
            weight: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSynced: true,
          } as BPRecord;
        });
        
        // Filter out malformed results
        resolve(records.filter(r => r.systolic > 0 && r.diastolic > 0));
      });
    });
  }
}
