import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/lib/use-theme';
import { FONTS } from '@/shared/config/theme';
import { Card, CardBody, Button, ButtonText } from '@/shared/ui';
import { useAcceptInvite } from '@/features/pairing';
import { normalizeInviteCode } from '@/features/pairing';
import type { RootStackParamList } from '@/app/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AcceptInvite'>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'AcceptInvite'>['route'];

const CODE_LENGTH = 6;

export function AcceptInvitePage() {
  const { t } = useTranslation('pages');
  const { colors, typography, touchTargetSize } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp>();

  const prefillCode = route.params?.code ?? '';
  const [rawCode, setRawCode] = useState(prefillCode);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const acceptInvite = useAcceptInvite();

  // Auto-focus on mount
  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  const normalizedCode = normalizeInviteCode(rawCode) ?? '';
  const isValidLength = normalizedCode.length === CODE_LENGTH;

  const handleCodeChange = useCallback((text: string) => {
    setError(null);
    // Allow only alphanumeric, max CODE_LENGTH chars
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').slice(0, CODE_LENGTH).toUpperCase();
    setRawCode(cleaned);
  }, []);

  const handleAccept = useCallback(async () => {
    if (!isValidLength) {
      return;
    }
    setError(null);
    try {
      await acceptInvite.mutateAsync(normalizedCode);
      setSucceeded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.errorGeneric'));
    }
  }, [acceptInvite, normalizedCode, isValidLength, t]);

  if (succeeded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.successContainer}>
          <Icon name="checkmark-circle" size={72} color={colors.successText} />
          <Text style={[styles.successTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
            {t('familySharing.accept')}
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
            {t('familySharing.acceptInviteSubtitle')}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={() => navigation.goBack()}
            style={styles.doneBtn}
          >
            <ButtonText>{t('common.done', { defaultValue: 'Done' })}</ButtonText>
          </Button>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
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
            {t('familySharing.acceptInviteTitle')}
          </Text>
          <View style={styles.headerRight} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formSection}>
          <Card variant="elevated" size="lg">
            <CardBody>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('familySharing.enterCode')}
              </Text>

              {/* Code input */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: error ? colors.error : isValidLength ? colors.accent : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={rawCode}
                  onChangeText={handleCodeChange}
                  placeholder="ABC123"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={CODE_LENGTH}
                  style={[
                    styles.codeInput,
                    {
                      color: colors.textPrimary,
                      fontFamily: FONTS.extraBold,
                      fontWeight: '800',
                      fontSize: typography['2xl'] ?? 24,
                      letterSpacing: 8,
                    },
                  ]}
                  accessibilityLabel={t('familySharing.enterCode')}
                  accessible
                />
                {isValidLength && (
                  <Icon name="checkmark-circle" size={20} color={colors.successText} />
                )}
              </View>

              <Text style={[styles.inputHint, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('familySharing.enterCodeHint')}
              </Text>

              {/* Error message */}
              {error != null && (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
                  <Icon name="alert-circle-outline" size={16} color={colors.error} />
                  <Text
                    style={[styles.errorText, { color: colors.error, fontSize: typography.sm }]}
                    accessibilityRole="alert"
                  >
                    {error}
                  </Text>
                </View>
              )}
            </CardBody>
          </Card>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={[styles.disclaimer, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('familySharing.acceptInviteSubtitle')}
          </Text>
        </Animated.View>

        {/* Accept / Cancel buttons */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.actions}>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => navigation.goBack()}
            style={styles.actionBtn}
          >
            <ButtonText>{t('familySharing.decline')}</ButtonText>
          </Button>

          <Button
            variant="primary"
            size="lg"
            onPress={() => void handleAccept()}
            isDisabled={!isValidLength || acceptInvite.isPending}
            style={styles.actionBtn}
          >
            {acceptInvite.isPending ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <ButtonText>{t('familySharing.accept')}</ButtonText>
            )}
          </Button>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: { padding: 4, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontWeight: '700' },
  headerRight: { minWidth: 44 },
  formSection: { marginTop: 16 },
  inputLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    textAlign: 'center',
  },
  inputHint: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: { fontFamily: FONTS.regular, fontWeight: '400', flex: 1 },
  disclaimer: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    marginHorizontal: 8,
    marginTop: 12,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  actionBtn: { flex: 1, justifyContent: 'center' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  successTitle: { fontFamily: FONTS.bold, fontWeight: '700', textAlign: 'center' },
  successSubtitle: { fontFamily: FONTS.regular, fontWeight: '400', textAlign: 'center', lineHeight: 22 },
  doneBtn: { marginTop: 16, alignSelf: 'stretch', justifyContent: 'center' },
});
