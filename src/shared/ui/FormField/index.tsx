import React from 'react';
import {View, Text, TextInput, StyleSheet, type KeyboardTypeOptions} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

type FormFieldBase = {
  label: string;
  value: string;
};

type TextFormField = FormFieldBase & {
  type?: 'text';
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  onPress?: never;
};

type PressableFormField = FormFieldBase & {
  type: 'pressable';
  onPress: () => void;
  onChangeText?: never;
  placeholder?: never;
  keyboardType?: never;
};

type FormFieldProps = TextFormField | PressableFormField;

export function FormField(props: FormFieldProps) {
  const {colors, typography} = useTheme();
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: typography.md,
    },
  ];

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {color: colors.textSecondary, fontSize: typography.sm},
        ]}>
        {props.label}
      </Text>
      {props.type === 'pressable' ? (
        <Pressable
          style={inputStyle}
          onPress={props.onPress}
          accessibilityRole="button"
          accessibilityLabel={props.label}>
          <Text
            style={[
              styles.pressableText,
              {
                color: props.value ? colors.textPrimary : colors.textTertiary,
                fontSize: typography.md,
              },
            ]}>
            {props.value || props.label}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.textTertiary} />
        </Pressable>
      ) : (
        <TextInput
          style={inputStyle}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={props.keyboardType ?? 'default'}
          accessibilityLabel={props.label}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginBottom: 16},
  label: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressableText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
