import {renderHook} from '@testing-library/react-native';
import {usePressScale} from '../button-animations';

// Mock reanimated without requiring the mock module
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(init => ({value: init})),
  useAnimatedStyle: jest.fn(fn => fn()),
  withSpring: jest.fn(val => val),
  withTiming: jest.fn(val => val),
}));

describe('usePressScale', () => {
  it('returns animatedStyle and handlers', () => {
    const {result} = renderHook(() => usePressScale(0.96));
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.onPressIn).toBeDefined();
    expect(result.current.onPressOut).toBeDefined();
  });

  it('animatedStyle contains transform and opacity', () => {
    const {result} = renderHook(() => usePressScale(0.96));
    expect(result.current.animatedStyle).toEqual({
      transform: [{scale: 1}],
      opacity: 1,
    });
  });

  it('onPressIn updates scale shared value', () => {
    const {result} = renderHook(() => usePressScale(0.96));
    result.current.onPressIn();
    // withSpring mock returns the target value directly
    const {withSpring: mockWithSpring} = require('react-native-reanimated');
    expect(mockWithSpring).toHaveBeenCalledWith(0.96, expect.any(Object));
  });

  it('onPressOut resets scale to 1', () => {
    const {result} = renderHook(() => usePressScale(0.96));
    result.current.onPressOut();
    const {withSpring: mockWithSpring} = require('react-native-reanimated');
    expect(mockWithSpring).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('uses default scaleTo of 0.96 when no argument provided', () => {
    const {result} = renderHook(() => usePressScale());
    result.current.onPressIn();
    const {withSpring: mockWithSpring} = require('react-native-reanimated');
    expect(mockWithSpring).toHaveBeenCalledWith(0.96, expect.any(Object));
  });
});
