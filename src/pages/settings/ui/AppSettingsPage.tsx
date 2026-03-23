import React, { useCallback } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type Language, type EntryMode } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { OptionChip, Card, CardBody } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AppSettings'>;

export function AppSettingsPage({ navigation }: Props) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, isDark, typography } = useTheme();

  const {
    language,
    theme,
    seniorMode,
    highContrast,
    preferredEntryMode,
    setLanguage,
    setTheme,
    setSeniorMode,
    setHighContrast,
    setPreferredEntryMode,
  } = useSettingsStore();

  const insets = useSafeAreaInsets();

  const showSavedToast = useCallback((setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [t]);

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

  const handleSeniorModeToggle = (value: boolean) => {
    setSeniorMode(value);
    showSavedToast(t('settings.seniorMode.label'));
  };

  const handleHighContrastToggle = (value: boolean) => {
    setHighContrast(value);
    showSavedToast(t('settings.highContrast.label'));
  };

  const handleEntryModeChange = (mode: EntryMode) => {
    setPreferredEntryMode(mode);
    showSavedToast(t('settings.entryMode.label'));
  };

  const isDarkToggled = theme === 'dark' || (theme === 'system' && isDark);

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
          {t('settings.appSettings.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Entry Mode Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
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
            </CardBody>
          </Card>
        </Animated.View>

        {/* Theme Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 16 }]}>
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
            </CardBody>
          </Card>
        </Animated.View>

        {/* Senior Mode Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
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
            </CardBody>
          </Card>
        </Animated.View>

        {/* High Contrast Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
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
            </CardBody>
          </Card>
        </Animated.View>

        {/* Language Card */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
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
  cardMargin: {
    marginBottom: 16,
  },
  cardRadius: {
    borderRadius: 20,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
});
