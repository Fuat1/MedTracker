import {renderHook} from '@testing-library/react-native';
import {useCollapse} from '../card-animations';

// Mock reanimated — inline mocks (do NOT use react-native-reanimated/mock)
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((init: number) => ({value: init})),
  useAnimatedStyle: jest.fn((fn: () => Record<string, unknown>) => fn()),
  withSpring: jest.fn((val: number) => val),
  withTiming: jest.fn((val: number) => val),
  withRepeat: jest.fn((val: number) => val),
  withSequence: jest.fn((...vals: number[]) => vals[vals.length - 1]),
}));

describe('useCollapse', () => {
  it('returns toggle, animatedStyle, and expanded state', () => {
    const {result} = renderHook(() => useCollapse(false));
    expect(result.current.toggle).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.expanded).toBe(false);
  });
});
