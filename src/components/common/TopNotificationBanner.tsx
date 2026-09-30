import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNotifications } from '../../context/NotificationContext';
import { navigate } from '../../navigation/navigationRef';
import { moderateScale, fontScale } from '../../theme/responsive';

const { width } = Dimensions.get('window');

export default function TopNotificationBanner() {
  const insets = useSafeAreaInsets();
  const { activeBanner, dismissBanner, markAsRead } = useNotifications();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (activeBanner) {
      // Animate In (Luxury Spring Slide Down)
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + (Platform.OS === 'android' ? 10 : 8),
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate Out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 220,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeBanner, insets.top]);

  if (!activeBanner) return null;

  const handlePress = () => {
    if (activeBanner.id) {
      markAsRead(activeBanner.id);
    }
    const targetScreen = activeBanner.actionScreen || 'Notifications';
    dismissBanner();
    navigate(targetScreen, activeBanner.actionParams);
  };

  // Get icon and color based on notification type
  const getIconConfig = () => {
    switch (activeBanner.type) {
      case 'attendance':
        return { name: 'qr-code-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.18)' };
      case 'workout':
        return { name: 'barbell-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.18)' };
      case 'diet':
        return { name: 'nutrition-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' };
      case 'payment':
        return { name: 'card-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.18)' };
      case 'warning':
      case 'alert':
        return { name: 'alert-circle-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' };
      default:
        return { name: 'notifications', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.2)' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.bannerCard}
        activeOpacity={0.92}
        onPress={handlePress}
      >
        {/* Glow Accent Border Line */}
        <View style={styles.topAccentBar} />

        <View style={styles.contentRow}>
          {/* Left Icon Badge */}
          <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
            <Icon name={iconConfig.name} size={moderateScale(20)} color={iconConfig.color} />
            <View style={[styles.pulseDot, { backgroundColor: iconConfig.color }]} />
          </View>

          {/* Center Info */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {activeBanner.title}
              </Text>
              <Text style={styles.timeText}>{activeBanner.date || 'Now'}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {activeBanner.message}
            </Text>
          </View>

          {/* Dismiss Close Icon */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={dismissBanner}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Icon name="close" size={moderateScale(16)} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 999999,
    elevation: 999999,
  },
  bannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 14,
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2.5,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  textContainer: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 6,
  },
  timeText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#818CF8',
  },
  message: {
    fontSize: fontScale(11.5),
    fontWeight: '400',
    color: '#CBD5E1',
    lineHeight: 16,
  },
  closeBtn: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(4),
  },
});
