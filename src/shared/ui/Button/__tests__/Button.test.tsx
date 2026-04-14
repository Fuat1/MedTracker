import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button, ButtonText } from '../index';

// Mock reanimated — use inline mock (do NOT use react-native-reanimated/mock)
jest.mock('react-native-reanimated', () => {
  const mockAnimated = {
    createAnimatedComponent: (component: any) => component,
  };
  return {
    __esModule: true,
    default: mockAnimated,
    useSharedValue: jest.fn((init: any) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val: any) => val),
    withTiming: jest.fn((val: any) => val),
  };
});

// Mock gesture handler Pressable to use RN Pressable
jest.mock('react-native-gesture-handler', () => {
  const { Pressable } = require('react-native');
  return { Pressable };
}, { virtual: true });

// Mock useTheme
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: {
      accent: '#0D9488',
      surface: '#ffffff',
      textPrimary: '#1a1a2e',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      error: '#dc2626',
      shadow: '#000000',
      shadowOpacity: 0.1,
    },
    typography: {
      xs: 12, sm: 14, md: 16, lg: 18, xl: 22,
      '2xl': 28, '3xl': 36, hero: 56,
    },
    isDark: false,
    highContrast: false,
    fontScale: 1,
  }),
}));

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('Button', () => {
  it('renders primary variant with text', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button variant="primary" onPress={onPress}>
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button variant="primary" onPress={onPress} accessibilityLabel="Save">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button variant="primary" onPress={onPress} isDisabled accessibilityLabel="Save">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { getByTestId } = render(
      <Button variant="primary" onPress={() => {}} isLoading testID="save-btn">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    expect(getByTestId('save-btn-spinner')).toBeTruthy();
  });

  it('sets correct accessibility props', () => {
    const { getByRole } = render(
      <Button
        variant="destructive"
        onPress={() => {}}
        accessibilityLabel="Delete reading"
        accessibilityHint="Permanently removes this reading"
      >
        <ButtonText>Delete</ButtonText>
      </Button>,
    );
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toBe('Delete reading');
    expect(btn.props.accessibilityHint).toBe('Permanently removes this reading');
  });
});
