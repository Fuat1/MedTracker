import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

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

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

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

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onCancel} />
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
            <Icon name="warning" size={32} color="#ffffff" />
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

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {tMedical('crisis.message')}
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                {tCommon('buttons.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.crisisRed }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Icon name="save-outline" size={16} color="#ffffff" />
              <Text style={styles.confirmText}>
                {tCommon('buttons.saveAnyway')}
              </Text>
            </TouchableOpacity>
          </View>
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
    width: '82%',
    maxWidth: 320,
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
    marginBottom: 16,
    letterSpacing: -0.3,
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
    marginBottom: 16,
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
  message: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  confirmText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#ffffff',
  },
});
