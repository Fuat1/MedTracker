# Card & Button Component System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable Card (6 variants + 5 specialized) and Button (7 variants) components to MedTracker using Gluestack UI v3 + NativeWind hybrid styling with Reanimated animations.

**Architecture:** Components live in `src/shared/ui/` (FSD shared layer). NativeWind handles layout/spacing; inline `style` via `useTheme()` handles all colors and font sizes. Gluestack UI v3 provides accessible base components that get copied into the project and customized.

**Tech Stack:** React Native 0.83, TypeScript strict, NativeWind 4.2, Reanimated 4.2, Gluestack UI v3, react-native-linear-gradient, react-native-vector-icons/Ionicons

**Spec:** `docs/superpowers/specs/2026-03-17-card-button-components-design.md`

---

## Task 0: Compatibility Spike — NativeWind + Gluestack on RN 0.83

**Files:**
- Modify: `metro.config.js`
- Modify: `tailwind.config.js`
- Create: `global.css`

This task verifies the tech stack works together before building components. If Gluestack fails, we build from scratch using the same API design.

- [ ] **Step 1: Update metro.config.js for NativeWind v4**

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = {};

module.exports = withNativeWind(mergeConfig(getDefaultConfig(__dirname), config), {
  input: './global.css',
});
```

- [ ] **Step 2: Create global.css**

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Update tailwind.config.js with NativeWind preset + custom tokens**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-extrabold': ['Nunito-ExtraBold'],
      },
      borderRadius: {
        'card-sm': '8px',
        card: '12px',
        'card-lg': '16px',
      },
      spacing: {
        'card-sm': '8px',
        'card-md': '16px',
        'card-lg': '20px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Import global.css in app entry**

Add `import '../global.css';` at the top of `src/app/App.tsx` (before other imports).

- [ ] **Step 5: Run Gluestack UI init**

```bash
npx gluestack-ui init
```

Follow prompts. If it scaffolds a provider, note where it lands.

- [ ] **Step 6: Add Gluestack button and card components**

```bash
npx gluestack-ui add button card
```

Components will be copied into project. Move them to `src/shared/ui/gluestack/` if they land elsewhere.

- [ ] **Step 7: Add GluestackUIProvider to app provider hierarchy**

In `src/app/App.tsx`, wrap the app content with `GluestackUIProvider` (if Gluestack init created one). Add it inside the existing `<Providers>` wrapper:

```tsx
import { GluestackUIProvider } from '@/shared/ui/gluestack/gluestack-ui-provider'; // path may vary after init

// Inside the provider hierarchy:
<GluestackUIProvider>
  {/* existing children */}
</GluestackUIProvider>
```

If Gluestack init did NOT create a provider (v3 copy-paste model may not require one), skip this step.

- [ ] **Step 8: Verify build on Android**

```bash
npx react-native run-android
```

Expected: App builds and runs without NativeWind or Gluestack errors. If Gluestack fails, delete its generated code and proceed with from-scratch implementation using the same API.

- [ ] **Step 9: Verify NativeWind works — add a test className**

Temporarily add `className="p-4 rounded-card"` to any existing View in a page. Verify it applies padding and border-radius. Remove after verification.

- [ ] **Step 10: Commit**

```bash
git add metro.config.js tailwind.config.js global.css src/app/App.tsx
git add src/shared/ui/gluestack/ # if created
git commit -m "chore: configure NativeWind v4 + Gluestack UI v3 foundation"
```

---

## Task 1: Button — Types and Animation Hooks

**Files:**
- Create: `src/shared/ui/Button/types.ts`
- Create: `src/shared/ui/Button/button-animations.ts`
- Test: `src/shared/ui/Button/__tests__/button-animations.test.ts`

- [ ] **Step 1: Write Button TypeScript interfaces**

Create `src/shared/ui/Button/types.ts`:

```typescript
import type { ReactNode } from 'react';
import type { AccessibilityProps, ViewStyle } from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'icon'
  | 'fab'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Pick<AccessibilityProps, 'accessibilityHint'> {
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
  as: React.ComponentType<{ name: string; size: number; color: string }>;
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
  sm: { minHeight: 36, iconSize: 16, paddingH: 12, paddingV: 8 },
  md: { minHeight: 44, iconSize: 20, paddingH: 16, paddingV: 12 },
  lg: { minHeight: 52, iconSize: 24, paddingH: 20, paddingV: 14 },
} as const;

export const BUTTON_GROUP_SPACING = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;
```

- [ ] **Step 2: Write failing test for usePressScale hook**

Create `src/shared/ui/Button/__tests__/button-animations.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-native';
import { usePressScale } from '../button-animations';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  };
});

