import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Card, CardHeader, CardBody, CardFooter, CardDivider} from '../Card';

// Mock reanimated — inline mocks (do NOT use react-native-reanimated/mock)
jest.mock('react-native-reanimated', () => {
  const createAnimatedComponent = (component: any) => component;
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    useSharedValue: jest.fn(init => ({value: init})),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(val => val),
    withTiming: jest.fn(val => val),
    createAnimatedComponent,
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
      borderLight: '#f1f5f9',
      error: '#dc2626',
      shadow: '#000',
      shadowOpacity: 0.1,
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
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-gesture-handler', () => ({
  Pressable: require('react-native').Pressable,
}));

describe('Card', () => {
  it('renders elevated variant by default', () => {
    const {getByTestId} = render(
      <Card testID="test-card">
        <CardBody>
          <></>
        </CardBody>
      </Card>,
    );
    expect(getByTestId('test-card')).toBeTruthy();
  });

  it('renders with header, body, footer, and divider', () => {
    const {getByText} = render(
      <Card>
        <CardHeader title="Test Title" />
        <CardBody>
          <></>
        </CardBody>
        <CardDivider />
        <CardFooter>
          <></>
        </CardFooter>
      </Card>,
    );
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('pressable variant calls onPress', () => {
    const onPress = jest.fn();
    const {getByTestId} = render(
      <Card variant="pressable" onPress={onPress} testID="press-card">
        <CardBody>
          <></>
        </CardBody>
      </Card>,
    );
    fireEvent.press(getByTestId('press-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pressable variant has button accessibility role', () => {
    const {getByRole} = render(
      <Card
        variant="pressable"
        onPress={() => {}}
        accessibilityLabel="View details">
        <CardBody>
          <></>
        </CardBody>
      </Card>,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
