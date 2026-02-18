import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { TagChip } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { LIFESTYLE_TAGS, type LifestyleTag } from '../../../entities/lifestyle-tag';

interface TagSelectorProps {
  selectedTags: LifestyleTag[];
  onTagsChange: (tags: LifestyleTag[]) => void;
  disabled?: boolean;
}

export function TagSelector({ selectedTags, onTagsChange, disabled }: TagSelectorProps) {
  const { t } = useTranslation('widgets');
  const { t: tCommon } = useTranslation('common');
  const { colors, fontScale, typography } = useTheme();
  const [expanded, setExpanded] = useState(selectedTags.length > 0);

  const toggleTag = (tag: LifestyleTag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(existing => existing !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={t('tagSelector.title')}
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <Icon
            name="pricetags-outline"
            size={Math.round(16 * fontScale)}
            color={colors.textSecondary}
          />
          <Text style={[styles.title, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {t('tagSelector.title')}
          </Text>
          {!expanded && selectedTags.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.countText, { color: colors.accent, fontSize: Math.round(11 * fontScale) }]}>
                {selectedTags.length}
              </Text>
            </View>
          )}
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={Math.round(16 * fontScale)}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});
