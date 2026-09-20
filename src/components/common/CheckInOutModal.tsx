import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { moderateScale, fontScale, wp, hp } from '../../theme/responsive';

const gymDumbbellImg = require('../../assets/Icons2/gym.png');
const clockImg = require('../../assets/Icons2/clock.png');
const activeNotifImg = require('../../assets/Icons2/active.png');
const stopwatchIcon = require('../../assets/Icons/stopwatch.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');

export interface CheckInOutModalProps {
  visible: boolean;
  type: 'checkin' | 'checkout';
  memberName?: string;
  gymName?: string;
  duration?: string;
  timeStr?: string;
  message?: string;
  onClose: () => void;
}

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  visible,
  type,
  memberName = 'Member',
  gymName = 'FitCore Gym',
  duration = '45 min',
  timeStr,
  message,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isCheckIn = type === 'checkin';
  const currentTime =
    timeStr ||
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Breathing aura animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Top Floating Glow Aura */}
              <View
                style={[
                  styles.auraWrapper,
                  {
                    backgroundColor: isCheckIn
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(108, 92, 231, 0.12)',
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.glowPulseRing,
                    {
                      borderColor: isCheckIn
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(108, 92, 231, 0.35)',
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isCheckIn ? '#10B981' : '#6C5CE7',
                      shadowColor: isCheckIn ? '#10B981' : '#6C5CE7',
                    },
                  ]}
                >
                  <Image
                    source={isCheckIn ? gymDumbbellImg : stopwatchIcon}
                    style={styles.headerIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Status Header Badge */}
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isCheckIn ? '#ECFDF5' : '#F3F0FF',
                    borderColor: isCheckIn ? '#A7F3D0' : '#DDD6FE',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isCheckIn ? '#10B981' : '#6C5CE7' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isCheckIn ? '#065F46' : '#5B21B6' },
                  ]}
                >
                  {isCheckIn ? 'LIVE SESSION ACTIVE' : 'WORKOUT LOGGED'}
                </Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.modalTitle}>
                {isCheckIn ? 'Check-In Confirmed' : 'Workout Completed'}
              </Text>

              <Text style={styles.modalSubtitle}>
                {message ||
                  (isCheckIn
                    ? `Welcome ${memberName}! Your workout session timer is active. Have a great workout!`
                    : `Awesome job today ${memberName}! You spent ${duration} training.`)}
              </Text>

              {/* Summary Stats Island */}
              <View style={styles.statIslandContainer}>
                {isCheckIn ? (
                  <>
                    <View style={styles.statIslandCol}>
                      <Text style={styles.statIslandLabel}>TIME IN</Text>
                      <Text style={styles.statIslandValue}>{currentTime}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statIslandCol}>
                      <Text style={styles.statIslandLabel}>LOCATION</Text>
                      <Text style={styles.statIslandValue} numberOfLines={1}>
                        {gymName}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.statIslandCol}>
                      <Text style={styles.statIslandLabel}>DURATION</Text>
                      <Text style={styles.statIslandValue}>{duration}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statIslandCol}>
                      <Text style={styles.statIslandLabel}>STATUS</Text>
                      <Text style={[styles.statIslandValue, { color: '#10B981' }]}>
                        Saved
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* CTA Action Button */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  { backgroundColor: isCheckIn ? '#10B981' : '#6C5CE7' },
                ]}
                onPress={onClose}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaButtonText}>
                  {isCheckIn ? "Let's Start Training" : 'Continue to Dashboard'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(22),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    paddingTop: moderateScale(30),
    paddingBottom: moderateScale(24),
    paddingHorizontal: moderateScale(22),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  auraWrapper: {
    width: moderateScale(82),
    height: moderateScale(82),
    borderRadius: moderateScale(41),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(16),
  },
  glowPulseRing: {
    position: 'absolute',
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
    borderWidth: 2,
  },
  iconCircle: {
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(31),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  headerIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    tintColor: '#FFFFFF',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    marginBottom: moderateScale(10),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusPillText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontScale(13),
    color: '#64748B',
    lineHeight: fontScale(19),
    textAlign: 'center',
    paddingHorizontal: moderateScale(6),
    marginBottom: moderateScale(18),
  },
  statIslandContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(20),
  },
  statIslandCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIslandLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statIslandValue: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  statDivider: {
    width: 1,
    height: moderateScale(28),
    backgroundColor: '#CBD5E1',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  ctaButtonText: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
