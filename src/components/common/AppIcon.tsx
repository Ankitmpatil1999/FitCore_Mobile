import React from 'react';
import { Image, ImageStyle, StyleProp, View, Text, StyleSheet } from 'react-native';

// Asset dictionary
const ICONS = {
  // Bottom bar & Navigation
  dashboard: require('../../assets/Bottom bar/Dashboard.png'),
  members: require('../../assets/Bottom bar/Member.png'),
  attendance: require('../../assets/Icons2/qr.png'),
  qr: require('../../assets/Icons2/qr.png'),
  'qr-code': require('../../assets/Icons2/qr.png'),
  'qr-code-outline': require('../../assets/Icons2/qr.png'),
  finance: require('../../assets/Bottom bar/Histroy.png'),
  history: require('../../assets/Bottom bar/Histroy.png'),
  receipt: require('../../assets/Bottom bar/Histroy.png'),
  'receipt-outline': require('../../assets/Bottom bar/Histroy.png'),
  gym: require('../../assets/Bottom bar/gym.png'),
  business: require('../../assets/Bottom bar/gym.png'),
  'business-outline': require('../../assets/Bottom bar/gym.png'),
  trainers: require('../../assets/Bottom bar/Trainer.png'),
  trainer: require('../../assets/Bottom bar/Trainer.png'),
  plans: require('../../assets/Bottom bar/plan.png'),
  plan: require('../../assets/Bottom bar/plan.png'),
  pricetags: require('../../assets/Bottom bar/plan.png'),
  'pricetags-outline': require('../../assets/Bottom bar/plan.png'),
  shop: require('../../assets/Bottom bar/protien.png'),
  cart: require('../../assets/Bottom bar/protien.png'),
  'bag-handle': require('../../assets/Bottom bar/protien.png'),
  'bag-handle-outline': require('../../assets/Bottom bar/protien.png'),
  search: require('../../assets/Bottom bar/search.png'),
  'search-outline': require('../../assets/Bottom bar/search.png'),
  home: require('../../assets/Bottom bar/home.png'),
  chart: require('../../assets/Icons2/chart.png'),
  'bar-chart': require('../../assets/Icons2/bar-chart.png'),
  'stats-chart': require('../../assets/Icons2/chart.png'),
  'stats-chart-outline': require('../../assets/Icons2/chart.png'),
  analytics: require('../../assets/Icons2/chart.png'),

  // Actions & Management
  'person-add': require('../../assets/Icons2/user (1).png'),
  'person-add-outline': require('../../assets/Icons2/user (1).png'),
  people: require('../../assets/Bottom bar/Member.png'),
  'people-outline': require('../../assets/Bottom bar/Member.png'),
  cash: require('../../assets/Icons2/pay.png'),
  'cash-outline': require('../../assets/Icons2/pay.png'),
  pay: require('../../assets/Icons2/pay.png'),
  wallet: require('../../assets/Icons2/pay.png'),
  time: require('../../assets/Icons2/clock.png'),
  'time-outline': require('../../assets/Icons2/clock.png'),
  clock: require('../../assets/Icons2/clock.png'),
  calendar: require('../../assets/Icons2/calendar.png'),
  'calendar-outline': require('../../assets/Icons2/calendar.png'),
  notifications: require('../../assets/Icons/Aleart.png'),
  'notifications-outline': require('../../assets/Icons/Aleart.png'),
  alert: require('../../assets/Icons/Aleart.png'),
  whatsapp: require('../../assets/Icons2/whatsapp.png'),
  'logo-whatsapp': require('../../assets/Icons2/whatsapp.png'),
  edit: require('../../assets/Icons/edit.png'),
  logout: require('../../assets/Icons/logout.png'),
  'log-out': require('../../assets/Icons/logout.png'),
  'log-out-outline': require('../../assets/Icons/logout.png'),
  camera: require('../../assets/Icons/camera.png'),
  'camera-outline': require('../../assets/Icons/camera.png'),
  dumbbell: require('../../assets/Icons/dumbbell.png'),
  barbell: require('../../assets/Icons2/barbell.png'),
  'barbell-outline': require('../../assets/Icons2/barbell.png'),
  kettlebell: require('../../assets/Icons2/kettlebell.png'),
  stopwatch: require('../../assets/Icons/stopwatch.png'),
  thunder: require('../../assets/Icons/thunder-bolt.png'),
  flash: require('../../assets/Icons/thunder-bolt.png'),
  email: require('../../assets/Icons/Email.png'),
  mail: require('../../assets/Icons2/gmail.png'),
  'mail-outline': require('../../assets/Icons2/gmail.png'),
  password: require('../../assets/Icons/Password.png'),
  'lock-closed': require('../../assets/Icons/Password.png'),
  'left-arrow': require('../../assets/Icons2/left-arrow.png'),
  'arrow-back': require('../../assets/Icons2/left-arrow.png'),
  active: require('../../assets/Icons2/active.png'),
  placeholder: require('../../assets/Icons2/placeholder.png'),
  user: require('../../assets/Icons2/user.png'),
  'person-circle': require('../../assets/Icons2/user.png'),
  'person-outline': require('../../assets/Icons2/user.png'),
  shield: require('../../assets/Icons/Password.png'),
  'shield-outline': require('../../assets/Icons/Password.png'),
  'help-circle': require('../../assets/Icons/Aleart.png'),
  'help-circle-outline': require('../../assets/Icons/Aleart.png'),
  'image-outline': require('../../assets/Icons/image.png'),
};

export type AppIconName = keyof typeof ICONS | string;

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}

export default function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  // Vector glyph helpers for geometric icons
  if (name === 'close' || name === 'close-circle' || name === 'close-outline') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.85, color: color || '#0F172A', fontWeight: '700', lineHeight: size }}>
          ✕
        </Text>
      </View>
    );
  }

  if (name === 'add' || name === 'add-circle' || name === 'add-outline') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 1.05, color: color || '#FFFFFF', fontWeight: '600', lineHeight: size }}>
          +
        </Text>
      </View>
    );
  }

  if (name === 'chevron-forward' || name === 'chevron-right' || name === 'arrow-forward') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 1.1, color: color || '#94A3B8', fontWeight: '600', lineHeight: size }}>
          ›
        </Text>
      </View>
    );
  }

  if (name === 'chevron-back' || name === 'chevron-left') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 1.1, color: color || '#94A3B8', fontWeight: '600', lineHeight: size }}>
          ‹
        </Text>
      </View>
    );
  }

  if (name === 'checkmark' || name === 'checkmark-circle' || name === 'checkmark-done') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.9, color: color || '#00C48C', fontWeight: '700', lineHeight: size }}>
          ✓
        </Text>
      </View>
    );
  }

  if (name === 'call' || name === 'call-outline') {
    return (
      <View style={[styles.symbolContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.85, color: color || '#3B82F6', fontWeight: '700', lineHeight: size }}>
          📞
        </Text>
      </View>
    );
  }

  const iconSource = ICONS[name as keyof typeof ICONS] || ICONS.dashboard;

  return (
    <Image
      source={iconSource}
      style={[
        {
          width: size,
          height: size,
          tintColor: color,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  symbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