describe('usePressScale', () => {
  it('returns animatedStyle and handlers', () => {
    const { result } = renderHook(() => usePressScale(0.96));
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.onPressIn).toBeDefined();
    expect(result.current.onPressOut).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/shared/ui/Button/__tests__/button-animations.test.ts --no-cache
```

Expected: FAIL — `usePressScale` not found.

- [ ] **Step 4: Implement animation hooks**

Create `src/shared/ui/Button/button-animations.ts`:

```typescript
import { Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 15, stiffness: 300 };

/**
 * Press scale + opacity feedback.
 * Scale applies on both platforms.
 * Opacity dim applies on iOS (instead of ripple).
 */
export function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(scaleTo, SPRING_CONFIG);
    if (Platform.OS === 'ios') {
      opacity.value = withTiming(0.85, { duration: 100 });
    }
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    if (Platform.OS === 'ios') {
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * FAB entry animation — spring from bottom.
 */
export function useFabEntry() {
  const translateY = useSharedValue(80);
  const fabScale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: fabScale.value },
    ],
  }));

  const enter = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
    fabScale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, enter };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/shared/ui/Button/__tests__/button-animations.test.ts --no-cache
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/Button/types.ts src/shared/ui/Button/button-animations.ts src/shared/ui/Button/__tests__/
git commit -m "feat(ui): add Button types and animation hooks"
```

---

## Task 2: Button — Main Component

**Files:**
- Create: `src/shared/ui/Button/Button.tsx`
- Create: `src/shared/ui/Button/index.ts`
- Test: `src/shared/ui/Button/__tests__/Button.test.tsx`

- [ ] **Step 1: Write failing test for Button rendering**

Create `src/shared/ui/Button/__tests__/Button.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button, ButtonText, ButtonIcon } from '../index';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  };
});

// Mock useTheme
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: {
      accent: '#0D9488',
      surface: '#ffffff',
      textPrimary: '#1a1a2e',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      error: '#dc2626',
      shadow: '#000000',
      shadowOpacity: 0.1,
    },
    typography: {
      xs: 12, sm: 14, md: 16, lg: 18, xl: 22,
      '2xl': 28, '3xl': 36, hero: 56,
    },
    isDark: false,
    highContrast: false,
    fontScale: 1,
  }),
}));

// Mock vector icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('Button', () => {
  it('renders primary variant with text', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button variant="primary" onPress={onPress}>
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button variant="primary" onPress={onPress} accessibilityLabel="Save">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button variant="primary" onPress={onPress} isDisabled accessibilityLabel="Save">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { getByTestId } = render(
      <Button variant="primary" onPress={() => {}} isLoading testID="save-btn">
        <ButtonText>Save</ButtonText>
      </Button>,
    );
    expect(getByTestId('save-btn-spinner')).toBeTruthy();
  });

  it('sets correct accessibility props', () => {
    const { getByRole } = render(
      <Button
        variant="destructive"
        onPress={() => {}}
        accessibilityLabel="Delete reading"
        accessibilityHint="Permanently removes this reading"
      >
        <ButtonText>Delete</ButtonText>
      </Button>,
    );
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toBe('Delete reading');
    expect(btn.props.accessibilityHint).toBe('Permanently removes this reading');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/ui/Button/__tests__/Button.test.tsx --no-cache
```

Expected: FAIL — module `../index` not found.

- [ ] **Step 3: Implement Button component**

Create `src/shared/ui/Button/Button.tsx`:

```tsx
import React, { createContext, useContext } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../lib/use-theme';
import { FONTS, type ThemeColors } from '../../config/theme';
import { usePressScale } from './button-animations';
import {
  type ButtonProps,
  type ButtonTextProps,
  type ButtonIconProps,
  type ButtonSpinnerProps,
  type ButtonVariant,
  type ButtonSize,
  BUTTON_SIZE_MAP,
} from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Context to pass variant styling down to sub-components
interface ButtonContextValue {
  variant: ButtonVariant;
  size: ButtonSize;
  textColor: string;
  iconSize: number;
  fontSize: number;
}
const ButtonContext = createContext<ButtonContextValue>({
  variant: 'primary',
  size: 'md',
  textColor: '#ffffff',
  iconSize: 20,
  fontSize: 16,
});

export function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  isLoading = false,
  isDisabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  children,
}: ButtonProps) {
  const { colors, typography, highContrast } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(
    variant === 'fab' ? 0.92 : 0.96,
  );
  const sizeConfig = BUTTON_SIZE_MAP[size];
  const disabled = isDisabled || isLoading;

  // Resolve colors by variant
  const bgColor = getBackgroundColor(variant, colors, disabled);
  const textColor = getTextColor(variant, colors, disabled);
  const borderColor = getBorderColor(variant, colors, highContrast);

  const containerStyle: ViewStyle = {
    backgroundColor: bgColor,
    minHeight: sizeConfig.minHeight,
    paddingHorizontal: variant === 'icon' || variant === 'fab' ? 0 : sizeConfig.paddingH,
    paddingVertical: variant === 'link' ? 0 : sizeConfig.paddingV,
    borderRadius: variant === 'fab' || variant === 'icon' ? sizeConfig.minHeight / 2 : 12,
    borderWidth: borderColor ? (highContrast ? 2 : 1) : 0,
    borderColor: borderColor || 'transparent',
    width: variant === 'fab' || variant === 'icon' ? sizeConfig.minHeight : undefined,
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'fab'
      ? {
          ...Platform.select({
            ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
            android: { elevation: 6 },
          }),
        }
      : {}),
  };

  const fontSize = variant === 'link' ? typography.sm : typography[sizeToTypography(size)];

  return (
    <ButtonContext.Provider value={{ variant, size, textColor, iconSize: sizeConfig.iconSize, fontSize }}>
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, busy: isLoading }}
        testID={testID}
        className="flex-row items-center justify-center gap-2"
        style={[containerStyle, animatedStyle, style]}
        hitSlop={sizeConfig.minHeight < 44 ? { top: (44 - sizeConfig.minHeight) / 2, bottom: (44 - sizeConfig.minHeight) / 2 } : undefined}
      >
        {isLoading ? (
          <ActivityIndicator
            color={textColor}
            size="small"
            testID={testID ? `${testID}-spinner` : undefined}
          />
        ) : (
          children
        )}
      </AnimatedPressable>
    </ButtonContext.Provider>
  );
}

