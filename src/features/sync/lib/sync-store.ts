/**
 * Zustand store for the upload retry queue and per-relationship sync state.
 *
 * Persisted to AsyncStorage so the queue survives app restarts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Maximum retry attempts before giving up on a record */
export const MAX_RETRY_COUNT = 10;

export interface RetryQueueItem {
  recordId: string;
  ownerUid: string;
  /** Unix seconds — when this item was added to the queue */
  addedAt: number;
  /** How many times we've retried */
  retryCount: number;
}

interface SyncStore {
  /** Records that failed to upload and need retry */
  retryQueue: RetryQueueItem[];
  /** Per-relationship last synced timestamp (key = linkedUserUid) */
  lastSyncedAt: Record<string, number>;

  addToRetryQueue: (item: Omit<RetryQueueItem, 'addedAt' | 'retryCount'>) => void;
  removeFromRetryQueue: (recordId: string) => void;
  incrementRetryCount: (recordId: string) => void;
  clearRetryQueue: () => void;
  setLastSyncedAt: (linkedUserUid: string, timestamp: number) => void;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      retryQueue: [],
      lastSyncedAt: {},

      addToRetryQueue: (item) =>
        set((state) => ({
          retryQueue: [
            ...state.retryQueue.filter((q) => q.recordId !== item.recordId),
            { ...item, addedAt: Math.floor(Date.now() / 1000), retryCount: 0 },
          ],
        })),

      removeFromRetryQueue: (recordId) =>
        set((state) => ({
          retryQueue: state.retryQueue.filter((q) => q.recordId !== recordId),
        })),

      incrementRetryCount: (recordId) =>
        set((state) => ({
          retryQueue: state.retryQueue.map((q) =>
            q.recordId === recordId ? { ...q, retryCount: q.retryCount + 1 } : q,
          ),
        })),

      clearRetryQueue: () => set({ retryQueue: [] }),

      setLastSyncedAt: (linkedUserUid, timestamp) =>
        set((state) => ({
          lastSyncedAt: { ...state.lastSyncedAt, [linkedUserUid]: timestamp },
        })),
    }),
    {
      name: 'medtracker-sync',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
