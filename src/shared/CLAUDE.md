# Shared Layer Patterns

**Loaded when working in `src/shared/`**

## Purpose

Shared layer contains **reusable infrastructure** with NO business logic. This is the foundation layer that all other layers can import.

## Structure

```
src/shared/
├── ui/                          ← Reusable UI components
│   ├── Numpad.tsx
│   ├── SaveButton.tsx
│   ├── CrisisModal.tsx
│   ├── Toast.tsx
│   ├── OptionChip.tsx
│   ├── LineChart.tsx
│   ├── BPTrendChart.tsx
│   ├── DateTimePicker.tsx
│   └── index.ts
├── lib/                         ← Utilities and hooks
│   ├── use-theme.ts
│   ├── use-bp-input.ts
│   ├── use-toast.ts
│   ├── settings-store.ts
│   ├── i18n.ts
│   ├── greeting-utils.ts
│   ├── analytics-utils.ts
│   └── index.ts
├── config/                      ← Configuration and constants
│   ├── theme.ts
│   ├── bp-guidelines.ts
│   └── locales/
│       ├── en/
│       ├── tr/
│       ├── id/
│       └── sr/
└── api/                         ← API clients
    ├── db.ts
    └── pdf-client.ts
```

## UI Components (MUST Have NO Business Logic)

Shared UI components are **dumb components** — they receive props and render, but contain NO domain logic:

```typescript
// shared/ui/SaveButton.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/shared/lib/use-theme';
import { FONTS } from '@/shared/config/theme';

interface SaveButtonProps {
  label: string;
  isValid: boolean;
  isLoading: boolean;
  onPress: () => void;
  fontScale?: number;
}

export function SaveButton({
  label,
  isValid,
  isLoading,
  onPress,
  fontScale = 1,
}: SaveButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isValid || isLoading}
      style={{
        backgroundColor: isValid ? colors.accent : colors.border,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Icon name="checkmark-circle" size={20 * fontScale} color="#fff" />
          <Text
            style={{
              color: '#fff',
              fontFamily: FONTS.bold,
              fontWeight: '700',
              fontSize: 18 * fontScale,
              marginLeft: 8,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

**MUST NOT**:
- ❌ Import from entities, features, widgets, or pages
- ❌ Contain BP classification logic
- ❌ Access database directly
- ❌ Handle mutations (leave to features layer)

## Utility Functions (MUST Be Pure)

All utility functions MUST be pure (no side effects, deterministic):

```typescript
// shared/lib/greeting-utils.ts
export function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting.morning';
  if (hour < 18) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

// shared/lib/analytics-utils.ts
import type { BPRecord } from '@/entities/blood-pressure';

export function computeWeeklyAverage(records: BPRecord[]) {
  const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const recentRecords = records.filter(r => r.timestamp >= oneWeekAgo);

  if (recentRecords.length === 0) return null;

  const avgSystolic = Math.round(
    recentRecords.reduce((sum, r) => sum + r.systolic, 0) / recentRecords.length
  );
  const avgDiastolic = Math.round(
    recentRecords.reduce((sum, r) => sum + r.diastolic, 0) / recentRecords.length
  );

  return { avgSystolic, avgDiastolic };
}
```

**WHY in shared/lib?**
- Generic date/time utilities that have NO BP-specific business logic
- Reusable across any domain (could be used for any health metric)
- If it contains BP validation or classification → move to `entities/blood-pressure/lib.ts`

## React Hooks (Generic Only)

Shared hooks are **infrastructure hooks** with NO business logic:

```typescript
// shared/lib/use-theme.ts
import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import { lightColors, darkColors, highContrastColors } from '@/shared/config/theme';

export function useTheme() {
  const theme = useSettingsStore(state => state.theme);
  const seniorMode = useSettingsStore(state => state.seniorMode);
  const highContrast = useSettingsStore(state => state.highContrast);
  const systemScheme = useColorScheme();

  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const colors = highContrast
    ? highContrastColors
    : isDark
    ? darkColors
    : lightColors;

  const fontScale = seniorMode ? 1.2 : 1.0;

  return { colors, isDark, fontScale };
}

// shared/lib/use-toast.ts
import { useState } from 'react';

export function useToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'error' | 'warning'>('error');

  const showToast = (msg: string, toastType: 'error' | 'warning' = 'error') => {
    setMessage(msg);
    setType(toastType);
    setIsVisible(true);
  };

  const hideToast = () => {
    setIsVisible(false);
  };

  return { isVisible, message, type, showToast, hideToast };
}
```

## Configuration (MUST Be Typed)

All configuration MUST use TypeScript types:

```typescript
// shared/config/theme.ts
export interface ThemeColors {
  background: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  // ... 20+ more tokens
}

export const lightColors: ThemeColors = {
  background: '#EDF5F0',
  surface: '#ffffff',
  accent: '#0D9488',
  // ...
};

export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  accent: '#14B8A6',
  // ...
};

export const FONTS = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
};
```

## API Clients (Thin Wrappers Only)

API clients SHOULD be thin wrappers with NO business logic:

```typescript
// shared/api/db.ts
import { open } from '@op-engineering/op-sqlite';

export const db = open({
  name: 'medtracker.db',
  encryptionKey: 'secure-key-from-keychain', // TODO: Use KeychainAccess
});

export async function initDatabase() {
  await db.execute(`CREATE TABLE IF NOT EXISTS bp_records (...)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp ...`);
}

// shared/api/pdf-client.ts
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export async function generatePDF(html: string, fileName: string) {
  const options = {
    html,
    fileName,
    directory: 'Documents',
  };

  const file = await RNHTMLtoPDF.convert(options);
  return file.filePath;
}
```

## Zustand Stores (Settings Only)

Shared stores are for **UI settings**, NOT business data (use React Query for data):

```typescript
// shared/lib/settings-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

interface SettingsStore {
  language: 'en' | 'id' | 'sr' | 'tr';
  guideline: 'aha_acc' | 'who' | 'esc_esh' | 'jsh';
  theme: 'light' | 'dark' | 'system';
  seniorMode: boolean;
  highContrast: boolean;
  defaultLocation: 'left_arm' | 'right_arm' | 'wrist';
  defaultPosture: 'sitting' | 'standing' | 'lying_down';

  setLanguage: (language: SettingsStore['language']) => void;
  setGuideline: (guideline: SettingsStore['guideline']) => void;
  setTheme: (theme: SettingsStore['theme']) => void;
  setSeniorMode: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: 'en',
      guideline: 'aha_acc',
      theme: 'system',
      seniorMode: false,
      highContrast: false,
      defaultLocation: 'left_arm',
      defaultPosture: 'sitting',

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },
      setGuideline: (guideline) => set({ guideline }),
      setTheme: (theme) => set({ theme }),
      setSeniorMode: (enabled) => set({ seniorMode: enabled }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
    }),
    {
      name: 'medtracker-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Common Mistakes (MUST AVOID)

❌ **Importing from any upper layer** → shared/ is the foundation, imports NOTHING from app/pages/widgets/features/entities
❌ **Business logic in UI components** → Extract to entities/ or features/
❌ **Data fetching in shared/** → Use React Query in entities/ or features/
❌ **BP classification in shared/lib** → Move to entities/blood-pressure/lib.ts
