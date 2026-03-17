import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { useSyncHealthPlatform } from '../../../features/health-sync/useSyncHealthPlatform';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Sync'>;

export function SyncPage({ navigation }: Props) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();

  const insets = useSafeAreaInsets();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const { mutate: syncHealth, isPending: isSyncingHealth } = useSyncHealthPlatform();
  const platformName = Platform.select({ ios: 'Apple Health', android: 'Health Connect', default: 'Health' });

  const handleBiometricToggle = useCallback((_value: boolean) => {
    Alert.alert(
      t('settings.dataPrivacy.comingSoon'),
      t('settings.dataPrivacy.comingSoonMessage'),
    );
    setBiometricEnabled(false);
  }, [t]);

  const handleCloudAction = useCallback(() => {
    Alert.alert(
      t('settings.cloudSync.comingSoon'),
      t('settings.cloudSync.comingSoonMessage'),
    );
  }, [t]);

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
          {t('settings.healthSync.title', { defaultValue: 'Data & Sync' })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Health Integration Card */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="fitness-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                {platformName}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('settings.healthSync.description', { defaultValue: `${platformName} Sync`, platform: platformName })}
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.filledButton,
                { backgroundColor: colors.accent },
                isSyncingHealth && { opacity: 0.7 },
              ]}
              onPress={() => syncHealth()}
              disabled={isSyncingHealth}
              accessibilityRole="button"
              accessibilityLabel={t('settings.healthSync.syncNow', { defaultValue: 'Sync Health Data' })}
            >
              <Text style={[styles.filledButtonText, { color: colors.surface, fontSize: typography.sm }]}>
                {isSyncingHealth
                  ? t('settings.healthSync.syncing', { defaultValue: 'Syncing...' })
                  : t('settings.healthSync.syncNow', { defaultValue: 'Sync Health Data' })
                }
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Data Privacy Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
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
          entering={FadeInUp.delay(200).duration(400)}
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

          <View style={[styles.warningBanner, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
            <Icon name="warning-outline" size={18} color={colors.warningText} />
            <Text style={[styles.warningText, { color: colors.warningText, fontSize: typography.sm }]}>
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
  activeText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  syncIconBtn: {
    padding: 8,
  },
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
});
