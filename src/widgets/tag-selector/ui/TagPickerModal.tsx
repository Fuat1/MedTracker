import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  BackHandler,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { TagChip } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';
import { CUSTOM_TAG_ICONS } from '../../../shared/config/custom-tag-icons';
import { makeCustomTagKey } from '../../../shared/types/custom-tag';
import { useCustomTags, useCreateCustomTag, useDeleteCustomTag } from '../../../features/manage-tags';
import type { TagKey } from '../../../shared/api/bp-tags-repository';

interface TagPickerModalProps {
  visible: boolean;
  selectedTags: TagKey[];
  onTagsChange: (tags: TagKey[]) => void;
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

  const { data: customTags = [] } = useCustomTags();
  const createCustomTag = useCreateCustomTag();
  const deleteCustomTag = useDeleteCustomTag();

  // Sheet animation
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState(CUSTOM_TAG_ICONS[0]);

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
      // Reset create form when closing
      setShowCreateForm(false);
      setNewLabel('');
      setNewIcon(CUSTOM_TAG_ICONS[0]);
    }
  }, [visible, backdropOpacity, slideAnim]);

  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCreateForm) {
        setShowCreateForm(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose, showCreateForm]);

  const toggleTag = (tag: TagKey) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(existing => existing !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleSaveCustomTag = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    try {
      const created = await createCustomTag.mutateAsync({ label: trimmed, icon: newIcon });
      // Auto-select the newly created tag
      onTagsChange([...selectedTags, makeCustomTagKey(created.id)]);
      setShowCreateForm(false);
      setNewLabel('');
      setNewIcon(CUSTOM_TAG_ICONS[0]);
    } catch {
      // Silently ignore — DB error rare
    }
  };

  const handleDeleteCustomTag = useCallback((id: string, label: string) => {
    Alert.alert(
      t('tagSelector.confirmDelete', { label }),
      t('tagSelector.confirmDeleteSubtitle'),
      [
        { text: t('tagSelector.deleteCancel'), style: 'cancel' },
        {
          text: t('tagSelector.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            const tagKey = makeCustomTagKey(id);
            // Remove from current selection if selected
            onTagsChange(selectedTags.filter(k => k !== tagKey));
            await deleteCustomTag.mutateAsync(id);
          },
        },
      ],
    );
  }, [t, selectedTags, onTagsChange, deleteCustomTag]);

  if (!visible) return null;

  const hasCustomTags = customTags.length > 0;

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Built-in tags section */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {hasCustomTags ? t('tagSelector.builtInSection') : undefined}
          </Text>
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

          {/* Custom tags section */}
          {hasCustomTags && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('tagSelector.customSection')}
              </Text>
              <View style={styles.chipsGrid}>
                {customTags.map(ct => {
                  const tagKey = makeCustomTagKey(ct.id);
                  return (
                    <TagChip
                      key={tagKey}
                      icon={ct.icon}
                      label={ct.label}
                      selected={selectedTags.includes(tagKey)}
                      onPress={() => toggleTag(tagKey)}
                      onLongPress={() => handleDeleteCustomTag(ct.id, ct.label)}
                      fontScale={fontScale}
                      disabled={disabled}
                    />
                  );
                })}
              </View>
              {!showCreateForm && (
                <Text style={[styles.deleteHint, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  {t('tagSelector.deleteHint')}
                </Text>
              )}
            </>
          )}

          {/* Inline create form */}
          {showCreateForm ? (
            <View style={[styles.createForm, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.createFormTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('tagSelector.createForm.title')}
              </Text>

              {/* Icon picker */}
              <Text style={[styles.createFormLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {t('tagSelector.createForm.pickIcon')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconPickerRow}
              >
                {CUSTOM_TAG_ICONS.map(iconName => {
                  const isSelected = newIcon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: isSelected ? colors.accent + '20' : colors.surface,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setNewIcon(iconName)}
                      accessibilityRole="button"
                      accessibilityLabel={iconName}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Icon name={iconName} size={20} color={isSelected ? colors.accent : colors.textSecondary} />
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Label input */}
              <TextInput
                style={[
                  styles.labelInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    fontSize: typography.sm * fontScale,
                    fontFamily: FONTS.regular,
                  },
                ]}
                placeholder={t('tagSelector.createForm.labelPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={newLabel}
                onChangeText={setNewLabel}
                maxLength={20}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveCustomTag}
              />

              {/* Form actions */}
              <View style={styles.createFormActions}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewLabel('');
                    setNewIcon(CUSTOM_TAG_ICONS[0]);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('tagSelector.createForm.cancel')}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                    {t('tagSelector.createForm.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: newLabel.trim() ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={handleSaveCustomTag}
                  disabled={!newLabel.trim() || createCustomTag.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={t('tagSelector.createForm.save')}
                >
                  <Text style={[styles.saveBtnText, { color: colors.surface, fontSize: typography.sm }]}>
                    {t('tagSelector.createForm.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Create new tag button */
            <Pressable
              style={[styles.createTagBtn, { borderColor: colors.accent }]}
              onPress={() => setShowCreateForm(true)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('tagSelector.createNew')}
            >
              <Icon name="add-circle-outline" size={16} color={colors.accent} />
              <Text style={[styles.createTagBtnText, { color: colors.accent, fontSize: typography.sm }]}>
                {t('tagSelector.createNew')}
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Done button */}
        {!showCreateForm && (
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
        )}
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
    maxHeight: '85%',
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
  scrollContent: {
    paddingBottom: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionLabelSpaced: {
    marginTop: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  deleteHint: {
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  createTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 4,
    minHeight: 44,
  },
  createTagBtnText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  createForm: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  createFormTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  createFormLabel: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  iconPickerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  createFormActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
