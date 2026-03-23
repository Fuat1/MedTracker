import type {ReactNode} from 'react';
import type {ViewStyle} from 'react-native';

export type CardVariant =
  | 'elevated'
  | 'outline'
  | 'ghost'
  | 'filled'
  | 'pressable'
  | 'gradient';

export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
  children: ReactNode;
}

export interface CardHeaderProps {
  icon?: string;
  title: string;
  action?: ReactNode;
}

export interface CardBodyProps {
  children: ReactNode;
  style?: ViewStyle;
}

export interface CardFooterProps {
  children: ReactNode;
}

export interface StatCardProps {
  value: string;
  unit?: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendColor?: string;
  testID?: string;
}

export interface ListCardProps<T> {
  title: string;
  icon?: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  maxItems?: number;
  variant?: 'elevated' | 'outline';
  testID?: string;
}

export interface CollapsibleCardProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  testID?: string;
}

export interface CardGroupProps {
  direction?: 'row' | 'column';
  children: ReactNode;
  testID?: string;
}

export interface SkeletonCardProps {
  variant?: 'elevated' | 'outline';
  lines?: number;
  testID?: string;
}

export const CARD_SIZE_MAP = {
  sm: {padding: 8, borderRadius: 8},
  md: {padding: 16, borderRadius: 12},
  lg: {padding: 20, borderRadius: 16},
} as const;
