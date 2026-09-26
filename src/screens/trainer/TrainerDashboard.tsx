import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { getMembersByTrainer } from '../../data/mockData';
import apiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInOutModal } from '../../components/common/CheckInOutModal';

// ── Asset Icons ──
const barbellIconImg = require('../../assets/Icons2/barbell.png');
const calendarIconImg = require('../../assets/Icons2/calendar.png');
const healthyIconImg = require('../../assets/Icons2/healthy.png');
const bellNotifImg = require('../../assets/Icons2/bell_clean.png');

export default function TrainerDashboard({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Kunal Patil';
  const gymName = currentGym?.name || 'FitCore Gym';

  // ── Shift & Live Attendance State ──
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTimestamp, setCheckInTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [punching, setPunching] = useState(false);
  const [popupModal, setPopupModal] = useState<{
    visible: boolean;
    type: 'checkin' | 'checkout';
    duration?: string;
    message?: string;
    timeStr?: string;
  }>({
    visible: false,
    type: 'checkin',
    duration: '45 min',
    message: '',
  });

  const [attendanceRate, setAttendanceRate] = useState('0%');
  const [totalShiftsCount, setTotalShiftsCount] = useState(0);
  const [coachRating, setCoachRating] = useState('5.0');
  const [todayPTSessions, setTodayPTSessions] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // ── Leave Request State ──
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);

  // ── Fetch Trainer live attendance, PT Sessions and Leave Requests from API & MongoDB ──
  const loadAttendance = async () => {
    try {
      const res: any = await apiService.getTrainerTodayAttendance(trainerId);
      if (res?.success && res.data) {
        const isLive = !!(res.data.checkInTime && !res.data.checkOutTime);
        setIsCheckedIn(isLive);

        if (isLive && res.data.checkInTimestamp) {
          setCheckInTimestamp(res.data.checkInTimestamp);
          const diffSec = Math.max(0, Math.floor((Date.now() - res.data.checkInTimestamp) / 1000));
          setElapsedSeconds(diffSec);
        } else if (!isLive) {
          setElapsedSeconds(0);
        }
      }

      // Fetch Attendance History from MongoDB for Attendance Rate Calculation
      const histRes: any = await apiService.getTrainerAttendanceHistory(trainerId);
      if (histRes?.success && histRes.data) {
        const summary = histRes.data.summary;
        if (summary?.attendanceRate) {
          setAttendanceRate(summary.attendanceRate);
        }
        if (summary?.totalDaysPresent !== undefined) {
          setTotalShiftsCount(summary.totalDaysPresent);
        }
      }

      // Fetch Leave Requests for this trainer
      const leavesRes: any = await apiService.getTrainerLeaveRequests(currentGym?.id, trainerId);
      if (leavesRes?.success && Array.isArray(leavesRes.data)) {
        setMyLeaveRequests(leavesRes.data);
      }

      // Fetch Live Coach Rating from MongoDB
      const revRes: any = await apiService.getTrainerReviews(trainerId);
      if (revRes?.success && revRes.data?.avgRating) {
        setCoachRating(revRes.data.avgRating);
      }

      // Fetch Live Today PT Sessions from MongoDB
      const todayDateStr = new Date().toISOString().split('T')[0];
      const ptRes: any = await apiService.getPTSessions({
        gymId: currentGym?.id,
        trainerId: trainerId,
        date: todayDateStr,
      });
      if (ptRes?.success && Array.isArray(ptRes.data)) {
        setTodayPTSessions(ptRes.data);
      }

      // Fetch dynamic unread notifications for trainer
      try {
        const targetGymId = currentGym?.id || (currentUser as any)?.gymId;
        const targetUserId = trainerId || currentUser?.id || 't1';
        const notifKeys = [
          'fitcore_read_notifs_all',
          `fitcore_read_notifs_${targetUserId}`,
          currentUser?.id ? `fitcore_read_notifs_${currentUser.id}` : null,
          currentUser?.phone ? `fitcore_read_notifs_${currentUser.phone}` : null,
        ].filter(Boolean) as string[];

        const storedResults = await Promise.all(notifKeys.map(k => AsyncStorage.getItem(k).catch(() => null)));
        const allReadTimeStr = await AsyncStorage.getItem('fitcore_all_notifs_read_timestamp').catch(() => null);
        const allReadTime = allReadTimeStr ? Number(allReadTimeStr) : 0;

        const locallyReadIds = new Set<string>();
        storedResults.forEach(res => {
          if (res) {
            try {
              const arr = JSON.parse(res);
              if (Array.isArray(arr)) arr.forEach(i => locallyReadIds.add(String(i)));
            } catch (e) {}
          }
        });

        const notifRes: any = await apiService.getNotifications('trainer', targetGymId, targetUserId);
        if (notifRes?.success && Array.isArray(notifRes.data)) {
          const unread = notifRes.data.filter((n: any) => {
            const notifId = String(n.id || n._id || '');
            const createdAtTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
            const isRead = Boolean(
              n.isRead ||
              n.read ||
              locallyReadIds.has(notifId) ||
              (allReadTime > 0 && createdAtTime > 0 && createdAtTime <= allReadTime)
            );
            return !isRead;
          }).length;
          setUnreadNotifCount(unread);
        } else {
          setUnreadNotifCount(0);
        }
      } catch (e) {
        setUnreadNotifCount(0);
      }
    } catch (e) {
      console.log('Using local trainer attendance fallback');
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveStartDate || !leaveEndDate) {
      Alert.alert('Missing Dates', 'Please select start and end dates for your leave.');
      return;
    }
    if (!leaveReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a brief reason for your leave request.');
      return;
    }
    setSubmittingLeave(true);
    try {
      const res: any = await apiService.createTrainerLeaveRequest({
        trainerId,
        trainerName,
        gymId: currentGym?.id || 'gym1',
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim(),
      });
      if (res?.success) {
        Alert.alert('Leave Submitted ✅', 'Your leave request has been sent to the gym owner for approval.');
        setLeaveModalVisible(false);
        setLeaveReason('');
        loadAttendance();
      } else {
        Alert.alert('Request Failed', res?.message || 'Unable to submit leave request.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error submitting leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [trainerId, currentGym?.id])
  );

  // ── Live Stopwatch Interval when Checked In ──
  useEffect(() => {
    let timer: any = null;
    if (isCheckedIn) {
      timer = setInterval(() => {
        if (checkInTimestamp) {
          const diffSec = Math.max(0, Math.floor((Date.now() - checkInTimestamp) / 1000));
          setElapsedSeconds(diffSec);
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckedIn, checkInTimestamp]);

  // ── Format Timer HH:MM:SS ──
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  // ── Handle Punch In / Punch Out (Identical to Member CheckIn Logic) ──
  const handlePunchShift = async () => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowTs = Date.now();

    if (!isCheckedIn) {
      // 1. Instant UI Feedback (0ms)
      setIsCheckedIn(true);
      if (!checkInTimestamp) {
        setCheckInTimestamp(nowTs);
      }
      setPopupModal({
        visible: true,
        type: 'checkin',
        message: `Welcome Coach ${trainerName.split(' ')[0]}! Shift tracking active. Have an awesome coaching session!`,
      });

      // 2. Background Sync to MongoDB
      setPunching(true);
      apiService
        .punchTrainerAttendance(trainerId, trainerName, 'check-in', currentGym?.id)
        .then((res: any) => {
          if (res?.success && res.data?.checkInTimestamp) {
            setCheckInTimestamp(res.data.checkInTimestamp);
            const diffSec = Math.max(0, Math.floor((Date.now() - res.data.checkInTimestamp) / 1000));
            setElapsedSeconds(diffSec);
          }
          loadAttendance();
        })
        .catch((e) => console.log('Trainer Check-in sync:', e))
        .finally(() => setPunching(false));
    } else {
      // 1. Instant UI Feedback (0ms)
      setIsCheckedIn(false);
      const durationStr = `${hours > 0 ? `${hours}h ` : ''}${Math.max(1, minutes)}m`;
      setPopupModal({
        visible: true,
        type: 'checkout',
        duration: durationStr,
        message: `You spent ${durationStr} on floor coaching today. Outstanding effort Coach!`,
      });

      // 2. Background Sync to MongoDB
      setPunching(true);
      apiService
        .punchTrainerAttendance(trainerId, trainerName, 'check-out', currentGym?.id)
        .then(() => {
          setCheckInTimestamp(null);
          setElapsedSeconds(0);
          loadAttendance();
        })
        .catch((e) => console.log('Trainer Check-out sync:', e))
        .finally(() => setPunching(false));
    }
  };

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

  const targetGymId = currentGym?.id || currentTrainer?.gymId;
  const clients = getMembersByTrainer(trainerId, targetGymId);
  const displayBookings = todayPTSessions;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: moderateScale(12) }}>
            <Text style={styles.gymTitle} numberOfLines={1}>
              {gymName}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.activeDot, { backgroundColor: isCheckedIn ? '#00C48C' : '#94A3B8' }]} />
              <Text style={styles.statusText}>
                Coach {trainerName.split(' ')[0]}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <Image
                source={bellNotifImg}
                style={{ width: moderateScale(22), height: moderateScale(22) }}
                resizeMode="contain"
              />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{currentTrainer?.avatar || currentUser?.avatar || 'KP'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* ════════════════════════════════════════════════════════════════
              1. COMPACT ATTENDANCE CHECK-IN / CHECK-OUT BAR (SAME AS MEMBER)
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.compactAttendanceCard}>
            <View style={styles.compactAttendanceRow}>
              {/* Timer Digits Box */}
              <View style={styles.compactClockRow}>
                <View style={styles.compactDigitBox}>
                  <Text style={styles.compactDigitText}>{hoursStr}</Text>
                </View>
                <Text style={styles.compactColon}>:</Text>
                <View style={styles.compactDigitBox}>
                  <Text style={styles.compactDigitText}>{minutesStr}</Text>
                </View>
                <Text style={styles.compactColon}>:</Text>
                <View style={styles.compactDigitBox}>
                  <Text style={styles.compactDigitText}>{secondsStr}</Text>
                </View>
              </View>

              {/* Prominent Check-In / Check-Out Button */}
              <TouchableOpacity
                style={[
                  styles.compactActionBtn,
                  {
                    backgroundColor: isCheckedIn ? '#EF4444' : '#059669',
                    shadowColor: isCheckedIn ? '#EF4444' : '#059669',
                  },
                ]}
                onPress={handlePunchShift}
                disabled={punching}
                activeOpacity={0.85}
              >
                <View style={styles.actionBtnInnerRow}>
                  <Icon
                    name={isCheckedIn ? 'log-out-outline' : 'checkmark-circle-outline'}
                    size={moderateScale(15)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.compactActionBtnText}>
                    {punching ? '...' : isCheckedIn ? 'Check Out' : 'Check In'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              2. 4 COMPACT KEY METRICS GRID (Icon + Number top, Text bottom)
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.metricsGrid}>
            {/* 1. Assigned Clients */}
            <TouchableOpacity
              style={[styles.metricCard, { borderColor: 'rgba(99, 102, 241, 0.22)' }]}
              onPress={() => navigation.navigate('Clients')}
              activeOpacity={0.75}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Icon name="people" size={moderateScale(15)} color="#4F46E5" />
                </View>
                <Text style={[styles.metricValue, { color: '#1E1B4B' }]}>{clients.length || 2}</Text>
              </View>
              <Text style={styles.metricLabel} numberOfLines={1}>Assigned Clients</Text>
            </TouchableOpacity>

            {/* 2. Daily Schedule */}
            <TouchableOpacity
              style={[styles.metricCard, { borderColor: 'rgba(245, 158, 11, 0.25)' }]}
              onPress={() => navigation.navigate('ScheduleSessions')}
              activeOpacity={0.75}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="calendar-outline" size={moderateScale(15)} color="#D97706" />
                </View>
                <Text style={[styles.metricValue, { color: '#78350F' }]}>{displayBookings.length}</Text>
              </View>
              <Text style={styles.metricLabel} numberOfLines={1}>Daily Schedule</Text>
            </TouchableOpacity>

            {/* 3. Attendance Rate (Clickable to open Full Dedicated Attendance Screen) */}
            <TouchableOpacity
              style={[styles.metricCard, { borderColor: 'rgba(16, 185, 129, 0.25)' }]}
              onPress={() => navigation.navigate('TrainerAttendance')}
              activeOpacity={0.75}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="checkmark-done" size={moderateScale(15)} color="#059669" />
                </View>
                <Text style={[styles.metricValue, { color: '#064E3B' }]}>{attendanceRate}</Text>
              </View>
              <Text style={styles.metricLabel} numberOfLines={1}>Attendance Rate</Text>
            </TouchableOpacity>

            {/* 4. Coach Rating (Clickable to view all Member Reviews & Ratings) */}
            <TouchableOpacity
              style={[styles.metricCard, { borderColor: 'rgba(244, 63, 94, 0.25)' }]}
              onPress={() => navigation.navigate('TrainerReviews')}
              activeOpacity={0.75}
            >
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconBg, { backgroundColor: '#FFF1F2' }]}>
                  <Icon name="star" size={moderateScale(14)} color="#E11D48" />
                </View>
                <Text style={[styles.metricValue, { color: '#881337' }]}>{coachRating} ★</Text>
              </View>
              <Text style={styles.metricLabel} numberOfLines={1}>Coach Rating</Text>
            </TouchableOpacity>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              3. TODAY'S SCHEDULE
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ScheduleSessions')}>
              <Text style={styles.sectionAction}>Full Schedule →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleList}>
            {displayBookings.length > 0 ? (
              displayBookings.map((b) => (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{b.time}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.memberName}>{b.memberName}</Text>
                    <Text style={styles.focusText}>{b.focus}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.startSessionBtn}
                    onPress={() => Alert.alert('Start Session', `PT Session with ${b.memberName}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startSessionBtnText}>Start</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyScheduleBox}>
                <Icon name="calendar-outline" size={moderateScale(22)} color="#94A3B8" />
                <Text style={styles.emptyScheduleTitle}>No Sessions Scheduled Today</Text>
                <Text style={styles.emptyScheduleSub}>All assigned gym members are up to date.</Text>
              </View>
            )}
          </View>

          {/* ════════════════════════════════════════════════════════════════
              4. QUICK ACTIONS
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickGrid}>
            {/* 1. Assign Workout */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('AssignWorkout')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(108, 92, 231, 0.12)' }]}>
                <Image source={barbellIconImg} style={{ width: 22, height: 22, tintColor: '#6C5CE7' }} resizeMode="contain" />
              </View>
              <Text style={styles.quickTitle}>Assign Workout</Text>
              <Text style={styles.quickSub}>Custom workout routines</Text>
            </TouchableOpacity>

            {/* 2. Assign Diet */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('AssignDiet')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(0, 196, 140, 0.12)' }]}>
                <Image source={healthyIconImg} style={{ width: 22, height: 22, tintColor: '#00C48C' }} resizeMode="contain" />
              </View>
              <Text style={styles.quickTitle}>Assign Diet</Text>
              <Text style={styles.quickSub}>Nutrition & Macro charts</Text>
            </TouchableOpacity>

            {/* 3. Leave Request (Dedicated Screen) */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('TrainerLeaveRequest')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Icon name="calendar-outline" size={moderateScale(22)} color="#EF4444" />
              </View>
              <Text style={styles.quickTitle}>Leave Request</Text>
              <Text style={styles.quickSub}>Apply & track time off</Text>
            </TouchableOpacity>

            {/* 4. Coach Reviews */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('TrainerReviews')}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Icon name="star-outline" size={moderateScale(22)} color="#F59E0B" />
              </View>
              <Text style={styles.quickTitle}>Coach Rating</Text>
              <Text style={styles.quickSub}>Member feedback & reviews</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: hp(4) }} />
        </ScrollView>

        {/* ── HIGH-FIDELITY CHECK-IN & CHECK-OUT POPUP MODAL (SAME AS MEMBER) ── */}
        <CheckInOutModal
          visible={popupModal.visible}
          type={popupModal.type}
          memberName={trainerName}
          gymName={gymName}
          duration={popupModal.duration}
          message={popupModal.message}
          onClose={() => setPopupModal((prev) => ({ ...prev, visible: false }))}
        />

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
  gymTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  headerIconBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    width: moderateScale(15),
    height: moderateScale(15),
    borderRadius: moderateScale(7.5),
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
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
    paddingBottom: hp(4),
  },

  // ── 1. Compact Attendance Bar (Same as Member Dashboard) ──
  compactAttendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  compactAttendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
  },
  liveTimerDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#00C48C',
    marginRight: moderateScale(2),
  },
  compactDigitBox: {
    minWidth: moderateScale(34),
    height: moderateScale(38),
    paddingHorizontal: moderateScale(6),
    backgroundColor: '#F8F7FF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  compactDigitText: {
    fontSize: fontScale(14.5),
    fontWeight: '900',
    color: '#0F172A',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  compactColon: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#A29BFE',
    marginHorizontal: moderateScale(1),
  },
  compactActionBtn: {
    paddingHorizontal: moderateScale(16),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
  },
  compactActionBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Metrics Grid ──
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(1.8),
  },
  metricCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  metricIconBg: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  metricValue: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  metricLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 0,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // ── Section Headers ──
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
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // ── PT Sessions List ──
  scheduleList: {
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  timeBadge: {
    backgroundColor: '#ECEAFD',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  timeBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  memberName: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  focusText: {
    fontSize: fontScale(11),
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
  emptyScheduleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  emptyScheduleTitle: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#334155',
    marginTop: moderateScale(6),
  },
  emptyScheduleSub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  startSessionBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Quick Grid ──
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

  // ── Leave Request Styles ──
  applyLeaveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
  },
  applyLeaveHeaderBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#4F46E5',
  },
  leaveRequestsList: {
    gap: moderateScale(10),
    marginBottom: hp(1.5),
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  leaveTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveDatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  leaveDatesText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#1E293B',
  },
  leaveStatusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  leaveStatusBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '800',
  },
  leaveReasonText: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  leaveNotesText: {
    fontSize: fontScale(11.5),
    color: '#059669',
    marginTop: 4,
  },
  emptyLeaveBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.5),
  },
  emptyLeaveTitle: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#334155',
    marginTop: moderateScale(6),
  },
  emptyLeaveSub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Leave Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  leaveModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitleIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalSubDesc: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginBottom: moderateScale(14),
  },
  inputFieldLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: fontScale(13),
    color: '#0F172A',
  },
  modalTextArea: {
    height: moderateScale(70),
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: moderateScale(10),
    marginTop: moderateScale(18),
  },
  modalCancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(10),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(110),
  },
  modalSubmitBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
