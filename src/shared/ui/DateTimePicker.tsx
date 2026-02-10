import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

export function DateTimePicker({ value, onChange, disabled }: DateTimePickerProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDateTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    // If today
    if (diffDays === 0) {
      if (diffMinutes < 1) {
        return t('time.justNow');
      } else if (diffMinutes < 60) {
        return t('time.minute', { count: diffMinutes });
      } else {
        return t('time.hour', { count: diffHours });
      }
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const adjustTime = (field: 'hour' | 'minute' | 'day', delta: number) => {
    const newDate = new Date(tempDate);
    switch (field) {
      case 'hour':
        newDate.setHours(newDate.getHours() + delta);
        break;
      case 'minute':
        newDate.setMinutes(newDate.getMinutes() + delta);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + delta);
        break;
    }
    setTempDate(newDate);
  };

  const handleSave = () => {
    onChange(tempDate);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setModalVisible(false);
  };

  const setToNow = () => {
    setTempDate(new Date());
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          },
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.triggerText, { color: colors.textPrimary }]}>
          {formatDateTime(value)}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('dateTime.selectTime')}
            </Text>

            {/* Date Display */}
            <View style={styles.dateDisplay}>
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {tempDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {/* Day Adjuster */}
            <View style={styles.adjuster}>
              <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                {t('dateTime.day')}
              </Text>
              <View style={styles.adjusterButtons}>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('day', -1)}
                >
                  <Icon name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                  {tempDate.getDate()}
                </Text>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('day', 1)}
                  disabled={tempDate >= new Date()}
                >
                  <Icon name="add" size={24} color={tempDate >= new Date() ? colors.textTertiary : colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Hour Adjuster */}
            <View style={styles.adjuster}>
              <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                {t('dateTime.hour')}
              </Text>
              <View style={styles.adjusterButtons}>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('hour', -1)}
                >
                  <Icon name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                  {tempDate.getHours().toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('hour', 1)}
                  disabled={tempDate >= new Date()}
                >
                  <Icon name="add" size={24} color={tempDate >= new Date() ? colors.textTertiary : colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Minute Adjuster */}
            <View style={styles.adjuster}>
              <Text style={[styles.adjusterLabel, { color: colors.textSecondary }]}>
                {t('dateTime.minute')}
              </Text>
              <View style={styles.adjusterButtons}>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('minute', -5)}
                >
                  <Icon name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.adjusterValue, { color: colors.textPrimary }]}>
                  {tempDate.getMinutes().toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.adjusterButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => adjustTime('minute', 5)}
                  disabled={tempDate >= new Date()}
                >
                  <Icon name="add" size={24} color={tempDate >= new Date() ? colors.textTertiary : colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Action: Now */}
            <TouchableOpacity
              style={[styles.nowButton, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}
              onPress={setToNow}
            >
              <Icon name="time" size={20} color={colors.accent} />
              <Text style={[styles.nowButtonText, { color: colors.accent }]}>
                {t('dateTime.setToNow')}
              </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={handleCancel}
              >
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  {t('buttons.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: colors.accent }]}
                onPress={handleSave}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonPrimaryText]}>
                  {t('buttons.done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  adjuster: {
    marginBottom: 16,
  },
  adjusterLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adjusterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjusterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjusterValue: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
  },
  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  nowButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonPrimary: {},
  actionButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
  },
});
