import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({title}: SectionHeaderProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
