import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { Card, CardBody, CardDivider, CardHeader, Button, ButtonText, ButtonGroup, SettingRow } from '../../../shared/ui';
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
        <Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
              <CardHeader icon="fitness-outline" title={platformName} />

              <Button
                variant="primary"
                size="md"
                onPress={() => syncHealth()}
                isLoading={isSyncingHealth}
                isDisabled={isSyncingHealth}
                accessibilityLabel={t('settings.healthSync.syncNow', { defaultValue: 'Sync Health Data' })}
              >
                <ButtonText>
                  {isSyncingHealth
                    ? t('settings.healthSync.syncing', { defaultValue: 'Syncing...' })
                    : t('settings.healthSync.syncNow', { defaultValue: 'Sync Health Data' })
                  }
                </ButtonText>
              </Button>
            </CardBody>
          </Card>
        </Animated.View>

        {/* Data Privacy Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
              <CardHeader icon="lock-closed" title={t('settings.dataPrivacy.title')} />

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t('settings.dataPrivacy.localEncrypted')}
                </Text>
                <Text style={[styles.activeText, { color: colors.successText, fontSize: typography.sm }]}>
                  {t('settings.dataPrivacy.active')}
                </Text>
              </View>

              <CardDivider />

              <SettingRow
                icon="finger-print"
                label={t('settings.dataPrivacy.biometricLock')}
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
              />
            </CardBody>
          </Card>
        </Animated.View>

        {/* Cloud Sync Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
              <CardHeader
                icon="cloud-outline"
                title={t('settings.cloudSync.title')}
                action={
                  <Pressable
                    onPress={handleCloudAction}
                    style={styles.syncIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.cloudSync.syncNow')}
                  >
                    <Icon name="sync-outline" size={22} color={colors.accent} />
                  </Pressable>
                }
              />

              <View style={[styles.warningBanner, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                <Icon name="warning-outline" size={18} color={colors.warningText} />
                <Text style={[styles.warningText, { color: colors.warningText, fontSize: typography.sm }]}>
                  {t('settings.cloudSync.privacyWarning')}
                </Text>
              </View>

              <ButtonGroup direction="row" spacing="lg">
                <Button
                  variant="secondary"
                  size="md"
                  onPress={handleCloudAction}
                  accessibilityLabel={t('settings.cloudSync.googleDrive')}
                  style={styles.flexOne}
                >
                  <ButtonText>{t('settings.cloudSync.googleDrive')}</ButtonText>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleCloudAction}
                  accessibilityLabel={t('settings.cloudSync.syncNow')}
                  style={styles.flexOne}
                >
                  <ButtonText>{t('settings.cloudSync.syncNow')}</ButtonText>
                </Button>
              </ButtonGroup>
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
  flexOne: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  activeText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
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
});