export function ButtonText({ children }: ButtonTextProps) {
  const { variant, textColor, fontSize } = useContext(ButtonContext);
  return (
    <Text
      style={[
        styles.text,
        {
          color: textColor,
          fontSize,
          textDecorationLine: variant === 'link' ? 'underline' : 'none',
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function ButtonIcon({ as: IconComponent, name }: ButtonIconProps) {
  const { textColor, iconSize } = useContext(ButtonContext);
  return <IconComponent name={name} size={iconSize} color={textColor} />;
}

export function ButtonSpinner({ color, size = 'small' }: ButtonSpinnerProps) {
  const { textColor } = useContext(ButtonContext);
  return <ActivityIndicator color={color || textColor} size={size} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBackgroundColor(variant: ButtonVariant, colors: ThemeColors, disabled: boolean): string {
  if (disabled && variant === 'primary') return colors.border;
  switch (variant) {
    case 'primary': return colors.accent;
    case 'destructive': return colors.error;
    case 'secondary':
    case 'ghost':
    case 'link': return 'transparent';
    case 'icon': return 'transparent';
    case 'fab': return colors.accent;
    default: return colors.accent;
  }
}

function getTextColor(variant: ButtonVariant, colors: ThemeColors, disabled: boolean): string {
  if (disabled) return colors.textSecondary;
  switch (variant) {
    case 'primary':
    case 'fab': return colors.surface;
    case 'destructive': return colors.surface;
    case 'secondary': return colors.accent;
    case 'ghost': return colors.textPrimary;
    case 'icon': return colors.textPrimary;
    case 'link': return colors.accent;
    default: return colors.surface;
  }
}

function getBorderColor(variant: ButtonVariant, colors: ThemeColors, highContrast: boolean): string | null {
  if (variant === 'secondary') return colors.accent;
  if (highContrast && variant !== 'ghost' && variant !== 'link') return colors.textPrimary;
  return null;
}

function sizeToTypography(size: ButtonSize): 'sm' | 'md' | 'lg' {
  return size;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
```

- [ ] **Step 4: Create barrel export**

Create `src/shared/ui/Button/index.ts`:

```typescript
export { Button, ButtonText, ButtonIcon, ButtonSpinner } from './Button';
export { ButtonGroup } from './ButtonGroup';
export { usePressScale, useFabEntry } from './button-animations';
export type {
  ButtonProps,
  ButtonTextProps,
  ButtonIconProps,
  ButtonSpinnerProps,
  ButtonGroupProps,
  ButtonVariant,
  ButtonSize,
} from './types';
```

Note: Comment out the `ButtonGroup` export line until Task 3 creates the file. Uncomment it in Task 3.

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/shared/ui/Button/__tests__/Button.test.tsx --no-cache
```

Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/Button/
git commit -m "feat(ui): add Button component with 7 variants"
```

---

## Task 3: ButtonGroup Component

**Files:**
- Create: `src/shared/ui/Button/ButtonGroup.tsx`
- Test: `src/shared/ui/Button/__tests__/ButtonGroup.test.tsx`

- [ ] **Step 1: Write failing test for ButtonGroup**

Create `src/shared/ui/Button/__tests__/ButtonGroup.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ButtonGroup } from '../ButtonGroup';
import { Button, ButtonText } from '../Button';

// Same mocks as Button.test.tsx (reanimated, useTheme, icons)
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withSpring: jest.fn((val) => val), withTiming: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { accent: '#0D9488', surface: '#fff', textPrimary: '#1a1a2e', textSecondary: '#64748b', border: '#e5e7eb', error: '#dc2626', shadow: '#000', shadowOpacity: 0.1 },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('ButtonGroup', () => {
  it('renders children in a row by default', () => {
    const { getByText } = render(
      <ButtonGroup>
        <Button onPress={() => {}}><ButtonText>A</ButtonText></Button>
        <Button onPress={() => {}}><ButtonText>B</ButtonText></Button>
      </ButtonGroup>,
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/ui/Button/__tests__/ButtonGroup.test.tsx --no-cache
```

Expected: FAIL — `../ButtonGroup` not found.

- [ ] **Step 3: Implement ButtonGroup**

Create `src/shared/ui/Button/ButtonGroup.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { type ButtonGroupProps, BUTTON_GROUP_SPACING } from './types';

export function ButtonGroup({
  direction = 'row',
  spacing = 'md',
  isAttached = false,
  children,
}: ButtonGroupProps) {
  return (
    <View
      className="items-center"
      style={{
        flexDirection: direction,
        gap: isAttached ? 0 : BUTTON_GROUP_SPACING[spacing],
      }}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/shared/ui/Button/__tests__/ButtonGroup.test.tsx --no-cache
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/Button/ButtonGroup.tsx src/shared/ui/Button/__tests__/ButtonGroup.test.tsx
git commit -m "feat(ui): add ButtonGroup component"
```

---

## Task 4: Card — Types and Animation Hooks

**Files:**
- Create: `src/shared/ui/Card/types.ts`
- Create: `src/shared/ui/Card/card-animations.ts`
- Test: `src/shared/ui/Card/__tests__/card-animations.test.ts`

- [ ] **Step 1: Write Card TypeScript interfaces**

Create `src/shared/ui/Card/types.ts`:

```typescript
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

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
  sm: { padding: 8, borderRadius: 8 },
  md: { padding: 16, borderRadius: 12 },
  lg: { padding: 20, borderRadius: 16 },
} as const;
```

- [ ] **Step 2: Write failing test for card animation hooks**

Create `src/shared/ui/Card/__tests__/card-animations.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-native';
import { useCollapse } from '../card-animations';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  };
});

describe('useCollapse', () => {
  it('returns toggle, animatedStyle, and expanded state', () => {
    const { result } = renderHook(() => useCollapse(false));
    expect(result.current.toggle).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.expanded).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/shared/ui/Card/__tests__/card-animations.test.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement card animation hooks**

Create `src/shared/ui/Card/card-animations.ts`:

```typescript
import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

/**
 * Collapsible expand/collapse animation.
 * Uses height animation via shared value (0 = collapsed, 1 = expanded).
 */
export function useCollapse(defaultExpanded = false) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const progress = useSharedValue(defaultExpanded ? 1 : 0);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * 1000, // Approximate; real impl uses measure()
  }));

  return { toggle, expanded, animatedStyle };
}

/**
 * Skeleton shimmer animation.
 * Respects system reduce-motion preference.
 */
export function useShimmer() {
  const translateX = useSharedValue(-200);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const check = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(enabled);
    };
    check();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-200, { duration: 0 }),
          withTiming(400, { duration: 1200 }),
        ),
        -1, // infinite
        false,
      );
    } else {
      translateX.value = -200; // No animation
    }
  }, [reduceMotion, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shimmerStyle, reduceMotion };
}

/**
 * Press scale for pressable cards (gentler than buttons).
 */
export function useCardPressScale() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/shared/ui/Card/__tests__/card-animations.test.ts --no-cache
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/Card/types.ts src/shared/ui/Card/card-animations.ts src/shared/ui/Card/__tests__/
git commit -m "feat(ui): add Card types and animation hooks (collapse, shimmer, press)"
```

---

## Task 5: Card — Base Component

**Files:**
- Create: `src/shared/ui/Card/Card.tsx`
- Create: `src/shared/ui/Card/index.ts`
- Test: `src/shared/ui/Card/__tests__/Card.test.tsx`

- [ ] **Step 1: Write failing test for base Card**

Create `src/shared/ui/Card/__tests__/Card.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Card, CardHeader, CardBody, CardFooter, CardDivider } from '../Card';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withSpring: jest.fn((val) => val), withTiming: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { accent: '#0D9488', surface: '#fff', textPrimary: '#1a1a2e', textSecondary: '#64748b', border: '#e5e7eb', borderLight: '#f1f5f9', error: '#dc2626', shadow: '#000', shadowOpacity: 0.1, background: '#EDF5F0' },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

describe('Card', () => {
  it('renders elevated variant by default', () => {
    const { getByTestId } = render(
      <Card testID="test-card"><CardBody><></></CardBody></Card>,
    );
    expect(getByTestId('test-card')).toBeTruthy();
  });

  it('renders with header, body, footer, and divider', () => {
    const { getByText } = render(
      <Card>
        <CardHeader title="Test Title" />
        <CardBody><></></CardBody>
        <CardDivider />
        <CardFooter><></></CardFooter>
      </Card>,
    );
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('pressable variant calls onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Card variant="pressable" onPress={onPress} testID="press-card">
        <CardBody><></></CardBody>
      </Card>,
    );
    fireEvent.press(getByTestId('press-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pressable variant has button accessibility role', () => {
    const { getByRole } = render(
      <Card variant="pressable" onPress={() => {}} accessibilityLabel="View details">
        <CardBody><></></CardBody>
      </Card>,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/ui/Card/__tests__/Card.test.tsx --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement base Card component**

Create `src/shared/ui/Card/Card.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../lib/use-theme';
import { FONTS, type ThemeColors } from '../../config/theme';
import { useCardPressScale } from './card-animations';
import { type CardProps, type CardHeaderProps, type CardBodyProps, type CardFooterProps, type CardVariant, CARD_SIZE_MAP } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  variant = 'elevated',
  size = 'md',
  onPress,
  accessibilityLabel,
  testID,
  style,
  children,
}: CardProps) {
  const { colors, highContrast, isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useCardPressScale();
  const sizeConfig = CARD_SIZE_MAP[size];

  const isPressable = variant === 'pressable' && onPress;
  const effectiveVariant = highContrast && variant === 'gradient' ? 'filled' : variant;

  const baseStyle = {
    padding: sizeConfig.padding,
    borderRadius: sizeConfig.borderRadius,
    ...getVariantStyle(effectiveVariant, colors, highContrast),
  };

  // Gradient variant
  if (effectiveVariant === 'gradient' && !highContrast) {
    return (
      <LinearGradient
        colors={isDark ? [colors.accent + '30', colors.surface] : [colors.accent + '15', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[baseStyle, style]}
        testID={testID}
      >
        {children}
      </LinearGradient>
    );
  }

  // Pressable variant
  if (isPressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[baseStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  // Static card
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[baseStyle, style]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ icon, title, action }: CardHeaderProps) {
  const { colors, typography } = useTheme();
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center flex-1">
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={colors.accent}
            style={styles.headerIcon}
          />
        )}
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.lg,
            fontFamily: FONTS.bold,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

export function CardBody({ children }: CardBodyProps) {
  return <View>{children}</View>;
}

export function CardFooter({ children }: CardFooterProps) {
  return <View className="flex-row items-center justify-end mt-3">{children}</View>;
}

export function CardDivider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVariantStyle(variant: CardVariant, colors: ThemeColors, highContrast: boolean) {
  const base: Record<string, unknown> = { backgroundColor: colors.surface };

  switch (variant) {
    case 'elevated':
      return {
        ...base,
        ...(!highContrast
          ? Platform.select({
              ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.shadowOpacity, shadowRadius: 8 },
              android: { elevation: 3 },
            })
          : { borderWidth: 2, borderColor: colors.textPrimary }),
      };
    case 'outline':
      return {
        ...base,
        borderWidth: highContrast ? 2 : 1,
        borderColor: highContrast ? colors.textPrimary : colors.border,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'filled':
      return { backgroundColor: colors.accent + '15' };
    case 'pressable':
      return {
        ...base,
        ...(!highContrast
          ? Platform.select({
              ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.shadowOpacity, shadowRadius: 8 },
              android: { elevation: 3 },
            })
          : { borderWidth: 2, borderColor: colors.textPrimary }),
      };
    default:
      return base;
  }
}

const styles = StyleSheet.create({
  headerIcon: {
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
```

- [ ] **Step 4: Create barrel export**

Create `src/shared/ui/Card/index.ts`:

```typescript
export { Card, CardHeader, CardBody, CardFooter, CardDivider } from './Card';
// Uncomment these in Task 6:
// export { StatCard } from './StatCard';
// export { ListCard } from './ListCard';
// export { CollapsibleCard } from './CollapsibleCard';
// Uncomment these in Task 7:
// export { CardGroup } from './CardGroup';
// export { SkeletonCard } from './SkeletonCard';
export { useCollapse, useShimmer, useCardPressScale } from './card-animations';
export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardVariant,
  CardSize,
  StatCardProps,
  ListCardProps,
  CollapsibleCardProps,
  CardGroupProps,
  SkeletonCardProps,
} from './types';
```

Note: Comment out the specialized card exports until Tasks 6-7 create the files. Uncomment them in the respective tasks.

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/shared/ui/Card/__tests__/Card.test.tsx --no-cache
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/Card/
git commit -m "feat(ui): add base Card component with 6 variants"
```

---

## Task 6: Specialized Cards — StatCard, ListCard, CollapsibleCard

**Files:**
- Create: `src/shared/ui/Card/StatCard.tsx`
- Create: `src/shared/ui/Card/ListCard.tsx`
- Create: `src/shared/ui/Card/CollapsibleCard.tsx`
- Test: `src/shared/ui/Card/__tests__/StatCard.test.tsx`

- [ ] **Step 1: Write failing test for StatCard**

Create `src/shared/ui/Card/__tests__/StatCard.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { StatCard } from '../StatCard';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withSpring: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { accent: '#0D9488', surface: '#fff', textPrimary: '#1a1a2e', textSecondary: '#64748b', border: '#e5e7eb', borderLight: '#f1f5f9', shadow: '#000', shadowOpacity: 0.1, successText: '#16a34a', background: '#EDF5F0' },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${params.label} ${params.value} ${params.unit || ''}`.trim() : key,
  }),
}));

describe('StatCard', () => {
  it('renders value, unit, and label', () => {
    const { getByText } = render(
      <StatCard value="128" unit="mmHg" label="Avg Systolic" />,
    );
    expect(getByText('128')).toBeTruthy();
    expect(getByText('mmHg')).toBeTruthy();
    expect(getByText('Avg Systolic')).toBeTruthy();
  });

  it('renders trend indicator when provided', () => {
    const { getByText } = render(
      <StatCard value="128" label="Avg" trend="down" trendValue="-3" />,
    );
    expect(getByText('-3')).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(
      <StatCard value="128" unit="mmHg" label="Avg Systolic" trend="down" trendValue="-3" />,
    );
    // t() returns the key in test (mocked), so verify the component renders with accessible prop
    const el = getByLabelText(/Avg Systolic/);
    expect(el).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/ui/Card/__tests__/StatCard.test.tsx --no-cache
```

Expected: FAIL

- [ ] **Step 3: Implement StatCard**

Create `src/shared/ui/Card/StatCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/use-theme';
import { FONTS } from '../../config/theme';
import { Card, CardBody } from './Card';
import type { StatCardProps } from './types';

const TREND_ICONS = {
  up: 'arrow-up',
  down: 'arrow-down',
  stable: 'remove',
} as const;

export function StatCard({
  value,
  unit,
  label,
  trend,
  trendValue,
  trendColor,
  testID,
}: StatCardProps) {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  const resolvedTrendColor = trendColor || colors.textSecondary;

  const a11yLabel = trend && trendValue
    ? t('shared.statCard.a11yWithTrend', { label, value, unit: unit || '', trend, trendValue })
    : t('shared.statCard.a11y', { label, value, unit: unit || '' });

  return (
    <Card testID={testID}>
      <CardBody>
        <View accessibilityLabel={a11yLabel} accessible>
          <View style={styles.valueRow}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography['2xl'],
                fontFamily: FONTS.extraBold,
                fontWeight: '800',
              }}
            >
              {value}
            </Text>
            {unit && (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.sm,
                  fontFamily: FONTS.medium,
                  fontWeight: '500',
                  marginLeft: 4,
                  alignSelf: 'flex-end',
                  marginBottom: 4,
                }}
              >
                {unit}
              </Text>
            )}
            {trend && trendValue && (
              <View style={[styles.trendBadge, { backgroundColor: resolvedTrendColor + '15' }]}>
                <Icon name={TREND_ICONS[trend]} size={12} color={resolvedTrendColor} />
                <Text
                  style={{
                    color: resolvedTrendColor,
                    fontSize: typography.xs,
                    fontFamily: FONTS.semiBold,
                    fontWeight: '600',
                    marginLeft: 2,
                  }}
                >
                  {trendValue}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sm,
              fontFamily: FONTS.medium,
              fontWeight: '500',
              marginTop: 4,
            }}
          >
            {label}
          </Text>
        </View>
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'center',
  },
});
```

- [ ] **Step 4: Implement ListCard**

Create `src/shared/ui/Card/ListCard.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/use-theme';
import { Card, CardHeader, CardBody, CardDivider } from './Card';
import type { ListCardProps } from './types';

export function ListCard<T>({
  title,
  icon,
  items,
  renderItem,
  maxItems = 20,
  variant = 'elevated',
  testID,
}: ListCardProps<T>) {
  const { colors } = useTheme();
  const displayItems = items.slice(0, maxItems);

  return (
    <Card variant={variant === 'outline' ? 'outline' : 'elevated'} testID={testID}>
      <CardHeader icon={icon} title={title} />
      <CardBody>
        {displayItems.map((item, index) => (
          <View key={index}>
            {index > 0 && <CardDivider />}
            {renderItem(item, index)}
          </View>
        ))}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 5: Implement CollapsibleCard**

Create `src/shared/ui/Card/CollapsibleCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/use-theme';
import { FONTS } from '../../config/theme';
import { Card } from './Card';
import { useCollapse } from './card-animations';
import type { CollapsibleCardProps } from './types';

export function CollapsibleCard({
  title,
  defaultExpanded = false,
  children,
  testID,
}: CollapsibleCardProps) {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  const { toggle, expanded, animatedStyle } = useCollapse(defaultExpanded);

  return (
    <Card testID={testID}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        accessibilityHint={t('shared.collapsibleCard.hint')}
        style={styles.header}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.lg,
            fontFamily: FONTS.bold,
            fontWeight: '700',
            flex: 1,
          }}
        >
          {title}
        </Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      <Animated.View style={[styles.content, animatedStyle]}>
        {children}
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  content: {
    overflow: 'hidden',
    marginTop: 8,
  },
});
```

- [ ] **Step 6: Write tests for CollapsibleCard and ListCard**

Add to `src/shared/ui/Card/__tests__/CollapsibleCard.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CollapsibleCard } from '../CollapsibleCard';
import { Text } from 'react-native';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withSpring: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { accent: '#0D9488', surface: '#fff', textPrimary: '#1a1a2e', textSecondary: '#64748b', border: '#e5e7eb', borderLight: '#f1f5f9', shadow: '#000', shadowOpacity: 0.1, background: '#EDF5F0' },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CollapsibleCard', () => {
  it('renders title', () => {
    const { getByText } = render(
      <CollapsibleCard title="Details"><Text>Content</Text></CollapsibleCard>,
    );
    expect(getByText('Details')).toBeTruthy();
  });

  it('has correct accessibility state', () => {
    const { getByRole } = render(
      <CollapsibleCard title="Details" defaultExpanded={false}><Text>Content</Text></CollapsibleCard>,
    );
    const btn = getByRole('button');
    expect(btn.props.accessibilityState).toEqual({ expanded: false });
  });

  it('toggles expanded state on press', () => {
    const { getByRole } = render(
      <CollapsibleCard title="Details"><Text>Content</Text></CollapsibleCard>,
    );
    fireEvent.press(getByRole('button'));
    expect(getByRole('button').props.accessibilityState).toEqual({ expanded: true });
  });
});
```

Add to `src/shared/ui/Card/__tests__/ListCard.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ListCard } from '../ListCard';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withSpring: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { accent: '#0D9488', surface: '#fff', textPrimary: '#1a1a2e', textSecondary: '#64748b', border: '#e5e7eb', borderLight: '#f1f5f9', shadow: '#000', shadowOpacity: 0.1, background: '#EDF5F0' },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('ListCard', () => {
  it('renders title and items', () => {
    const items = ['Alpha', 'Beta'];
    const { getByText } = render(
      <ListCard title="Items" items={items} renderItem={(item) => <Text>{item}</Text>} />,
    );
    expect(getByText('Items')).toBeTruthy();
    expect(getByText('Alpha')).toBeTruthy();
    expect(getByText('Beta')).toBeTruthy();
  });

  it('respects maxItems', () => {
    const items = ['A', 'B', 'C', 'D'];
    const { queryByText } = render(
      <ListCard title="Items" items={items} maxItems={2} renderItem={(item) => <Text>{item}</Text>} />,
    );
    expect(queryByText('A')).toBeTruthy();
    expect(queryByText('B')).toBeTruthy();
    expect(queryByText('C')).toBeNull();
  });
});
```

- [ ] **Step 7: Run all Card tests**

```bash
npx jest src/shared/ui/Card/__tests__/ --no-cache
```

Expected: PASS (all StatCard, CollapsibleCard, ListCard tests)

- [ ] **Step 8: Uncomment specialized card exports in Card/index.ts**

In `src/shared/ui/Card/index.ts`, uncomment the StatCard, ListCard, and CollapsibleCard export lines that were commented out in Task 5.

- [ ] **Step 9: Commit**

```bash
git add src/shared/ui/Card/StatCard.tsx src/shared/ui/Card/ListCard.tsx src/shared/ui/Card/CollapsibleCard.tsx src/shared/ui/Card/__tests__/ src/shared/ui/Card/index.ts
git commit -m "feat(ui): add StatCard, ListCard, and CollapsibleCard"
```

---

## Task 7: Specialized Cards — CardGroup and SkeletonCard

**Files:**
- Create: `src/shared/ui/Card/CardGroup.tsx`
- Create: `src/shared/ui/Card/SkeletonCard.tsx`
- Test: `src/shared/ui/Card/__tests__/SkeletonCard.test.tsx`

- [ ] **Step 1: Write failing test for SkeletonCard**

Create `src/shared/ui/Card/__tests__/SkeletonCard.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonCard } from '../SkeletonCard';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return { ...Reanimated, useSharedValue: jest.fn((init) => ({ value: init })), useAnimatedStyle: jest.fn(() => ({})), withRepeat: jest.fn((val) => val), withSequence: jest.fn((val) => val), withTiming: jest.fn((val) => val) };
});
jest.mock('../../../lib/use-theme', () => ({
  useTheme: () => ({
    colors: { surface: '#fff', border: '#e5e7eb', borderLight: '#f1f5f9', shadow: '#000', shadowOpacity: 0.1, textPrimary: '#1a1a2e', textSecondary: '#64748b', accent: '#0D9488', background: '#EDF5F0' },
    typography: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56 },
    isDark: false, highContrast: false, fontScale: 1,
  }),
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('SkeletonCard', () => {
  it('renders the specified number of lines', () => {
    const { getByTestId } = render(
      <SkeletonCard lines={4} testID="skeleton" />,
    );
    expect(getByTestId('skeleton')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/ui/Card/__tests__/SkeletonCard.test.tsx --no-cache
```

Expected: FAIL

- [ ] **Step 3: Implement CardGroup**

Create `src/shared/ui/Card/CardGroup.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import type { CardGroupProps } from './types';

export function CardGroup({
  direction = 'row',
  children,
  testID,
}: CardGroupProps) {
  return (
    <View
      testID={testID}
      className="gap-2"
      style={{ flexDirection: direction }}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Implement SkeletonCard**

Create `src/shared/ui/Card/SkeletonCard.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../lib/use-theme';
import { Card, CardBody } from './Card';
import { useShimmer } from './card-animations';
import type { SkeletonCardProps } from './types';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function SkeletonCard({
  variant = 'elevated',
  lines = 3,
  testID,
}: SkeletonCardProps) {
  const { colors } = useTheme();
  const { shimmerStyle, reduceMotion } = useShimmer();

  const lineWidths = generateLineWidths(lines);

  return (
    <Card variant={variant === 'outline' ? 'outline' : 'elevated'} testID={testID}>
      <CardBody>
        {lineWidths.map((width, i) => (
          <View
            key={i}
            style={[
              styles.line,
              {
                width,
                backgroundColor: colors.border + '40',
                marginBottom: i < lines - 1 ? 10 : 0,
              },
            ]}
          >
            {!reduceMotion && (
              <AnimatedGradient
                colors={['transparent', colors.surface + '60', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, shimmerStyle]}
              />
            )}
          </View>
        ))}
      </CardBody>
    </Card>
  );
}

function generateLineWidths(count: number): string[] {
  const widths = ['100%', '85%', '70%', '90%', '60%'];
  return Array.from({ length: count }, (_, i) => widths[i % widths.length]);
}

const styles = StyleSheet.create({
  line: {
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 5: Write test for CardGroup**

Create `src/shared/ui/Card/__tests__/CardGroup.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CardGroup } from '../CardGroup';

describe('CardGroup', () => {
  it('renders children', () => {
    const { getByText } = render(
      <CardGroup><Text>Child A</Text><Text>Child B</Text></CardGroup>,
    );
    expect(getByText('Child A')).toBeTruthy();
    expect(getByText('Child B')).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run all Card tests**

```bash
npx jest src/shared/ui/Card/__tests__/ --no-cache
```

Expected: PASS (all tests)

- [ ] **Step 7: Uncomment remaining exports in Card/index.ts**

In `src/shared/ui/Card/index.ts`, uncomment the CardGroup and SkeletonCard export lines that were commented out in Task 5.

- [ ] **Step 8: Commit**

```bash
git add src/shared/ui/Card/CardGroup.tsx src/shared/ui/Card/SkeletonCard.tsx src/shared/ui/Card/__tests__/SkeletonCard.test.tsx src/shared/ui/Card/__tests__/CardGroup.test.tsx src/shared/ui/Card/index.ts
git commit -m "feat(ui): add CardGroup and SkeletonCard with shimmer animation"
```

---

## Task 8: Update Barrel Exports + Type Check

**Files:**
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Update shared/ui barrel exports**

Add Button and Card exports to `src/shared/ui/index.ts`:

```typescript
// Existing exports (lines 1-14) stay unchanged
// Add at the end:

// Button system
export { Button, ButtonText, ButtonIcon, ButtonSpinner } from './Button';
export { ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonGroupProps } from './Button';

// Card system
export { Card, CardHeader, CardBody, CardFooter, CardDivider } from './Card';
export { StatCard } from './Card';
export { ListCard } from './Card';
export { CollapsibleCard } from './Card';
export { CardGroup } from './Card';
export { SkeletonCard } from './Card';
export type { CardProps, CardVariant, CardSize, StatCardProps, ListCardProps, CollapsibleCardProps, CardGroupProps, SkeletonCardProps } from './Card';
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No errors. Fix any TypeScript issues before proceeding.

- [ ] **Step 3: Run lint**

```bash
npx eslint src/shared/ui/Button/ src/shared/ui/Card/ --ext .ts,.tsx
```

Expected: No errors. Fix any lint issues.

- [ ] **Step 4: Run all tests**

```bash
npx jest src/shared/ui/ --no-cache
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/index.ts
git commit -m "feat(ui): export Button and Card systems from shared/ui barrel"
```

---

## Task 9: Full Test Suite + Manual Verification

**Files:**
- No new files; verify everything works end-to-end.

- [ ] **Step 1: Run complete test suite**

```bash
npm test
```

Expected: All existing tests still pass, all new tests pass.

- [ ] **Step 2: Run type check on full project**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No errors.

- [ ] **Step 3: Verify Android build**

```bash
npx react-native run-android
```

Expected: App builds and runs. NativeWind classes work. No runtime crashes.

- [ ] **Step 4: Verify iOS build (if on macOS)**

```bash
cd ios && pod install && cd .. && npx react-native run-ios
```

Expected: App builds and runs.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: finalize Card & Button component system"
```

---

## Deferred Enhancements (Post-MVP)

These spec features are intentionally deferred from the initial implementation to keep the core shippable. Each can be added in a follow-up PR:

1. **Android ripple animation** — `useRipple` hook with expanding circle SharedValue from touch coordinates (spec Section 3.5). Currently Android uses same scale animation as iOS.
2. **Loading crossfade animation** — `withTiming` opacity transition between content and spinner (spec Section 3.5). Currently uses instant swap.
3. **Focus ring state** — 2px accent outline on focus, especially prominent in high-contrast mode (spec Section 3.3). Requires keyboard/accessibility focus tracking.
4. **Card entry fade animation** — Staggered `FadeInUp.delay(index * 50)` on mount (spec Section 4.6). Currently cards appear instantly.
5. **CardGroup shared border radius** — Visually connected cards with shared outer border radius and removed inner radii (spec Section 4.2). Currently just a gap-spaced container.
6. **CardGroup stagger mount animation** — Children animate in sequence on mount (spec Section 4.6).

## Summary

| Task | Components | Tests |
|---|---|---|
| 0 | NativeWind + Gluestack foundation | Build verification |
| 1 | Button types + animation hooks | button-animations.test.ts |
| 2 | Button main component | Button.test.tsx |
| 3 | ButtonGroup | ButtonGroup.test.tsx |
| 4 | Card types + animation hooks | card-animations.test.ts |
| 5 | Card base component | Card.test.tsx |
| 6 | StatCard, ListCard, CollapsibleCard | StatCard, ListCard, CollapsibleCard tests |
| 7 | CardGroup, SkeletonCard | SkeletonCard, CardGroup tests |
| 8 | Barrel exports + type check | Full lint + typecheck |
| 9 | Full suite + build verification | All tests + builds |
