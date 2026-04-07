import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface LoadingStateProps {
  message?: string;
  testID?: string;
}

export function LoadingState({message, testID}: LoadingStateProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size="large" color={colors.accent} />
      {message && (
        <Text
          style={[
            styles.message,
            {color: colors.textSecondary, fontSize: typography.sm},
          ]}>
          {message}
        </Text>
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
  },
  message: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 12,
  },
});
