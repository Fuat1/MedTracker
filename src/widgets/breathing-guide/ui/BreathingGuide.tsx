import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { BREATHING_TECHNIQUE } from '../../../entities/measurement-protocol';

const INHALE_DURATION = BREATHING_TECHNIQUE.inhale * 1000;
const HOLD_DURATION = BREATHING_TECHNIQUE.hold * 1000;
const EXHALE_DURATION = BREATHING_TECHNIQUE.exhale * 1000;

interface BreathingGuideProps {
  onCycleComplete?: (cyclesCompleted: number) => void;
  totalCycles?: number;
}

type Phase = 'inhale' | 'hold' | 'exhale';

export function BreathingGuide({ onCycleComplete, totalCycles = BREATHING_TECHNIQUE.cycles }: BreathingGuideProps) {
  const { t } = useTranslation('pages');
  const { colors } = useTheme();
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(BREATHING_TECHNIQUE.inhale);

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Start animation cycle
    const runCycle = () => {
      // Inhale
      setCurrentPhase('inhale');
      setSecondsRemaining(BREATHING_TECHNIQUE.inhale);
      scale.value = withTiming(1, {
        duration: INHALE_DURATION,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: INHALE_DURATION,
        easing: Easing.inOut(Easing.ease),
      });

      timeouts.push(setTimeout(() => {
        // Hold
        setCurrentPhase('hold');
        setSecondsRemaining(BREATHING_TECHNIQUE.hold);
      }, INHALE_DURATION));

      timeouts.push(setTimeout(() => {
        // Exhale
        setCurrentPhase('exhale');
        setSecondsRemaining(BREATHING_TECHNIQUE.exhale);
        scale.value = withTiming(0.6, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease),
        });
        opacity.value = withTiming(0.4, {
          duration: EXHALE_DURATION,
          easing: Easing.inOut(Easing.ease),
        });
      }, INHALE_DURATION + HOLD_DURATION));

      timeouts.push(setTimeout(() => {
        const newCyclesCompleted = cyclesCompleted + 1;
        setCyclesCompleted(newCyclesCompleted);
        onCycleComplete?.(newCyclesCompleted);
      }, INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION));
    };

    if (cyclesCompleted < totalCycles) {
      runCycle();
    }

    return () => {
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [cyclesCompleted, totalCycles, onCycleComplete, scale, opacity]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return getPhaseDuration(currentPhase);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPhase]);

  const getPhaseDuration = (phase: Phase): number => {
    switch (phase) {
      case 'inhale':
        return BREATHING_TECHNIQUE.inhale;
      case 'hold':
        return BREATHING_TECHNIQUE.hold;
      case 'exhale':
        return BREATHING_TECHNIQUE.exhale;
    }
  };

  const getPhaseText = (): string => {
    switch (currentPhase) {
      case 'inhale':
        return t('preMeasurement.breathing.inhale');
      case 'hold':
        return t('preMeasurement.breathing.hold');
      case 'exhale':
        return t('preMeasurement.breathing.exhale');
    }
  };

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Animated Circle */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: colors.accent + '30',
              borderColor: colors.accent,
            },
            animatedCircleStyle,
          ]}
        />
        <View style={styles.centerContent}>
          <Text style={[styles.secondsText, { color: colors.accent }]}>
            {secondsRemaining}
          </Text>
        </View>
      </View>

      {/* Phase Label */}
      <Text style={[styles.phaseText, { color: colors.textPrimary }]}>
        {getPhaseText()}
      </Text>

      {/* Cycle Counter */}
      <Text style={[styles.cycleText, { color: colors.textSecondary }]}>
        {t('preMeasurement.breathing.cycle', { current: cyclesCompleted + 1, total: totalCycles })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondsText: {
    fontSize: 64,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  phaseText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  cycleText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
