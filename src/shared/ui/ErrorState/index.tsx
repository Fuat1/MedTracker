import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Button, ButtonText} from '../Button';

interface ErrorStateProps {
  title: string;
  subtitle: string;
  onRetry?: () => void;
}

export function ErrorState({title, subtitle, onRetry}: ErrorStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Icon name="alert-circle-outline" size={48} color={colors.error} />
      <Text
        style={[styles.title, {color: colors.error, fontSize: typography.lg}]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {subtitle}
      </Text>
      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          onPress={onRetry}
          style={styles.retryButton}>
          <ButtonText>Try Again</ButtonText>
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
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  retryButton: {marginTop: 24},
});
