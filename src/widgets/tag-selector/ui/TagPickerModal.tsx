import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { TagChip } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';
import type { LifestyleTag } from '../../../shared/types/lifestyle-tag';

interface TagPickerModalProps {
  visible: boolean;
  selectedTags: LifestyleTag[];
  onTagsChange: (tags: LifestyleTag[]) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function TagPickerModal({
  visible,
  selectedTags,
  onTagsChange,
  onClose,
  disabled,
}: TagPickerModalProps) {
  const { t } = useTranslation('widgets');
  const { t: tCommon } = useTranslation('common');
  const { colors, fontScale, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 320,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, slideAnim]);

  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  const toggleTag = (tag: LifestyleTag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(existing => existing !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderText}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('tagSelector.title')}
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {t('tagSelector.subtitle')}
            </Text>
          </View>
          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tCommon('buttons.done')}
          >
            <Icon name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Chips grid */}
        <View style={styles.chipsGrid}>
          {LIFESTYLE_TAGS.map(tagMeta => (
            <TagChip
              key={tagMeta.key}
              icon={tagMeta.icon}
              label={tCommon(tagMeta.labelKey as any)}
              selected={selectedTags.includes(tagMeta.key)}
              onPress={() => toggleTag(tagMeta.key)}
              fontScale={fontScale}
              disabled={disabled}
            />
          ))}
        </View>

        {/* Done button */}
        <Pressable
          style={[styles.doneButton, { backgroundColor: colors.accent }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.done')}
        >
          <Text style={[styles.doneText, { color: colors.surface, fontSize: typography.md }]}>
            {tCommon('buttons.done')}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  sheetTitle: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
