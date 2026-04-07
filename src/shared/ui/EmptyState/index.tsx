import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Button, ButtonText} from '../Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: {label: string; onPress: () => void};
}

export function EmptyState({icon, title, subtitle, action}: EmptyStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[styles.title, {color: colors.textPrimary, fontSize: typography.lg}]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {color: colors.textTertiary, fontSize: typography.sm},
        ]}>
        {subtitle}
      </Text>
      {action && (
        <Button
          variant="secondary"
          size="md"
          onPress={action.onPress}
          style={styles.actionButton}>
          <ButtonText>{action.label}</ButtonText>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  icon: {fontSize: 60, marginBottom: 16},
  title: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  actionButton: {marginTop: 24},
});
