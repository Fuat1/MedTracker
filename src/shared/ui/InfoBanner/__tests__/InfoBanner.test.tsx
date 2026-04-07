import React from 'react';
import {render} from '@testing-library/react-native';
import {InfoBanner} from '../index';

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('InfoBanner', () => {
  it('renders title and body', () => {
    const {getByText} = render(
      <InfoBanner
        icon="shield-checkmark-outline"
        title="AHA/ACC 2025 Detected"
        body="Your readings match this guideline"
        color="#0D9488"
      />,
    );
    expect(getByText('AHA/ACC 2025 Detected')).toBeTruthy();
    expect(getByText('Your readings match this guideline')).toBeTruthy();
  });
});
