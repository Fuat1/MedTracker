import { useSyncHealthPlatform } from '../useSyncHealthPlatform';
import { renderHook, waitFor } from '@testing-library/react-native';
import { healthPlatform } from '../../../shared/api/health-platform';
import { getBPRecords, insertBPRecord, updateBPRecord } from '../../../shared/api/bp-repository';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../../shared/api/health-platform', () => ({
  healthPlatform: {
    isAvailable: jest.fn(() => Promise.resolve(true)),
    requestPermissions: jest.fn(() => Promise.resolve(true)),
    saveBloodPressure: jest.fn(() => Promise.resolve('mocked-id')),
    getBloodPressureRecords: jest.fn(() => Promise.resolve([])),
  }
}));

jest.mock('../../../shared/api/bp-repository', () => ({
  getBPRecords: jest.fn(),
  insertBPRecord: jest.fn(),
  updateBPRecord: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => def,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSyncHealthPlatform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports unsynced local records and updates db', async () => {
    const unsyncedRecord = { id: 'local-1', systolic: 120, diastolic: 80, isSynced: false };
    const syncedRecord = { id: 'local-2', systolic: 110, diastolic: 75, isSynced: true };
    
    (getBPRecords as jest.Mock).mockResolvedValueOnce([unsyncedRecord, syncedRecord]);
    (healthPlatform.saveBloodPressure as jest.Mock).mockResolvedValueOnce('external-1');

    (healthPlatform.getBloodPressureRecords as jest.Mock).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSyncHealthPlatform(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Validations
    expect(healthPlatform.saveBloodPressure).toHaveBeenCalledTimes(1);
    expect(healthPlatform.saveBloodPressure).toHaveBeenCalledWith(unsyncedRecord);
    expect(updateBPRecord).toHaveBeenCalledWith('local-1', { isSynced: true });
    expect(result.current.data?.exportCount).toBe(1);
  });

  it('imports external records and handles conflict resolution (skip duplicates)', async () => {
    const timestamp = Date.now();
    
    // Local record exactly matching the external record's timestamp
    const localRecords = [
      { id: 'local-1', timestamp: timestamp, systolic: 130, diastolic: 85, isSynced: true }
    ];
    (getBPRecords as jest.Mock).mockResolvedValueOnce(localRecords);

    // External returns two records. One duplicates the local (within 1 min and exact sys/dia), one is new.
    const externalRecords = [
      { systolic: 130, diastolic: 85, timestamp: timestamp }, // duplicate
      { systolic: 125, diastolic: 82, timestamp: timestamp - 90000 } // new
    ];
    (healthPlatform.getBloodPressureRecords as jest.Mock).mockResolvedValueOnce(externalRecords);
    
    // Don't save anything since no unsynced local
    (healthPlatform.saveBloodPressure as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useSyncHealthPlatform(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(insertBPRecord).toHaveBeenCalledTimes(1); // Only the non-duplicate
    expect(insertBPRecord).toHaveBeenCalledWith(expect.objectContaining({
      systolic: 125,
      diastolic: 82,
      isSynced: true
    }));

    expect(result.current.data?.importCount).toBe(1);
  });

  it('fails safely if platform is unavailable', async () => {
    (healthPlatform.isAvailable as jest.Mock).mockResolvedValueOnce(false);

    const { result } = renderHook(() => useSyncHealthPlatform(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Health Platform not available');
  });
});
