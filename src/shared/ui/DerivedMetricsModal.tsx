import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface DerivedMetricsModalProps {
  visible: boolean;
  type: 'pp' | 'map';
  value: number;
  onClose: () => void;
}

export function DerivedMetricsModal({
  visible,
  type,
  value,
  onClose,
}: DerivedMetricsModalProps) {
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

  const iconName = type === 'pp' ? 'pulse' : 'analytics';
  const iconColor = type === 'pp' ? colors.ppColor : colors.mapColor;
  const formulaTextStyle = { color: colors.textPrimary, fontFamily: FONTS.semiBold, fontWeight: '600' as const };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
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
          <View style={[styles.stripe, { backgroundColor: iconColor }]} />

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
            <Icon name={iconName} size={32} color="#ffffff" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {tMedical(`derivedMetrics.${type}.title`)}
          </Text>

          {/* Value Badge */}
          <View
            style={[
              styles.valueBadge,
              {
                backgroundColor: `${iconColor}15`,
                borderColor: `${iconColor}40`,
              },
            ]}
          >
            <Text style={[styles.badgeLabel, { color: iconColor }]}>
              {tMedical(`derivedMetrics.${type}.abbr`)}:
            </Text>
            <Text style={[styles.badgeValue, { color: iconColor }]}>
              {value}
            </Text>
            <Text style={[styles.badgeUnit, { color: iconColor }]}>
              {tCommon('units.mmhg')}
            </Text>
          </View>

          {/* Content Section */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Definition */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                What is it?
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {tMedical(`derivedMetrics.${type}.definition`)}
              </Text>
            </View>

            {/* Formula */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Formula
              </Text>
              <View
                style={[
                  styles.formulaBox,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.formulaText,
                    formulaTextStyle,
                  ]}
                >
                  {tMedical(`derivedMetrics.${type}.formula`)}
                </Text>
              </View>
            </View>

            {/* Normal Ranges */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Normal Ranges
              </Text>
              <View style={styles.rangesContainer}>
                {type === 'pp' ? (
                  <>
                    <View style={[styles.rangeItem, { backgroundColor: colors.errorBackground, borderLeftColor: colors.error }]}>
                      <Icon
                        name="alert-circle"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.pp.ranges.low')}
                      </Text>
                    </View>
                    <View style={[styles.rangeItem, { backgroundColor: colors.successBg, borderLeftColor: colors.successText }]}>
                      <Icon
                        name="checkmark-circle"
                        size={16}
                        color={colors.successText}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.pp.ranges.normal')}
                      </Text>
                    </View>
                    <View style={[styles.rangeItem, { backgroundColor: colors.errorBackground, borderLeftColor: colors.error }]}>
                      <Icon
                        name="warning"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.pp.ranges.high')}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.rangeItem, { backgroundColor: colors.infoBg, borderLeftColor: colors.infoColor }]}>
                      <Icon
                        name="arrow-down-circle"
                        size={16}
                        color={colors.infoColor}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.map.ranges.low')}
                      </Text>
                    </View>
                    <View style={[styles.rangeItem, { backgroundColor: colors.successBg, borderLeftColor: colors.successText }]}>
                      <Icon
                        name="checkmark-circle"
                        size={16}
                        color={colors.successText}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.map.ranges.normal')}
                      </Text>
                    </View>
                    <View style={[styles.rangeItem, { backgroundColor: colors.errorBackground, borderLeftColor: colors.error }]}>
                      <Icon
                        name="warning"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={[styles.rangeText, { color: colors.textPrimary }]}>
                        {tMedical('derivedMetrics.map.ranges.high')}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Clinical Significance */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Clinical Significance
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {tMedical(`derivedMetrics.${type}.significance`)}
              </Text>
            </View>

            {/* Reference */}
            <View style={styles.referenceSection}>
              <Icon
                name="information-circle-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.referenceText, { color: colors.textSecondary }]}>
                {tMedical(`derivedMetrics.${type}.reference`)}
              </Text>
            </View>

            {/* Disclaimer */}
            <View
              style={[
                styles.disclaimer,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                This information is for educational purposes only. Always consult
                your healthcare provider for medical interpretation of your blood
                pressure readings.
              </Text>
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.accent }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeText}>{tCommon('buttons.done')}</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardWrapper: {
    width: '88%',
    maxWidth: 380,
    maxHeight: '85%',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 16,
    alignItems: 'center',
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
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.3,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  badgeValue: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  badgeUnit: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  contentScroll: {
    width: '100%',
    maxHeight: 380,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 19,
  },
  formulaBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  formulaText: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  rangesContainer: {
    gap: 8,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  rangeText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  referenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  disclaimer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    textAlign: 'center',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#ffffff',
  },
});
