import type {ReactNode} from 'react';
import type {AccessibilityProps, ViewStyle} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'icon'
  | 'fab'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Pick<AccessibilityProps, 'accessibilityHint'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
  children: ReactNode;
}

export interface ButtonTextProps {
  children: ReactNode;
}

export interface ButtonIconProps {
  as: React.ComponentType<{name: string; size: number; color: string}>;
  name: string;
}

export interface ButtonSpinnerProps {
  color?: string;
  size?: 'small' | 'large';
}

export interface ButtonGroupProps {
  direction?: 'row' | 'column';
  spacing?: 'sm' | 'md' | 'lg';
  isAttached?: boolean;
  children: ReactNode;
}

/** Maps button size to min height, icon size */
export const BUTTON_SIZE_MAP = {
  sm: {minHeight: 36, iconSize: 16, paddingH: 12, paddingV: 8},
  md: {minHeight: 44, iconSize: 20, paddingH: 16, paddingV: 12},
  lg: {minHeight: 52, iconSize: 24, paddingH: 20, paddingV: 14},
} as const;

export const BUTTON_GROUP_SPACING = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;
