import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import {
  MEASUREMENT_CHECKLIST,
  RECOMMENDED_REST_DURATION,
  BREATHING_TECHNIQUE,
} from '../../../entities/measurement-protocol';
import { BreathingGuide } from '../../../widgets/breathing-guide';

type WorkflowStep = 'checklist' | 'breathing' | 'timer' | 'ready';

export function PreMeasurementPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, fontScale, typography } = useTheme();
  const navigation = useNavigation();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('checklist');
  const [timeRemaining, setTimeRemaining] = useState(RECOMMENDED_REST_DURATION);
  const [breathingCyclesCompleted, setBreathingCyclesCompleted] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    if (currentStep !== 'timer') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurrentStep('ready');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkipToMeasurement = () => {
    Alert.alert(
      t('preMeasurement.skipWarning.title'),
      t('preMeasurement.skipWarning.message'),
      [
        { text: tCommon('buttons.cancel'), style: 'cancel' },
        {
          text: t('preMeasurement.skipWarning.confirm'),
          style: 'destructive',
          onPress: () => navigation.navigate('NewReading' as never),
        },
      ],
    );
  };

  const handleContinue = () => {
    switch (currentStep) {
      case 'checklist':
        setCurrentStep('breathing');
        break;
      case 'breathing':
        setCurrentStep('timer');
        break;
      case 'timer':
      case 'ready':
        navigation.navigate('NewReading' as never);
        break;
    }
  };

  const handleBreathingCycleComplete = (cycles: number) => {
    setBreathingCyclesCompleted(cycles);
    if (cycles >= BREATHING_TECHNIQUE.cycles) {
      // Auto-advance after breathing is done
      setTimeout(() => setCurrentStep('timer'), 1000);
    }
  };

  const renderChecklist = () => (
    <View style={styles.contentContainer}>
      <Icon name="clipboard-outline" size={64} color={colors.accent} style={styles.headerIcon} />
      <Text style={[styles.title, { color: colors.textPrimary, fontSize: Math.round(26 * fontScale) }]}>
        {t('preMeasurement.checklist.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
        {t('preMeasurement.checklist.subtitle')}
      </Text>

      <View style={styles.checklistContainer}>
        {MEASUREMENT_CHECKLIST.map((step) => {
          const itemStyle = { backgroundColor: colors.surface, borderColor: step.important ? colors.accent + '30' : colors.border };
          const textStyle = { color: colors.textPrimary, fontFamily: step.important ? FONTS.semiBold : FONTS.regular, fontWeight: step.important ? '600' as const : '400' as const };
          return (
            <View
              key={step.id}
              style={[styles.checklistItem, itemStyle]}
            >
              <Icon
                name={step.iconName as any}
                size={28}
                color={step.important ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.checklistText, textStyle, { fontSize: typography.md }]}>
                {t(step.translationKey as any)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderBreathing = () => (
    <View style={styles.contentContainer}>
      <Icon name="fitness-outline" size={64} color={colors.accent} style={styles.headerIcon} />
      <Text style={[styles.title, { color: colors.textPrimary, fontSize: Math.round(26 * fontScale) }]}>
        {t('preMeasurement.breathing.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
        {t('preMeasurement.breathing.subtitle')}
      </Text>

      <BreathingGuide
        onCycleComplete={handleBreathingCycleComplete}
        totalCycles={BREATHING_TECHNIQUE.cycles}
      />

      {breathingCyclesCompleted >= BREATHING_TECHNIQUE.cycles && (
        <View style={[styles.completeBadge, { backgroundColor: colors.accent + '20' }]}>
          <Icon name="checkmark-circle" size={20} color={colors.accent} />
          <Text style={[styles.completeText, { color: colors.accent, fontSize: typography.md }]}>
            {t('preMeasurement.breathing.complete')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTimer = () => (
    <View style={styles.contentContainer}>
      <Icon name="time-outline" size={64} color={colors.accent} style={styles.headerIcon} />
      <Text style={[styles.title, { color: colors.textPrimary, fontSize: Math.round(26 * fontScale) }]}>
        {t('preMeasurement.timer.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
        {t('preMeasurement.timer.subtitle')}
      </Text>

      <View style={styles.timerContainer}>
        <View
          style={[
            styles.timerCircle,
            {
              backgroundColor: colors.accent + '20',
              borderColor: colors.accent,
            },
          ]}
        >
          <Text style={[styles.timerText, { color: colors.accent, fontSize: typography.hero }]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      <Text style={[styles.timerHint, { color: colors.textTertiary, fontSize: typography.xs }]}>
        {t('preMeasurement.timer.hint')}
      </Text>
    </View>
  );

  const renderReady = () => (
    <View style={styles.contentContainer}>
      <Icon name="checkmark-circle" size={80} color={colors.accent} style={styles.headerIcon} />
      <Text style={[styles.title, { color: colors.textPrimary, fontSize: Math.round(26 * fontScale) }]}>
        {t('preMeasurement.ready.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
        {t('preMeasurement.ready.subtitle')}
      </Text>
    </View>
  );

  const canContinue = () => {
    switch (currentStep) {
      case 'checklist':
        return true;
      case 'breathing':
        return breathingCyclesCompleted >= BREATHING_TECHNIQUE.cycles;
      case 'timer':
        return timeRemaining === 0;
      case 'ready':
        return true;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('preMeasurement.title')}
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {(['checklist', 'breathing', 'timer', 'ready'] as WorkflowStep[]).map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted =
            (['checklist', 'breathing', 'timer', 'ready'] as WorkflowStep[]).indexOf(currentStep) >
            index;

          return (
            <View key={step} style={styles.progressItem}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive || isCompleted ? colors.accent : colors.border,
                  },
                ]}
              />
              {index < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isCompleted ? colors.accent : colors.border,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {currentStep === 'checklist' && renderChecklist()}
        {currentStep === 'breathing' && renderBreathing()}
        {currentStep === 'timer' && renderTimer()}
        {currentStep === 'ready' && renderReady()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={handleSkipToMeasurement}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary, fontSize: typography.md }]}>
            {t('preMeasurement.skip')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: canContinue() ? colors.accent : colors.border,
            },
          ]}
          onPress={handleContinue}
          disabled={!canContinue()}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueButtonText, { fontSize: typography.md }]}>
            {currentStep === 'ready' ? t('preMeasurement.startMeasurement') : tCommon('buttons.continue')}
          </Text>
          <Icon name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 30,
    height: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  checklistContainer: {
    width: '100%',
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    gap: 14,
  },
  checklistText: {
    flex: 1,
    lineHeight: 20,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginTop: 20,
  },
  completeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  timerContainer: {
    marginVertical: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  timerHint: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
