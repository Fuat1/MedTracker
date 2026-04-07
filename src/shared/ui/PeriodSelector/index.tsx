import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {OptionChip} from '../OptionChip';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  options: string[];
  onCustomPress?: () => void;
}

export function PeriodSelector({
  value,
  onChange,
  options,
  onCustomPress,
}: PeriodSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {options.map(opt => (
        <OptionChip
          key={opt}
          label={opt}
          selected={value === opt}
          onPress={() =>
            opt === 'custom' && onCustomPress ? onCustomPress() : onChange(opt)
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
});
