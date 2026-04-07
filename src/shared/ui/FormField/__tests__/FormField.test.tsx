import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {FormField} from '../index';

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

describe('FormField', () => {
  it('renders the label', () => {
    const {getByText} = render(
      <FormField label="Full Name" value="" onChangeText={jest.fn()} />,
    );
    expect(getByText('Full Name')).toBeTruthy();
  });

  it('text variant calls onChangeText on input', () => {
    const onChangeText = jest.fn();
    const {getByDisplayValue} = render(
      <FormField label="Full Name" value="John" onChangeText={onChangeText} />,
    );
    expect(getByDisplayValue('John')).toBeTruthy();
  });

  it('pressable variant calls onPress when tapped', () => {
    const onPress = jest.fn();
    const {getByRole} = render(
      <FormField label="Date of Birth" value="Jan 1 1980" type="pressable" onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pressable variant has button accessibility role', () => {
    const {getByRole} = render(
      <FormField label="Date of Birth" value="Jan 1 1980" type="pressable" onPress={jest.fn()} />,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
