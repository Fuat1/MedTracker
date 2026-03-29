import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFirebaseAuth } from '@/features/auth';
import { useTheme } from '@/shared/lib/use-theme';
import { Button, ButtonText, ButtonIcon } from '@/shared/ui';
import { Card, CardBody } from '@/shared/ui';
import Icon from 'react-native-vector-icons/Ionicons';
import { FONTS } from '@/shared/config/theme';

type AuthTab = 'google' | 'apple' | 'email';
type EmailMode = 'signin' | 'signup';

interface AuthPageProps {
  onSkip?: () => void;
}

export function AuthPage({ onSkip }: AuthPageProps) {
  const { t } = useTranslation('pages');
  const { colors, fontScale } = useTheme();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, error, isLoading } =
    useFirebaseAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('google');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailSubmit = async () => {
    if (emailMode === 'signin') {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password, displayName);
      if (!error) {
        setVerificationSent(true);
        setEmailMode('signin');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Icon name="people" size={48 * fontScale} color={colors.accent} />
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 28 * fontScale, fontFamily: FONTS.extraBold }]}>
            {t('auth.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: 15 * fontScale, fontFamily: FONTS.regular }]}>
            {t('auth.subtitle')}
          </Text>
        </Animated.View>

        {/* Tab selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tabs}>
          <TabButton
            label={t('auth.tabGoogle')}
            active={activeTab === 'google'}
            onPress={() => setActiveTab('google')}
            colors={colors}
            fontScale={fontScale}
          />
          {Platform.OS === 'ios' && (
            <TabButton
              label={t('auth.tabApple')}
              active={activeTab === 'apple'}
              onPress={() => setActiveTab('apple')}
              colors={colors}
              fontScale={fontScale}
            />
          )}
          <TabButton
            label={t('auth.tabEmail')}
            active={activeTab === 'email'}
            onPress={() => setActiveTab('email')}
            colors={colors}
            fontScale={fontScale}
          />
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.content}>
          <Card variant="elevated" size="lg">
            <CardBody>
              {activeTab === 'google' ? (
                <Button
                  variant="primary"
                  size="lg"
                  onPress={signInWithGoogle}
                  isLoading={isLoading}
                  style={styles.fullWidth}
                >
                  <ButtonIcon as={Icon} name="logo-google" />
                  <ButtonText>{t('auth.signInWithGoogle')}</ButtonText>
                </Button>
              ) : activeTab === 'apple' && Platform.OS === 'ios' ? (
                <Button
                  variant="primary"
                  size="lg"
                  onPress={signInWithApple}
                  isLoading={isLoading}
                  style={styles.fullWidth}
                >
                  <ButtonIcon as={Icon} name="logo-apple" />
                  <ButtonText>{t('auth.signInWithApple')}</ButtonText>
                </Button>
              ) : (
                <View>
                  {verificationSent && (
                    <Text style={[styles.info, { color: colors.successText, fontFamily: FONTS.medium, fontSize: 14 * fontScale }]}>
                      {t('auth.emailVerificationSent')}
                    </Text>
                  )}

                  {emailMode === 'signup' && (
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, fontFamily: FONTS.regular, fontSize: 16 * fontScale }]}
                      placeholder={t('auth.displayNameLabel')}
                      placeholderTextColor={colors.textSecondary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      accessible
                      accessibilityLabel={t('auth.displayNameLabel')}
                    />
                  )}

                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, fontFamily: FONTS.regular, fontSize: 16 * fontScale }]}
                    placeholder={t('auth.emailLabel')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    accessible
                    accessibilityLabel={t('auth.emailLabel')}
                  />

                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, fontFamily: FONTS.regular, fontSize: 16 * fontScale }]}
                    placeholder={t('auth.passwordLabel')}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    accessible
                    accessibilityLabel={t('auth.passwordLabel')}
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleEmailSubmit}
                    isLoading={isLoading}
                    style={styles.fullWidth}
                  >
                    <ButtonText>
                      {emailMode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                    </ButtonText>
                  </Button>

                  <Button
                    variant="link"
                    size="sm"
                    onPress={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                    style={styles.switchButton}
                  >
                    <ButtonText>
                      {emailMode === 'signin'
                        ? t('auth.switchToSignUp')
                        : t('auth.switchToSignIn')}
                    </ButtonText>
                  </Button>
                </View>
              )}

              {error && (
                <Text
                  style={[styles.error, { color: colors.error, fontFamily: FONTS.medium, fontSize: 14 * fontScale }]}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                >
                  {error}
                </Text>
              )}
            </CardBody>
          </Card>
        </Animated.View>

        {/* Skip */}
        {onSkip && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Button variant="ghost" size="md" onPress={onSkip} style={styles.skipButton}>
              <ButtonText>{t('auth.skipForNow')}</ButtonText>
            </Button>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TabButton({
  label,
  active,
  onPress,
  colors,
  fontScale,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  fontScale: number;
}) {
  return (
    <Button
      variant={active ? 'primary' : 'ghost'}
      size="sm"
      onPress={onPress}
      style={styles.tabButton}
      accessibilityHint={active ? 'Selected tab' : undefined}
    >
      <ButtonText>{label}</ButtonText>
    </Button>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabButton: { flex: 1 },
  content: { marginBottom: 16 },
  fullWidth: { width: '100%' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  error: { marginTop: 12, textAlign: 'center' },
  info: { marginBottom: 12, textAlign: 'center' },
  switchButton: { marginTop: 8, alignSelf: 'center' },
  skipButton: { alignSelf: 'center', marginTop: 8 },
});
