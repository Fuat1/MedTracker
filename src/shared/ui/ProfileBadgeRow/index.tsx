import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface Badge {
  icon: string;
  label: string;
}

interface ProfileBadgeRowProps {
  badges: Badge[];
}

export function ProfileBadgeRow({badges}: ProfileBadgeRowProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.row}>
      {badges.map((badge, index) => (
        <View
          key={index}
          style={[styles.badge, {backgroundColor: colors.surfaceSecondary}]}>
          <Icon name={badge.icon} size={12} color={colors.textTertiary} />
          <Text
            style={[
              styles.badgeText,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
