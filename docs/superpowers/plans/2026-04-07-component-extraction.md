# Component Extraction & Reuse — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract 12 new shared/ui components, replace 20+ inline Card/Button builds with existing components, and merge NewReadingPage + QuickLogPage into a shared BPReadingForm widget.

**Architecture:** Impact-first — Phase 1 creates new components and adopts them in all files, Phase 2 replaces inline builds of existing shared/ui components, Phase 3 merges the near-duplicate reading pages into a shared widget. Each phase is independently shippable.

**Tech Stack:** React Native CLI 0.76+, TypeScript strict, @testing-library/react-native for tests, react-native-vector-icons/Ionicons, FONTS constant (Nunito family), useTheme() for all colors/typography — no hardcoded values.

---

## File Structure

**New files — Phase 1 (12 components):**
- `src/shared/ui/SettingRow/index.tsx` — toggle row: label + optional description + Switch
- `src/shared/ui/SettingRow/__tests__/SettingRow.test.tsx`
- `src/shared/ui/ProfileBadgeRow/index.tsx` — horizontal icon+text badge chips with gap
- `src/shared/ui/ProfileBadgeRow/__tests__/ProfileBadgeRow.test.tsx`
- `src/shared/ui/MenuItem/index.tsx` — icon circle + label + optional subtitle + chevron
- `src/shared/ui/MenuItem/__tests__/MenuItem.test.tsx`
- `src/shared/ui/FormField/index.tsx` — label + TextInput or Pressable picker row
- `src/shared/ui/FormField/__tests__/FormField.test.tsx`
- `src/shared/ui/EmptyState/index.tsx` — centered icon + title + subtitle + optional action
- `src/shared/ui/EmptyState/__tests__/EmptyState.test.tsx`
- `src/shared/ui/LoadingState/index.tsx` — centered ActivityIndicator + optional text
- `src/shared/ui/LoadingState/__tests__/LoadingState.test.tsx`
- `src/shared/ui/ErrorState/index.tsx` — centered error icon + title + subtitle + optional retry
- `src/shared/ui/ErrorState/__tests__/ErrorState.test.tsx`
- `src/shared/ui/DetailChip/index.tsx` — small icon + text chip with border (metadata display)
- `src/shared/ui/DetailChip/__tests__/DetailChip.test.tsx`
- `src/shared/ui/SectionHeader/index.tsx` — uppercase semibold section label
- `src/shared/ui/SectionHeader/__tests__/SectionHeader.test.tsx`
- `src/shared/ui/PeriodSelector/index.tsx` — horizontal scrollable OptionChip row for date periods
- `src/shared/ui/PeriodSelector/__tests__/PeriodSelector.test.tsx`
- `src/shared/ui/InfoBanner/index.tsx` — colored detection/alert banner with icon + title + body
- `src/shared/ui/InfoBanner/__tests__/InfoBanner.test.tsx`
- `src/shared/ui/InfoHintRow/index.tsx` — subtle icon + single-line hint text
- `src/shared/ui/InfoHintRow/__tests__/InfoHintRow.test.tsx`

**New files — Phase 3:**
- `src/widgets/bp-reading-form/ui/BPReadingForm.tsx` — shared form UI
- `src/widgets/bp-reading-form/lib/use-bp-reading-form.ts` — extracted hook
- `src/widgets/bp-reading-form/index.ts` — barrel export

**Modified files — Phase 1 (adopt new components):**
- `src/shared/ui/index.ts` — add 12 new exports
- `src/pages/settings/ui/AppSettingsPage.tsx` — SettingRow ×3
- `src/pages/settings/ui/SyncPage.tsx` — SettingRow ×2
- `src/pages/settings/ui/WeatherSettingsPage.tsx` — SettingRow ×1
- `src/pages/analytics/ui/AnalyticsPage.tsx` — SettingRow ×4+, PeriodSelector, InfoHintRow, ProfileBadgeRow
- `src/pages/history/ui/HistoryPage.tsx` — SettingRow ×2+, PeriodSelector, ProfileBadgeRow
- `src/pages/family-sharing/ui/SharingSettingsPage.tsx` — SettingRow ×5+, EmptyState, SectionHeader
- `src/pages/settings/ui/SettingsPage.tsx` — MenuItem ×6, ProfileBadgeRow
- `src/pages/home/ui/HomePage.tsx` — ProfileBadgeRow
- `src/pages/settings/ui/PersonalInfoPage.tsx` — FormField ×7+
- `src/widgets/bp-records-list/ui/BPRecordsList.tsx` — EmptyState, LoadingState, ErrorState, SectionHeader
- `src/pages/medications/ui/MedicationPage.tsx` — EmptyState, LoadingState, ErrorState
- `src/pages/edit-reading/ui/EditReadingPage.tsx` — LoadingState
- `src/pages/family-sharing/ui/AcceptInvitePage.tsx` — LoadingState
- `src/widgets/bp-record-card/ui/BPRecordCard.tsx` — DetailChip ×7+
- `src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx` — DetailChip
- `src/pages/settings/ui/ClassificationPage.tsx` — InfoBanner

**Modified files — Phase 2 (adopt existing components):**
- `src/pages/settings/ui/AppSettingsPage.tsx` — CardHeader for section headers
- `src/pages/settings/ui/SyncPage.tsx` — CardHeader for section headers
- `src/pages/settings/ui/WeatherSettingsPage.tsx` — CardHeader for section headers
- `src/pages/settings/ui/SettingsPage.tsx` — Card variant="pressable" for aboutCard
- `src/pages/medications/ui/MedicationPage.tsx` — Card, Button
- `src/pages/family-sharing/ui/AcceptInvitePage.tsx` — Button
- `src/pages/family-sharing/ui/SharingSettingsPage.tsx` — Button

**Modified files — Phase 3:**
- `src/pages/new-reading/ui/NewReadingPage.tsx` — refactor to ~50-line shell
- `src/pages/quick-log/ui/QuickLogPage.tsx` — refactor to ~50-line shell

---

## Shared Test Mock

Every component test in this plan uses these mocks. Copy them verbatim.

```typescript
const mockTheme = {
  colors: {
    accent: '#0D9488',
    surface: '#ffffff',
    surfaceSecondary: '#f8fafc',
    textPrimary: '#1a1a2e',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e5e7eb',
    borderLight: '#f1f5f9',
    error: '#dc2626',
    shadow: '#000',
    shadowOpacity: 0.1,
    background: '#EDF5F0',
    toggleTrackActive: '#0D9488',
    toggleTrackInactive: '#d1d5db',
    toggleThumb: '#ffffff',
    iconCircleBg: 'rgba(13,148,136,0.12)',
  },
  typography: {xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, hero: 56},
  isDark: false,
  highContrast: false,
  fontScale: 1,
  seniorMode: false,
  touchTargetSize: 44,
  interactiveSpacing: 8,
};
jest.mock('../../../lib/use-theme', () => ({useTheme: () => mockTheme}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
```

---

## Phase 1 — Create New Components

### Task 1: SettingRow

**Files:**
- Create: `src/shared/ui/SettingRow/index.tsx`
- Create: `src/shared/ui/SettingRow/__tests__/SettingRow.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/ui/SettingRow/__tests__/SettingRow.test.tsx
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd "c:\Users\fuats\Desktop\Workdir\MedTracker"
npx jest src/shared/ui/SettingRow --no-coverage
```

Expected: `Cannot find module '../index'`

- [ ] **Step 3: Implement SettingRow**

```typescript
// src/shared/ui/SettingRow/index.tsx
import React from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: string;
  iconColor?: string;
}

export function SettingRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  iconColor,
}: SettingRowProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconCircle, {backgroundColor: colors.iconCircleBg}]}>
          <Icon name={icon} size={18} color={iconColor ?? colors.accent} />
        </View>
      )}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            {color: colors.textPrimary, fontSize: typography.sm},
          ]}>
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.toggleTrackInactive,
          true: colors.toggleTrackActive,
        }}
        thumbColor={colors.toggleThumb}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{checked: value, disabled}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {flex: 1},
  label: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  description: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
});
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest src/shared/ui/SettingRow --no-coverage
```

Expected: `5 passed`

- [ ] **Step 5: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {SettingRow} from './SettingRow';
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/SettingRow/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add SettingRow component"
```

---

### Task 2: ProfileBadgeRow

**Files:**
- Create: `src/shared/ui/ProfileBadgeRow/index.tsx`
- Create: `src/shared/ui/ProfileBadgeRow/__tests__/ProfileBadgeRow.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/ui/ProfileBadgeRow/__tests__/ProfileBadgeRow.test.tsx
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx jest src/shared/ui/ProfileBadgeRow --no-coverage
```

Expected: `Cannot find module '../index'`

- [ ] **Step 3: Implement ProfileBadgeRow**

```typescript
// src/shared/ui/ProfileBadgeRow/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface Badge {
  icon: string;
  label: string;
}

