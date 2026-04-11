import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/lib/use-theme';
import { FONTS } from '@/shared/config/theme';
import { Card, CardBody, Button, ButtonText, ButtonIcon } from '@/shared/ui';
import { useToastStore } from '@/shared/lib/toast-store';
import type { SettingsStackParamList } from '@/app/navigation';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'InvitePerson'>;
type RouteProp = NativeStackScreenProps<SettingsStackParamList, 'InvitePerson'>['route'];

function formatTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Math.floor(Date.now() / 1000);
  if (remaining <= 0) {
    return 'Expired';
  }
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function InvitePage() {
  const { t } = useTranslation('pages');
  const { colors, typography, touchTargetSize } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp>();
  const { showToast } = useToastStore();

  const { inviteCode, expiresAt } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(() => formatTimeRemaining(expiresAt));

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(expiresAt));
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const deepLink = `medtracker://invite?code=${inviteCode}`;

  const handleCopy = () => {
    Clipboard.setString(inviteCode);
    showToast(t('common.copied', { defaultValue: 'Copied!' }), 'info' as never);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on MedTracker! Use invite code: ${inviteCode}\n\nOr open: ${deepLink}`,
        title: t('familySharing.inviteTitle'),
      });
    } catch {
      // User dismissed share sheet — ignore
    }
  };

  // Render the invite code as large spaced letters for readability
  const codeChars = inviteCode.split('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        >
          <Icon name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('familySharing.inviteTitle')}
        </Text>
        <View style={styles.headerRight} />
      </Animated.View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Code display card */}
        <Animated.View entering={ZoomIn.delay(100).duration(400)} style={styles.codeSection}>
          <Card variant="elevated" size="lg">
            <CardBody>
              <Text style={[styles.codeLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('familySharing.inviteCode')}
              </Text>

              {/* Large invite code */}
              <View style={styles.codeRow}>
                {codeChars.map((char, i) => (
                  <View
                    key={i}
                    style={[styles.codeChar, { backgroundColor: colors.iconCircleBg, borderColor: colors.border }]}
                  >
                    <Text style={[styles.codeCharText, { color: colors.accent, fontSize: typography['3xl'] ?? 32 }]}>
                      {char}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.codeHint, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('familySharing.inviteCodeHint')}
              </Text>

              {/* QR code for deep link */}
              <View style={styles.qrContainer}>
                <QRCode
                  value={deepLink}
                  size={160}
                  backgroundColor="transparent"
                  color={colors.textPrimary}
                />
              </View>
            </CardBody>
          </Card>
        </Animated.View>

        {/* Expiry */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View style={[styles.expiryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="time-outline" size={16} color={colors.warningText} />
            <Text style={[styles.expiryText, { color: colors.warningText, fontSize: typography.sm }]}>
              {t('familySharing.inviteCodeExpiry')} ({timeRemaining})
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.actions}>
          <Button variant="secondary" size="lg" onPress={handleCopy} style={styles.actionBtn}>
            <ButtonIcon as={Icon} name="copy-outline" />
            <ButtonText>{t('common.copy', { defaultValue: 'Copy Code' })}</ButtonText>
          </Button>

          <Button variant="primary" size="lg" onPress={() => void handleShare()} style={styles.actionBtn}>
            <ButtonIcon as={Icon} name="share-outline" />
            <ButtonText>{t('common.share', { defaultValue: 'Share' })}</ButtonText>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontWeight: '700' },
  headerRight: { minWidth: 44 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  codeSection: {},
  codeLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  codeChar: {
    width: 44,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCharText: { fontFamily: FONTS.extraBold, fontWeight: '800' },
  qrContainer: {
    alignItems: 'center' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  codeHint: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  expiryText: { fontFamily: FONTS.semiBold, fontWeight: '600' },
  actions: { gap: 12 },
  actionBtn: { justifyContent: 'center' },
});
