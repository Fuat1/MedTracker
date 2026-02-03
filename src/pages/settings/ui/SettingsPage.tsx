import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { BP_UNITS, BP_GUIDELINES } from '../../../shared/config/settings';

export function SettingsPage() {
  const { unit, guideline, setUnit, setGuideline } = useSettingsStore();

  const units = [
    { value: BP_UNITS.MMHG, label: 'mmHg (Millimeters of Mercury)', description: 'Standard worldwide' },
    { value: BP_UNITS.KPA, label: 'kPa (Kilopascals)', description: 'Used in some regions' },
  ];

  const guidelines = [
    {
      value: BP_GUIDELINES.AHA_ACC,
      label: 'AHA/ACC',
      description: 'American Heart Association (USA)',
      regions: 'Americas, International',
    },
    {
      value: BP_GUIDELINES.ESC_ESH,
      label: 'ESC/ESH',
      description: 'European Society of Cardiology (Europe)',
      regions: 'Europe, Africa, Middle East',
    },
    {
      value: BP_GUIDELINES.JSH,
      label: 'JSH',
      description: 'Japanese Society of Hypertension',
      regions: 'Japan, East Asia',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure your blood pressure monitoring preferences
          </Text>
        </View>

        {/* Measurement Unit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement Unit</Text>
          <Text style={styles.sectionDescription}>
            Choose your preferred unit for blood pressure values
          </Text>

          {units.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                unit === item.value && styles.optionSelected,
              ]}
              onPress={() => setUnit(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={styles.radioOuter}>
                  {unit === item.value && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionDescription}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Note: 1 kPa ≈ 7.5 mmHg. All values are stored in mmHg and
              converted for display.
            </Text>
          </View>
        </View>

        {/* Classification Guidelines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classification Guidelines</Text>
          <Text style={styles.sectionDescription}>
            Select the regional guidelines for blood pressure categorization
          </Text>

          {guidelines.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                guideline === item.value && styles.optionSelected,
              ]}
              onPress={() => setGuideline(item.value)}
            >
              <View style={styles.optionContent}>
                <View style={styles.radioOuter}>
                  {guideline === item.value && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionDescription}>{item.description}</Text>
                  <Text style={styles.optionRegions}>Regions: {item.regions}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Different regions use different thresholds for categorizing
              blood pressure levels. Choose the guideline recommended by your
              healthcare provider.
            </Text>
          </View>
        </View>

        {/* Comparison Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidelines Comparison</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Category</Text>
              <Text style={styles.tableHeader}>AHA/ACC</Text>
              <Text style={styles.tableHeader}>ESC/ESH</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Normal</Text>
              <Text style={styles.tableCell}>&lt;120/80</Text>
              <Text style={styles.tableCell}>&lt;130/85</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Elevated</Text>
              <Text style={styles.tableCell}>120-129/&lt;80</Text>
              <Text style={styles.tableCell}>130-139/85-89</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Stage 1</Text>
              <Text style={styles.tableCell}>130-139/80-89</Text>
              <Text style={styles.tableCell}>140-159/90-99</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Stage 2</Text>
              <Text style={styles.tableCell}>≥140/90</Text>
              <Text style={styles.tableCell}>≥160/100</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Crisis</Text>
              <Text style={styles.tableCell}>&gt;180/120</Text>
              <Text style={styles.tableCell}>≥180/110</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionRegions: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  comparisonTable: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tableHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
  },
});
