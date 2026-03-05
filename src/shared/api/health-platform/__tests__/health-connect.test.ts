import { HealthConnectService } from '../health-connect';
import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  insertRecords,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

jest.mock('react-native-health-connect', () => ({
  initialize: jest.fn(),
  requestPermission: jest.fn(() => [{ accessType: 'read', recordType: 'BloodPressure' }]),
  getGrantedPermissions: jest.fn(() => [
    { accessType: 'read', recordType: 'BloodPressure' },
    { accessType: 'write', recordType: 'BloodPressure' }
  ]),
  insertRecords: jest.fn(() => ['test-id']),
  readRecords: jest.fn(),
  getSdkStatus: jest.fn(() => 1 /* SdkAvailabilityStatus.SDK_AVAILABLE */),
  SdkAvailabilityStatus: { SDK_AVAILABLE: 1 },
}));

jest.mock('../../../lib', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

describe('HealthConnectService', () => {
  let service: HealthConnectService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthConnectService();
  });

  describe('isAvailable', () => {
    it('returns true when Health Connect SDK is available', async () => {
      const available = await service.isAvailable();
      expect(available).toBe(true);
      expect(getSdkStatus).toHaveBeenCalled();
    });
  });

  describe('requestPermissions', () => {
    it('requests read and write permissions and returns true', async () => {
      const granted = await service.requestPermissions();
      expect(granted).toBe(true);
      expect(initialize).toHaveBeenCalled();
      expect(requestPermission).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ accessType: 'read', recordType: 'BloodPressure' }),
        expect.objectContaining({ accessType: 'write', recordType: 'BloodPressure' })
      ]));
    });
  });

  describe('hasPermissions', () => {
    it('checks for granted read/write permissions', async () => {
      const has = await service.hasPermissions();
      expect(has).toBe(true);
      expect(getGrantedPermissions).toHaveBeenCalled();
    });
  });

  describe('saveBloodPressure', () => {
    it('inserts a record correctly', async () => {
      const mockRecord = {
        id: '1',
        systolic: 125,
        diastolic: 85,
        pulse: null,
        timestamp: Date.now(),
        timezoneOffset: 0,
        location: 'left_arm',
        posture: 'sitting',
        notes: null,
        weight: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSynced: false,
      } as any;

      const id = await service.saveBloodPressure(mockRecord);
      expect(id).toBe('test-id');
      expect(insertRecords).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          recordType: 'BloodPressure',
          systolic: { value: 125, unit: 'millimetersOfMercury' },
          diastolic: { value: 85, unit: 'millimetersOfMercury' }
        })
      ]));
    });
  });

  describe('getBloodPressureRecords', () => {
    it('maps Health Connect results to BPRecord domain objects', async () => {
      (readRecords as jest.Mock).mockResolvedValueOnce({
        records: [
          {
            metadata: { id: 'hc-id-1' },
            systolic: { inMillimetersOfMercury: 122 },
            diastolic: { inMillimetersOfMercury: 82 },
            time: new Date('2024-01-01T12:00:00Z').toISOString()
          }
        ]
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-02T00:00:00Z');
      const records = await service.getBloodPressureRecords(startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(expect.objectContaining({
        id: 'hc-id-1',
        systolic: 122,
        diastolic: 82,
        isSynced: true,
      }));
    });
  });
});
