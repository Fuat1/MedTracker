import React from 'react';
import {render} from '@testing-library/react-native';
import {ProfileBadgeRow} from '../index';

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

describe('ProfileBadgeRow', () => {
  it('renders all badge labels', () => {
    const {getByText} = render(
      <ProfileBadgeRow
        badges={[
          {icon: 'calendar-outline', label: '45 yrs'},
          {icon: 'body-outline', label: 'BMI 24.1'},
        ]}
      />,
    );
    expect(getByText('45 yrs')).toBeTruthy();
    expect(getByText('BMI 24.1')).toBeTruthy();
  });

  it('renders nothing when badges array is empty', () => {
    const {toJSON} = render(<ProfileBadgeRow badges={[]} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders single badge without crash', () => {
    const {getByText} = render(
      <ProfileBadgeRow badges={[{icon: 'person-outline', label: 'Male'}]} />,
    );
    expect(getByText('Male')).toBeTruthy();
  });
});
