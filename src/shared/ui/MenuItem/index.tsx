import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface MenuItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function MenuItem({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
}: MenuItemProps) {
  const {colors, typography} = useTheme();
  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={[styles.iconCircle, {backgroundColor: colors.iconCircleBg}]}>
        <Icon name={icon} size={20} color={iconColor ?? colors.accent} />
      </View>
      <View style={styles.textCol}>
        <Text
          style={[
            styles.label,
            {color: colors.textPrimary, fontSize: typography.md},
          ]}>
          {label}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement
        ? rightElement
        : showChevron && (
            <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
          )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {flex: 1},
  label: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
});
