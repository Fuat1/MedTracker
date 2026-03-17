import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { OptionChip } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import type { WeightUnit, HeightUnit, Gender } from '../../../shared/config/profile-constants';
import { GENDERS } from '../../../shared/config/profile-constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type Props = NativeStackScreenProps<SettingsStackParamList, 'PersonalInfo'>;

export function PersonalInfoPage({ navigation }: Props) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();

  const {
    defaultLocation,
    defaultPosture,
    userName,
    dateOfBirth,
    gender,
    height,
    defaultWeight,
    heightUnit,
    weightUnit,
    setDefaultLocation,
    setDefaultPosture,
    setUserName,
    setDateOfBirth,
    setGender,
    setHeight,
    setDefaultWeight,
    setHeightUnit,
    setWeightUnit,
  } = useSettingsStore();

  const insets = useSafeAreaInsets();
  const [nameInput, setNameInput] = useState(userName ?? '');
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(
    dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1),
  );

  const showSavedToast = useCallback((setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [t]);

  const handleLocationChange = (newLocation: MeasurementLocation) => {
    setDefaultLocation(newLocation);
    showSavedToast(t('settings.defaultLocation.title'));
  };

  const handlePostureChange = (newPosture: MeasurementPosture) => {
    setDefaultPosture(newPosture);
    showSavedToast(t('settings.defaultPosture.title'));
  };

  const handleGenderChange = (newGender: Gender) => {
    setGender(gender === newGender ? null : newGender);
    showSavedToast(t('settings.personalization.gender'));
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

  const handleHeightUnitChange = useCallback((u: HeightUnit) => {
    setHeightUnit(u);
    showSavedToast(t('settings.personalization.height'));
  }, [setHeightUnit, t, showSavedToast]);

  const handleWeightUnitChange = useCallback((u: WeightUnit) => {
    setWeightUnit(u);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.back')}
        >
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('settings.personalization.personalInfo')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>Year</Text>
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
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>Month</Text>
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
                <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>Day</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  privacyNote: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginBottom: 14,
  },
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
