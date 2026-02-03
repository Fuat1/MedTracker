import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

export function Numpad({
  value,
  onValueChange,
  maxLength = 3,
  disabled = false,
}: NumpadProps) {
  const handleKeyPress = (key: string) => {
    if (disabled) {
      return;
    }

    if (key === 'C') {
      // Clear
      onValueChange('');
    } else if (key === '⌫') {
      // Backspace
      onValueChange(value.slice(0, -1));
    } else {
      // Number key
      if (value.length < maxLength) {
        // Prevent leading zeros (except for single 0)
        if (value === '0' && key === '0') {
          return;
        }
        if (value === '0' && key !== '0') {
          onValueChange(key);
        } else {
          onValueChange(value + key);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                key === 'C' && styles.clearKey,
                key === '⌫' && styles.backspaceKey,
                disabled && styles.disabledKey,
              ]}
              onPress={() => handleKeyPress(key)}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                key === '⌫' ? 'Backspace' : key === 'C' ? 'Clear' : key
              }
            >
              <Text
                style={[
                  styles.keyText,
                  (key === 'C' || key === '⌫') && styles.actionKeyText,
                  disabled && styles.disabledKeyText,
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// Minimum touch target 48x48dp per accessibility guidelines
const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key: {
    width: 72,
    height: 56,
    marginHorizontal: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearKey: {
    backgroundColor: '#fef2f2',
  },
  backspaceKey: {
    backgroundColor: '#fef2f2',
  },
  actionKeyText: {
    color: '#dc2626',
    fontSize: 20,
  },
  disabledKey: {
    opacity: 0.5,
  },
  disabledKeyText: {
    color: '#9ca3af',
  },
});
