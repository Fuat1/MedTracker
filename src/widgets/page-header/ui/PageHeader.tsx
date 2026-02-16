import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { getGreetingKey } from '../../../shared/lib/greeting-utils';
import { FONTS } from '../../../shared/config/theme';

interface PageHeaderProps {
  variant: 'greeting' | 'title';
  title?: string;
}

export function PageHeader({ variant, title }: PageHeaderProps) {
  const { t } = useTranslation('pages');
  const { colors, typography } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
      {variant === 'greeting' ? (
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingText, { color: colors.textSecondary, fontSize: typography.xl }]}>
            {t(getGreetingKey())},
          </Text>
          <Text style={[styles.userName, { color: colors.textPrimary, fontSize: typography['2xl'] }]}>
            {t('home.userName')}
          </Text>
        </View>
      ) : (
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography['2xl'] }]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.surface, shadowColor: colors.shadow },
        ]}
      >
        <Icon name="shield-checkmark" size={20} color={colors.accent} />
        <Text style={[styles.badgeText, { color: colors.textSecondary, fontSize: typography.xs }]}>
          {t('home.encryptedOffline')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  userName: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    textAlign: 'right',
  },
});
