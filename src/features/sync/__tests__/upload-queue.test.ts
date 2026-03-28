/**
 * Tests for the upload retry queue (sync-store).
 *
 * The sync-store is a pure Zustand store — we test it directly
 * without React hooks to keep tests fast and deterministic.
 */

import { act } from '@testing-library/react-native';

// Mock AsyncStorage so persist middleware doesn't error in Node
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Import AFTER mocks
import { useSyncStore } from '../lib/sync-store';

/** Helper — read a fresh snapshot of the store state */
function getState() {
  return useSyncStore.getState();
}

beforeEach(() => {
  // Reset store to initial state before each test
  act(() => {
    useSyncStore.setState({ retryQueue: [], lastSyncedAt: {} });
  });
});

// ---------------------------------------------------------------------------
// addToRetryQueue
// ---------------------------------------------------------------------------

describe('addToRetryQueue', () => {
  it('adds a new item with addedAt and retryCount=0', () => {
    const before = Math.floor(Date.now() / 1000);

    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
    });

    const { retryQueue } = getState();
    expect(retryQueue).toHaveLength(1);

    const item = retryQueue[0];
    expect(item.recordId).toBe('rec-1');
    expect(item.ownerUid).toBe('uid-a');
    expect(item.retryCount).toBe(0);
    expect(item.addedAt).toBeGreaterThanOrEqual(before);
  });

  it('replaces an existing item with the same recordId (idempotent)', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().incrementRetryCount('rec-1'); // bump retryCount to 1
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' }); // re-add
    });

    const { retryQueue } = getState();
    // Should still be just one item
    expect(retryQueue).toHaveLength(1);
    // Re-adding resets retryCount back to 0
    expect(retryQueue[0].retryCount).toBe(0);
  });

  it('can hold multiple distinct records', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().addToRetryQueue({ recordId: 'rec-2', ownerUid: 'uid-a' });
      getState().addToRetryQueue({ recordId: 'rec-3', ownerUid: 'uid-b' });
    });

    expect(getState().retryQueue).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// removeFromRetryQueue
// ---------------------------------------------------------------------------

describe('removeFromRetryQueue', () => {
  it('removes the item with the matching recordId', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().addToRetryQueue({ recordId: 'rec-2', ownerUid: 'uid-a' });
      getState().removeFromRetryQueue('rec-1');
    });

    const { retryQueue } = getState();
    expect(retryQueue).toHaveLength(1);
    expect(retryQueue[0].recordId).toBe('rec-2');
  });

  it('is a no-op when recordId does not exist', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().removeFromRetryQueue('does-not-exist');
    });

    expect(getState().retryQueue).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// incrementRetryCount
// ---------------------------------------------------------------------------

describe('incrementRetryCount', () => {
  it('increments retryCount for the matching item', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().incrementRetryCount('rec-1');
      getState().incrementRetryCount('rec-1');
    });

    const item = getState().retryQueue.find((q) => q.recordId === 'rec-1');
    expect(item?.retryCount).toBe(2);
  });

  it('does not affect other queue items', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().addToRetryQueue({ recordId: 'rec-2', ownerUid: 'uid-a' });
      getState().incrementRetryCount('rec-1');
    });

    const rec2 = getState().retryQueue.find((q) => q.recordId === 'rec-2');
    expect(rec2?.retryCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// clearRetryQueue
// ---------------------------------------------------------------------------

describe('clearRetryQueue', () => {
  it('empties the queue', () => {
    act(() => {
      getState().addToRetryQueue({ recordId: 'rec-1', ownerUid: 'uid-a' });
      getState().addToRetryQueue({ recordId: 'rec-2', ownerUid: 'uid-b' });
      getState().clearRetryQueue();
    });

    expect(getState().retryQueue).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// setLastSyncedAt
// ---------------------------------------------------------------------------

describe('setLastSyncedAt', () => {
  it('stores and updates the timestamp for a linked user', () => {
    act(() => {
      getState().setLastSyncedAt('uid-linked', 1_700_000_000);
    });

    expect(getState().lastSyncedAt['uid-linked']).toBe(1_700_000_000);

    act(() => {
      getState().setLastSyncedAt('uid-linked', 1_700_001_000);
    });

    expect(getState().lastSyncedAt['uid-linked']).toBe(1_700_001_000);
  });

  it('tracks multiple linked users independently', () => {
    act(() => {
      getState().setLastSyncedAt('uid-a', 1_000);
      getState().setLastSyncedAt('uid-b', 2_000);
    });

    expect(getState().lastSyncedAt['uid-a']).toBe(1_000);
    expect(getState().lastSyncedAt['uid-b']).toBe(2_000);
  });
});
