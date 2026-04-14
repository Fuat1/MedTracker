import { AppleHealthService } from '../apple-health';
import AppleHealthKit from 'react-native-health';

jest.mock('react-native-health', () => ({
  Constants: {
    Permissions: {
      BloodPressureSystolic: 'BloodPressureSystolic',
      BloodPressureDiastolic: 'BloodPressureDiastolic',
    },
  },
  isAvailable: jest.fn((cb) => cb(null, true)),
  initHealthKit: jest.fn((options, cb) => cb(null)),
  getBloodPressureSamples: jest.fn((options, cb) => cb(null, [])),
  saveBloodPressure: jest.fn((options, cb) => cb(null, { id: 'test-id' })),
}));

jest.mock('../../../lib', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

describe('AppleHealthService', () => {
  let service: AppleHealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppleHealthService();
  });

  describe('isAvailable', () => {
    it('returns true if HealthKit is available', async () => {
      const result = await service.isAvailable();
      expect(result).toBe(true);
      expect(AppleHealthKit.isAvailable).toHaveBeenCalled();
    });
  });

  describe('requestPermissions', () => {
    it('initializes HealthKit with the correct permissions', async () => {
      const result = await service.requestPermissions();
      expect(result).toBe(true);
      expect(AppleHealthKit.initHealthKit).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: {
            read: ['BloodPressureSystolic', 'BloodPressureDiastolic'],
            write: ['BloodPressureSystolic', 'BloodPressureDiastolic'],
          },
        }),
        expect.any(Function)
      );
    });
  });

  describe('saveBloodPressure', () => {
    it('does not crash if saveBloodPressure is not fully supported but mock gives id', async () => {
      const mockRecord = {
        id: '1',
        systolic: 120,
        diastolic: 80,
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

      const result = await service.saveBloodPressure(mockRecord);
      expect(result).toBe('test-id');
    });
  });

  describe('getBloodPressureRecords', () => {
    it('maps HealthKit results to BPRecord domain objects', async () => {
      const mockSamples = [
        {
          id: 'apple-id-1',
          bloodPressureSystolicValue: 120,
          bloodPressureDiastolicValue: 80,
          startDate: new Date('2024-01-01T12:00:00Z').toISOString(),
        },
      ];

      (AppleHealthKit.getBloodPressureSamples as jest.Mock).mockImplementationOnce((options, cb) => {
        cb(null, mockSamples);
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-02T00:00:00Z');
      const records = await service.getBloodPressureRecords(startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(expect.objectContaining({
        id: 'apple-id-1',
        systolic: 120,
        diastolic: 80,
        posture: 'sitting',
        isSynced: true,
      }));
    });
  });
});
