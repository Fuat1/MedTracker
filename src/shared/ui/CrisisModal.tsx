import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  BackHandler,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

const SYMPTOM_KEYS = [
  'chestPain',
  'headache',
  'breathShortness',
  'visionChanges',
  'difficultySpeak',
  'backPain',
  'numbness',
  'weakness',
] as const;

type Step = 'symptoms' | 'emergency' | 'urgency';

interface CrisisModalProps {
  visible: boolean;
  systolic: number;
  diastolic: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CrisisModal({
  visible,
  systolic,
  diastolic,
  onCancel,
  onConfirm,
}: CrisisModalProps) {
  const { t: tMedical } = useTranslation('medical');
  const { t: tCommon } = useTranslation('common');
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('symptoms');
  const [checkedSymptoms, setCheckedSymptoms] = useState<Set<string>>(new Set());

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('symptoms');
      setCheckedSymptoms(new Set());
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 240,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => handler.remove();
  }, [visible, onCancel]);

  const toggleSymptom = useCallback((key: string) => {
    setCheckedSymptoms(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSymptomsNext = useCallback(() => {
    setStep(checkedSymptoms.size > 0 ? 'emergency' : 'urgency');
  }, [checkedSymptoms.size]);

  const handleCall911 = useCallback(() => {
    const phoneUrl = Platform.OS === 'ios' ? 'tel:911' : 'tel:911';
    Linking.openURL(phoneUrl).catch(() => {
      // If call fails, stay on screen — user can still dial manually
    });
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none" accessibilityRole="alert" accessibilityLiveRegion="assertive">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
      </Animated.View>

      {/* Card */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.cardWrapper,
          { opacity: cardOpacity, transform: [{ scale: cardScale }] },
        ]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>

          {/* Top stripe */}
          <View style={[styles.stripe, { backgroundColor: colors.crisisRed }]} />

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.crisisRed, shadowColor: colors.crisisRed }]}>
            <Icon name="warning" size={32} color={colors.surface} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.crisisRed }]}>
            {tMedical('crisis.title')}
          </Text>

          {/* BP values */}
          <View style={[styles.valuesRow, { backgroundColor: colors.errorBackground, borderColor: colors.crisisBorder }]}>
            <Text style={[styles.valuesText, { color: colors.crisisRed }]}>
              {systolic}
              <Text style={[styles.valuesDivider, { color: colors.crisisBorder }]}>/</Text>
              {diastolic}
            </Text>
            <Text style={[styles.valuesUnit, { color: colors.error }]}>mmHg</Text>
          </View>

          {/* Step: Symptom Checklist */}
          {step === 'symptoms' && (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {tMedical('crisis.subtitle', { systolic, diastolic })}
              </Text>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                {tMedical('crisis.symptomsQuestion')}
              </Text>
              <ScrollView style={styles.symptomList} bounces={false}>
                {SYMPTOM_KEYS.map(key => {
                  const checked = checkedSymptoms.has(key);
                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.symptomRow,
                        { borderBottomColor: colors.borderLight },
                        checked && { backgroundColor: colors.errorBackground },
                      ]}
                      onPress={() => toggleSymptom(key)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={tMedical(`crisis.symptoms.${key}` as any)}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: checked ? colors.crisisRed : colors.border },
                        checked && { backgroundColor: colors.crisisRed },
                      ]}>
                        {checked && <Icon name="checkmark" size={14} color={colors.surface} />}
                      </View>
                      <Text style={[styles.symptomText, { color: colors.textPrimary }]}>
                        {tMedical(`crisis.symptoms.${key}` as any)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.buttons}>
                <Pressable
                  style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.cancel')}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {tCommon('buttons.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, { backgroundColor: colors.crisisRed }]}
                  onPress={handleSymptomsNext}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.continue')}
                >
                  <Text style={[styles.confirmText, { color: colors.surface }]}>
                    {tCommon('buttons.continue')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Step: EMERGENCY — symptoms present → call 911 */}
          {step === 'emergency' && (
            <>
              <View style={[styles.emergencyBanner, { backgroundColor: colors.crisisRed }]}>
                <Icon name="call" size={22} color={colors.surface} />
                <Text style={[styles.emergencyTitle, { color: colors.surface }]}>
                  {tMedical('crisis.emergency.title')}
                </Text>
              </View>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {tMedical('crisis.emergency.message')}
              </Text>
              <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                {tMedical('crisis.disclaimer')}
              </Text>
              <View style={styles.buttons}>
                <Pressable
                  style={[styles.confirmButton, styles.fullWidth, { backgroundColor: colors.crisisRed }]}
                  onPress={handleCall911}
                  accessibilityRole="button"
                  accessibilityLabel={tMedical('crisis.emergency.title')}
                >
                  <Icon name="call" size={16} color={colors.surface} />
                  <Text style={[styles.confirmText, { color: colors.surface }]}>
                    {tMedical('crisis.emergency.title')}
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.buttons, styles.buttonsSpaced]}>
                <Pressable
                  style={[styles.cancelButton, styles.fullWidth, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.saveAnyway')}
                >
                  <Icon name="save-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {tCommon('buttons.saveAnyway')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Step: URGENCY — no symptoms → contact provider */}
          {step === 'urgency' && (
            <>
              <View style={[styles.urgencyBanner, { backgroundColor: colors.warningBorder + '20', borderColor: colors.warningBorder }]}>
                <Icon name="medical" size={20} color={colors.warningText} />
                <Text style={[styles.urgencyTitle, { color: colors.warningText }]}>
                  {tMedical('crisis.urgency.title')}
                </Text>
              </View>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {tMedical('crisis.urgency.message')}
              </Text>
              <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                {tMedical('crisis.disclaimer')}
              </Text>
              <View style={styles.buttons}>
                <Pressable
                  style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.cancel')}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {tCommon('buttons.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, { backgroundColor: colors.crisisRed }]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('buttons.saveAnyway')}
                >
                  <Icon name="save-outline" size={16} color={colors.surface} />
                  <Text style={[styles.confirmText, { color: colors.surface }]}>
                    {tCommon('buttons.saveAnyway')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)', // Intentional: semi-transparent overlay unaffected by theme
  },
  cardWrapper: {
    width: '88%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 16,
    alignItems: 'center',
    paddingBottom: 20,
  },
  stripe: {
    width: '100%',
    height: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    lineHeight: 18,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  valuesText: {
    fontSize: 36,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  valuesDivider: {
    fontSize: 28,
  },
  valuesUnit: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  symptomList: {
    width: '100%',
    maxHeight: 220,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    gap: 10,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symptomText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    width: '100%',
    paddingLeft: 20,
  },
  emergencyTitle: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    width: '100%',
    paddingLeft: 20,
  },
  urgencyTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    width: '100%',
  },
  buttonsSpaced: {
    marginTop: 8,
  },
  fullWidth: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1.6,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
