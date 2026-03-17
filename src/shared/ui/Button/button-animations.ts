import {Platform} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SPRING_CONFIG = {damping: 15, stiffness: 300};

/**
 * Press scale + opacity feedback.
 * Scale applies on both platforms.
 * Opacity dim applies on iOS (instead of ripple).
 */
export function usePressScale(scaleTo = 0.96) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(scaleTo, SPRING_CONFIG);
    if (Platform.OS === 'ios') {
      opacity.value = withTiming(0.85, {duration: 100});
    }
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    if (Platform.OS === 'ios') {
      opacity.value = withTiming(1, {duration: 150});
    }
  };

  return {animatedStyle, onPressIn, onPressOut};
}

/**
 * FAB entry animation — spring from bottom.
 */
export function useFabEntry() {
  const translateY = useSharedValue(80);
  const fabScale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}, {scale: fabScale.value}],
  }));

  const enter = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
    fabScale.value = withSpring(1, SPRING_CONFIG);
  };

  return {animatedStyle, enter};
}
