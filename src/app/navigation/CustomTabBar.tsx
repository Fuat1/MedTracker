import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../shared/lib/use-theme';
import { useSettingsStore } from '../../shared/lib/settings-store';
import { FONTS } from '../../shared/config/theme';
import type { RootStackParamList } from './index';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  History: { active: 'time', inactive: 'time-outline' },
  Analytics: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABEL_KEYS = {
  Home: 'navigation.home',
  History: 'navigation.history',
  Analytics: 'navigation.analytics',
  Settings: 'navigation.settings',
} as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { preferredEntryMode, setPreferredEntryMode } = useSettingsStore();

  const leftTabs = state.routes.slice(0, 2);
  const rightTabs = state.routes.slice(2, 4);

  const navigateToMode = (mode: 'quickLog' | 'guided') => {
    if (mode === 'quickLog') {
      stackNav.navigate('QuickLog');
    } else {
      stackNav.navigate('PreMeasurement');
    }
  };

  const askRemember = (mode: 'quickLog' | 'guided') => {
    Alert.alert(
      t('entryMode.rememberTitle'),
      t('entryMode.rememberMessage'),
      [
        {
          text: t('entryMode.rememberNo'),
          style: 'cancel',
          onPress: () => navigateToMode(mode),
        },
        {
          text: t('entryMode.rememberYes'),
          onPress: () => {
            setPreferredEntryMode(mode);
            navigateToMode(mode);
          },
        },
      ],
      { cancelable: false },
    );
  };

  const showEntryModeDialog = () => {
    Alert.alert(
      t('entryMode.title'),
      t('entryMode.message'),
      [
        {
          text: t('entryMode.quickLog'),
          onPress: () => askRemember('quickLog'),
        },
        {
          text: t('entryMode.guided'),
          onPress: () => askRemember('guided'),
        },
        {
          text: t('buttons.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const handleFabPress = () => {
    if (preferredEntryMode) {
      navigateToMode(preferredEntryMode);
    } else {
      showEntryModeDialog();
    }
  };

  const handleFabLongPress = () => {
    showEntryModeDialog();
  };

  const renderTab = (route: typeof state.routes[0], _index: number) => {
    const realIndex = state.routes.indexOf(route);
    const isFocused = state.index === realIndex;
    const icons = TAB_ICONS[route.name] || { active: 'help', inactive: 'help-outline' };
    const labelKey = TAB_LABEL_KEYS[route.name as keyof typeof TAB_LABEL_KEYS];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabButton}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Icon
          name={isFocused ? icons.active : icons.inactive}
          size={24}
          color={isFocused ? colors.accent : colors.textTertiary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? colors.accent : colors.textTertiary },
          ]}
        >
          {t(labelKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      <View style={styles.tabRow}>
        {leftTabs.map((route, i) => renderTab(route, i))}
        <View style={styles.fabSpacer} />
        {rightTabs.map((route, i) => renderTab(route, i))}
      </View>

      <TouchableOpacity
        style={[
          styles.fabButton,
          {
            backgroundColor: colors.accent,
            ...Platform.select({
              ios: {
                shadowColor: colors.accent,
              },
              android: {},
            }),
          },
        ]}
        onPress={handleFabPress}
        onLongPress={handleFabLongPress}
        delayLongPress={800}
        activeOpacity={0.85}
      >
        <Icon name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  fabSpacer: {
    width: 72,
  },
  fabButton: {
    position: 'absolute',
    top: -26,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
});
