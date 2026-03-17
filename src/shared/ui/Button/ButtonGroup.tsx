import React from 'react';
import {View} from 'react-native';
import {type ButtonGroupProps, BUTTON_GROUP_SPACING} from './types';

export function ButtonGroup({
  direction = 'row',
  spacing = 'md',
  isAttached = false,
  children,
}: ButtonGroupProps) {
  return (
    <View
      style={{
        flexDirection: direction,
        gap: isAttached ? 0 : BUTTON_GROUP_SPACING[spacing],
        alignItems: 'center',
      }}>
      {children}
    </View>
  );
}
