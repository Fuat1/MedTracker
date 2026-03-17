import React from 'react';
import {render} from '@testing-library/react-native';
import {ButtonGroup} from '../ButtonGroup';
import {Button, ButtonText} from '../Button';

// Mock reanimated — inline mocks (do NOT use react-native-reanimated/mock)
jest.mock('react-native-reanimated', () => {
  const mock = {
    useSharedValue: jest.fn(init => ({value: init})),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(val => val),
    withTiming: jest.fn(val => val),
    createAnimatedComponent: (component: unknown) => component,
  };
  return {
    __esModule: true,
    ...mock,
    default: mock,
  };
});

jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: {
      accent: '#0D9488',
      surface: '#fff',
      textPrimary: '#1a1a2e',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      error: '#dc2626',
      shadow: '#000',
      shadowOpacity: 0.1,
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

jest.mock('react-native-gesture-handler', () => ({
  Pressable: require('react-native').Pressable,
}));

describe('ButtonGroup', () => {
  it('renders children in a row by default', () => {
    const {getByText} = render(
      <ButtonGroup>
        <Button onPress={() => {}}>
          <ButtonText>A</ButtonText>
        </Button>
        <Button onPress={() => {}}>
          <ButtonText>B</ButtonText>
        </Button>
      </ButtonGroup>,
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });
});
