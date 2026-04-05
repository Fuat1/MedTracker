import { Vibration, Platform } from 'react-native';

/**
 * Soft tap — numpad keystroke confirmation.
 * iOS: 10 ms; Android: 20 ms (minimum perceivable).
 */
export function hapticKeystroke(): void {
  try {
    Vibration.vibrate(Platform.OS === 'ios' ? 10 : 20);
  } catch {
    // No vibration permission — silent no-op
  }
}

/**
 * Success double-pulse — save action confirmation.
 * Pattern: wait 0ms, vibrate 50ms, wait 100ms, vibrate 50ms.
 */
export function hapticSave(): void {
  try {
    Vibration.vibrate([0, 50, 100, 50]);
  } catch {
    // No vibration permission — silent no-op
  }
}

/**
 * Heavy repeated pattern — crisis alert (trimodal).
 * Pattern: wait 0ms, vibrate 100ms, pause 50ms, vibrate 100ms, pause 50ms, vibrate 100ms.
 * Designed to be perceivable through diabetic neuropathy (SM-009).
 */
export function hapticCrisis(): void {
  try {
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  } catch {
    // No vibration permission — silent no-op
  }
}
