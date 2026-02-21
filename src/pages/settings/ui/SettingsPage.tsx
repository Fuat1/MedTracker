import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type Language, type EntryMode } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { OptionChip } from '../../../shared/ui';
import { BP_UNITS, BP_GUIDELINES } from '../../../shared/config/settings';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import type { WeightUnit, HeightUnit, Gender } from '../../../shared/config/profile-constants';
import { GENDERS } from '../../../shared/config/profile-constants';
import { calculateBMI, getBMICategory, calculateAge } from '../../../entities/user-profile';
import { getLocales } from 'react-native-localize';
import { getSettingsForRegion } from '../../../shared/lib/region-settings';
import { useQuery } from '@tanstack/react-query';
import { getBPRecords } from '../../../shared/api/bp-repository';

export function SettingsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tMedical } = useTranslation('medical');
  const { colors, isDark, typography } = useTheme();
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const {
    unit,
    guideline,
    defaultLocation,
    defaultPosture,
    language,
    theme,
    seniorMode,
    highContrast,
    preferredEntryMode,
    userName,
    dateOfBirth,
    gender,
    height,
    defaultWeight,
    heightUnit,
    weightUnit,
    setUnit,
    setGuideline,
    setDefaultLocation,
    setDefaultPosture,
    setLanguage,
    setTheme,
    setSeniorMode,
    setHighContrast,
    setPreferredEntryMode,
    setUserName,
    setDateOfBirth,
    setGender,
    setHeight,
    setDefaultWeight,
    setHeightUnit,
    setWeightUnit,
  } = useSettingsStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [nameInput, setNameInput] = useState(userName ?? '');
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(
    dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1),
  );

  // Fetch latest record for BMI display
  const { data: latestRecords } = useQuery({
    queryKey: ['bp-records'],
    queryFn: () => getBPRecords(1),
  });
  const latestWeight = latestRecords?.[0]?.weight ?? defaultWeight;
  const bmi = calculateBMI(latestWeight, height);
  const bmiCategory = bmi != null ? getBMICategory(bmi) : null;
  const age = calculateAge(dateOfBirth);

  const showSavedToast = useCallback((setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [t]);

  const handleBiometricToggle = (_value: boolean) => {
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

  const handleSeniorModeToggle = (value: boolean) => {
    setSeniorMode(value);
    showSavedToast(t('settings.seniorMode.label'));
  };

  const handleHighContrastToggle = (value: boolean) => {
    setHighContrast(value);
    showSavedToast(t('settings.highContrast.label'));
  };

  const handleGenderChange = (newGender: Gender) => {
    setGender(gender === newGender ? null : newGender);
    showSavedToast(t('settings.personalization.gender'));
  };

  const handleEntryModeChange = (mode: EntryMode) => {
    setPreferredEntryMode(mode);
    showSavedToast(t('settings.entryMode.label'));
  };

  const handleDobSave = useCallback(() => {
    const iso = `${tempDob.getFullYear()}-${String(tempDob.getMonth() + 1).padStart(2, '0')}-${String(tempDob.getDate()).padStart(2, '0')}`;
    setDateOfBirth(iso);
    setDobModalVisible(false);
    showSavedToast(t('settings.personalization.dateOfBirth'));
  }, [tempDob, setDateOfBirth, t, showSavedToast]);

  const handleDobCancel = useCallback(() => {
    setTempDob(dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1));
    setDobModalVisible(false);
  }, [dateOfBirth]);

  const adjustDob = useCallback((field: 'year' | 'month' | 'day', delta: number) => {
    setTempDob(prev => {
      const d = new Date(prev);
      if (field === 'year') d.setFullYear(d.getFullYear() + delta);
      else if (field === 'month') d.setMonth(d.getMonth() + delta);
      else d.setDate(d.getDate() + delta);
      return d;
    });
  }, []);

  const handleHeightChange = useCallback((text: string) => {
    const val = parseFloat(text);
    if (text === '' || text === '0') {
      setHeight(null);
      return;
    }
    if (!isNaN(val)) {
      const cm = heightUnit === 'cm' ? val : val * 30.48;
      setHeight(Math.round(cm * 10) / 10);
    }
  }, [heightUnit, setHeight]);

  const handleWeightChange = useCallback((text: string) => {
    const val = parseFloat(text);
    if (text === '' || text === '0') {
      setDefaultWeight(null);
      return;
    }
    if (!isNaN(val)) {
      const kg = weightUnit === 'kg' ? val : val / 2.20462;
      setDefaultWeight(Math.round(kg * 10) / 10);
    }
  }, [weightUnit, setDefaultWeight]);

  const handleHeightUnitChange = useCallback((unit: HeightUnit) => {
    setHeightUnit(unit);
    showSavedToast(t('settings.personalization.height'));
  }, [setHeightUnit, t, showSavedToast]);

  const handleWeightUnitChange = useCallback((unit: WeightUnit) => {
    setWeightUnit(unit);
    showSavedToast(t('settings.personalization.defaultWeight'));
  }, [setWeightUnit, t, showSavedToast]);

  const heightDisplay = height != null
    ? (heightUnit === 'cm' ? String(Math.round(height)) : String(Math.round(height / 30.48 * 10) / 10))
    : '';

  const weightDisplay = defaultWeight != null
    ? (weightUnit === 'kg' ? String(Math.round(defaultWeight * 10) / 10) : String(Math.round(defaultWeight * 2.20462 * 10) / 10))
    : '';

  const formatDob = (dob: string | null): string => {
    if (!dob) return t('settings.personalization.dateOfBirthPlaceholder');
    const d = new Date(dob);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    [BP_GUIDELINES.WHO]: tMedical('guidelines.who.name'),
  };
  const guidelineName = guidelineNameMap[guideline] || 'AHA/ACC';

  const warningBannerStyle = {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  };
  const warningTextStyle = { color: colors.warningText, fontSize: typography.sm };
  const cardTitleWithMarginStyle = { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 16 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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

        {/* ═══════════════════ PERSONALIZATION SECTION ═══════════════════ */}
        <View style={styles.sectionTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
            <Icon name="person-outline" size={20} color={colors.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 0, marginTop: 0 }]}>
            {t('settings.personalization.title')}
          </Text>
        </View>

        {/* Personal Information Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 4 }]}>
            {t('settings.personalization.personalInfo')}
          </Text>
          <Text style={[styles.privacyNote, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('settings.personalization.privacyNote')}
          </Text>

          {/* Full Name */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.fullName')}
          </Text>
          <TextInput
            style={[
              styles.fieldInput,
              styles.nameInput,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                color: colors.textPrimary,
                fontSize: typography.sm,
              },
            ]}
            value={nameInput}
            onChangeText={setNameInput}
            onBlur={() => {
              const trimmed = nameInput.trim() || null;
              setUserName(trimmed);
              setNameInput(trimmed ?? '');
              if (trimmed) { showSavedToast(t('settings.personalization.fullName')); }
            }}
            placeholder={t('settings.personalization.fullNamePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={60}
            accessibilityLabel={t('settings.personalization.fullName')}
            accessible={true}
          />

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Date of Birth */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.dateOfBirth')}
          </Text>
          <Pressable
            style={[styles.fieldInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            onPress={() => setDobModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.personalization.dateOfBirth')}
          >
            <Icon name="calendar-outline" size={18} color={dateOfBirth ? colors.textPrimary : colors.textTertiary} />
            <Text style={[styles.fieldInputText, { color: dateOfBirth ? colors.textPrimary : colors.textTertiary, fontSize: typography.sm }]}>
              {formatDob(dateOfBirth)}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Gender */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.gender')}
          </Text>
          <View style={styles.chipRow}>
            {([
              { value: GENDERS.MALE as Gender, label: t('settings.personalization.genderMale') },
              { value: GENDERS.FEMALE as Gender, label: t('settings.personalization.genderFemale') },
              { value: GENDERS.OTHER as Gender, label: t('settings.personalization.genderOther') },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={gender === opt.value}
                onPress={() => handleGenderChange(opt.value)}
              />
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Height */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.height')}
          </Text>
          <View style={styles.fieldWithUnit}>
            <TextInput
              style={[styles.numericInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.textPrimary, fontSize: typography.sm }]}
              value={heightDisplay}
              onChangeText={handleHeightChange}
              keyboardType="numeric"
              placeholder={t('settings.personalization.heightPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel={t('settings.personalization.height')}
            />
            <View style={styles.unitChips}>
              <OptionChip label={tCommon('height.cm')} selected={heightUnit === 'cm'} onPress={() => handleHeightUnitChange('cm')} />
              <OptionChip label={tCommon('height.ft')} selected={heightUnit === 'ft'} onPress={() => handleHeightUnitChange('ft')} />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Default Weight */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.defaultWeight')}
          </Text>
          <View style={styles.fieldWithUnit}>
            <TextInput
              style={[styles.numericInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.textPrimary, fontSize: typography.sm }]}
              value={weightDisplay}
              onChangeText={handleWeightChange}
              keyboardType="numeric"
              placeholder={t('settings.personalization.defaultWeightPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel={t('settings.personalization.defaultWeight')}
            />
            <View style={styles.unitChips}>
              <OptionChip label={tCommon('weight.kg')} selected={weightUnit === 'kg'} onPress={() => handleWeightUnitChange('kg')} />
              <OptionChip label={tCommon('weight.lbs')} selected={weightUnit === 'lbs'} onPress={() => handleWeightUnitChange('lbs')} />
            </View>
          </View>
          <Text style={[styles.fieldHint, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('settings.personalization.defaultWeightHint')}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Default Location */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.defaultLocation')}
          </Text>
          <View style={styles.chipRow}>
            {([
              { value: MEASUREMENT_LOCATIONS.LEFT_ARM, label: t('settings.defaultLocation.leftArm.label') },
              { value: MEASUREMENT_LOCATIONS.RIGHT_ARM, label: t('settings.defaultLocation.rightArm.label') },
              { value: MEASUREMENT_LOCATIONS.LEFT_WRIST, label: t('settings.defaultLocation.leftWrist.label') },
              { value: MEASUREMENT_LOCATIONS.RIGHT_WRIST, label: t('settings.defaultLocation.rightWrist.label') },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={defaultLocation === opt.value}
                onPress={() => handleLocationChange(opt.value)}
              />
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* Default Posture */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('settings.personalization.defaultPosture')}
          </Text>
          <View style={styles.chipRow}>
            {([
              { value: MEASUREMENT_POSTURES.SITTING, label: t('settings.defaultPosture.sitting.label') },
              { value: MEASUREMENT_POSTURES.STANDING, label: t('settings.defaultPosture.standing.label') },
              { value: MEASUREMENT_POSTURES.LYING, label: t('settings.defaultPosture.lying.label') },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={defaultPosture === opt.value}
                onPress={() => handlePostureChange(opt.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* DOB Picker Modal */}
        <Modal
          visible={dobModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleDobCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('settings.personalization.dateOfBirth')}
              </Text>

              <View style={styles.dateDisplay}>
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                  {tempDob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>

              {/* Year Adjuster */}
              <View style={styles.adjuster}>
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                  Year
                </Text>
                <View style={styles.adjusterButtons}>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('year', -1)}
                    accessibilityRole="button"
                    accessibilityLabel="Year -1"
                  >
                    <Icon name="remove" size={24} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                    {tempDob.getFullYear()}
                  </Text>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('year', 1)}
                    disabled={tempDob.getFullYear() >= new Date().getFullYear()}
                    accessibilityRole="button"
                    accessibilityLabel="Year +1"
                  >
                    <Icon name="add" size={24} color={tempDob.getFullYear() >= new Date().getFullYear() ? colors.textTertiary : colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              {/* Month Adjuster */}
              <View style={styles.adjuster}>
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                  Month
                </Text>
                <View style={styles.adjusterButtons}>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('month', -1)}
                    accessibilityRole="button"
                    accessibilityLabel="Month -1"
                  >
                    <Icon name="remove" size={24} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                    {tempDob.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('month', 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Month +1"
                  >
                    <Icon name="add" size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              {/* Day Adjuster */}
              <View style={styles.adjuster}>
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                  Day
                </Text>
                <View style={styles.adjusterButtons}>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('day', -1)}
                    accessibilityRole="button"
                    accessibilityLabel="Day -1"
                  >
                    <Icon name="remove" size={24} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                    {tempDob.getDate()}
                  </Text>
                  <Pressable
                    style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => adjustDob('day', 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Day +1"
                  >
                    <Icon name="add" size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={handleDobCancel}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.cancel')}
                >
                  <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                    {tCommon('buttons.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: colors.accent }]}
                  onPress={handleDobSave}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.done')}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                    {tCommon('buttons.done')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Guideline Card */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="medical-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.guideline.title')}
            </Text>
          </View>
          <Pressable
            style={[styles.detectRegionButton, { borderColor: colors.accent }]}
            onPress={handleDetectRegion}
            accessibilityRole="button"
            accessibilityLabel={t('settings.detectRegion.button')}
          >
            <Icon name="earth-outline" size={18} color={colors.accent} />
            <Text style={[styles.detectRegionText, { color: colors.accent, fontSize: typography.sm }]}>
              {t('settings.detectRegion.button')}
            </Text>
          </Pressable>
          <View style={styles.chipRow}>
            {([
              { value: BP_GUIDELINES.AHA_ACC, label: tMedical('guidelines.ahaAcc.name') },
              { value: BP_GUIDELINES.ESC_ESH, label: tMedical('guidelines.escEsh.name') },
              { value: BP_GUIDELINES.JSH, label: tMedical('guidelines.jsh.name') },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={guideline === opt.value}
                onPress={() => handleGuidelineChange(opt.value)}
              />
            ))}
          </View>
          <Text style={[styles.guidelineNote, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('settings.guideline.note')}
          </Text>
        </Animated.View>

        {/* Unit Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="speedometer-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.unit.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: BP_UNITS.MMHG, label: 'mmHg' },
              { value: BP_UNITS.KPA, label: 'kPa' },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={unit === opt.value}
                onPress={() => handleUnitChange(opt.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* BP Legend Card */}
        <Animated.View
          entering={FadeInUp.delay(250).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, cardTitleWithMarginStyle]}>
            {t('settings.bpLegend.title', { guideline: guidelineName })}
          </Text>

          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.normal }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.normal')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.elevated }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.elevated')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_1 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.stage1')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_2 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.stage2')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════════════ APP SETTINGS SECTION ═══════════════════ */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
          {t('settings.appSettings.title')}
        </Text>

        {/* Entry Mode Card */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="add-circle-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                {t('settings.entryMode.label')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('settings.entryMode.description')}
              </Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: null as EntryMode, label: t('settings.entryMode.alwaysAsk') },
              { value: 'quickLog' as EntryMode, label: t('settings.entryMode.quickLog') },
              { value: 'guided' as EntryMode, label: t('settings.entryMode.guided') },
            ]).map((opt) => (
              <OptionChip
                key={String(opt.value)}
                label={opt.label}
                selected={preferredEntryMode === opt.value}
                onPress={() => handleEntryModeChange(opt.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Theme Card */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, cardTitleWithMarginStyle]}>
            {t('settings.theme.title')}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Icon name="moon" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.darkMode')}
              </Text>
            </View>
            <Switch
              value={isDarkToggled}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
              thumbColor={colors.toggleThumb}
              accessibilityRole="switch"
              accessibilityLabel={t('settings.darkMode')}
            />
          </View>

          {theme !== 'system' && (
            <Pressable
              onPress={handleSystemTheme}
              style={styles.systemThemeLink}
              accessibilityRole="button"
              accessibilityLabel={t('settings.useSystemDefault')}
            >
              <Icon name="phone-portrait-outline" size={14} color={colors.accent} />
              <Text style={[styles.systemThemeText, { color: colors.accent, fontSize: typography.sm }]}>
                {t('settings.useSystemDefault')}
              </Text>
            </Pressable>
          )}
          {theme === 'system' && (
            <View style={styles.systemThemeLink}>
              <Icon name="phone-portrait-outline" size={14} color={colors.accent} />
              <Text style={[styles.systemThemeText, { color: colors.accent, fontSize: typography.sm }]}>
                {t('settings.theme.system.label')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Senior Mode Card */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
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
        </Animated.View>

        {/* High Contrast Card */}
        <Animated.View
          entering={FadeInUp.delay(450).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.highContrast.label')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('settings.highContrast.description')}
              </Text>
              {highContrast && (
                <Text style={[styles.noteText, { color: colors.accent, fontSize: typography.xs }]}>
                  {t('settings.highContrast.note')}
                </Text>
              )}
            </View>
            <Switch
              value={highContrast}
              onValueChange={handleHighContrastToggle}
              trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
              thumbColor={colors.toggleThumb}
              accessibilityRole="switch"
              accessibilityLabel={t('settings.highContrast.label')}
            />
          </View>
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
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
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
              <OptionChip
                key={opt.code}
                label={opt.label}
                selected={language === opt.code}
                onPress={() => handleLanguageChange(opt.code)}
              />
            ))}
          </View>
        </Animated.View>

        {/* ═══════════════════ DATA & PRIVACY SECTION ═══════════════════ */}

        {/* Data Privacy Card */}
        <Animated.View
          entering={FadeInUp.delay(550).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="lock-closed" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.dataPrivacy.title')}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('settings.dataPrivacy.localEncrypted')}
            </Text>
            <Text style={[styles.activeText, { color: colors.successText, fontSize: typography.sm }]}>
              {t('settings.dataPrivacy.active')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Icon name="finger-print" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.dataPrivacy.biometricLock')}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.toggleTrackInactive, true: colors.toggleTrackActive }}
              thumbColor={colors.toggleThumb}
              accessibilityRole="switch"
              accessibilityLabel={t('settings.dataPrivacy.biometricLock')}
            />
          </View>
        </Animated.View>

        {/* Cloud Sync Card */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="cloud-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                {t('settings.cloudSync.title')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('settings.cloudSync.lastBackup', { time: t('settings.cloudSync.neverSynced') })}
              </Text>
            </View>
            <Pressable
              onPress={handleCloudAction}
              style={styles.syncIconBtn}
              accessibilityRole="button"
              accessibilityLabel={t('settings.cloudSync.syncNow')}
            >
              <Icon name="sync-outline" size={22} color={colors.accent} />
            </Pressable>
          </View>

          <View style={[styles.warningBanner, warningBannerStyle]}>
            <Icon name="warning-outline" size={18} color={colors.warningText} />
            <Text style={[styles.warningText, warningTextStyle]}>
              {t('settings.cloudSync.privacyWarning')}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.outlineButton, { borderColor: colors.border }]}
              onPress={handleCloudAction}
              accessibilityRole="button"
              accessibilityLabel={t('settings.cloudSync.googleDrive')}
            >
              <Text style={[styles.outlineButtonText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('settings.cloudSync.googleDrive')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filledButton, { backgroundColor: colors.accent }]}
              onPress={handleCloudAction}
              accessibilityRole="button"
              accessibilityLabel={t('settings.cloudSync.syncNow')}
            >
              <Text style={[styles.filledButtonText, { color: colors.surface, fontSize: typography.sm }]}>
                {t('settings.cloudSync.syncNow')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* About & Disclaimer Card */}
        <Animated.View
          entering={FadeInUp.delay(650).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="information-circle-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
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
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 12,
  },

  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  privacyNote: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginBottom: 14,
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
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  cardSubtitle: {
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
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingDescription: {
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  noteText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 8,
  },
  activeText: {
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

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.regular,
    lineHeight: 18,
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
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Profile badges
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

  // Personalization field styles
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    minHeight: 48,
  },
  fieldInputText: {
    fontFamily: FONTS.regular,
    flex: 1,
  },
  nameInput: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  fieldWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numericInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    minHeight: 48,
  },
  unitChips: {
    flexDirection: 'row',
    gap: 6,
  },
  fieldHint: {
    fontFamily: FONTS.regular,
    marginTop: 6,
  },
  disclaimerText: {
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  guidelineNote: {
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginTop: 12,
  },

  // DOB Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  adjuster: {
    marginBottom: 16,
  },
  adjusterLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adjusterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjusterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjusterValue: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  actionButtonPrimary: {},
  actionButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
  },
});
