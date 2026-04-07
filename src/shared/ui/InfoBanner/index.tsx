import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {FONTS} from '../../config/theme';

interface InfoBannerProps {
  icon: string;
  title: string;
  body: string;
  color: string;
}

export function InfoBanner({icon, title, body, color}: InfoBannerProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color + '12',
          borderColor: color,
        },
      ]}>
      <Icon name={icon} size={20} color={color} style={styles.icon} />
      <View style={styles.textCol}>
        <Text style={[styles.title, {color}]}>{title}</Text>
        <Text style={[styles.body, {color}]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  icon: {marginTop: 1},
  textCol: {flex: 1},
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.85,
  },
});
