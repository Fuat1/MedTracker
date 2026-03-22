import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Medication, MedicationInput } from '../../../shared/api/medication-repository';
import { useManageMedications } from '../../../features/track-medication/useManageMedications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  medication: Medication | null;
}

const FREQUENCIES = ['daily', 'twice_daily', 'three_times_daily', 'as_needed'] as const;
type Frequency = typeof FREQUENCIES[number];

function frequencyLabel(freq: string, t: (key: string, fallback: string) => string): string {
  switch (freq) {
    case 'daily': return t('medication:freq.daily', 'Once daily');
    case 'twice_daily': return t('medication:freq.twiceDaily', 'Twice daily');
    case 'three_times_daily': return t('medication:freq.threeTimesDaily', '3× daily');
    case 'as_needed': return t('medication:freq.asNeeded', 'As needed');
    default: return freq;
  }
}

export default function MedicationModal({ visible, onClose, medication }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { addMedication, updateMedication, isAdding, isUpdating } = useManageMedications();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [reminders, setReminders] = useState<string[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [reminderError, setReminderError] = useState('');

  useEffect(() => {
    if (visible && medication) {
      setName(medication.name);
      setDosage(medication.dosage);
      setFrequency(medication.frequency as Frequency);
      try { setReminders(JSON.parse(medication.reminder_times || '[]')); } catch { setReminders([]); }
    } else if (visible && !medication) {
      setName('');
      setDosage('');
      setFrequency('daily');
      setReminders([]);
      setNewReminder('');
      setReminderError('');
    }
  }, [visible, medication]);

  const isLoading = isAdding || isUpdating;

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim() || isLoading) return;
    const input: MedicationInput = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      reminder_times: JSON.stringify(reminders),
    };
    if (medication) {
      await updateMedication({ id: medication.id, updates: input });
    } else {
      await addMedication(input);
    }
    onClose();
  };

  const handleAddReminder = () => {
    const valid = /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(newReminder);
    if (!valid) {
      setReminderError(t('medication:reminderFormat', 'Use HH:MM format (e.g. 08:00)'));
      return;
    }
    setReminderError('');
    if (!reminders.includes(newReminder)) {
      setReminders([...reminders, newReminder].sort());
    }
    setNewReminder('');
  };

  const removeReminder = (time: string) => setReminders(reminders.filter(r => r !== time));

  const canSave = name.trim().length > 0 && dosage.trim().length > 0 && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>
                {t('common:cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {medication
                ? t('medication:edit', 'Edit Medication')
                : t('medication:add', 'Add Medication')}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!canSave}>
              <Text style={[styles.saveText, { color: canSave ? colors.accent : colors.textTertiary }]}>
                {isLoading ? '…' : t('common:save', 'Save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('medication:name', 'MEDICATION NAME')}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={name}
              onChangeText={setName}
              placeholder={t('medication:namePlaceholder', 'e.g. Amlodipine')}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />

            {/* Dosage */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('medication:dosage', 'DOSAGE')}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('medication:dosagePlaceholder', 'e.g. 5mg, 1 tablet')}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
            />

            {/* Frequency */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('medication:frequency', 'FREQUENCY')}
            </Text>
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.freqChip,
                    { borderColor: frequency === freq ? colors.accent : colors.border },
                    frequency === freq && { backgroundColor: colors.iconCircleBg },
                  ]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={[
                    styles.freqChipText,
                    { color: frequency === freq ? colors.accent : colors.textSecondary },
                  ]}>
                    {frequencyLabel(freq, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reminders */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('medication:reminders', 'DAILY REMINDERS')}
            </Text>
            <View style={styles.reminderInputRow}>
              <TextInput
                style={[styles.input, styles.reminderInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newReminder}
                onChangeText={(v) => { setNewReminder(v); setReminderError(''); }}
                placeholder="08:00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                returnKeyType="done"
                onSubmitEditing={handleAddReminder}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddReminder}
              >
                <Icon name="add" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
            {reminderError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{reminderError}</Text>
            ) : null}

            <View style={styles.chipRow}>
              {reminders.length === 0 ? (
                <Text style={[styles.noReminders, { color: colors.textTertiary }]}>
                  {t('medication:noReminders', 'No reminders set')}
                </Text>
              ) : reminders.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => removeReminder(time)}
                >
                  <Text style={[styles.timeChipText, { color: colors.textPrimary }]}>{time}</Text>
                  <Icon name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {t('medication:reminderHint', 'Tap a time chip to remove it')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 64,
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    fontSize: 17,
  },
  cancelText: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 17,
  },
  saveText: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 17,
    textAlign: 'right',
  },
  scrollContent: {
    padding: 20,
    gap: 0,
  },
  label: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 16,
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  freqChipText: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  reminderInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  reminderInput: {
    flex: 1,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 13,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  timeChipText: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  noReminders: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 14,
    fontStyle: 'italic',
  },
  hint: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 12,
    marginTop: 8,
  },
});
