import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Numpad, DateTimePicker, Toast, CrisisModal, SaveButton, DerivedMetricsModal } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useToast } from '../../../shared/lib';
import {
  isCrisisReading,
  useBPClassification,
  classifyBP,
  calculatePulsePressure,
  calculateMAP,
  getBPCategoryLabel,
} from '../../../entities/blood-pressure';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import { BP_COLORS_LIGHT, BP_COLORS_DARK, FONTS } from '../../../shared/config/theme';
import { formatDateTime, getTimeWindow } from '../../../shared/lib';
import { useBPRecords } from '../../../features/record-bp';
import { useTagsForRecord } from '../../../features/manage-tags';
import { useEditBP } from '../../../features/edit-bp';
import { useDeleteBP } from '../../../features/delete-bp';
import { TagPickerModal } from '../../../widgets/tag-selector';
import type { TagKey } from '../../../shared/api/bp-tags-repository';
import type { RootStackParamList } from '../../../app/navigation';

type ActiveField = 'systolic' | 'diastolic' | 'pulse' | null;

const WINDOW_ICONS = {
  morning: 'sunny-outline',
  day: 'partly-sunny-outline',
  evening: 'cloudy-night-outline',
  night: 'moon-outline',
} as const;

export function EditReadingPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tValidation } = useTranslation('validation');
  const { t: tWidgets } = useTranslation('widgets');
  const { colors, isDark, fontScale, typography } = useTheme();
  const { guideline } = useSettingsStore();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EditReading'>>();
  const { recordId } = route.params;

  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const { toastMsg, toastType, toastVisible, showToast, hideToast } = useToast();

  // ── Data fetching ──
  const { data: allRecords } = useBPRecords();
  const record = allRecords?.find(r => r.id === recordId) ?? null;
  const { data: existingTags = [] } = useTagsForRecord(recordId);

  // ── Mutations ──
  const editBP = useEditBP();
  const deleteBP = useDeleteBP();

  // ── Local form state ──
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [location, setLocation] = useState<MeasurementLocation>('left_arm');
  const [posture, setPosture] = useState<MeasurementPosture>('sitting');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagKey[]>([]);
  const [initialized, setInitialized] = useState(false);

  // ── UI state ──
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [ppMapModalVisible, setPPMapModalVisible] = useState(false);
  const [ppMapType, setPPMapType] = useState<'pp' | 'map'>('pp');
  const [ppMapValue, setPPMapValue] = useState(0);

  // ── Pre-fill form once record + tags are loaded ──
  useEffect(() => {
    if (record && !initialized) {
      setSystolic(String(record.systolic));
      setDiastolic(String(record.diastolic));
      setPulse(record.pulse != null ? String(record.pulse) : '');
      setMeasurementTime(new Date(record.timestamp * 1000));
      setLocation(record.location);
      setPosture(record.posture);
      setNotes(record.notes ?? '');
      setInitialized(true);
    }
  }, [record, initialized]);

  useEffect(() => {
    if (existingTags.length > 0 && initialized) {
      setSelectedTags(existingTags);
    }
  }, [existingTags, initialized]);

  // ── Derived values ──
  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : null;

  const { validation, category, categoryColor, categoryLabel } =
    useBPClassification(systolic, diastolic, pulse, guideline);

  const ppValue = systolicNum && diastolicNum ? calculatePulsePressure(systolicNum, diastolicNum) : null;
  const mapValue = systolicNum && diastolicNum ? calculateMAP(systolicNum, diastolicNum) : null;
  const timeWindow = getTimeWindow(Math.floor(measurementTime.getTime() / 1000));

  const isValid = validation.isValid && !!systolic && !!diastolic;
  const hasTags = selectedTags.length > 0;

  // ── Numpad handlers ──
  const handleNumpadChange = useCallback((value: string) => {
    switch (activeField) {
      case 'systolic': setSystolic(value); break;
      case 'diastolic': setDiastolic(value); break;
      case 'pulse': setPulse(value); break;
    }
  }, [activeField]);

  const getCurrentValue = useCallback((): string => {
    switch (activeField) {
      case 'systolic': return systolic;
      case 'diastolic': return diastolic;
      case 'pulse': return pulse;
      default: return '';
    }
  }, [activeField, systolic, diastolic, pulse]);

  // ── Save handler ──
  const handleSave = async () => {
    if (!isValid || !systolicNum || !diastolicNum || !record) {
      showToast(validation.errors[0] ?? tValidation('errors.validationError'));
      return;
    }
    if (isCrisisReading(systolicNum, diastolicNum, guideline)) {
      setCrisisVisible(true);
      return;
    }
    await performSave();
  };

  const performSave = async () => {
    try {
      await editBP.mutateAsync({
        id: recordId,
        systolic: systolicNum!,
        diastolic: diastolicNum!,
        pulse: pulseNum,
        timestamp: Math.floor(measurementTime.getTime() / 1000),
        location,
        posture,
        notes: notes.trim() || null,
        tags: selectedTags,
      });
      navigation.goBack();
    } catch {
      showToast(t('editReading.alerts.saveError.message'));
    }
  };

  // ── Delete handler ──
  const handleDelete = () => {
    Alert.alert(
      t('editReading.deleteConfirm.title'),
      t('editReading.deleteConfirm.message'),
      [
        { text: t('editReading.deleteConfirm.cancel'), style: 'cancel' },
        {
          text: t('editReading.deleteConfirm.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBP.mutateAsync(recordId);
              navigation.goBack();
            } catch {
              showToast(t('editReading.alerts.deleteError.message'));
            }
          },
        },
      ],
    );
  };

  // ── Location / posture labels ──
  const locationLabels: Record<MeasurementLocation, string> = {
    left_arm:   tCommon('location.leftArm'),
    right_arm:  tCommon('location.rightArm'),
    left_wrist: tCommon('location.leftWrist'),
    right_wrist: tCommon('location.rightWrist'),
  };
  const postureLabels: Record<MeasurementPosture, string> = {
    sitting:  tCommon('posture.sitting'),
    standing: tCommon('posture.standing'),
    lying:    tCommon('posture.lying'),
  };

  const isPending = editBP.isPending || deleteBP.isPending;

  // ── Loading / not-found state ──
  if (!allRecords) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
            {t('editReading.title')}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: typography.md }]}>
            {t('editReading.noData')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
            {t('editReading.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {formatDateTime(record.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.cancel')}
        >
          <Icon name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Toast ── */}
      <Toast message={toastMsg} type={toastType} visible={toastVisible} onHide={hideToast} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Category badge + derived metrics row ── */}
          <View style={styles.categoryRow}>
            {category && validation.isValid ? (
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18', borderColor: categoryColor }]}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.categoryText, { color: categoryColor, fontSize: 13 * fontScale }]}>
                  {categoryLabel}
                </Text>
              </View>
            ) : (
              <View style={[styles.categoryBadge, { backgroundColor: colors.border + '40', borderColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.textTertiary, fontSize: 13 * fontScale }]}>
                  ---
                </Text>
              </View>
            )}

            {/* Derived metrics chips */}
            <View style={styles.derivedRow}>
              {ppValue != null && (
                <Pressable
                  style={[styles.derivedChip, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => { setPPMapType('pp'); setPPMapValue(ppValue); setPPMapModalVisible(true); }}
                  accessibilityRole="button"
                  accessibilityLabel={t('editReading.derived.pp')}
                >
                  <Text style={[styles.derivedLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>PP</Text>
                  <Text style={[styles.derivedValue, { color: colors.textPrimary, fontSize: typography.sm }]}>{ppValue}</Text>
                </Pressable>
              )}
              {mapValue != null && (
                <Pressable
                  style={[styles.derivedChip, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => { setPPMapType('map'); setPPMapValue(mapValue); setPPMapModalVisible(true); }}
                  accessibilityRole="button"
                  accessibilityLabel={t('editReading.derived.map')}
                >
                  <Text style={[styles.derivedLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>MAP</Text>
                  <Text style={[styles.derivedValue, { color: colors.textPrimary, fontSize: typography.sm }]}>{mapValue}</Text>
                </Pressable>
              )}
              <View style={[styles.derivedChip, { backgroundColor: colors.surfaceSecondary }]}>
                <Icon name={WINDOW_ICONS[timeWindow]} size={12} color={colors.textTertiary} />
                <Text style={[styles.derivedValue, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t(`editReading.derived.window.${timeWindow}`)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Measurement section ── */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('editReading.section.measurement').toUpperCase()}
          </Text>

          {/* DateTime + Tag row */}
          <View style={styles.dateTimeWrapper}>
            <DateTimePicker
              value={measurementTime}
              onChange={setMeasurementTime}
              disabled={isPending}
            />
            <Pressable
              style={[
                styles.tagPill,
                {
                  backgroundColor: hasTags ? colors.accent + '15' : 'transparent',
                  borderColor: hasTags ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setTagPickerVisible(true)}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={tWidgets('tagSelector.title')}
            >
              <Icon name="pricetags-outline" size={13} color={hasTags ? colors.accent : colors.textSecondary} />
              <Text style={[styles.tagPillText, { color: hasTags ? colors.accent : colors.textSecondary, fontSize: 12 * fontScale }]}>
                {hasTags
                  ? tWidgets('tagSelector.tagCount', { count: selectedTags.length })
                  : tWidgets('tagSelector.addTags')}
              </Text>
            </Pressable>
          </View>

          {/* BP Value cards */}
          <View style={styles.valuesRow}>
            {/* Systolic */}
            <TouchableOpacity
              style={[
                styles.valueBox,
                {
                  backgroundColor: activeField === 'systolic' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'systolic' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('systolic')}
              accessibilityRole="button"
              accessibilityLabel={tCommon('common.systolic')}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.systolic')}
              </Text>
              <Text style={[styles.valueText, { color: systolic && validation.isValid ? categoryColor : activeField === 'systolic' ? colors.accent : colors.textPrimary, fontSize: 38 * fontScale }]}>
                {systolic || '---'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>mmHg</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={[styles.dividerText, { color: colors.textTertiary, fontSize: typography.xl }]}>/</Text>
            </View>

            {/* Diastolic */}
            <TouchableOpacity
              style={[
                styles.valueBox,
                {
                  backgroundColor: activeField === 'diastolic' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'diastolic' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('diastolic')}
              accessibilityRole="button"
              accessibilityLabel={tCommon('common.diastolic')}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.diastolic')}
              </Text>
              <Text style={[styles.valueText, { color: diastolic && validation.isValid ? categoryColor : activeField === 'diastolic' ? colors.accent : colors.textPrimary, fontSize: 38 * fontScale }]}>
                {diastolic || '---'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>mmHg</Text>
            </TouchableOpacity>

            {/* Pulse */}
            <TouchableOpacity
              style={[
                styles.valueBoxPulse,
                {
                  backgroundColor: activeField === 'pulse' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'pulse' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('pulse')}
              accessibilityRole="button"
              accessibilityLabel={tCommon('common.pulse')}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.pulse')}
              </Text>
              <Text style={[styles.valueText, { color: activeField === 'pulse' ? colors.accent : colors.textPrimary, fontSize: 38 * fontScale }]}>
                {pulse || '--'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>
                {tCommon('units.bpm')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Details section ── */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('editReading.section.details').toUpperCase()}
          </Text>

          <View style={[styles.detailsCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            {/* Location */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('editReading.section.location')}
              </Text>
              <View style={styles.chipsRow}>
                {(Object.values(MEASUREMENT_LOCATIONS) as MeasurementLocation[]).map(loc => (
                  <Pressable
                    key={loc}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: location === loc ? colors.accent : colors.surfaceSecondary,
                        borderColor: location === loc ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setLocation(loc)}
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel={locationLabels[loc]}
                  >
                    <Text style={[styles.chipText, { color: location === loc ? colors.surface : colors.textSecondary, fontSize: typography.xs }]}>
                      {locationLabels[loc]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.pickerDivider, { backgroundColor: colors.border }]} />

            {/* Posture */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('editReading.section.posture')}
              </Text>
              <View style={styles.chipsRow}>
                {(Object.values(MEASUREMENT_POSTURES) as MeasurementPosture[]).map(pos => (
                  <Pressable
                    key={pos}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: posture === pos ? colors.accent : colors.surfaceSecondary,
                        borderColor: posture === pos ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setPosture(pos)}
                    disabled={isPending}
                    accessibilityRole="button"
                    accessibilityLabel={postureLabels[pos]}
                  >
                    <Text style={[styles.chipText, { color: posture === pos ? colors.surface : colors.textSecondary, fontSize: typography.xs }]}>
                      {postureLabels[pos]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* ── Notes section ── */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('editReading.section.notes').toUpperCase()}
          </Text>

          <View style={[styles.notesCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.textPrimary, fontSize: typography.md }]}
              placeholder={t('editReading.section.notesPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!isPending}
              textAlignVertical="top"
              accessibilityLabel={t('editReading.section.notes')}
            />
            <Text style={[styles.notesCounter, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {notes.length}/500
            </Text>
          </View>

          {/* ── Save button ── */}
          <View style={styles.saveRow}>
            <SaveButton
              label={isPending ? t('editReading.saving') : t('editReading.saveChanges')}
              isValid={isValid && !isPending}
              isLoading={editBP.isPending}
              onPress={handleSave}
              fontScale={fontScale}
            />
          </View>

          {/* ── Delete button ── */}
          <Pressable
            style={[styles.deleteButton, { borderColor: colors.error + '60', backgroundColor: colors.error + '08' }]}
            onPress={handleDelete}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel={t('editReading.deleteReading')}
          >
            {deleteBP.isPending ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Icon name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.deleteText, { color: colors.error, fontSize: typography.md }]}>
                  {t('editReading.deleteReading')}
                </Text>
              </>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Numpad modal ── */}
      <Modal
        visible={activeField !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveField(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setActiveField(null)}
        >
          <View style={styles.modalSpacer} />
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHandleBar}>
              <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {activeField === 'systolic'
                ? t('editReading.numpad.enterSystolic')
                : activeField === 'diastolic'
                ? t('editReading.numpad.enterDiastolic')
                : t('editReading.numpad.enterPulse')}
            </Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary, fontSize: 36 * fontScale }]}>
              {getCurrentValue() || '0'}
            </Text>
            <Numpad
              value={getCurrentValue()}
              onValueChange={handleNumpadChange}
              maxLength={3}
              disabled={isPending}
            />
            <Pressable
              style={[styles.modalDoneButton, { backgroundColor: colors.accent }]}
              onPress={() => setActiveField(null)}
              accessibilityRole="button"
              accessibilityLabel={tCommon('buttons.done')}
            >
              <Text style={[styles.modalDoneText, { color: colors.surface, fontSize: typography.lg }]}>
                {tCommon('buttons.done')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Crisis confirmation ── */}
      <CrisisModal
        visible={crisisVisible}
        systolic={systolicNum ?? 0}
        diastolic={diastolicNum ?? 0}
        onCancel={() => setCrisisVisible(false)}
        onConfirm={() => { setCrisisVisible(false); performSave(); }}
      />

      {/* ── Tag picker ── */}
      <TagPickerModal
        visible={tagPickerVisible}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onClose={() => setTagPickerVisible(false)}
        disabled={isPending}
      />

      {/* ── PP/MAP info modal ── */}
      <DerivedMetricsModal
        visible={ppMapModalVisible}
        type={ppMapType}
        value={ppMapValue}
        onClose={() => setPPMapModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontFamily: FONTS.regular },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: FONTS.extraBold, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontFamily: FONTS.regular, marginTop: 1 },
  closeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // ── Scroll content ──
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // ── Category + derived ──
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  categoryDot: { width: 7, height: 7, borderRadius: 3.5 },
  categoryText: { fontFamily: FONTS.bold, fontWeight: '700' },
  derivedRow: { flexDirection: 'row', gap: 6 },
  derivedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  derivedLabel: { fontFamily: FONTS.semiBold, fontWeight: '600' },
  derivedValue: { fontFamily: FONTS.semiBold, fontWeight: '600' },

  // ── Section labels ──
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  // ── DateTime + tag row ──
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagPillText: { fontFamily: FONTS.semiBold, fontWeight: '600' },

  // ── BP value cards ──
  valuesRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 20 },
  valueBox: {
    flex: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  valueBoxPulse: {
    flex: 1.4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  divider: { alignItems: 'center', justifyContent: 'center', paddingBottom: 10, width: 14 },
  dividerText: { fontFamily: FONTS.extraBold, fontWeight: '800' },
  valueLabel: { fontFamily: FONTS.semiBold, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  valueText: { fontFamily: FONTS.extraBold, fontWeight: '800', letterSpacing: -1 },
  valueUnit: { fontFamily: FONTS.regular, marginTop: 2 },

  // ── Details card ──
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerSection: { paddingVertical: 4 },
  pickerLabel: { fontFamily: FONTS.medium, fontWeight: '500', marginBottom: 8 },
  pickerDivider: { height: 1, marginVertical: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: FONTS.medium, fontWeight: '500' },

  // ── Notes card ──
  notesCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesInput: { fontFamily: FONTS.regular, minHeight: 72, paddingTop: 0 },
  notesCounter: { fontFamily: FONTS.regular, textAlign: 'right', marginTop: 4 },

  // ── Buttons ──
  saveRow: { marginBottom: 12 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteText: { fontFamily: FONTS.semiBold, fontWeight: '600' },

  // ── Numpad modal ──
  modalOverlay: { flex: 1 },
  modalSpacer: { flex: 1 },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  modalHandleBar: { alignItems: 'center', marginBottom: 16 },
  handleBar: { width: 48, height: 4, borderRadius: 9999 },
  modalTitle: { textAlign: 'center', fontFamily: FONTS.medium, fontWeight: '500', marginBottom: 8 },
  modalValue: { textAlign: 'center', fontFamily: FONTS.bold, fontWeight: '700', marginBottom: 16 },
  modalDoneButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  modalDoneText: { fontFamily: FONTS.bold, fontWeight: '700' },
});
