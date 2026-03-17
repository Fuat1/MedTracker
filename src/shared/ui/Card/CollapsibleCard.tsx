import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Card} from './Card';
import {useCollapse} from './card-animations';
import type {CollapsibleCardProps} from './types';

export function CollapsibleCard({
  title,
  defaultExpanded = false,
  children,
  testID,
}: CollapsibleCardProps) {
  const {colors, typography} = useTheme();
  const {t} = useTranslation();
  const {toggle, expanded, animatedStyle} = useCollapse(defaultExpanded);

  return (
    <Card testID={testID}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{expanded}}
        accessibilityLabel={title}
        accessibilityHint={t('shared.collapsibleCard.hint')}
        style={styles.header}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.lg,
            fontFamily: FONTS.bold,
            fontWeight: '700',
            flex: 1,
          }}>
          {title}
        </Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      <Animated.View style={[styles.content, animatedStyle]}>
        {children}
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  content: {
    overflow: 'hidden',
    marginTop: 8,
  },
});
