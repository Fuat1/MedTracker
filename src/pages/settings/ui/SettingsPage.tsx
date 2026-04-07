import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { Card, CardBody, CardHeader, MenuItem, ProfileBadgeRow } from '../../../shared/ui';
import { calculateBMI, getBMICategory, calculateAge } from '../../../entities/user-profile';
import { useQuery } from '@tanstack/react-query';
import { getBPRecords } from '../../../shared/api/bp-repository';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;


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
          <ProfileBadgeRow
            badges={[
              {
                icon: 'calendar-outline',
                label: age != null
                  ? t('settings.profile.age', { age: String(age) })
                  : t('settings.profile.noAge'),
              },
              {
                icon: 'body-outline',
                label: bmi != null && bmiCategory
                  ? t('settings.profile.bmi', { bmi: bmi.toFixed(1), category: tCommon(`bmi.${bmiCategory}`) })
                  : t('settings.profile.noBmi'),
              },
            ]}
          />
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <MenuItem
            icon="person-outline"
            label={t('settings.personalization.personalInfo')}
            subtitle={t('settings.personalization.menuSubtitle', { defaultValue: 'Name, date of birth, body metrics' })}
            onPress={() => navigation.navigate('PersonalInfo')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <MenuItem
            icon="medical-outline"
            label={t('settings.guideline.title')}
            subtitle={t('settings.guideline.menuSubtitle', { defaultValue: 'Guidelines, units & BP legend' })}
            onPress={() => navigation.navigate('Classification')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <MenuItem
            icon="settings-outline"
            label={t('settings.appSettings.title')}
            subtitle={t('settings.appSettings.menuSubtitle', { defaultValue: 'Theme, language & accessibility' })}
            onPress={() => navigation.navigate('AppSettings')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <MenuItem
            icon="sync-outline"
            label={t('settings.healthSync.title', { defaultValue: 'Data & Sync' })}
            subtitle={t('settings.healthSync.menuSubtitle', { defaultValue: 'Health sync, privacy & cloud backup' })}
            onPress={() => navigation.navigate('Sync')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <MenuItem
            icon="cloud-outline"
            label={t('settings.weather.title')}
            subtitle={t('settings.weather.menuSubtitle')}
            onPress={() => navigation.navigate('WeatherSettings')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <MenuItem
            icon="people-outline"
            label={t('familySharing.title')}
            subtitle={t('familySharing.noLinkedPeopleSubtitle')}
            onPress={() => navigation.navigate('FamilySharing')}
          />
        </Animated.View>

        {/* About & Disclaimer Card - stays on this page */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.aboutCardMargin}>
          <Card variant="elevated" size="lg" style={styles.aboutCardRadius}>
            <CardHeader icon="information-circle-outline" title={t('settings.about.title')} />
            <CardBody>
              <Text
                style={[styles.disclaimerText, { color: colors.textSecondary, fontSize: typography.xs }]}
                accessibilityRole="text"
                accessibilityLabel={t('settings.about.disclaimer')}
              >
                {t('settings.about.disclaimer')}
              </Text>
            </CardBody>
          </Card>
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
  // About card
  aboutCardMargin: {
    marginTop: 8,
    marginBottom: 16,
  },
  aboutCardRadius: {
    borderRadius: 20,
  },
  disclaimerText: {
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
