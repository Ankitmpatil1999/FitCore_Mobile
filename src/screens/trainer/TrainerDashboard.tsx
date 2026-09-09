import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { getMembersByTrainer, getPTBookingsForTrainer } from '../../data/mockData';

// ── Interactive Scale on Press Component ──
function AnimatedPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ── Asset Icons ──
const barbellIconImg = require('../../assets/Icons2/barbell.png');
const calendarIconImg = require('../../assets/Icons2/calendar.png');
const healthyIconImg = require('../../assets/Icons2/healthy.png');

export default function TrainerDashboard({ navigation }: any) {
  const { currentTrainer } = useAppContext();
  const trainerId = currentTrainer?.id || 't1';
  const trainerName = currentTrainer?.name || 'Vikram Singh';

  const [isAvailable, setIsAvailable] = useState(true);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  const clients = getMembersByTrainer(trainerId);
  const bookings = getPTBookingsForTrainer(trainerId);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayStr);

  const displayBookings = todayBookings.length > 0 ? todayBookings : [
    { id: 'pt1', time: '06:00 AM', memberName: 'Arjun Mehta', focus: 'Legs & Squats Form Correction', status: 'scheduled' },
    { id: 'pt2', time: '08:00 AM', memberName: 'Rahul Desai', focus: 'Deadlift Technique Check', status: 'scheduled' },
    { id: 'pt3', time: '05:00 PM', memberName: 'Ananya Jain', focus: 'HIIT Conditioning & Core', status: 'scheduled' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.trainerTitle}>Coach {trainerName.split(' ')[0]} 👋</Text>
            <View style={styles.statusRow}>
              <View style={[styles.activeDot, { backgroundColor: isAvailable ? '#00C48C' : '#FF4D6D' }]} />
              <Text style={styles.statusText}>
                {isAvailable ? 'Available for PT Sessions' : 'Busy with Client'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{currentTrainer?.avatar || 'VS'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── 4 KEY METRICS GRID ── */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(26, 102, 255, 0.10)' }]}>
                <Icon name="people" size={moderateScale(18)} color="#6C5CE7" />
              </View>
              <Text style={styles.metricValue}>{clients.length || 28}</Text>
              <Text style={styles.metricLabel}>Assigned Clients</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 153, 0, 0.10)' }]}>
                <Image source={calendarIconImg} style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#FF9900' }} resizeMode="contain" />
              </View>
              <Text style={styles.metricValue}>{displayBookings.length}</Text>
              <Text style={styles.metricLabel}>Today's PT Slots</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Icon name="checkmark-done" size={moderateScale(18)} color="#00C48C" />
              </View>
              <Text style={styles.metricValue}>96%</Text>
              <Text style={styles.metricLabel}>Attendance Rate</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 77, 109, 0.10)' }]}>
                <Icon name="star" size={moderateScale(18)} color="#FF4D6D" />
              </View>
              <Text style={styles.metricValue}>4.9 ★</Text>
              <Text style={styles.metricLabel}>Coach Rating</Text>
            </View>
          </View>

          {/* ── TODAY'S PT SCHEDULE ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's PT Sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleSessions')}>
              <Text style={styles.sectionLink}>Full Schedule →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleCard}>
            {displayBookings.map((session, idx) => (
              <View
                key={session.id}
                style={[
                  styles.scheduleItem,
                  idx < displayBookings.length - 1 && styles.scheduleItemBorder,
                ]}
              >
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{session.time}</Text>
                </View>

                <View style={styles.sessionDetails}>
                  <Text style={styles.clientName}>{session.memberName}</Text>
                  <Text style={styles.sessionFocus}>{session.focus}</Text>
                </View>

                <TouchableOpacity
                  style={styles.startSessionBtn}
                  onPress={() => Alert.alert('PT Session Started', `Training session with ${session.memberName} has begun!`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startSessionBtnText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ── QUICK PLAN CREATORS & ASSIGNERS ── */}
          <Text style={styles.sectionTitle}>Quick Plan Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('AssignWorkout')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(26, 102, 255, 0.10)' }]}>
                <Image source={barbellIconImg} style={{ width: moderateScale(22), height: moderateScale(22), tintColor: '#6C5CE7' }} resizeMode="contain" />
              </View>
              <Text style={styles.quickTitle}>Assign Workout</Text>
              <Text style={styles.quickSub}>Build routine for clients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('AssignDiet')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Image source={healthyIconImg} style={{ width: moderateScale(22), height: moderateScale(22), tintColor: '#00C48C' }} resizeMode="contain" />
              </View>
              <Text style={styles.quickTitle}>Assign Diet</Text>
              <Text style={styles.quickSub}>Calorie & protein target</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('ScheduleSessions')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255, 153, 0, 0.10)' }]}>
                <Image source={calendarIconImg} style={{ width: moderateScale(22), height: moderateScale(22), tintColor: '#FF9900' }} resizeMode="contain" />
              </View>
              <Text style={styles.quickTitle}>Book PT Slot</Text>
              <Text style={styles.quickSub}>Schedule member 1-on-1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('TrainerChat')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.10)' }]}>
                <Icon name="chatbubble-ellipses" size={moderateScale(20)} color="#A855F7" />
              </View>
              <Text style={styles.quickTitle}>Message Clients</Text>
              <Text style={styles.quickSub}>Direct coach chat</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: hp(12) }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  root: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(108, 92, 231, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  trainerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
  },
  avatarBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  avatarText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  metricCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  metricIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
  },
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  sectionLink: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    gap: moderateScale(12),
  },
  scheduleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
  },
  timeBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  sessionDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  sessionFocus: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  startSessionBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(9),
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startSessionBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  quickCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  quickIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  quickSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },
});
