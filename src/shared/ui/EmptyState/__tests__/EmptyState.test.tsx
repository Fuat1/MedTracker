import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {EmptyState} from '../index';

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
  const c = (comp: any) => comp;
  return {
    __esModule: true, default: {createAnimatedComponent: c},
    useSharedValue: jest.fn(i => ({value: i})), useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(v => v), withTiming: jest.fn(v => v), createAnimatedComponent: c,
  };
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const {getByText} = render(
      <EmptyState icon="💓" title="No readings yet" subtitle="Add your first reading" />,
    );
    expect(getByText('No readings yet')).toBeTruthy();
    expect(getByText('Add your first reading')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onPress = jest.fn();
    const {getByText} = render(
      <EmptyState
        icon="💓" title="No readings" subtitle="Add one"
        action={{label: 'Add Reading', onPress}}
      />,
    );
    expect(getByText('Add Reading')).toBeTruthy();
  });

  it('calls action onPress when button pressed', () => {
    const onPress = jest.fn();
    const {getByText} = render(
      <EmptyState
        icon="💓" title="No readings" subtitle="Add one"
        action={{label: 'Add Reading', onPress}}
      />,
    );
    fireEvent.press(getByText('Add Reading'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
