import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BPRecord } from '../../../shared/api';
import {
  classifyBP,
  getBPCategoryColor,
  getBPCategoryLabel,
} from '../../../entities/blood-pressure';
import { formatDateTime, getRelativeTime } from '../../../shared/lib';

interface BPRecordCardProps {
  record: BPRecord;
}

export function BPRecordCard({ record }: BPRecordCardProps) {
  const category = classifyBP(record.systolic, record.diastolic);
  const categoryColor = getBPCategoryColor(category);
  const categoryLabel = getBPCategoryLabel(category);

  const locationLabels: Record<string, string> = {
    left_arm: 'Left Arm',
    right_arm: 'Right Arm',
    left_wrist: 'Left Wrist',
    right_wrist: 'Right Wrist',
  };

  const postureLabels: Record<string, string> = {
    sitting: 'Sitting',
    standing: 'Standing',
    lying: 'Lying',
  };

  return (
    <View
      style={[styles.card, { borderLeftColor: categoryColor }]}
    >
      <View style={styles.header}>
        {/* BP Values */}
        <View style={styles.valuesRow}>
          <Text style={[styles.valueTextLarge, { color: categoryColor }]}>
            {record.systolic}
          </Text>
          <Text style={styles.separator}>/</Text>
          <Text style={[styles.valueTextLarge, { color: categoryColor }]}>
            {record.diastolic}
          </Text>
          <Text style={styles.unit}>mmHg</Text>
        </View>

        {/* Category Badge */}
        <View
          style={[styles.badge, { backgroundColor: categoryColor }]}
        >
          <Text style={styles.badgeText}>{categoryLabel}</Text>
        </View>
      </View>

      {/* Pulse */}
      {record.pulse && (
        <View style={styles.pulseRow}>
          <Text style={styles.pulseLabel}>Pulse: </Text>
          <Text style={styles.pulseValue}>{record.pulse} BPM</Text>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.metadataRow}>
        <Text style={styles.metadataText}>
          {getRelativeTime(record.timestamp)}
        </Text>
        <Text style={styles.metadataDot}>•</Text>
        <Text style={styles.metadataText}>
          {locationLabels[record.location] || record.location}
        </Text>
        <Text style={styles.metadataDot}>•</Text>
        <Text style={styles.metadataText}>
          {postureLabels[record.posture] || record.posture}
        </Text>
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {formatDateTime(record.timestamp)}
      </Text>

      {/* Notes */}
      {record.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{record.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueTextLarge: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 20,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  pulseValue: {
    color: '#374151',
    fontWeight: '500',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metadataText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  metadataDot: {
    color: '#d1d5db',
    marginHorizontal: 8,
  },
  timestamp: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 4,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesText: {
    color: '#4b5563',
    fontSize: 14,
  },
});
