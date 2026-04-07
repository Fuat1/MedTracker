import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PeriodSelector} from '../index';

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

describe('PeriodSelector', () => {
  const options = ['7d', '14d', '30d', 'all'];

  it('renders all option labels', () => {
    const {getByText} = render(
      <PeriodSelector value="7d" onChange={jest.fn()} options={options} />,
    );
    expect(getByText('7d')).toBeTruthy();
    expect(getByText('14d')).toBeTruthy();
    expect(getByText('30d')).toBeTruthy();
    expect(getByText('all')).toBeTruthy();
  });

  it('calls onChange with pressed option', () => {
    const onChange = jest.fn();
    const {getByText} = render(
      <PeriodSelector value="7d" onChange={onChange} options={options} />,
    );
    fireEvent.press(getByText('30d'));
    expect(onChange).toHaveBeenCalledWith('30d');
  });

  it('calls onCustomPress when custom option is pressed', () => {
    const onCustomPress = jest.fn();
    const {getByText} = render(
      <PeriodSelector
        value="7d"
        onChange={jest.fn()}
        options={['7d', 'custom']}
        onCustomPress={onCustomPress}
      />,
    );
    fireEvent.press(getByText('custom'));
    expect(onCustomPress).toHaveBeenCalledTimes(1);
  });
});