interface ProfileBadgeRowProps {
  badges: Badge[];
}

export function ProfileBadgeRow({badges}: ProfileBadgeRowProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.row}>
      {badges.map((badge, index) => (
        <View
          key={index}
          style={[styles.badge, {backgroundColor: colors.surfaceSecondary}]}>
          <Icon name={badge.icon} size={12} color={colors.textTertiary} />
          <Text
            style={[
              styles.badgeText,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest src/shared/ui/ProfileBadgeRow --no-coverage
```

Expected: `3 passed`

- [ ] **Step 5: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {ProfileBadgeRow} from './ProfileBadgeRow';
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/ProfileBadgeRow/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add ProfileBadgeRow component"
```

---

### Task 3: MenuItem

**Files:**
- Create: `src/shared/ui/MenuItem/index.tsx`
- Create: `src/shared/ui/MenuItem/__tests__/MenuItem.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/ui/MenuItem/__tests__/MenuItem.test.tsx
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {MenuItem} from '../index';

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
jest.mock('react-native-reanimated', () => {
  const createAnimatedComponent = (c: any) => c;
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    useSharedValue: jest.fn(init => ({value: init})),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(v => v),
    withTiming: jest.fn(v => v),
    createAnimatedComponent,
  };
});

describe('MenuItem', () => {
  it('renders label', () => {
    const {getByText} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={jest.fn()} />,
    );
    expect(getByText('Personal Info')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const {getByText} = render(
      <MenuItem icon="person-outline" label="Personal Info" subtitle="John, 45" onPress={jest.fn()} />,
    );
    expect(getByText('John, 45')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const {getByRole} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has button accessibility role and label', () => {
    const {getByLabelText} = render(
      <MenuItem icon="person-outline" label="Personal Info" onPress={jest.fn()} />,
    );
    expect(getByLabelText('Personal Info')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx jest src/shared/ui/MenuItem --no-coverage
```

Expected: `Cannot find module '../index'`

- [ ] **Step 3: Implement MenuItem**

```typescript
// src/shared/ui/MenuItem/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface MenuItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function MenuItem({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
}: MenuItemProps) {
  const {colors, typography} = useTheme();
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={[styles.iconCircle, {backgroundColor: colors.iconCircleBg}]}>
        <Icon name={icon} size={20} color={iconColor ?? colors.accent} />
      </View>
      <View style={styles.textCol}>
        <Text
          style={[
            styles.label,
            {color: colors.textPrimary, fontSize: typography.md},
          ]}>
          {label}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement
        ? rightElement
        : showChevron && (
            <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
          )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {flex: 1},
  label: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
});
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest src/shared/ui/MenuItem --no-coverage
```

Expected: `4 passed`

- [ ] **Step 5: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {MenuItem} from './MenuItem';
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/MenuItem/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add MenuItem component"
```

---

### Task 4: FormField

**Files:**
- Create: `src/shared/ui/FormField/index.tsx`
- Create: `src/shared/ui/FormField/__tests__/FormField.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/ui/FormField/__tests__/FormField.test.tsx
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx jest src/shared/ui/FormField --no-coverage
```

Expected: `Cannot find module '../index'`

- [ ] **Step 3: Implement FormField**

```typescript
// src/shared/ui/FormField/index.tsx
import React from 'react';
import {View, Text, TextInput, StyleSheet, type KeyboardTypeOptions} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

type FormFieldBase = {
  label: string;
  value: string;
};

type TextFormField = FormFieldBase & {
  type?: 'text';
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  onPress?: never;
};

type PressableFormField = FormFieldBase & {
  type: 'pressable';
  onPress: () => void;
  onChangeText?: never;
  placeholder?: never;
  keyboardType?: never;
};

type FormFieldProps = TextFormField | PressableFormField;

export function FormField(props: FormFieldProps) {
  const {colors, typography} = useTheme();
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: typography.md,
    },
  ];

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {props.label}
      </Text>
      {props.type === 'pressable' ? (
        <Pressable
          style={inputStyle}
          onPress={props.onPress}
          accessibilityRole="button"
          accessibilityLabel={props.label}>
          <Text
            style={[
              styles.pressableText,
              {
                color: props.value ? colors.textPrimary : colors.textTertiary,
                fontSize: typography.md,
              },
            ]}>
            {props.value || props.label}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.textTertiary} />
        </Pressable>
      ) : (
        <TextInput
          style={inputStyle}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={props.keyboardType ?? 'default'}
          accessibilityLabel={props.label}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginBottom: 16},
  label: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressableText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest src/shared/ui/FormField --no-coverage
```

Expected: `4 passed`

- [ ] **Step 5: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {FormField} from './FormField';
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/FormField/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add FormField component"
```

---

### Task 5: EmptyState, LoadingState, ErrorState

These three "state" components share the same structure. Create and test all three in one task.

**Files:**
- Create: `src/shared/ui/EmptyState/index.tsx`
- Create: `src/shared/ui/EmptyState/__tests__/EmptyState.test.tsx`
- Create: `src/shared/ui/LoadingState/index.tsx`
- Create: `src/shared/ui/LoadingState/__tests__/LoadingState.test.tsx`
- Create: `src/shared/ui/ErrorState/index.tsx`
- Create: `src/shared/ui/ErrorState/__tests__/ErrorState.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/ui/EmptyState/__tests__/EmptyState.test.tsx
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {EmptyState} from '../index';

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
jest.mock('react-native-reanimated', () => {
  const c = (comp: any) => comp;
  return {__esModule: true, default: {createAnimatedComponent: c},
    useSharedValue: jest.fn(i => ({value: i})), useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(v => v), withTiming: jest.fn(v => v), createAnimatedComponent: c};
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const {getByText} = render(
      <EmptyState icon="💓" title="No readings yet" subtitle="Add your first reading" />,
    );
    expect(getByText('No readings yet')).toBeTruthy();
    expect(getByText('Add your first reading')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onPress = jest.fn();
    const {getByText} = render(
      <EmptyState
        icon="💓" title="No readings" subtitle="Add one"
        action={{label: 'Add Reading', onPress}}
      />,
    );
    expect(getByText('Add Reading')).toBeTruthy();
  });

  it('calls action onPress when button pressed', () => {
    const onPress = jest.fn();
    const {getByText} = render(
      <EmptyState
        icon="💓" title="No readings" subtitle="Add one"
        action={{label: 'Add Reading', onPress}}
      />,
    );
    fireEvent.press(getByText('Add Reading'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

```typescript
// src/shared/ui/LoadingState/__tests__/LoadingState.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import {LoadingState} from '../index';

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

describe('LoadingState', () => {
  it('renders activity indicator', () => {
    const {getByTestId} = render(<LoadingState testID="loading" />);
    expect(getByTestId('loading')).toBeTruthy();
  });

  it('renders message when provided', () => {
    const {getByText} = render(<LoadingState message="Loading readings..." />);
    expect(getByText('Loading readings...')).toBeTruthy();
  });

  it('renders without message', () => {
    const {queryByText} = render(<LoadingState />);
    expect(queryByText('Loading readings...')).toBeNull();
  });
});
```

```typescript
// src/shared/ui/ErrorState/__tests__/ErrorState.test.tsx
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ErrorState} from '../index';

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
jest.mock('react-native-reanimated', () => {
  const c = (comp: any) => comp;
  return {__esModule: true, default: {createAnimatedComponent: c},
    useSharedValue: jest.fn(i => ({value: i})), useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(v => v), withTiming: jest.fn(v => v), createAnimatedComponent: c};
});

describe('ErrorState', () => {
  it('renders title and subtitle', () => {
    const {getByText} = render(
      <ErrorState title="Failed to load" subtitle="Pull to retry" />,
    );
    expect(getByText('Failed to load')).toBeTruthy();
    expect(getByText('Pull to retry')).toBeTruthy();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    const {getByText} = render(
      <ErrorState title="Error" subtitle="Try again" onRetry={onRetry} />,
    );
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('calls onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    const {getByText} = render(
      <ErrorState title="Error" subtitle="Try again" onRetry={onRetry} />,
    );
    fireEvent.press(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest src/shared/ui/EmptyState src/shared/ui/LoadingState src/shared/ui/ErrorState --no-coverage
```

Expected: `Cannot find module` for all three

- [ ] **Step 3: Implement EmptyState**

```typescript
// src/shared/ui/EmptyState/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Button, ButtonText} from '../Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: {label: string; onPress: () => void};
}

export function EmptyState({icon, title, subtitle, action}: EmptyStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[styles.title, {color: colors.textPrimary, fontSize: typography.lg}]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {color: colors.textTertiary, fontSize: typography.sm},
        ]}>
        {subtitle}
      </Text>
      {action && (
        <Button
          variant="secondary"
          size="md"
          onPress={action.onPress}
          style={styles.actionButton}>
          <ButtonText>{action.label}</ButtonText>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  icon: {fontSize: 60, marginBottom: 16},
  title: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  actionButton: {marginTop: 24},
});
```

- [ ] **Step 4: Implement LoadingState**

```typescript
// src/shared/ui/LoadingState/index.tsx
import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface LoadingStateProps {
  message?: string;
  testID?: string;
}

export function LoadingState({message, testID}: LoadingStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size="large" color={colors.accent} />
      {message && (
        <Text
          style={[
            styles.message,
            {color: colors.textSecondary, fontSize: typography.sm},
          ]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  message: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 12,
  },
});
```

- [ ] **Step 5: Implement ErrorState**

```typescript
// src/shared/ui/ErrorState/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Button, ButtonText} from '../Button';

interface ErrorStateProps {
  title: string;
  subtitle: string;
  onRetry?: () => void;
}

export function ErrorState({title, subtitle, onRetry}: ErrorStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Icon name="alert-circle-outline" size={48} color={colors.error} />
      <Text
        style={[styles.title, {color: colors.error, fontSize: typography.lg}]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {subtitle}
      </Text>
      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          onPress={onRetry}
          style={styles.retryButton}>
          <ButtonText>Try Again</ButtonText>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  retryButton: {marginTop: 24},
});
```

- [ ] **Step 6: Run tests — expect all pass**

```bash
npx jest src/shared/ui/EmptyState src/shared/ui/LoadingState src/shared/ui/ErrorState --no-coverage
```

Expected: `9 passed`

- [ ] **Step 7: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {EmptyState} from './EmptyState';
export {LoadingState} from './LoadingState';
export {ErrorState} from './ErrorState';
```

- [ ] **Step 8: Commit**

```bash
git add src/shared/ui/EmptyState/ src/shared/ui/LoadingState/ src/shared/ui/ErrorState/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add EmptyState, LoadingState, ErrorState components"
```

---

### Task 6: DetailChip, SectionHeader

**Files:**
- Create: `src/shared/ui/DetailChip/index.tsx`
- Create: `src/shared/ui/DetailChip/__tests__/DetailChip.test.tsx`
- Create: `src/shared/ui/SectionHeader/index.tsx`
- Create: `src/shared/ui/SectionHeader/__tests__/SectionHeader.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/ui/DetailChip/__tests__/DetailChip.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import {DetailChip} from '../index';

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

describe('DetailChip', () => {
  it('renders the label', () => {
    const {getByText} = render(
      <DetailChip icon="time-outline" label="08:30 AM" />,
    );
    expect(getByText('08:30 AM')).toBeTruthy();
  });

  it('renders without icon when icon is omitted', () => {
    const {getByText} = render(<DetailChip label="Home" />);
    expect(getByText('Home')).toBeTruthy();
  });
});
```

```typescript
// src/shared/ui/SectionHeader/__tests__/SectionHeader.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import {SectionHeader} from '../index';

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

describe('SectionHeader', () => {
  it('renders the title text', () => {
    const {getByText} = render(<SectionHeader title="Today" />);
    expect(getByText('TODAY')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest src/shared/ui/DetailChip src/shared/ui/SectionHeader --no-coverage
```

Expected: `Cannot find module` for both

- [ ] **Step 3: Implement DetailChip**

```typescript
// src/shared/ui/DetailChip/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface DetailChipProps {
  label: string;
  icon?: string;
  color?: string;
}

export function DetailChip({label, icon, color}: DetailChipProps) {
  const {colors, typography} = useTheme();
  const chipColor = color ?? colors.textSecondary;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.borderLight,
        },
      ]}>
      {icon && <Icon name={icon} size={14} color={chipColor} />}
      <Text
        style={[
          styles.label,
          {color: chipColor, fontSize: typography.xs},
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
```

- [ ] **Step 4: Implement SectionHeader**

```typescript
// src/shared/ui/SectionHeader/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({title}: SectionHeaderProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npx jest src/shared/ui/DetailChip src/shared/ui/SectionHeader --no-coverage
```

Expected: `3 passed`

- [ ] **Step 6: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {DetailChip} from './DetailChip';
export {SectionHeader} from './SectionHeader';
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/ui/DetailChip/ src/shared/ui/SectionHeader/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add DetailChip and SectionHeader components"
```

---

### Task 7: PeriodSelector

**Files:**
- Create: `src/shared/ui/PeriodSelector/index.tsx`
- Create: `src/shared/ui/PeriodSelector/__tests__/PeriodSelector.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/ui/PeriodSelector/__tests__/PeriodSelector.test.tsx
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
  const options = ['7d', '14d', '30d', 'all'] as const;

  it('renders all option labels', () => {
    const {getByText} = render(
      <PeriodSelector value="7d" onChange={jest.fn()} options={[...options]} />,
    );
    expect(getByText('7d')).toBeTruthy();
    expect(getByText('14d')).toBeTruthy();
    expect(getByText('30d')).toBeTruthy();
    expect(getByText('all')).toBeTruthy();
  });

  it('calls onChange with pressed option', () => {
    const onChange = jest.fn();
    const {getByText} = render(
      <PeriodSelector value="7d" onChange={onChange} options={[...options]} />,
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx jest src/shared/ui/PeriodSelector --no-coverage
```

Expected: `Cannot find module '../index'`

- [ ] **Step 3: Implement PeriodSelector**

```typescript
// src/shared/ui/PeriodSelector/index.tsx
import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {OptionChip} from '../OptionChip';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  options: string[];
  onCustomPress?: () => void;
}

export function PeriodSelector({
  value,
  onChange,
  options,
  onCustomPress,
}: PeriodSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {options.map(opt => (
        <OptionChip
          key={opt}
          label={opt}
          selected={value === opt}
          onPress={() => (opt === 'custom' && onCustomPress ? onCustomPress() : onChange(opt))}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
});
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest src/shared/ui/PeriodSelector --no-coverage
```

Expected: `3 passed`

- [ ] **Step 5: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {PeriodSelector} from './PeriodSelector';
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/PeriodSelector/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add PeriodSelector component"
```

---

### Task 8: InfoBanner, InfoHintRow

**Files:**
- Create: `src/shared/ui/InfoBanner/index.tsx`
- Create: `src/shared/ui/InfoBanner/__tests__/InfoBanner.test.tsx`
- Create: `src/shared/ui/InfoHintRow/index.tsx`
- Create: `src/shared/ui/InfoHintRow/__tests__/InfoHintRow.test.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/ui/InfoBanner/__tests__/InfoBanner.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import {InfoBanner} from '../index';

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
```

```typescript
// src/shared/ui/InfoHintRow/__tests__/InfoHintRow.test.tsx
import React from 'react';
import {render} from '@testing-library/react-native';
import {InfoHintRow} from '../index';

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

describe('InfoHintRow', () => {
  it('renders the hint text', () => {
    const {getByText} = render(
      <InfoHintRow icon="information-circle-outline" text="Pulse Pressure = SBP − DBP" />,
    );
    expect(getByText('Pulse Pressure = SBP − DBP')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx jest src/shared/ui/InfoBanner src/shared/ui/InfoHintRow --no-coverage
```

Expected: `Cannot find module` for both

- [ ] **Step 3: Implement InfoBanner**

```typescript
// src/shared/ui/InfoBanner/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {FONTS} from '../../config/theme';

interface InfoBannerProps {
  icon: string;
  title: string;
  body: string;
  color: string;
}

export function InfoBanner({icon, title, body, color}: InfoBannerProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color + '12',
          borderColor: color,
        },
      ]}>
      <Icon name={icon} size={20} color={color} style={styles.icon} />
      <View style={styles.textCol}>
        <Text style={[styles.title, {color}]}>{title}</Text>
        <Text style={[styles.body, {color}]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  icon: {marginTop: 1},
  textCol: {flex: 1},
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.85,
  },
});
```

- [ ] **Step 4: Implement InfoHintRow**

```typescript
// src/shared/ui/InfoHintRow/index.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface InfoHintRowProps {
  icon: string;
  text: string;
  color?: string;
}

export function InfoHintRow({icon, text, color}: InfoHintRowProps) {
  const {colors, typography} = useTheme();
  const chipColor = color ?? colors.textSecondary;
  return (
    <View
      style={[
        styles.container,
        {backgroundColor: chipColor + '12'},
      ]}>
      <Icon name={icon} size={14} color={chipColor} />
      <Text
        style={[
          styles.text,
          {color: chipColor, fontSize: typography.xs},
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npx jest src/shared/ui/InfoBanner src/shared/ui/InfoHintRow --no-coverage
```

Expected: `2 passed`

- [ ] **Step 6: Export from index.ts**

Add to `src/shared/ui/index.ts`:
```typescript
export {InfoBanner} from './InfoBanner';
export {InfoHintRow} from './InfoHintRow';
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/ui/InfoBanner/ src/shared/ui/InfoHintRow/ src/shared/ui/index.ts
git commit -m "feat(shared/ui): add InfoBanner and InfoHintRow components"
```

- [ ] **Step 8: Run full shared/ui test suite**

```bash
npx jest src/shared/ui --no-coverage
```

Expected: All 12 new component tests pass alongside existing Card and Button tests.

---

## Phase 1 — Adopt New Components

### Task 9: Adopt SettingRow in Settings Pages

Replace inline `View(settingRow) + View(settingInfo) + Text(label) + Text(description) + Switch` with `<SettingRow>` in AppSettingsPage, SyncPage, and WeatherSettingsPage.

**Files:**
- Modify: `src/pages/settings/ui/AppSettingsPage.tsx`
- Modify: `src/pages/settings/ui/SyncPage.tsx`
- Modify: `src/pages/settings/ui/WeatherSettingsPage.tsx`

- [ ] **Step 1: Update AppSettingsPage imports**

At the top of `src/pages/settings/ui/AppSettingsPage.tsx`, add `SettingRow` to the shared/ui import:
```typescript
// Before:
import { Card, CardBody, OptionChip } from '../../../shared/ui';
// After:
import { Card, CardBody, OptionChip, SettingRow } from '../../../shared/ui';
```

- [ ] **Step 2: Replace Senior Mode settingRow in AppSettingsPage**

Find (approximately lines 215–232):
```tsx
<View style={styles.settingRow}>
  <View style={styles.settingInfo}>
    <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
      {t('settings.seniorMode.label')}
    </Text>
    <Text style={[styles.settingDescription, { color: colors.textSecondary, fontSize: typography.xs }]}>
      {t('settings.seniorMode.description')}
    </Text>
  </View>
  <Switch
    value={seniorMode}
    onValueChange={handleSeniorModeToggle}
    trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
    thumbColor={colors.toggleThumb}
    accessibilityRole="switch"
    accessibilityLabel={t('settings.seniorMode.label')}
  />
</View>
```

Replace with:
```tsx
<SettingRow
  label={t('settings.seniorMode.label')}
  description={t('settings.seniorMode.description')}
  value={seniorMode}
  onValueChange={handleSeniorModeToggle}
/>
```

- [ ] **Step 3: Replace High Contrast and Voice Logging settingRows in AppSettingsPage**

Apply the same pattern for the High Contrast row (lines ~241–265) and Voice Logging row (lines ~272–290). Each becomes:
```tsx
<SettingRow
  label={t('settings.highContrast.label')}
  description={t('settings.highContrast.description')}
  value={highContrast}
  onValueChange={handleHighContrastToggle}
/>
```
```tsx
<SettingRow
  label={t('settings.voiceLogging.label')}
  description={t('settings.voiceLogging.description')}
  value={voiceLogging}
  onValueChange={setVoiceLogging}
/>
```

Remove `Switch` from imports in AppSettingsPage after replacing all instances (verify no other Switch usage first with Grep).

- [ ] **Step 4: Update SyncPage — add SettingRow import and replace rows**

In `src/pages/settings/ui/SyncPage.tsx`:
```typescript
// Add SettingRow to shared/ui import
import { Card, CardBody, CardHeader, SettingRow } from '../../../shared/ui';
```

Replace each `View(settingRow) + ... + Switch` block with the corresponding `<SettingRow>` call (2 instances). Use the actual `t()` keys and state variables from the existing code.

- [ ] **Step 5: Update WeatherSettingsPage — add SettingRow import and replace row**

In `src/pages/settings/ui/WeatherSettingsPage.tsx`:
```typescript
import { Card, CardBody, CardHeader, SettingRow } from '../../../shared/ui';
```

Replace the master toggle settingRow block with:
```tsx
<SettingRow
  label={t('settings.weather.masterToggle.label')}
  description={t('settings.weather.masterToggle.description')}
  value={weatherEnabled}
  onValueChange={setWeatherEnabled}
/>
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/settings/ui/AppSettingsPage.tsx src/pages/settings/ui/SyncPage.tsx src/pages/settings/ui/WeatherSettingsPage.tsx
git commit -m "feat(settings): adopt SettingRow in settings pages"
```

---

### Task 10: Adopt SettingRow in Analytics, History, SharingSettings

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/history/ui/HistoryPage.tsx`
- Modify: `src/pages/family-sharing/ui/SharingSettingsPage.tsx`

- [ ] **Step 1: AnalyticsPage — add import and replace toggle rows**

In `src/pages/analytics/ui/AnalyticsPage.tsx`, add `SettingRow` to the shared/ui import.

Find each `View(styles.toggleRow)` + `View(labelCol)` + `Text(label)` + `Switch` block (PP toggle, MAP toggle, approximately lines 257–284) and replace each with:
```tsx
<SettingRow
  label={t('analytics.showPP')}
  value={showPP}
  onValueChange={setShowPP}
/>
```
```tsx
<SettingRow
  label={t('analytics.showMAP')}
  value={showMAP}
  onValueChange={setShowMAP}
/>
```

- [ ] **Step 2: HistoryPage — add import and replace toggle rows**

In `src/pages/history/ui/HistoryPage.tsx`, add `SettingRow` to shared/ui import. Replace the inline toggle row blocks (approximately lines 535–548) with `<SettingRow>` calls using the actual state variables and `t()` keys from the file.

- [ ] **Step 3: SharingSettingsPage — replace SharingToggle inline pattern**

In `src/pages/family-sharing/ui/SharingSettingsPage.tsx`, the local `SharingToggle` function component (lines ~44–62) duplicates `SettingRow`. Delete the local `SharingToggle` function and add `SettingRow` to the shared/ui import. Replace all `<SharingToggle>` usages with `<SettingRow>`, mapping props:
- `SharingToggle label=` → `SettingRow label=`
- `SharingToggle value=` → `SettingRow value=`
- `SharingToggle onChange=` → `SettingRow onValueChange=`

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx src/pages/history/ui/HistoryPage.tsx src/pages/family-sharing/ui/SharingSettingsPage.tsx
git commit -m "feat(pages): adopt SettingRow in analytics, history, family-sharing"
```

---

### Task 11: Adopt ProfileBadgeRow

**Files:**
- Modify: `src/pages/home/ui/HomePage.tsx`
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/history/ui/HistoryPage.tsx`
- Modify: `src/pages/settings/ui/SettingsPage.tsx`

- [ ] **Step 1: HomePage — add import and replace badge row**

In `src/pages/home/ui/HomePage.tsx`, add `ProfileBadgeRow` to the shared/ui import.

Find the `profileBadgesRow` section (approximately lines 121–139):
```tsx
<View style={styles.profileBadgesRow}>
  {userAge != null && (
    <View style={[styles.profileBadge, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <Icon name="calendar-outline" size={14} color={colors.textSecondary} />
      <Text ...>{tCommon('age.years', { count: userAge })}</Text>
    </View>
  )}
  {latestBmi != null && bmiCategory != null && (
    <View style={[styles.profileBadge, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <Icon name="body-outline" size={14} color={colors.textSecondary} />
      <Text ...>BMI: {latestBmi} ({tCommon(`bmi.${bmiCategory}`)})</Text>
    </View>
  )}
</View>
```

Replace with:
```tsx
<ProfileBadgeRow
  badges={[
    ...(userAge != null ? [{icon: 'calendar-outline', label: tCommon('age.years', {count: userAge})}] : []),
    ...(latestBmi != null && bmiCategory != null
      ? [{icon: 'body-outline', label: `BMI: ${latestBmi} (${tCommon(`bmi.${bmiCategory}` as any)})`}]
      : []),
  ]}
/>
```

- [ ] **Step 2: AnalyticsPage — replace profile context row**

In `src/pages/analytics/ui/AnalyticsPage.tsx`, add `ProfileBadgeRow` to shared/ui import.

Find the profile context row (approximately lines 174–205) with the conditional badge Views. Replace the inner badge Views with:
```tsx
<ProfileBadgeRow
  badges={[
    ...(profileAge != null ? [{icon: 'person-outline', label: t('analytics.profile.age', {age: profileAge})}] : []),
    ...(gender != null ? [{icon: 'male-female-outline', label: t(`settings.personalization.gender${gender.charAt(0).toUpperCase() + gender.slice(1)}` as any)}] : []),
    ...(profileBmi != null ? [{icon: 'body-outline', label: `BMI ${profileBmi.value.toFixed(1)} · ${tCommon(`bmi.${profileBmi.category}` as any)}`}] : []),
  ]}
/>
```

Keep the outer `Animated.View` with `entering` prop.

- [ ] **Step 3: HistoryPage and SettingsPage — replace their profile badge rows**

Apply the same `ProfileBadgeRow` adoption pattern to `HistoryPage.tsx` (lines ~457–482) and `SettingsPage.tsx` (lines ~89–101) by inspecting those files and replacing the equivalent inline badge Views with `<ProfileBadgeRow badges={[...]} />`.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/home/ui/HomePage.tsx src/pages/analytics/ui/AnalyticsPage.tsx src/pages/history/ui/HistoryPage.tsx src/pages/settings/ui/SettingsPage.tsx
git commit -m "feat(pages): adopt ProfileBadgeRow in home, analytics, history, settings"
```

---

### Task 12: Adopt MenuItem in SettingsPage

**Files:**
- Modify: `src/pages/settings/ui/SettingsPage.tsx`

- [ ] **Step 1: Add MenuItem to shared/ui import**

In `src/pages/settings/ui/SettingsPage.tsx`:
```typescript
// Before:
import { useTheme } from '../../../shared/lib/use-theme';
// Add to shared/ui import line:
import { MenuItem } from '../../../shared/ui';
```

- [ ] **Step 2: Delete the local MenuItem function**

Remove the entire local `function MenuItem({ icon, label, subtitle, onPress, colors, typography }: MenuItemProps)` component (lines 19–52) and its `interface MenuItemProps`.

- [ ] **Step 3: Update all MenuItem usages**

The 6 `<MenuItem>` calls in SettingsPage pass `colors` and `typography` as props (because the local component needed them). The new shared `<MenuItem>` gets these from `useTheme()` internally. Remove `colors={colors}` and `typography={typography}` from all 6 call sites. For example:

```tsx
// Before:
<MenuItem
  icon="person-outline"
  label={t('settings.personalization.personalInfo')}
  subtitle={t('settings.personalization.menuSubtitle', { defaultValue: 'Name, date of birth, body metrics' })}
  onPress={() => navigation.navigate('PersonalInfo')}
  colors={colors}
  typography={typography}
/>

// After:
<MenuItem
  icon="person-outline"
  label={t('settings.personalization.personalInfo')}
  subtitle={t('settings.personalization.menuSubtitle', { defaultValue: 'Name, date of birth, body metrics' })}
  onPress={() => navigation.navigate('PersonalInfo')}
/>
```

Apply to all 6 MenuItem calls.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/ui/SettingsPage.tsx
git commit -m "feat(settings): replace local MenuItem with shared/ui MenuItem"
```

---

### Task 13: Adopt FormField in PersonalInfoPage

**Files:**
- Modify: `src/pages/settings/ui/PersonalInfoPage.tsx`

- [ ] **Step 1: Add FormField to shared/ui import**

```typescript
import { DateTimePicker, FormField } from '../../../shared/ui';
```

- [ ] **Step 2: Replace each label+TextInput block**

PersonalInfoPage has 7+ inline label+input patterns. Each looks like:
```tsx
<View style={styles.fieldContainer}>
  <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
    {t('profile.fullName')}
  </Text>
  <TextInput
    style={[styles.fieldInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.textPrimary }]}
    value={name}
    onChangeText={setName}
    placeholder={t('profile.namePlaceholder')}
  />
</View>
```

Replace each with:
```tsx
<FormField
  label={t('profile.fullName')}
  value={name}
  onChangeText={setName}
  placeholder={t('profile.namePlaceholder')}
/>
```

For pressable fields (e.g. date of birth that opens a picker):
```tsx
<FormField
  label={t('profile.dateOfBirth')}
  value={displayDOB}
  type="pressable"
  onPress={openDatePicker}
/>
```

Identify all 7+ field blocks and replace each. Remove `TextInput` from the React Native import if no other usage remains.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/ui/PersonalInfoPage.tsx
git commit -m "feat(personal-info): adopt FormField for all form inputs"
```

---

### Task 14: Adopt EmptyState, LoadingState, ErrorState, SectionHeader in BPRecordsList

**Files:**
- Modify: `src/widgets/bp-records-list/ui/BPRecordsList.tsx`

- [ ] **Step 1: Add imports**

```typescript
import {EmptyState, LoadingState, ErrorState, SectionHeader} from '../../../shared/ui';
```

- [ ] **Step 2: Replace isLoading early return**

Find (lines ~46–55):
```tsx
if (isLoading) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: typography.sm }]}>
        {t('bpRecordsList.loading')}
      </Text>
    </View>
  );
}
```

Replace with:
```tsx
if (isLoading) {
  return <LoadingState message={t('bpRecordsList.loading')} />;
}
```

- [ ] **Step 3: Replace isError early return**

Find (lines ~57–68):
```tsx
if (isError) {
  return (
    <View style={styles.centerContainer}>
      <Text style={[styles.errorTitle, { color: colors.error, fontSize: typography.lg }]}>
        {t('bpRecordsList.error.title')}
      </Text>
      <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
        {t('bpRecordsList.error.subtitle')}
      </Text>
    </View>
  );
}
```

Replace with:
```tsx
if (isError) {
  return (
    <ErrorState
      title={t('bpRecordsList.error.title')}
      subtitle={t('bpRecordsList.error.subtitle')}
    />
  );
}
```

- [ ] **Step 4: Replace renderEmpty callback**

Find the `renderEmpty` callback (lines ~34–44):
```tsx
const renderEmpty = useCallback(() => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyIcon, { fontSize: Math.round(60 * fontScale) }]}>💓</Text>
    <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
      {t('bpRecordsList.empty.title')}
    </Text>
    <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
      {t('bpRecordsList.empty.subtitle')}
    </Text>
  </View>
), [colors.textPrimary, colors.textTertiary, t, fontScale, typography.lg]);
```

Replace with:
```tsx
const renderEmpty = useCallback(
  () => (
    <EmptyState
      icon="💓"
      title={t('bpRecordsList.empty.title')}
      subtitle={t('bpRecordsList.empty.subtitle')}
    />
  ),
  [t],
);
```

- [ ] **Step 5: Replace renderSectionHeader callback**

Find the `renderSectionHeader` callback (lines ~26–32):
```tsx
const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: typography.sm }]}>
      {section.title}
    </Text>
  </View>
), [colors.textSecondary, typography.sm]);
```

Replace with:
```tsx
const renderSectionHeader = useCallback(
  ({section}: {section: {title: string}}) => (
    <SectionHeader title={section.title} />
  ),
  [],
);
```

- [ ] **Step 6: Remove unused imports**

Remove `ActivityIndicator` and any now-unused style variables (`fontScale`, `typography` if no longer referenced) from imports and destructuring. Run type-check to confirm:

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 7: Commit**

```bash
git add src/widgets/bp-records-list/ui/BPRecordsList.tsx
git commit -m "feat(bp-records-list): adopt EmptyState, LoadingState, ErrorState, SectionHeader"
```

---

### Task 15: Adopt state components in MedicationPage, EditReadingPage, AcceptInvitePage

**Files:**
- Modify: `src/pages/medications/ui/MedicationPage.tsx`
- Modify: `src/pages/edit-reading/ui/EditReadingPage.tsx`
- Modify: `src/pages/family-sharing/ui/AcceptInvitePage.tsx`

- [ ] **Step 1: MedicationPage — import and replace**

Add `EmptyState, LoadingState, ErrorState` to the shared/ui import in `src/pages/medications/ui/MedicationPage.tsx`.

Replace the inline `isLoading` return block:
```tsx
if (isLoading) {
  return <LoadingState />;
}
```

Replace the inline error block with `<ErrorState title="..." subtitle="..." />` using the existing `t()` keys.

Replace the inline empty container (icon + title + subtitle View) with:
```tsx
<EmptyState
  icon="💊"
  title={t('medications.empty.title')}
  subtitle={t('medications.empty.subtitle')}
/>
```

- [ ] **Step 2: EditReadingPage — replace loading state**

In `src/pages/edit-reading/ui/EditReadingPage.tsx` (line ~233), find:
```tsx
if (isLoading) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
```

Replace with:
```tsx
if (isLoading) {
  return <LoadingState />;
}
```

Add `LoadingState` to the shared/ui import.

- [ ] **Step 3: AcceptInvitePage — replace loading state**

In `src/pages/family-sharing/ui/AcceptInvitePage.tsx` (line ~210), apply the same `LoadingState` replacement pattern.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/medications/ui/MedicationPage.tsx src/pages/edit-reading/ui/EditReadingPage.tsx src/pages/family-sharing/ui/AcceptInvitePage.tsx
git commit -m "feat(pages): adopt LoadingState, EmptyState, ErrorState in medication/edit/accept pages"
```

---

### Task 16: Adopt DetailChip in BPRecordCard and WeatherCorrelationCard

**Files:**
- Modify: `src/widgets/bp-record-card/ui/BPRecordCard.tsx`
- Modify: `src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx`

- [ ] **Step 1: BPRecordCard — add import**

In `src/widgets/bp-record-card/ui/BPRecordCard.tsx`, add `DetailChip` to the shared/ui import.

- [ ] **Step 2: Replace detailChip views in BPRecordCard**

Find each inline detailChip block (lines ~340–393), e.g.:
```tsx
<View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
  <Icon name="pulse" size={14} color={colors.textSecondary} />
  <Text style={[styles.detailChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
    {record.pulse} {t('units.bpm')}
  </Text>
</View>
```

Replace with:
```tsx
<DetailChip icon="pulse" label={`${record.pulse} ${t('units.bpm')}`} />
```

Apply to all 7+ `detailChip` View blocks. For tag chips (which map icon from `display.icon`):
```tsx
<DetailChip key={tag} icon={display.icon} label={display.label} />
```

- [ ] **Step 3: WeatherCorrelationCard — add import and replace deltaChip views**

In `src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx`, add `DetailChip` to shared/ui import. Find the `deltaChip` View pattern (lines ~180–202) and replace with `<DetailChip>` calls.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 5: Commit**

```bash
git add src/widgets/bp-record-card/ui/BPRecordCard.tsx src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx
git commit -m "feat(widgets): adopt DetailChip in bp-record-card and weather-correlation-card"
```

---

### Task 17: Adopt PeriodSelector and InfoHintRow in AnalyticsPage and HistoryPage; InfoBanner in ClassificationPage; SectionHeader in SharingSettingsPage

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`
- Modify: `src/pages/history/ui/HistoryPage.tsx`
- Modify: `src/pages/settings/ui/ClassificationPage.tsx`
- Modify: `src/pages/family-sharing/ui/SharingSettingsPage.tsx`

- [ ] **Step 1: AnalyticsPage — PeriodSelector**

Add `PeriodSelector` to the shared/ui import in AnalyticsPage. Find the horizontal OptionChip row (approximately lines 216–230):
```tsx
<View style={styles.periodRow}>
  <OptionChip label="7d" selected={period === '7d'} onPress={() => setPeriod('7d')} />
  <OptionChip label="14d" selected={period === '14d'} onPress={() => setPeriod('14d')} />
  {/* ... more chips */}
</View>
```

Replace with:
```tsx
<PeriodSelector
  value={period}
  onChange={setPeriod}
  options={['7d', '14d', '30d', '90d', 'all', 'custom']}
  onCustomPress={openCustomRangePicker}
/>
```

- [ ] **Step 2: AnalyticsPage — InfoHintRow**

Add `InfoHintRow` to shared/ui import. Find the `ppMapHintRow` View (approximately lines 288–306):
```tsx
<View style={[styles.ppMapHintRow, { backgroundColor: ppMapHintBg }]}>
  <Icon name="information-circle-outline" size={14} color={hintColor} />
  <Text style={[styles.ppMapHintText, { color: hintColor, fontSize: typography.xs }]}>
    {t('analytics.ppMapHint')}
  </Text>
</View>
```

Replace with:
```tsx
<InfoHintRow
  icon="information-circle-outline"
  text={t('analytics.ppMapHint')}
  color={hintColor}
/>
```

- [ ] **Step 3: HistoryPage — PeriodSelector**

Add `PeriodSelector` to shared/ui import in HistoryPage. Find the period chip row (approximately lines 495–509) and replace with:
```tsx
<PeriodSelector
  value={period}
  onChange={setPeriod}
  options={['7d', '14d', '30d', '90d', 'all', 'custom']}
  onCustomPress={openCustomRangePicker}
/>
```

- [ ] **Step 4: ClassificationPage — InfoBanner**

Add `InfoBanner` to shared/ui import in ClassificationPage. Find the `detectionBanner` View (approximately lines 148–177):
```tsx
<View style={[styles.detectionBanner, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
  <Icon name="shield-checkmark-outline" size={20} color={colors.accent} />
  <View style={styles.detectionTextCol}>
    <Text style={[styles.detectionTitle, { color: colors.accent }]}>
      {t('classification.detectedTitle')}
    </Text>
    <Text style={[styles.detectionBody, { color: colors.accent }]}>
      {t('classification.detectedBody')}
    </Text>
  </View>
</View>
```

Replace with:
```tsx
<InfoBanner
  icon="shield-checkmark-outline"
  title={t('classification.detectedTitle')}
  body={t('classification.detectedBody')}
  color={colors.accent}
/>
```

- [ ] **Step 5: SharingSettingsPage — SectionHeader**

Add `SectionHeader` to shared/ui import. Find the inline section header (approximately line 285):
```tsx
<Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
  {t('familySharing.linkedPeople').toUpperCase()}
</Text>
```

Replace with:
```tsx
<SectionHeader title={t('familySharing.linkedPeople')} />
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx src/pages/history/ui/HistoryPage.tsx src/pages/settings/ui/ClassificationPage.tsx src/pages/family-sharing/ui/SharingSettingsPage.tsx
git commit -m "feat(pages): adopt PeriodSelector, InfoHintRow, InfoBanner, SectionHeader"
```

---

## Phase 2 — Adopt Existing shared/ui Components

### Task 18: Replace inline CardHeader builds in settings pages

**Files:**
- Modify: `src/pages/settings/ui/AppSettingsPage.tsx`
- Modify: `src/pages/settings/ui/SyncPage.tsx`
- Modify: `src/pages/settings/ui/WeatherSettingsPage.tsx`

- [ ] **Step 1: Verify CardHeader is already imported**

`CardHeader` is exported from `src/shared/ui`. Add it to the import wherever missing:
```typescript
import { Card, CardBody, CardHeader, OptionChip, SettingRow } from '../../../shared/ui';
```

- [ ] **Step 2: AppSettingsPage — replace section header rows**

Find each manually built section header (icon circle + title + optional subtitle), e.g.:
```tsx
<View style={styles.cardHeaderRow}>
  <View style={[styles.cardIconCircle, { backgroundColor: colors.iconCircleBg }]}>
    <Icon name="phone-portrait-outline" size={20} color={colors.accent} />
  </View>
  <View style={styles.cardHeaderText}>
    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
      {t('settings.entryMode.title')}
    </Text>
  </View>
</View>
```

Replace with:
```tsx
<CardHeader icon="phone-portrait-outline" title={t('settings.entryMode.title')} />
```

Apply for all 3 section headers in AppSettingsPage (Entry Mode, Theme/Language, Numpad Layout). Remove the manual `Icon` import from AppSettingsPage if it's no longer used elsewhere.

- [ ] **Step 3: SyncPage and WeatherSettingsPage — same replacement**

Repeat the `CardHeader` replacement for each manually built header row in SyncPage (3 headers) and WeatherSettingsPage (2+ headers).

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/settings/ui/AppSettingsPage.tsx src/pages/settings/ui/SyncPage.tsx src/pages/settings/ui/WeatherSettingsPage.tsx
git commit -m "feat(settings): replace inline section headers with CardHeader"
```

---

### Task 19: Replace inline card and button builds with Card and Button

**Files:**
- Modify: `src/pages/settings/ui/SettingsPage.tsx`
- Modify: `src/pages/medications/ui/MedicationPage.tsx`
- Modify: `src/pages/family-sharing/ui/AcceptInvitePage.tsx`
- Modify: `src/pages/family-sharing/ui/SharingSettingsPage.tsx`

- [ ] **Step 1: SettingsPage — replace aboutCard manual build**

In `src/pages/settings/ui/SettingsPage.tsx`, find the `aboutCard` View (approximately lines 172–200):
```tsx
<Animated.View
  entering={FadeInUp.delay(500).duration(400)}
  style={[styles.aboutCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
>
  {/* ... */}
</Animated.View>
```

Replace the inner manual styling with `<Card variant="elevated">` wrapping:
```tsx
<Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.cardMargin}>
  <Card variant="elevated">
    {/* about content */}
  </Card>
</Animated.View>
```

Add `Card` to the shared/ui import.

- [ ] **Step 2: MedicationPage — replace inline card container**

In `src/pages/medications/ui/MedicationPage.tsx`, find medication card Views with inline shadow/elevation/borderRadius styling. Replace with `<Card variant="elevated">` wrappers. Add `Card` to shared/ui import.

Replace the add medication Pressable styled as a FAB button:
```tsx
// Before: raw Pressable with inline styles acting as a FAB
<Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={onAddMedication}>
  <Icon name="add" size={24} color="#fff" />
</Pressable>
```

```tsx
// After:
import { Card, Button, ButtonIcon } from '../../../shared/ui';
<Button variant="fab" size="lg" onPress={onAddMedication} style={styles.fabPosition}>
  <ButtonIcon as={Icon} name="add" />
</Button>
```

- [ ] **Step 3: AcceptInvitePage — replace action buttons**

In `src/pages/family-sharing/ui/AcceptInvitePage.tsx`, find the accept and decline Pressable buttons with inline styling. Replace with:
```tsx
import { Button, ButtonText, ButtonGroup } from '../../../shared/ui';

<ButtonGroup direction="row" spacing="md">
  <Button variant="secondary" size="md" style={{flex: 1}} onPress={handleDecline}>
    <ButtonText>{t('familySharing.decline')}</ButtonText>
  </Button>
  <Button variant="primary" size="md" style={{flex: 1}} onPress={handleAccept} isLoading={isAccepting}>
    <ButtonText>{t('familySharing.accept')}</ButtonText>
  </Button>
</ButtonGroup>
```

- [ ] **Step 4: SharingSettingsPage — replace invite button**

In `src/pages/family-sharing/ui/SharingSettingsPage.tsx`, find the invite Pressable:
```tsx
// Before: Pressable with inline backgroundColor/borderRadius
<Pressable style={[styles.inviteButton, { backgroundColor: colors.accent }]} onPress={onInvite}>
  <Icon name="person-add-outline" size={18} color="#fff" />
  <Text style={styles.inviteButtonText}>{t('familySharing.invite')}</Text>
</Pressable>
```

Replace with:
```tsx
<Button variant="primary" size="md" onPress={onInvite}>
  <ButtonIcon as={Icon} name="person-add-outline" />
  <ButtonText>{t('familySharing.invite')}</ButtonText>
</Button>
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/ui/SettingsPage.tsx src/pages/medications/ui/MedicationPage.tsx src/pages/family-sharing/ui/AcceptInvitePage.tsx src/pages/family-sharing/ui/SharingSettingsPage.tsx
git commit -m "feat(pages): replace inline card/button builds with shared/ui Card and Button"
```

---

## Phase 3 — Merge NewReadingPage + QuickLogPage

### Task 20: Extract `use-bp-reading-form` hook

**Files:**
- Create: `src/widgets/bp-reading-form/lib/use-bp-reading-form.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "c:\Users\fuats\Desktop\Workdir\MedTracker\src\widgets\bp-reading-form\lib"
mkdir -p "c:\Users\fuats\Desktop\Workdir\MedTracker\src\widgets\bp-reading-form\ui"
```

- [ ] **Step 2: Create use-bp-reading-form.ts**

This hook extracts all shared state and logic from both reading pages. Copy the state and handlers exactly from NewReadingPage, parameterizing only what differs:

```typescript
// src/widgets/bp-reading-form/lib/use-bp-reading-form.ts
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {useBPInput, useToast} from '../../../shared/lib';
import {isCrisisReading, useBPClassification} from '../../../entities/blood-pressure';
import {useSettingsStore} from '../../../shared/lib/settings-store';
import {useRecordBP, BP_RECORDS_QUERY_KEY} from '../../../features/record-bp';
import {getWeightDisplayValue, parseWeightToKg} from '../../../entities/user-profile';
import {detectMorningSurge} from '../../../shared/lib';
import type {TagKey} from '../../../shared/api/bp-tags-repository';
import type {BPRecord} from '../../../shared/api/bp-repository';

interface UseBPReadingFormOptions {
  autoAdvance: boolean;
  onDismiss: () => void;
}

export function useBPReadingForm({autoAdvance, onDismiss}: UseBPReadingFormOptions) {
  const {t} = useTranslation('pages');
  const {t: tCommon} = useTranslation('common');
  const {t: tValidation} = useTranslation('validation');
  const {t: tWidgets} = useTranslation('widgets');
  const {guideline, defaultLocation, defaultPosture, defaultWeight, weightUnit} =
    useSettingsStore();
  const recordBP = useRecordBP();
  const queryClient = useQueryClient();

  const {systolic, diastolic, pulse, activeField, setActiveField, handleNumpadChange} =
    useBPInput({autoAdvance});
  const {toastMsg, toastType, toastVisible, showToast, hideToast} = useToast();
  const {systolicNum, diastolicNum, pulseNum, validation, category, categoryColor, categoryLabel} =
    useBPClassification(systolic, diastolic, pulse, guideline);

  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagKey[]>([]);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [weightText, setWeightText] = useState(() => {
    if (defaultWeight == null) return '';
    return String(getWeightDisplayValue(defaultWeight, weightUnit));
  });
  const [weightFocused, setWeightFocused] = useState(false);

  const handleSubmit = async () => {
    if (!validation.isValid || !systolicNum || !diastolicNum) {
      showToast(validation.errors[0] ?? tValidation('errors.validationError'));
      return;
    }
    if (isCrisisReading(systolicNum, diastolicNum, guideline)) {
      setCrisisVisible(true);
      return;
    }
    await saveRecord();
  };

  const saveRecord = async () => {
    try {
      const parsedWeight = weightText.trim() ? parseFloat(weightText) : NaN;
      const weightKg = !isNaN(parsedWeight) ? parseWeightToKg(parsedWeight, weightUnit) : null;
      await recordBP.mutateAsync({
        systolic: systolicNum!,
        diastolic: diastolicNum!,
        pulse: pulseNum,
        timestamp: Math.floor(measurementTime.getTime() / 1000),
        location: defaultLocation,
        posture: defaultPosture,
        weight: weightKg,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      try {
        const latestRecords =
          queryClient.getQueryData<BPRecord[]>(BP_RECORDS_QUERY_KEY) ?? [];
        const surge = detectMorningSurge(latestRecords);
        if (surge.hasSurge) {
          showToast(tCommon('morningSurgeAlert', {delta: surge.delta}), 'warning');
          await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
        }
      } catch (surgeError) {
        if (__DEV__) console.warn('Surge detection failed:', surgeError);
      }
      onDismiss();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('newReading.alerts.error.message'),
      );
    }
  };

  const isValid = validation.isValid && !!systolic && !!diastolic;
  const hasTags = selectedTags.length > 0;
  const hasWeight = weightText.trim().length > 0;

  return {
    // BP values
    systolic, diastolic, pulse,
    activeField, setActiveField, handleNumpadChange,
    systolicNum, diastolicNum,
    validation, category, categoryColor, categoryLabel, isValid,
    // Time
    measurementTime, setMeasurementTime,
    // Crisis
    crisisVisible, setCrisisVisible,
    // Tags
    selectedTags, setSelectedTags, tagPickerVisible, setTagPickerVisible, hasTags,
    // Weight
    weightText, setWeightText, weightFocused, setWeightFocused, hasWeight, weightUnit,
    // Toast
    toastMsg, toastType, toastVisible, hideToast,
    // Actions
    handleSubmit, saveRecord,
    isSaving: recordBP.isPending,
    // i18n (for callers that need them)
    t, tCommon, tWidgets,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/widgets/bp-reading-form/lib/use-bp-reading-form.ts
git commit -m "feat(bp-reading-form): extract use-bp-reading-form hook"
```

---

### Task 21: Create BPReadingForm widget

**Files:**
- Create: `src/widgets/bp-reading-form/ui/BPReadingForm.tsx`
- Create: `src/widgets/bp-reading-form/index.ts`

- [ ] **Step 1: Create BPReadingForm.tsx**

This is the full shared form UI extracted from NewReadingPage. Copy NewReadingPage's entire JSX body, then replace the hook calls with the extracted hook and add `title`, `subtitle`, and `onDismiss` props:

```typescript
// src/widgets/bp-reading-form/ui/BPReadingForm.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Numpad, DateTimePicker, Toast, CrisisModal, SaveButton} from '../../../shared/ui';
import {useTheme} from '../../../shared/lib/use-theme';
import {FONTS} from '../../../shared/config/theme';
import {TagPickerModal} from '../../tag-selector';
import {useBPReadingForm} from '../lib/use-bp-reading-form';

interface BPReadingFormProps {
  title: string;
  subtitle?: string;
  autoAdvance: boolean;
  onDismiss: () => void;
}

export function BPReadingForm({title, subtitle, autoAdvance, onDismiss}: BPReadingFormProps) {
  const {colors, fontScale, typography} = useTheme();
  const {t: tCommon} = useTranslation('common');

  const {
    systolic, diastolic, pulse,
    activeField, setActiveField, handleNumpadChange,
    validation, category, categoryColor, categoryLabel, isValid,
    measurementTime, setMeasurementTime,
    crisisVisible, setCrisisVisible,
    selectedTags, setSelectedTags, tagPickerVisible, setTagPickerVisible, hasTags,
    weightText, setWeightText, weightFocused, setWeightFocused, hasWeight, weightUnit,
    toastMsg, toastType, toastVisible, hideToast,
    handleSubmit, saveRecord,
    isSaving,
    tWidgets,
  } = useBPReadingForm({autoAdvance, onDismiss});

  const tagPillBg = hasTags ? colors.accent + '15' : 'transparent';
  const tagPillBorder = hasTags ? colors.accent : colors.border;
  const tagPillColor = hasTags ? colors.accent : colors.textSecondary;
  const weightPillBg = weightFocused ? colors.accent + '10' : hasWeight ? colors.accent + '15' : 'transparent';
  const weightPillBorder = weightFocused || hasWeight ? colors.accent : colors.border;
  const weightPillColor = weightFocused || hasWeight ? colors.accent : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.headerTitle, {color: colors.textPrimary, fontSize: typography.xl}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.headerSubtitle, {color: colors.textSecondary, fontSize: typography.xs}]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.closeButton, {backgroundColor: colors.surfaceSecondary}]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.close' as any)}>
          <Icon name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Content — exact copy of NewReadingPage content section */}
      <View style={styles.content}>
        <Toast message={toastMsg} type={toastType} visible={toastVisible} onHide={hideToast} />

        <View style={styles.topSection}>
          <View style={styles.dateTimeWrapper}>
            <DateTimePicker
              value={measurementTime}
              onChange={setMeasurementTime}
              disabled={isSaving}
            />
            <View style={styles.pillsRow}>
              <Pressable
                style={[styles.weightPill, {backgroundColor: weightPillBg, borderColor: weightPillBorder}]}
                onPress={() => setWeightFocused(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={tCommon('weight.label')}>
                <Icon name="scale-outline" size={13} color={weightPillColor} />
                <Text style={[styles.weightInput, {color: weightText ? weightPillColor : colors.textTertiary, fontSize: 12 * fontScale}]}>
                  {weightText || '--'}
                </Text>
                <Text style={[styles.weightUnitText, {color: weightPillColor, fontSize: 12 * fontScale}]}>
                  {tCommon(`weight.${weightUnit}`)}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tagPill, {backgroundColor: tagPillBg, borderColor: tagPillBorder}]}
                onPress={() => setTagPickerVisible(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={tWidgets('tagSelector.title')}>
                <Icon name="pricetags-outline" size={13} color={tagPillColor} />
                <Text style={[styles.tagPillText, {color: tagPillColor, fontSize: 12 * fontScale}]}>
                  {hasTags
                    ? tWidgets('tagSelector.tagCount', {count: selectedTags.length})
                    : tWidgets('tagSelector.addTags')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Value boxes (systolic / diastolic / pulse) — paste exact code from NewReadingPage here */}
          {/* ... copy lines 188–305 from NewReadingPage verbatim ... */}

          {/* Category badge — copy lines 307–340 from NewReadingPage verbatim */}
        </View>

        {/* Numpad */}
        <Numpad
          onPress={key => handleNumpadChange(key, activeField)}
          disabled={isSaving}
        />

        <SaveButton
          label={tCommon('buttons.save' as any)}
          isValid={isValid}
          isLoading={isSaving}
          onPress={handleSubmit}
          fontScale={fontScale}
        />
      </View>

      {/* Modals */}
      <CrisisModal
        visible={crisisVisible}
        onDismiss={() => setCrisisVisible(false)}
        onConfirm={() => {
          setCrisisVisible(false);
          saveRecord();
        }}
      />
      <TagPickerModal
        visible={tagPickerVisible}
        selected={selectedTags}
        onClose={() => setTagPickerVisible(false)}
        onSave={setSelectedTags}
      />
    </SafeAreaView>
  );
}
```

> **Note:** The value boxes section (SBP/DBP/pulse pressables and category badge) is identical to NewReadingPage lines 188–340. Copy those lines verbatim into the `// ... copy lines ...` placeholder above. Do not paraphrase — use the exact code.

- [ ] **Step 2: Copy value box and category JSX from NewReadingPage**

Open `src/pages/new-reading/ui/NewReadingPage.tsx` and copy lines 188–340 (value boxes row through category badge section) verbatim into the corresponding placeholder in `BPReadingForm.tsx`. Replace all `recordBP.isPending` references with `isSaving`.

- [ ] **Step 3: Add StyleSheet to BPReadingForm.tsx**

Copy the `StyleSheet.create({...})` from `NewReadingPage.tsx` verbatim. Add styles for `headerTextCol` and `headerSubtitle`:
```typescript
const styles = StyleSheet.create({
  // ... paste all styles from NewReadingPage ...
  headerTextCol: {flex: 1},
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
});
```

- [ ] **Step 4: Create barrel export**

```typescript
// src/widgets/bp-reading-form/index.ts
export {BPReadingForm} from './ui/BPReadingForm';
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/bp-reading-form/
git commit -m "feat(widgets): add BPReadingForm widget with shared use-bp-reading-form hook"
```

---

### Task 22: Refactor NewReadingPage to thin shell

**Files:**
- Modify: `src/pages/new-reading/ui/NewReadingPage.tsx`

- [ ] **Step 1: Replace NewReadingPage body**

Replace the entire contents of `NewReadingPage.tsx` with:

```typescript
// src/pages/new-reading/ui/NewReadingPage.tsx
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSettingsStore} from '../../../shared/lib/settings-store';
import {GUIDELINE_DISPLAY_NAMES} from '../../../shared/config/bp-guidelines';
import {BPReadingForm} from '../../../widgets/bp-reading-form';

export function NewReadingPage() {
  const {t} = useTranslation('pages');
  const navigation = useNavigation();
  const {guideline} = useSettingsStore();
  const guidelineName = GUIDELINE_DISPLAY_NAMES[guideline] ?? guideline;

  return (
    <BPReadingForm
      variant="full"
      autoAdvance={false}
      title={t('newReading.title')}
      subtitle={guidelineName}
      onDismiss={() => navigation.goBack()}
    />
  );
}
```

> **Note:** Check that `GUIDELINE_DISPLAY_NAMES` (or equivalent) exists in `src/shared/config/bp-guidelines.ts`. If the constant has a different name, use whatever the existing export is.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/new-reading/ui/NewReadingPage.tsx
git commit -m "refactor(new-reading): replace with BPReadingForm thin shell"
```

---

### Task 23: Refactor QuickLogPage to thin shell

**Files:**
- Modify: `src/pages/quick-log/ui/QuickLogPage.tsx`

- [ ] **Step 1: Replace QuickLogPage body**

```typescript
// src/pages/quick-log/ui/QuickLogPage.tsx
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {BPReadingForm} from '../../../widgets/bp-reading-form';

export function QuickLogPage() {
  const {t} = useTranslation('pages');
  const navigation = useNavigation();

  return (
    <BPReadingForm
      variant="compact"
      autoAdvance={true}
      title={t('quickLog.title')}
      onDismiss={() => navigation.goBack()}
    />
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/quick-log/ui/QuickLogPage.tsx
git commit -m "refactor(quick-log): replace with BPReadingForm thin shell"
```

---

### Task 24: Verify Phase 3 behavioral parity

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass (no regressions).

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: Zero errors.

- [ ] **Step 3: Lint**

```bash
npx eslint src/ --ext .ts,.tsx --max-warnings 0
```

Expected: No new lint errors (fix any that appear before proceeding).

- [ ] **Step 4: Manual smoke test — New Reading flow**

Launch app on device/emulator. Open New Reading modal:
- Verify header shows "New Reading" title + guideline name subtitle
- Enter SBP 120, DBP 80 — verify classification badge appears
- Enter SBP 190, DBP 120 — verify crisis modal appears
- Save a normal reading — verify it appears in history

- [ ] **Step 5: Manual smoke test — Quick Log flow**

Open Quick Log page:
- Verify header shows "Quick Log" title with no subtitle
- Verify auto-advance: entering 3 SBP digits moves focus to DBP automatically
- Save a reading — verify it appears in history

- [ ] **Step 6: Update verified-functionalities.md**

Open `docs/verified-functionalities.md` and add an entry under the relevant section noting that NewReadingPage and QuickLogPage now delegate to `BPReadingForm` widget. Update the `> Last verified:` date to `2026-04-07`.

- [ ] **Step 7: Commit**

```bash
git add docs/verified-functionalities.md
git commit -m "docs: update verified-functionalities after component extraction"
```

---

## Final Checklist

- [ ] All 12 new components have passing tests
- [ ] All components exported from `src/shared/ui/index.ts`
- [ ] `npx jest --no-coverage` passes
- [ ] `npx tsc --noEmit --skipLibCheck` passes
- [ ] `npx eslint src/ --ext .ts,.tsx --max-warnings 0` passes
- [ ] NewReadingPage and QuickLogPage both work correctly via BPReadingForm
- [ ] `docs/verified-functionalities.md` updated
