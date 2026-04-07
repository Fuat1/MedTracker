import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {MenuItem} from '../index';

const mockTheme = {
  colors: {
    accent: '#0D9488', surface: '#ffffff', surfaceSecondary: '#f8fafc',
    textPrimary: '#1a1a2e', textSecondary: '#64748b', textTertiary: '#94a3b8',
    border: '#e5e7eb', borderLight: '#f1f5f9', error: '#dc2626',
    shadow: '#000', shadowOpacity: 0.1, background: '#EDF5F0',
    toggleTrackActive: '#0D9488', toggleTrackInactive: '#d1d5db', toggleThumb: '#ffffff',
    iconCircleBg: 'rgba(13,148,136,0.12)',
  },
  typography: {xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56},
  isDark: false, highContrast: false, fontScale: 1, seniorMode: false,
  touchTargetSize: 44, interactiveSpacing: 8,
};
jest.mock('../../../lib/use-theme', () => ({useTheme: () => mockTheme}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-gesture-handler', () => ({
  Pressable: require('react-native').Pressable,
}));
jest.mock('react-native-reanimated', () => {
  const createAnimatedComponent = (c: any) => c;
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    useSharedValue: jest.fn(init => ({value: init})),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(v => v),
    withTiming: jest.fn(v => v),
    createAnimatedComponent,
  };
});

describe('MenuItem', () => {
  it('renders label', () => {
    const {getByText} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={jest.fn()} />,
    );
    expect(getByText('Personal Info')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const {getByText} = render(
      <MenuItem icon="person-outline" label="Personal Info" subtitle="John, 45" onPress={jest.fn()} />,
    );
    expect(getByText('John, 45')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const {getByRole} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has button accessibility role and label', () => {
    const {getByLabelText} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={jest.fn()} />,
    );
    expect(getByLabelText('Personal Info')).toBeTruthy();
  });
});
