import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { calculateBMI, getBMICategory, calculateAge } from '../../../entities/user-profile';
import { useQuery } from '@tanstack/react-query';
import { getBPRecords } from '../../../shared/api/bp-repository';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}

function MenuItem({ icon, label, subtitle, onPress, colors, typography }: MenuItemProps) {
  return (
    <Pressable
      style={[styles.menuItem, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: colors.iconCircleBg }]}>
        <Icon name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.menuTextCol}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary, fontSize: typography.md }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

export function SettingsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();
  const navigation = useNavigation<SettingsNavProp>();
  const insets = useSafeAreaInsets();

  const {
    userName,
    dateOfBirth,
    height,
    defaultWeight,
  } = useSettingsStore();

  const { data: latestRecords } = useQuery({
    queryKey: ['bp-records'],
    queryFn: () => getBPRecords(1),
  });
  const latestWeight = latestRecords?.[0]?.weight ?? defaultWeight;
  const bmi = calculateBMI(latestWeight, height);
  const bmiCategory = bmi != null ? getBMICategory(bmi) : null;
  const age = calculateAge(dateOfBirth);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileSection}>
          <Icon name="person-circle" size={80} color={colors.accent} />
          <Text style={[styles.profileName, { color: colors.textPrimary, fontSize: typography['2xl'] }]}>
            {userName ?? t('settings.profile.defaultName')}
          </Text>
          <View style={styles.profileBadges}>
            <Text style={[styles.profileBadge, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {age != null
                ? t('settings.profile.age', { age: String(age) })
                : t('settings.profile.noAge')}
            </Text>
            <Text style={[styles.profileBadgeDot, { color: colors.textTertiary }]}>{'|'}</Text>
            <Text style={[styles.profileBadge, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {bmi != null && bmiCategory
                ? t('settings.profile.bmi', { bmi: bmi.toFixed(1), category: tCommon(`bmi.${bmiCategory}`) })
                : t('settings.profile.noBmi')}
            </Text>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <MenuItem
            icon="person-outline"
            label={t('settings.personalization.personalInfo')}
            subtitle={t('settings.personalization.menuSubtitle', { defaultValue: 'Name, date of birth, body metrics' })}
            onPress={() => navigation.navigate('PersonalInfo')}
            colors={colors}
            typography={typography}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <MenuItem
            icon="medical-outline"
            label={t('settings.guideline.title')}
            subtitle={t('settings.guideline.menuSubtitle', { defaultValue: 'Guidelines, units & BP legend' })}
            onPress={() => navigation.navigate('Classification')}
            colors={colors}
            typography={typography}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <MenuItem
            icon="settings-outline"
            label={t('settings.appSettings.title')}
            subtitle={t('settings.appSettings.menuSubtitle', { defaultValue: 'Theme, language & accessibility' })}
            onPress={() => navigation.navigate('AppSettings')}
            colors={colors}
            typography={typography}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <MenuItem
            icon="sync-outline"
            label={t('settings.healthSync.title', { defaultValue: 'Data & Sync' })}
            subtitle={t('settings.healthSync.menuSubtitle', { defaultValue: 'Health sync, privacy & cloud backup' })}
            onPress={() => navigation.navigate('Sync')}
            colors={colors}
            typography={typography}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <MenuItem
            icon="cloud-outline"
            label={t('settings.weather.title')}
            subtitle={t('settings.weather.menuSubtitle')}
            onPress={() => navigation.navigate('WeatherSettings')}
            colors={colors}
            typography={typography}
          />
        </Animated.View>

        {/* About & Disclaimer Card - stays on this page */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={[styles.aboutCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.aboutHeaderRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="information-circle-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.aboutTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.about.title')}
            </Text>
          </View>
          <Text
            style={[styles.disclaimerText, { color: colors.textSecondary, fontSize: typography.xs }]}
            accessibilityRole="text"
            accessibilityLabel={t('settings.about.disclaimer')}
          >
            {t('settings.about.disclaimer')}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 12,
  },
  profileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  profileBadge: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  profileBadgeDot: {
    fontFamily: FONTS.regular,
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
    minHeight: 72,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },

  // About card
  aboutCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aboutTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  disclaimerText: {
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
