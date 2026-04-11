/**
 * Tests for getNativeNavigationMode wrapper.
 * The module reads NativeModules lazily so we can control the mock per-test
 * by reassigning NativeModules.NavigationBarModule before each call.
 */

import { NativeModules } from 'react-native';
import { getNativeNavigationMode } from '../native-navigation-bar';

const modules = NativeModules as Record<string, unknown>;

describe('getNativeNavigationMode', () => {
  afterEach(() => {
    delete modules.NavigationBarModule;
  });

  it('returns "unknown" when NavigationBarModule is not present', async () => {
    delete modules.NavigationBarModule;
    const result = await getNativeNavigationMode();
    expect(result).toBe('unknown');
  });

  it('returns "gesture" when module resolves "gesture"', async () => {
    modules.NavigationBarModule = {
      getNavigationMode: jest.fn().mockResolvedValue('gesture'),
    };
    const result = await getNativeNavigationMode();
    expect(result).toBe('gesture');
  });

  it('returns "buttons" when module resolves "buttons"', async () => {
    modules.NavigationBarModule = {
      getNavigationMode: jest.fn().mockResolvedValue('buttons'),
    };
    const result = await getNativeNavigationMode();
    expect(result).toBe('buttons');
  });

  it('returns "unknown" for unexpected string values', async () => {
    modules.NavigationBarModule = {
      getNavigationMode: jest.fn().mockResolvedValue('something-weird'),
    };
    const result = await getNativeNavigationMode();
    expect(result).toBe('unknown');
  });
});
