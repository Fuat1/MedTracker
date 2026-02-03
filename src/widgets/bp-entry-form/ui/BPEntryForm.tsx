import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { Numpad } from '../../../shared/ui';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import {
  validateBPValues,
  classifyBP,
  getBPCategoryColor,
  getBPCategoryLabel,
  isCrisisReading,
} from '../../../entities/blood-pressure';
import { useRecordBP } from '../../../features/record-bp';

type ActiveField = 'systolic' | 'diastolic' | 'pulse' | null;

export function BPEntryForm() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [location, setLocation] = useState<MeasurementLocation>(
    MEASUREMENT_LOCATIONS.LEFT_ARM,
  );
  const [posture, setPosture] = useState<MeasurementPosture>(
    MEASUREMENT_POSTURES.SITTING,
  );
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const recordBP = useRecordBP();

  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : null;

  const validation = validateBPValues(systolicNum, diastolicNum, pulseNum);

  const category =
    systolicNum && diastolicNum ? classifyBP(systolicNum, diastolicNum) : null;

  const categoryColor = category ? getBPCategoryColor(category) : '#9ca3af';
  const categoryLabel = category ? getBPCategoryLabel(category) : '';

  const handleFieldPress = useCallback((field: ActiveField) => {
    setActiveField(field);
  }, []);

  const handleNumpadChange = useCallback(
    (value: string) => {
      switch (activeField) {
        case 'systolic':
          setSystolic(value);
          break;
        case 'diastolic':
          setDiastolic(value);
          break;
        case 'pulse':
          setPulse(value);
          break;
      }
    },
    [activeField],
  );

  const getCurrentValue = (): string => {
    switch (activeField) {
      case 'systolic':
        return systolic;
      case 'diastolic':
        return diastolic;
      case 'pulse':
        return pulse;
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!validation.isValid || !systolicNum || !diastolicNum) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    // Crisis warning
    if (isCrisisReading(systolicNum, diastolicNum)) {
      Alert.alert(
        '⚠️ Hypertensive Crisis',
        'This reading indicates a hypertensive crisis. Please seek immediate medical attention if you are experiencing symptoms such as chest pain, shortness of breath, or severe headache.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            style: 'destructive',
            onPress: () => saveRecord(),
          },
        ],
      );
      return;
    }

    await saveRecord();
  };

  const saveRecord = async () => {
    try {
      await recordBP.mutateAsync({
        systolic: systolicNum!,
        diastolic: diastolicNum!,
        pulse: pulseNum,
        location,
        posture,
      });

      // Reset form
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setActiveField(null);

      Alert.alert('Success', 'Blood pressure reading saved!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save reading',
      );
    }
  };

  const locationLabels: Record<MeasurementLocation, string> = {
    left_arm: 'Left Arm',
    right_arm: 'Right Arm',
    left_wrist: 'Left Wrist',
    right_wrist: 'Right Wrist',
  };

  const postureLabels: Record<MeasurementPosture, string> = {
    sitting: 'Sitting',
    standing: 'Standing',
    lying: 'Lying',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* BP Values Display */}
        <View
          style={[styles.valuesContainer, { backgroundColor: categoryColor + '20' }]}
        >
          <View style={styles.bpRow}>
            <TouchableOpacity
              style={[
                styles.valueBox,
                styles.valueBoxLeft,
                activeField === 'systolic' && styles.valueBoxActive,
              ]}
              onPress={() => handleFieldPress('systolic')}
              accessibilityRole="button"
              accessibilityLabel="Systolic input"
            >
              <Text style={styles.valueLabel}>Systolic</Text>
              <Text
                style={[styles.valueText, { color: categoryColor }]}
              >
                {systolic || '---'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.separator}>/</Text>

            <TouchableOpacity
              style={[
                styles.valueBox,
                styles.valueBoxRight,
                activeField === 'diastolic' && styles.valueBoxActive,
              ]}
              onPress={() => handleFieldPress('diastolic')}
              accessibilityRole="button"
              accessibilityLabel="Diastolic input"
            >
              <Text style={styles.valueLabel}>Diastolic</Text>
              <Text
                style={[styles.valueText, { color: categoryColor }]}
              >
                {diastolic || '---'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pulse */}
          <TouchableOpacity
            style={[
              styles.pulseBox,
              activeField === 'pulse' && styles.pulseBoxActive,
            ]}
            onPress={() => handleFieldPress('pulse')}
            accessibilityRole="button"
            accessibilityLabel="Pulse input"
          >
            <Text style={styles.pulseLabel}>Pulse (optional)</Text>
            <Text style={styles.pulseText}>
              {pulse ? `${pulse} BPM` : '--- BPM'}
            </Text>
          </TouchableOpacity>

          {/* Category Label */}
          {category && (
            <View style={styles.categoryContainer}>
              <View
                style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
              >
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Measurement Location
          </Text>
          <View style={styles.optionsRow}>
            {Object.entries(MEASUREMENT_LOCATIONS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  styles.optionButtonMargin,
                  location === value ? styles.optionButtonActive : styles.optionButtonInactive,
                ]}
                onPress={() => setLocation(value)}
              >
                <Text
                  style={location === value ? styles.optionTextActive : styles.optionTextInactive}
                >
                  {locationLabels[value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Posture Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posture</Text>
          <View style={styles.optionsRow}>
            {Object.entries(MEASUREMENT_POSTURES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  styles.optionButtonMarginRight,
                  posture === value ? styles.optionButtonActive : styles.optionButtonInactive,
                ]}
                onPress={() => setPosture(value)}
              >
                <Text
                  style={posture === value ? styles.optionTextActive : styles.optionTextInactive}
                >
                  {postureLabels[value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            validation.isValid && systolic && diastolic
              ? styles.submitButtonActive
              : styles.submitButtonInactive,
          ]}
          onPress={handleSubmit}
          disabled={!validation.isValid || !systolic || !diastolic || recordBP.isPending}
        >
          <Text style={styles.submitButtonText}>
            {recordBP.isPending ? 'Saving...' : 'Save Reading'}
          </Text>
        </TouchableOpacity>

        {/* Validation Errors */}
        {!validation.isValid && systolic && diastolic && (
          <View style={styles.errorContainer}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Numpad Modal */}
      <Modal
        visible={activeField !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveField(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveField(null)}
        >
          <View style={styles.modalSpacer} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <Text style={styles.modalTitle}>
              {activeField === 'systolic'
                ? 'Enter Systolic'
                : activeField === 'diastolic'
                  ? 'Enter Diastolic'
                  : 'Enter Pulse'}
            </Text>
            <Text style={styles.modalValue}>
              {getCurrentValue() || '0'}
            </Text>
            <Numpad
              value={getCurrentValue()}
              onValueChange={handleNumpadChange}
              maxLength={3}
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setActiveField(null)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
  },
  valuesContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  bpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  valueBoxLeft: {
    marginRight: 8,
  },
  valueBoxRight: {
    marginLeft: 8,
  },
  valueBoxActive: {
    backgroundColor: '#ffffff',
  },
  valueLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 24,
    color: '#9ca3af',
  },
  pulseBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  pulseBoxActive: {
    backgroundColor: '#ffffff',
  },
  pulseLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  pulseText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  categoryContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  categoryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  optionButtonMargin: {
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonMarginRight: {
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
  },
  optionButtonInactive: {
    backgroundColor: '#f3f4f6',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  optionTextInactive: {
    color: '#374151',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#3b82f6',
  },
  submitButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalSpacer: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  modalHandle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHandleBar: {
    width: 48,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 9999,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalValue: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalDoneButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
