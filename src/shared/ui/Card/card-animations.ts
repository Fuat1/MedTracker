import {useState, useEffect} from 'react';
import {AccessibilityInfo} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const SPRING_CONFIG = {damping: 15, stiffness: 150};

/**
 * Collapsible expand/collapse animation.
 * Uses height animation via shared value (0 = collapsed, 1 = expanded).
 */
export function useCollapse(defaultExpanded = false) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const progress = useSharedValue(defaultExpanded ? 1 : 0);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * 1000, // Approximate; real impl uses measure()
  }));

  return {toggle, expanded, animatedStyle};
}

/**
 * Skeleton shimmer animation.
 * Respects system reduce-motion preference.
 */
export function useShimmer() {
  const translateX = useSharedValue(-200);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const check = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(enabled);
    };
    check();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-200, {duration: 0}),
          withTiming(400, {duration: 1200}),
        ),
        -1, // infinite
        false,
      );
    } else {
      translateX.value = -200; // No animation
    }
  }, [reduceMotion, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  return {shimmerStyle, reduceMotion};
}

/**
 * Press scale for pressable cards (gentler than buttons).
 */
export function useCardPressScale() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return {animatedStyle, onPressIn, onPressOut};
}
