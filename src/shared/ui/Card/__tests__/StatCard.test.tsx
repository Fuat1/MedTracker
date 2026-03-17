import React from 'react';
import {render} from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: jest.fn((init: number) => ({value: init})),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val: number) => val),
    withTiming: jest.fn((val: number) => val),
    withRepeat: jest.fn((val: number) => val),
    withSequence: jest.fn((...vals: number[]) => vals[vals.length - 1]),
    createAnimatedComponent: (comp: any) => comp,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  const TouchableOpacity = require('react-native').TouchableOpacity;
  return {Pressable: TouchableOpacity, GestureHandlerRootView: View};
});

jest.mock('react-native-linear-gradient', () => {
  const View = require('react-native').View;
  return {__esModule: true, default: View};
});

jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: {
      accent: '#0D9488',
      surface: '#fff',
      textPrimary: '#1a1a2e',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      borderLight: '#f1f5f9',
      shadow: '#000',
      shadowOpacity: 0.1,
      successText: '#16a34a',
      background: '#EDF5F0',
    },
    typography: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      '2xl': 28,
      '3xl': 36,
      hero: 56,
    },
    isDark: false,
    highContrast: false,
    fontScale: 1,
  }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params
        ? `${params.label} ${params.value} ${params.unit || ''}`.trim()
        : key,
  }),
}));

import {StatCard} from '../StatCard';

describe('StatCard', () => {
  it('renders value, unit, and label', () => {
    const {getByText} = render(
      <StatCard value="120" unit="mmHg" label="Avg Systolic" />,
    );

    expect(getByText('120')).toBeTruthy();
    expect(getByText('mmHg')).toBeTruthy();
    expect(getByText('Avg Systolic')).toBeTruthy();
  });

  it('renders trend indicator when provided', () => {
    const {getByText} = render(
      <StatCard
        value="120"
        unit="mmHg"
        label="Avg Systolic"
        trend="up"
        trendValue="+5%"
        trendColor="#16a34a"
      />,
    );

    expect(getByText('+5%')).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    const {getByLabelText} = render(
      <StatCard value="120" unit="mmHg" label="Avg Systolic" />,
    );

    expect(getByLabelText(/Avg Systolic/)).toBeTruthy();
  });
});
