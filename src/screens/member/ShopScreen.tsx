import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Native Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const gymIcon = require('../../assets/Icons2/gym.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');

export default function ShopScreen({ navigation }: any) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle Continuous Breathing Pulse for Center Emblem
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={leftArrowIcon}
            style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FitCore Store</Text>
        <View style={{ width: moderateScale(38) }} />
      </View>

      {/* Centered Minimal Coming Soon View */}
      <View style={styles.container}>
        {/* Ambient Glows */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowBottom} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Version 2.0 Pill */}
          <View style={styles.versionBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.versionText}>VERSION 2.0</Text>
          </View>

          {/* Animated Center Icon Emblem */}
          <Animated.View style={[styles.emblemOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.emblemInner}>
              <Image
                source={gymIcon}
                style={styles.emblemIcon}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Title & Coming Soon Text */}
          <Text style={styles.storeTitle}>FitCore Store</Text>
          <Text style={styles.comingSoonHeading}>Coming Soon</Text>
          <Text style={styles.comingSoonSub}>
            We are crafting a brand new store experience for genuine gym supplements & gear. Stay tuned!
          </Text>

          {/* Return Home Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Image
              source={dumbbellIcon}
              style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#FFFFFF' }}
              resizeMode="contain"
            />
            <Text style={styles.actionBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    position: 'relative',
  },

  // Ambient Glows
  ambientGlowTop: {
    position: 'absolute',
    top: hp(5),
    width: wp(75),
    height: wp(75),
    borderRadius: wp(37.5),
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: hp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(0, 196, 140, 0.06)',
  },

  // Centered Luxury Card
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(26),
    paddingVertical: moderateScale(34),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },

  // Version 2.0 Pill
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    marginBottom: hp(2.2),
  },
  badgeDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#6C5CE7',
  },
  versionText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.8,
  },

  // Emblem
  emblemOuter: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
  },
  emblemInner: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  emblemIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    tintColor: '#FFFFFF',
  },

  // Typography
  storeTitle: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  comingSoonHeading: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: hp(1),
  },
  comingSoonSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18.5),
    paddingHorizontal: wp(2),
    marginBottom: hp(3),
  },

  // Action Button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6C5CE7',
    paddingVertical: moderateScale(13),
    paddingHorizontal: moderateScale(26),
    borderRadius: moderateScale(14),
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
