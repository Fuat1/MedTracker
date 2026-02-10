import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type Language, type ThemeMode } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { BP_UNITS, BP_GUIDELINES } from '../../../shared/config/settings';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import { getLocales } from 'react-native-localize';
import { getSettingsForRegion } from '../../../shared/lib/region-settings';

export function SettingsPage() {
  const { t } = useTranslation('pages');
  const { t: tMedical } = useTranslation('medical');
  const { colors, isDark } = useTheme();
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const {
    unit,
    guideline,
    defaultLocation,
    defaultPosture,
    language,
    theme,
    setUnit,
    setGuideline,
    setDefaultLocation,
    setDefaultPosture,
    setLanguage,
    setTheme,
  } = useSettingsStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const showSavedToast = (setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleBiometricToggle = (value: boolean) => {
    Alert.alert(
      t('settings.dataPrivacy.comingSoon'),
      t('settings.dataPrivacy.comingSoonMessage'),
    );
    setBiometricEnabled(false);
  };

  const handleCloudAction = () => {
    Alert.alert(
      t('settings.cloudSync.comingSoon'),
      t('settings.cloudSync.comingSoonMessage'),
    );
  };

  const handleThemeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
    showSavedToast(t('settings.theme.title'));
  };

  const handleSystemTheme = () => {
    setTheme('system');
    showSavedToast(t('settings.theme.title'));
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    showSavedToast(t('settings.language.title'));
  };

  const handleGuidelineChange = (newGuideline: typeof BP_GUIDELINES[keyof typeof BP_GUIDELINES]) => {
    setGuideline(newGuideline);
    showSavedToast(t('settings.guideline.title'));
  };

  const handleUnitChange = (newUnit: typeof BP_UNITS[keyof typeof BP_UNITS]) => {
    setUnit(newUnit);
    showSavedToast(t('settings.unit.title'));
  };

  const handleLocationChange = (newLocation: MeasurementLocation) => {
    setDefaultLocation(newLocation);
    showSavedToast(t('settings.defaultLocation.title'));
  };

  const handlePostureChange = (newPosture: MeasurementPosture) => {
    setDefaultPosture(newPosture);
    showSavedToast(t('settings.defaultPosture.title'));
  };

  const handleDetectRegion = () => {
    const locales = getLocales();
    const countryCode = locales[0]?.countryCode ?? '';
    const recommended = getSettingsForRegion(countryCode);

    const changed = recommended.guideline !== guideline || recommended.unit !== unit;
    if (changed) {
      if (recommended.guideline !== guideline) setGuideline(recommended.guideline);
      if (recommended.unit !== unit) setUnit(recommended.unit);
      Toast.show({
        type: 'success',
        text1: t('settings.detectRegion.updated'),
        position: 'bottom',
        visibilityTime: 2500,
      });
    } else {
      Toast.show({
        type: 'info',
        text1: t('settings.detectRegion.noChange'),
        position: 'bottom',
        visibilityTime: 2500,
      });
    }
  };

  // Resolve theme for switch state
  const isDarkToggled = theme === 'dark' || (theme === 'system' && isDark);

  // Get guideline display name
  const guidelineNameMap: Record<string, string> = {
    [BP_GUIDELINES.AHA_ACC]: tMedical('guidelines.ahaAcc.name'),
    [BP_GUIDELINES.ESC_ESH]: tMedical('guidelines.escEsh.name'),
    [BP_GUIDELINES.JSH]: tMedical('guidelines.jsh.name'),
  };
  const guidelineName = guidelineNameMap[guideline] || 'AHA/ACC';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileSection}>
          <Icon name="person-circle" size={80} color={colors.accent} />
          <Text style={[styles.profileName, { color: colors.textPrimary }]}>
            {t('settings.profile.defaultName')}
          </Text>
        </Animated.View>

        {/* Data Privacy Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="lock-closed" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.dataPrivacy.title')}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
              {t('settings.dataPrivacy.localEncrypted')}
            </Text>
            <Text style={[styles.activeText, { color: colors.successText }]}>
              {t('settings.dataPrivacy.active')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Icon name="finger-print" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                {t('settings.dataPrivacy.biometricLock')}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
              thumbColor="#ffffff"
            />
          </View>
        </Animated.View>

        {/* Cloud Sync Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="cloud-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t('settings.cloudSync.title')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t('settings.cloudSync.lastBackup', { time: t('settings.cloudSync.neverSynced') })}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloudAction} style={styles.syncIconBtn}>
              <Icon name="sync-outline" size={22} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={[styles.warningBanner, { backgroundColor: isDark ? '#422006' : '#fef3c7', borderColor: isDark ? '#92400e' : '#f59e0b' }]}>
            <Icon name="warning-outline" size={18} color={isDark ? '#fbbf24' : '#d97706'} />
            <Text style={[styles.warningText, { color: isDark ? '#fde68a' : '#92400e' }]}>
              {t('settings.cloudSync.privacyWarning')}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: colors.border }]}
              onPress={handleCloudAction}
              activeOpacity={0.7}
            >
              <Text style={[styles.outlineButtonText, { color: colors.textSecondary }]}>
                {t('settings.cloudSync.googleDrive')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filledButton, { backgroundColor: colors.accent }]}
              onPress={handleCloudAction}
              activeOpacity={0.85}
            >
              <Text style={styles.filledButtonText}>
                {t('settings.cloudSync.syncNow')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* AHA Standard Legend Card */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
            {t('settings.bpLegend.title', { guideline: guidelineName })}
          </Text>

          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.normal }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                {t('settings.bpLegend.normal')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.elevated }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                {t('settings.bpLegend.elevated')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_1 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                {t('settings.bpLegend.stage1')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_2 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>
                {t('settings.bpLegend.stage2')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Theme Card */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
            {t('settings.theme.title')}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Icon name="moon" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                {t('settings.darkMode')}
              </Text>
            </View>
            <Switch
              value={isDarkToggled}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
              thumbColor="#ffffff"
            />
          </View>

          {theme !== 'system' && (
            <TouchableOpacity onPress={handleSystemTheme} style={styles.systemThemeLink}>
              <Icon name="phone-portrait-outline" size={14} color={colors.accent} />
              <Text style={[styles.systemThemeText, { color: colors.accent }]}>
                {t('settings.useSystemDefault')}
              </Text>
            </TouchableOpacity>
          )}
          {theme === 'system' && (
            <View style={styles.systemThemeLink}>
              <Icon name="phone-portrait-outline" size={14} color={colors.accent} />
              <Text style={[styles.systemThemeText, { color: colors.accent }]}>
                {t('settings.theme.system.label')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Language Card */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="language-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.language.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { code: 'en' as Language, label: 'EN' },
              { code: 'id' as Language, label: 'ID' },
              { code: 'sr' as Language, label: 'SR' },
              { code: 'tr' as Language, label: 'TR' },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.chip,
                  language === opt.code
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handleLanguageChange(opt.code)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: language === opt.code ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Guideline Card */}
        <Animated.View
          entering={FadeInUp.delay(550).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="medical-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.guideline.title')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.detectRegionButton, { borderColor: colors.accent }]}
            onPress={handleDetectRegion}
            activeOpacity={0.7}
          >
            <Icon name="earth-outline" size={18} color={colors.accent} />
            <Text style={[styles.detectRegionText, { color: colors.accent }]}>
              {t('settings.detectRegion.button')}
            </Text>
          </TouchableOpacity>
          <View style={styles.chipRow}>
            {([
              { value: BP_GUIDELINES.AHA_ACC, label: tMedical('guidelines.ahaAcc.name') },
              { value: BP_GUIDELINES.ESC_ESH, label: tMedical('guidelines.escEsh.name') },
              { value: BP_GUIDELINES.JSH, label: tMedical('guidelines.jsh.name') },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  guideline === opt.value
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handleGuidelineChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: guideline === opt.value ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Unit Card */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="speedometer-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.unit.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: BP_UNITS.MMHG, label: 'mmHg' },
              { value: BP_UNITS.KPA, label: 'kPa' },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  unit === opt.value
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handleUnitChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: unit === opt.value ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Location Card */}
        <Animated.View
          entering={FadeInUp.delay(650).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="body-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.defaultLocation.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: MEASUREMENT_LOCATIONS.LEFT_ARM, label: t('settings.defaultLocation.leftArm.label') },
              { value: MEASUREMENT_LOCATIONS.RIGHT_ARM, label: t('settings.defaultLocation.rightArm.label') },
              { value: MEASUREMENT_LOCATIONS.LEFT_WRIST, label: t('settings.defaultLocation.leftWrist.label') },
              { value: MEASUREMENT_LOCATIONS.RIGHT_WRIST, label: t('settings.defaultLocation.rightWrist.label') },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  defaultLocation === opt.value
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handleLocationChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: defaultLocation === opt.value ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Posture Card */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="accessibility-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('settings.defaultPosture.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: MEASUREMENT_POSTURES.SITTING, label: t('settings.defaultPosture.sitting.label') },
              { value: MEASUREMENT_POSTURES.STANDING, label: t('settings.defaultPosture.standing.label') },
              { value: MEASUREMENT_POSTURES.LYING, label: t('settings.defaultPosture.lying.label') },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  defaultPosture === opt.value
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={() => handlePostureChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: defaultPosture === opt.value ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 12,
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  // Icon circle
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Settings rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  activeText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },

  // Sync icon
  syncIconBtn: {
    padding: 8,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  outlineButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  filledButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  filledButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },

  // System theme link
  systemThemeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  systemThemeText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },

  // Legend
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
    paddingVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },

  // Detect region
  detectRegionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 48,
  },
  detectRegionText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
