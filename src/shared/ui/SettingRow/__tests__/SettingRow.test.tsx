import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {SettingRow} from '../index';

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

describe('SettingRow', () => {
  it('renders label', () => {
    const {getByText} = render(
      <SettingRow label="Senior Mode" value={false} onValueChange={jest.fn()} />,
    );
    expect(getByText('Senior Mode')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const {getByText} = render(
      <SettingRow label="Senior Mode" description="Larger text" value={false} onValueChange={jest.fn()} />,
    );
    expect(getByText('Larger text')).toBeTruthy();
  });

  it('does not render description when omitted', () => {
    const {queryByText} = render(
      <SettingRow label="Senior Mode" value={false} onValueChange={jest.fn()} />,
    );
    expect(queryByText('Larger text')).toBeNull();
  });

  it('calls onValueChange when switch is toggled', () => {
    const onValueChange = jest.fn();
    const {getByRole} = render(
      <SettingRow label="Senior Mode" value={false} onValueChange={onValueChange} />,
    );
    fireEvent(getByRole('switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('has switch accessibility role and label', () => {
    const {getByRole, getByLabelText} = render(
      <SettingRow label="Senior Mode" value={true} onValueChange={jest.fn()} />,
    );
    expect(getByRole('switch')).toBeTruthy();
    expect(getByLabelText('Senior Mode')).toBeTruthy();
  });
});
