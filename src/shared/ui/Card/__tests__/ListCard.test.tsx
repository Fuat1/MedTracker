import React from 'react';
import {render} from '@testing-library/react-native';
import {Text} from 'react-native';

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

import {ListCard} from '../ListCard';

describe('ListCard', () => {
  it('renders title and items', () => {
    const items = ['Item A', 'Item B', 'Item C'];
    const {getByText} = render(
      <ListCard
        title="My List"
        items={items}
        renderItem={(item: string) => <Text>{item}</Text>}
      />,
    );

    expect(getByText('My List')).toBeTruthy();
    expect(getByText('Item A')).toBeTruthy();
    expect(getByText('Item B')).toBeTruthy();
    expect(getByText('Item C')).toBeTruthy();
  });

  it('respects maxItems', () => {
    const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
    const {getByText, queryByText} = render(
      <ListCard
        title="My List"
        items={items}
        renderItem={(item: string) => <Text>{item}</Text>}
        maxItems={2}
      />,
    );

    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
    expect(queryByText('Item 3')).toBeNull();
  });
});
