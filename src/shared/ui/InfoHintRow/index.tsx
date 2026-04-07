import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface InfoHintRowProps {
  icon: string;
  text: string;
  color?: string;
}

export function InfoHintRow({icon, text, color}: InfoHintRowProps) {
  const {colors, typography} = useTheme();
  const chipColor = color ?? colors.textSecondary;
  return (
    <View
      style={[
        styles.container,
        {backgroundColor: chipColor + '12'},
      ]}>
      <Icon name={icon} size={14} color={chipColor} />
      <Text
        style={[
          styles.text,
          {color: chipColor, fontSize: typography.xs},
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
