import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type Language, type ThemeMode } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { BP_UNITS, BP_GUIDELINES } from '../../../shared/config/settings';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';

const THEME_OPTIONS: Array<{ value: ThemeMode; icon: string }> = [
  { value: 'light', icon: 'sunny' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'phone-portrait-outline' },
];

export function SettingsPage() {
  const { t } = useTranslation('pages');
  const { t: tMedical } = useTranslation('medical');
  const { colors } = useTheme();

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

  const languageOptions: Array<{
    code: Language;
    name: string;
    nativeName: string;
  }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  ];

  const units = [
    { value: BP_UNITS.MMHG, label: t('settings.unit.mmhg.label'), description: t('settings.unit.mmhg.description') },
    { value: BP_UNITS.KPA, label: t('settings.unit.kpa.label'), description: t('settings.unit.kpa.description') },
  ];

  const guidelines = [
    {
      value: BP_GUIDELINES.AHA_ACC,
      label: tMedical('guidelines.ahaAcc.name'),
      description: tMedical('guidelines.ahaAcc.fullName'),
      regions: tMedical('guidelines.ahaAcc.regions'),
    },
    {
      value: BP_GUIDELINES.ESC_ESH,
      label: tMedical('guidelines.escEsh.name'),
      description: tMedical('guidelines.escEsh.fullName'),
      regions: tMedical('guidelines.escEsh.regions'),
    },
    {
      value: BP_GUIDELINES.JSH,
      label: tMedical('guidelines.jsh.name'),
      description: tMedical('guidelines.jsh.fullName'),
      regions: tMedical('guidelines.jsh.regions'),
    },
  ];

  const locations = [
    { value: MEASUREMENT_LOCATIONS.LEFT_ARM, label: t('settings.defaultLocation.leftArm.label'), description: t('settings.defaultLocation.leftArm.description') },
    { value: MEASUREMENT_LOCATIONS.RIGHT_ARM, label: t('settings.defaultLocation.rightArm.label'), description: t('settings.defaultLocation.rightArm.description') },
    { value: MEASUREMENT_LOCATIONS.LEFT_WRIST, label: t('settings.defaultLocation.leftWrist.label'), description: t('settings.defaultLocation.leftWrist.description') },
    { value: MEASUREMENT_LOCATIONS.RIGHT_WRIST, label: t('settings.defaultLocation.rightWrist.label'), description: t('settings.defaultLocation.rightWrist.description') },
  ];

  const postures = [
    { value: MEASUREMENT_POSTURES.SITTING, label: t('settings.defaultPosture.sitting.label'), description: t('settings.defaultPosture.sitting.description') },
    { value: MEASUREMENT_POSTURES.STANDING, label: t('settings.defaultPosture.standing.label'), description: t('settings.defaultPosture.standing.description') },
    { value: MEASUREMENT_POSTURES.LYING, label: t('settings.defaultPosture.lying.label'), description: t('settings.defaultPosture.lying.description') },
  ];

  const showSavedToast = (setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    showSavedToast(t('settings.theme.title'));
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    showSavedToast(t('settings.language.title'));
  };

  const handleUnitChange = (newUnit: typeof BP_UNITS[keyof typeof BP_UNITS]) => {
    setUnit(newUnit);
    showSavedToast(t('settings.unit.title'));
  };

  const handleGuidelineChange = (newGuideline: typeof BP_GUIDELINES[keyof typeof BP_GUIDELINES]) => {
    setGuideline(newGuideline);
    showSavedToast(t('settings.guideline.title'));
  };

  const handleLocationChange = (newLocation: MeasurementLocation) => {
    setDefaultLocation(newLocation);
    showSavedToast(t('settings.defaultLocation.title'));
  };

  const handlePostureChange = (newPosture: MeasurementPosture) => {
    setDefaultPosture(newPosture);
    showSavedToast(t('settings.defaultPosture.title'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('settings.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.theme.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.theme.description')}
          </Text>

          {THEME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { borderColor: colors.border },
                theme === option.value && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handleThemeChange(option.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: theme === option.value ? colors.accent : colors.border },
                ]}>
                  {theme === option.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <View style={styles.optionLabelRow}>
                    <Icon name={option.icon} size={18} color={theme === option.value ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                      {t(`settings.theme.${option.value}.label`)}
                    </Text>
                  </View>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {t(`settings.theme.${option.value}.description`)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.language.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.language.description')}
          </Text>

          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.option,
                { borderColor: colors.border },
                language === option.code && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handleLanguageChange(option.code)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {option.nativeName}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.name}
                  </Text>
                </View>
                <View style={[
                  styles.radioOuter,
                  { borderColor: language === option.code ? colors.accent : colors.border },
                ]}>
                  {language === option.code && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Measurement Unit Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.unit.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.unit.description')}
          </Text>

          {units.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                { borderColor: colors.border },
                unit === item.value && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handleUnitChange(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: unit === item.value ? colors.accent : colors.border },
                ]}>
                  {unit === item.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={[styles.infoBox, { backgroundColor: colors.accent + '15', borderLeftColor: colors.accent }]}>
            <Text style={[styles.infoText, { color: colors.accent }]}>
              {t('settings.unit.note')}
            </Text>
          </View>
        </View>

        {/* Classification Guidelines Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.guideline.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.guideline.description')}
          </Text>

          {guidelines.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                { borderColor: colors.border },
                guideline === item.value && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handleGuidelineChange(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: guideline === item.value ? colors.accent : colors.border },
                ]}>
                  {guideline === item.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                  <Text style={[styles.optionRegions, { color: colors.textTertiary }]}>Regions: {item.regions}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={[styles.infoBox, { backgroundColor: colors.accent + '15', borderLeftColor: colors.accent }]}>
            <Text style={[styles.infoText, { color: colors.accent }]}>
              {t('settings.guideline.note')}
            </Text>
          </View>
        </View>

        {/* Default Measurement Location Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.defaultLocation.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.defaultLocation.description')}
          </Text>

          {locations.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                { borderColor: colors.border },
                defaultLocation === item.value && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handleLocationChange(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: defaultLocation === item.value ? colors.accent : colors.border },
                ]}>
                  {defaultLocation === item.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Default Posture Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.defaultPosture.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('settings.defaultPosture.description')}
          </Text>

          {postures.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                { borderColor: colors.border },
                defaultPosture === item.value && { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
              ]}
              onPress={() => handlePostureChange(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: defaultPosture === item.value ? colors.accent : colors.border },
                ]}>
                  {defaultPosture === item.value && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comparison Table */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.guidelinesComparison.title')}
          </Text>
          <View style={styles.comparisonTable}>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableHeader, { color: colors.textPrimary }]}>
                {t('settings.guidelinesComparison.table.category')}
              </Text>
              <Text style={[styles.tableHeader, { color: colors.textPrimary }]}>
                {tMedical('guidelines.ahaAcc.name')}
              </Text>
              <Text style={[styles.tableHeader, { color: colors.textPrimary }]}>
                {tMedical('guidelines.escEsh.name')}
              </Text>
            </View>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                {t('settings.guidelinesComparison.table.normal')}
              </Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>&lt;120/80</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>&lt;130/85</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                {t('settings.guidelinesComparison.table.elevated')}
              </Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>120-129/&lt;80</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>130-139/85-89</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                {t('settings.guidelinesComparison.table.stage1')}
              </Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>130-139/80-89</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>140-159/90-99</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                {t('settings.guidelinesComparison.table.stage2')}
              </Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>≥140/90</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>≥160/100</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>
                {t('settings.guidelinesComparison.table.crisis')}
              </Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>&gt;180/120</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary }]}>≥180/110</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  section: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
  },
  optionRegions: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  comparisonTable: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tableHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
  },
});
