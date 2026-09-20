import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale, Metrics } from '../../theme/responsive';
import {
  getPlanById,
  getWorkoutPlanByMember,
  getDaysRemaining,
  DIET_PLANS,
} from '../../data/mockData';
import { apiService } from '../../services/api';
import { CheckInOutModal } from '../../components/common/CheckInOutModal';

// ── Asset Icons ──
const gymDumbbellImg = require('../../assets/Icons2/gym.png');
const qrIconImg = require('../../assets/Icons2/qr.png');
const calendarIconImg = require('../../assets/Icons2/calendar.png');
const trainerIconImg = require('../../assets/Icons2/user.png');
const nutritionIconImg = require('../../assets/Icons2/healthy.png');
const bodyStatsIconImg = require('../../assets/Icons2/healthy (1).png');
const kettlebellImg = require('../../assets/Icons2/kettlebell.png');
const clockImg = require('../../assets/Icons2/clock.png');
const chartImg = require('../../assets/Icons2/chart.png');
const activeNotifImg = require('../../assets/Icons2/active.png');
const barbellImg = require('../../assets/Icons2/barbell.png');
const payImg = require('../../assets/Icons2/pay.png');

// ── Custom User Icons from src/assets/Icons ──
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const stopwatchIcon = require('../../assets/Icons/stopwatch.png');
const kcalIcon = require('../../assets/Icons/kcal.png');
const thunderIcon = require('../../assets/Icons/thunder-bolt.png');

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

// ── Animated Circular Progress Ring Component ──
function AnimatedProgressRing({ percentage = 75 }: { percentage?: number }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Entrance bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();

    // Smooth continuous orbit rotation
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // Subtle breathing pulse for glowing ring aura
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.progressRingWrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Outer ambient glow pulse aura */}
      <Animated.View
        style={[
          styles.progressGlowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.08],
              outputRange: [0.35, 0.75],
            }),
          },
        ]}
      />

      {/* Rotating orbit ring */}
      <Animated.View
        style={[
          styles.progressOrbitRing,
          { transform: [{ rotate: spinInterpolate }] },
        ]}
      >
        {/* Orbital particle glowing dot */}
        <View style={styles.orbitDot} />
      </Animated.View>

      {/* Center percentage badge */}
      <View style={styles.progressCenterBox}>
        <Text style={styles.progressRingVal}>{percentage}%</Text>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { currentUser, currentMember, currentGym, role } = useAppContext();
  const [liveData, setLiveData] = useState<any>(null);
  const [liveWorkout, setLiveWorkout] = useState<any>(null);
  const [liveWeekOverview, setLiveWeekOverview] = useState<any>(null);
  const [hasAssignedDiet, setHasAssignedDiet] = useState(false);
  const [hasAssignedTrainer, setHasAssignedTrainer] = useState(false);

  // ── Live Gym Check-In / Check-Out Stopwatch Timer ──
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isTodayCompleted, setIsTodayCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastSessionDuration, setLastSessionDuration] = useState<string | null>(null);
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
  const [checkInLoading, setCheckInLoading] = useState(false);

  // ── Full Lifetime & Monthly Attendance History State ──
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>({
    totalVisits: 0,
    thisMonthVisits: 0,
    totalHoursSpent: '0.0 hrs',
    avgTimePerSession: '0m',
  });

  // ── First-Time Member Gym Experience Selection (Shows Only Once) ──
  const [showExpModal, setShowExpModal] = useState(false);
  const [expYears, setExpYears] = useState('0');
  const [expMonths, setExpMonths] = useState('1');
  const [joinDay, setJoinDay] = useState(new Date().getDate().toString().padStart(2, '0'));
  const [joinMonth, setJoinMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [joinYear, setJoinYear] = useState(new Date().getFullYear().toString());

  const totalExpMonths = (parseInt(expYears || '0', 10) * 12) + parseInt(expMonths || '0', 10);
  const isExpBeginner = totalExpMonths < 6;

  const dismissExperienceModal = async () => {
    setShowExpModal(false);
    const ids = [
      currentMember?.id,
      currentUser?.id,
      currentMember?.phone,
      currentUser?.phone,
      'global_member_exp',
    ].filter(Boolean);
    try {
      await Promise.all(ids.map(id => AsyncStorage.setItem(`fitcore_exp_prompt_done_${id}`, 'true')));
    } catch (e) { }
  };

  useEffect(() => {
    const checkExperiencePrompt = async () => {
      try {
        const id = currentMember?.id || currentUser?.id || currentMember?.phone || currentUser?.phone;
        if (!id) return; // Wait until member/user is loaded

        // Check if member already has experience configured
        if (
          (currentMember as any)?.hasSetExperience ||
          (currentMember as any)?.experienceLevel ||
          (currentMember as any)?.experienceYears !== undefined ||
          (currentMember as any)?.experienceMonths !== undefined
        ) {
          setShowExpModal(false);
          await dismissExperienceModal();
          return;
        }

        const keysToCheck = [
          `fitcore_exp_prompt_done_${id}`,
          currentUser?.phone ? `fitcore_exp_prompt_done_${currentUser.phone}` : null,
          currentMember?.phone ? `fitcore_exp_prompt_done_${currentMember.phone}` : null,
          currentMember?.id ? `fitcore_exp_prompt_done_${currentMember.id}` : null,
          currentUser?.id ? `fitcore_exp_prompt_done_${currentUser.id}` : null,
          'fitcore_exp_prompt_done_global_member_exp',
        ].filter(Boolean);

        let alreadyDone = false;
        for (const k of keysToCheck) {
          const val = await AsyncStorage.getItem(k as string);
          if (val === 'true') {
            alreadyDone = true;
            break;
          }
        }

        if (!alreadyDone) {
          setShowExpModal(true);
        } else {
          setShowExpModal(false);
        }
      } catch (err) {
        // fallback
      }
    };
    checkExperiencePrompt();
  }, [currentUser?.id, currentUser?.phone, currentMember?.id, currentMember?.phone]);

  const handleSaveExperience = async () => {
    await dismissExperienceModal();

    const memberId = currentMember?.id || currentUser?.id || currentMember?.phone || currentUser?.phone || 'm1';
    const levelQuery = isExpBeginner ? 'beginner' : 'intermediate';
    const formattedJoinDate = `${joinYear}-${joinMonth.padStart(2, '0')}-${joinDay.padStart(2, '0')}`;

    try {
      // 1. Save to MongoDB database
      await apiService.updateExperience({
        memberId,
        experienceLevel: levelQuery,
        experienceYears: parseInt(expYears || '0', 10),
        experienceMonths: parseInt(expMonths || '0', 10),
        joinedDate: formattedJoinDate,
      });

      // 2. Fetch fresh workout plan tailored to this experience level
      const res: any = await apiService.getMemberWorkout(memberId, undefined, levelQuery);
      if (res.success && res.data) {
        setLiveWorkout(res.data);
      }
    } catch (e) {
      console.log('Error updating workout plan:', e);
    }
  };

  const fetchLiveMemberData = async () => {
    try {
      const memberId = String(currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1');
      if (!memberId) return;

      const [profileRes, workoutRes, attendanceRes, dietRes]: any[] = await Promise.all([
        apiService.getMemberProfile(memberId),
        apiService.getMemberWorkout(memberId),
        apiService.getAttendanceHistory(memberId),
        apiService.getMemberDiet(memberId).catch(() => ({ success: false, data: null })),
      ]);

      if (dietRes?.success && (dietRes?.hasDietPlan === true || (dietRes?.data && !String(dietRes?.data?.id).startsWith('default')))) {
        setHasAssignedDiet(true);
      } else {
        const localAssigned = DIET_PLANS.find(dp => (dp as any).memberId === memberId || (dp as any).memberId === currentMember?.id);
        setHasAssignedDiet(Boolean(localAssigned));
      }

      if (profileRes.success && profileRes.data) {
        setLiveData(profileRes.data);
        setHasAssignedTrainer(Boolean(
          profileRes.data.hasAssignedTrainer ||
          profileRes.data.trainer ||
          profileRes.data.member?.trainerId ||
          profileRes.data.member?.assignedTrainerId
        ));
        const mem: any = (profileRes.data as any)?.member;
        if (mem) {
          if (mem.experienceYears !== undefined) setExpYears(String(mem.experienceYears));
          if (mem.experienceMonths !== undefined) setExpMonths(String(mem.experienceMonths));
          if (mem.joinDate) {
            const parts = String(mem.joinDate).split('-');
            if (parts.length === 3) {
              setJoinYear(parts[0]);
              setJoinMonth(parts[1]);
              setJoinDay(parts[2]);
            }
          }
          if (mem.hasSetExperience || mem.experienceLevel || mem.experienceYears !== undefined) {
            const ids = [mem.id, mem.userId, mem.phone, currentMember?.id, currentUser?.id].filter(Boolean);
            ids.forEach(id => AsyncStorage.setItem(`fitcore_exp_prompt_done_${id}`, 'true').catch(() => { }));
            setShowExpModal(false);
          }
        }
      }
      if (workoutRes.success && workoutRes.data) {
        setLiveWorkout(workoutRes.data);
      }
      if (attendanceRes?.success && attendanceRes?.data) {
        const attData: any = attendanceRes.data;
        if (attData?.weekOverview) {
          setLiveWeekOverview(attData.weekOverview);
        }
        if (attData?.records) {
          setAttendanceRecords(attData.records);
        }
        setAttendanceSummary({
          totalVisits: attData?.totalVisits ?? attData?.records?.length ?? 0,
          thisMonthVisits: attData?.thisMonthVisits ?? 0,
          totalHoursSpent: attData?.totalHoursSpent ?? '0.0 hrs',
          avgTimePerSession: attData?.avgTimePerSession ?? '0m',
        });
        const todaySession = attData?.todaySession || {};
        const inGym = Boolean(todaySession?.isCheckedIn);
        setIsCheckedIn(inGym);
        if (inGym) {
          // Resumes seamlessly from earlier checkout time on the same day
          setElapsedSeconds(Number(todaySession?.todayTotalSeconds || todaySession?.currentSessionSeconds || 0));
        } else {
          setElapsedSeconds(Number(todaySession?.todayCompletedSeconds || 0));
        }
        if (todaySession?.todayDurationFormatted) {
          setLastSessionDuration(todaySession.todayDurationFormatted);
        }
      }
    } catch (err) {
      console.log('Using local fallback state for Dashboard');
    }
  };

  useEffect(() => {
    fetchLiveMemberData();
  }, [currentUser?.id, currentMember?.id, isFocused]);

  const plan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const fallbackWorkoutPlan = currentMember ? getWorkoutPlanByMember(currentMember.id) : undefined;
  const daysLeft = liveData?.member?.daysRemaining !== undefined
    ? liveData.member.daysRemaining
    : (currentMember?.expiryDate ? getDaysRemaining(currentMember.expiryDate) : 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayWorkout =
    liveWorkout?.days?.find((d: any) =>
      d?.day?.toLowerCase() === today.toLowerCase() ||
      d?.dayName?.toLowerCase()?.startsWith(today.toLowerCase())
    ) ||
    fallbackWorkoutPlan?.days?.find((d: any) => d?.day?.toLowerCase() === today.toLowerCase()) ||
    liveWorkout?.days?.[0];

  const firstName = liveData?.member?.name?.split(' ')[0] || currentMember?.name?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'Member';
  const gymName = liveData?.gym?.name || (currentMember as any)?.gymName || currentGym?.name || '';
  const planName = liveData?.plan?.name || liveData?.member?.planName || (currentMember as any)?.planName || 'Active Pass';

  const userRoleLabel =
    (currentUser?.role || role) === 'trainer'
      ? 'Trainer'
      : (currentUser?.role || role) === 'owner'
        ? 'Gym Owner'
        : (currentUser?.role || role) === 'vendor'
          ? 'Vendor'
          : 'Member';

  // Clean workout title so that if it contains & or + or emoji, it formats cleanly
  const rawFocus = todayWorkout?.focus || todayWorkout?.dayName || 'Chest';
  const cleanFocus = rawFocus
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
  const workoutTitle = cleanFocus;

  // ── Option 2 Split Day & Routine Calculations ──
  const dayIndexMap: Record<string, { num: string; text: string; splitNum: string }> = {
    sunday: { num: 'Rest', text: 'Rest & Recovery', splitNum: 'Rest' },
    monday: { num: 'Day 1', text: 'Day 1 of 6', splitNum: '1 / 6' },
    tuesday: { num: 'Day 2', text: 'Day 2 of 6', splitNum: '2 / 6' },
    wednesday: { num: 'Day 3', text: 'Day 3 of 6', splitNum: '3 / 6' },
    thursday: { num: 'Day 4', text: 'Day 4 of 6', splitNum: '4 / 6' },
    friday: { num: 'Day 5', text: 'Day 5 of 6', splitNum: '5 / 6' },
    saturday: { num: 'Day 6', text: 'Day 6 of 6', splitNum: '6 / 6' },
  };
  const dayInfo = dayIndexMap[today.toLowerCase()] || { num: 'Day 1', text: 'Day 1 of 6', splitNum: '1 / 6' };
  const splitDayNum = todayWorkout?.splitDay || dayInfo.splitNum;
  const splitDayText = todayWorkout?.splitDay || dayInfo.text;
  const workoutDuration = todayWorkout?.durationMin ? `${todayWorkout.durationMin}m` : '45m';

  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  const handleToggleCheckIn = async () => {
    const memberId = currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1';
    const gymId = currentUser?.gymId || currentGym?.id || liveData?.gym?.id || liveData?.member?.gymId;
    const memberName = currentUser?.name || currentMember?.name || liveData?.member?.name || 'Member';
    const memberPhone = currentUser?.phone || currentMember?.phone || liveData?.member?.phone || '';

    if (!isCheckedIn) {
      // 1. Instant UI Feedback (0ms)
      setIsCheckedIn(true);
      setPopupModal({
        visible: true,
        type: 'checkin',
        message: `Welcome ${memberName}! Session tracking active. Have an awesome workout!`,
      });

      // 2. Background Sync
      apiService.checkIn(
        memberId,
        gymId,
        'dashboard_button',
        memberName,
        memberPhone
      ).then(() => fetchLiveMemberData()).catch((e) => console.log('Check-in sync:', e));
    } else {
      // 1. Instant UI Feedback (0ms)
      setIsCheckedIn(false);
      const durationStr = `${Math.max(1, Math.floor(elapsedSeconds / 60))} min`;
      setLastSessionDuration(durationStr);
      setPopupModal({
        visible: true,
        type: 'checkout',
        duration: durationStr,
        message: `You spent ${durationStr} training today. Outstanding effort!`,
      });

      // 2. Background Sync
      apiService.checkOut(memberId, memberPhone)
        .then((res: any) => {
          if (res?.data?.durationFormatted) {
            setLastSessionDuration(res.data.durationFormatted);
          }
          fetchLiveMemberData();
        })
        .catch((e) => console.log('Check-out sync:', e));
    }
  };

  // ── Micro-Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // Subtle breathing pulse animation for CTA button
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    );
    pulseLoop.start();

    // Shimmer effect animation
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── AMBIENT BACKGROUND GLOW PARTICLES ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP NAV BAR ── */}
        <View style={styles.topNav}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitleFit}>
              Fit<Text style={styles.brandTitleCore}>Core</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <Image
                source={activeNotifImg}
                style={{ width: moderateScale(22), height: moderateScale(22) }}
                resizeMode="contain"
              />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {currentUser?.avatar ?? 'AM'}
              </Text>
              <View style={styles.avatarOnlineDot} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >

            {/* ── ATTENDANCE CHECK-IN / CHECK-OUT HERO CARD ── */}
            <View style={styles.compactAttendanceCard}>
              <View style={styles.compactAttendanceRow}>
                {/* Timer Digits & QR Pass link */}
                <TouchableOpacity
                  style={styles.compactClockRow}
                  onPress={() => navigation.navigate('Check-In')}
                  activeOpacity={0.75}
                >
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
                  <View style={styles.qrPassMiniBtn}>
                    <Image
                      source={qrIconImg}
                      style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#6C5CE7' }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* Prominent Check-In / Check-Out Button */}
                <TouchableOpacity
                  style={[
                    styles.compactActionBtn,
                    {
                      backgroundColor: isCheckedIn ? '#EF4444' : '#059669',
                      shadowColor: isCheckedIn ? '#EF4444' : '#059669',
                    },
                  ]}
                  onPress={handleToggleCheckIn}
                  disabled={checkInLoading}
                  activeOpacity={0.85}
                >
                  {checkInLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.actionBtnInnerRow}>
                      <Icon
                        name={isCheckedIn ? 'log-out-outline' : 'checkmark-circle-outline'}
                        size={moderateScale(16)}
                        color="#FFFFFF"
                      />
                      <Text style={styles.compactActionBtnText}>
                        {isCheckedIn ? 'Check Out' : 'Check In'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 1. TODAY'S WORKOUT CARD ── */}
            {/* ── 2. TODAY'S WORKOUT HEADER WITH EXPERIENCE PILL ── */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(8) }}>
                <Text style={styles.sectionTitleText}>Today's Workout</Text>
                <TouchableOpacity
                  style={styles.expLevelPill}
                  onPress={() => setShowExpModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.expLevelPillInner}>
                    <View
                      style={[
                        styles.expLevelDot,
                        { backgroundColor: isExpBeginner ? '#10B981' : '#3B82F6' },
                      ]}
                    />
                    <Text style={styles.expLevelPillText}>
                      {isExpBeginner ? 'Beginner' : 'Intermediate'}
                    </Text>
                    <Icon name="chevron-down" size={moderateScale(11)} color="#4F46E5" style={{ marginLeft: 2 }} />
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Workout')}>
                <Text style={styles.sectionLinkText}>View all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.workoutCard}
              onPress={() => navigation.navigate('Workout')}
              activeOpacity={0.88}
            >
              {/* Top Hero Section: Title + Focus Badge */}
              <View style={styles.workoutTopRow}>
                <View style={{ flex: 1, paddingRight: moderateScale(12) }}>
                  <View style={styles.workoutSplitBadge}>
                    <Text style={styles.workoutSplitBadgeText}>{today.toUpperCase()} FOCUS</Text>
                  </View>

                  <Text style={styles.workoutTitleText}>{workoutTitle}</Text>
                  <Text style={styles.workoutSubText}>Hypertrophy & Strength Split</Text>
                </View>

                {/* Split Day Badge */}
                <View style={styles.todaySplitBadge}>
                  <Text style={styles.todaySplitBadgeNumber}>{splitDayNum}</Text>
                  <Text style={styles.todaySplitBadgeLabel}>Weekly Split</Text>
                </View>
              </View>

              {/* Middle Section: Dedicated 3-Column Stat Island (Option 2) */}
              <View style={styles.statIslandContainer}>
                {/* Column 1: Split Day */}
                <View style={styles.statIslandCol}>
                  <View style={styles.statIconValRow}>
                    <Image
                      source={barbellImg}
                      style={{ width: moderateScale(15), height: moderateScale(15), tintColor: '#6C5CE7' }}
                      resizeMode="contain"
                    />
                    <Text style={styles.statIslandVal}>{splitDayNum}</Text>
                  </View>
                  <Text style={styles.statIslandLbl}>Split Day</Text>
                </View>

                <View style={styles.statDivider} />

                {/* Column 2: Duration */}
                <View style={styles.statIslandCol}>
                  <View style={styles.statIconValRow}>
                    <Image
                      source={stopwatchIcon}
                      style={{ width: moderateScale(15), height: moderateScale(15) }}
                      resizeMode="contain"
                    />
                    <Text style={styles.statIslandVal}>{workoutDuration}</Text>
                  </View>
                  <Text style={styles.statIslandLbl}>Est. Time</Text>
                </View>

                <View style={styles.statDivider} />

                {/* Column 3: Workout Session Status */}
                <View style={styles.statIslandCol}>
                  <View style={styles.statIconValRow}>
                    <Image
                      source={isCheckedIn ? activeNotifImg : kettlebellImg}
                      style={{ width: moderateScale(15), height: moderateScale(15), tintColor: isCheckedIn ? '#10B981' : '#6C5CE7' }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.statIslandVal, { color: isCheckedIn ? '#10B981' : '#0F172A', fontSize: fontScale(13.5) }]}>
                      {isCheckedIn ? 'Active' : 'Ready'}
                    </Text>
                    {isCheckedIn && (
                      <Icon name="flame" size={moderateScale(13)} color="#F97316" style={{ marginLeft: 2 }} />
                    )}
                  </View>
                  <Text style={styles.statIslandLbl}>Status</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* ── 4. THIS WEEK OVERVIEW ── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitleText}>This Week Overview</Text>
              </View>
              <TouchableOpacity
                style={styles.viewHistoryBtn}
                onPress={() => navigation.navigate('AttendanceHistory')}
                activeOpacity={0.7}
              >
                <Image
                  source={calendarIconImg}
                  style={{ width: moderateScale(13), height: moderateScale(13), tintColor: '#6C5CE7', marginRight: moderateScale(4) }}
                  resizeMode="contain"
                />
                <Text style={styles.viewHistoryBtnText}>View All History</Text>
                <Icon name="chevron-forward" size={moderateScale(13)} color="#6C5CE7" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.weekOverviewCard}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('AttendanceHistory')}
            >
              {/* 1. 7-Day Visual Attendance & Workout Split Strip */}
              <View style={styles.weekDaysStrip}>
                {(liveWeekOverview?.days || [
                  { day: 'Mon', focus: 'Chest', done: true },
                  { day: 'Tue', focus: 'Triceps', done: true },
                  { day: 'Wed', focus: 'Back', done: true },
                  { day: 'Thu', focus: 'Biceps', done: true },
                  { day: 'Fri', focus: 'Shoulders', done: true },
                  { day: 'Sat', focus: 'Legs', done: false },
                  { day: 'Sun', focus: 'Full Body', done: false },
                ]).map((item: any, idx: number) => {
                  const todayShortName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                  const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const todayIdx = daysOrder.indexOf(todayShortName);
                  const itemIdx = daysOrder.indexOf(item.day);
                  const isCurrentDay = item.isToday !== undefined ? Boolean(item.isToday) : itemIdx === todayIdx;
                  const isFutureDate = item.isFuture !== undefined ? Boolean(item.isFuture) : itemIdx > todayIdx;
                  const isCompleted = isCurrentDay
                    ? Boolean(isCheckedIn || item.attended || elapsedSeconds > 0)
                    : Boolean(item.attended || item.done);
                  const isPastMissed = !isCurrentDay && !isFutureDate && !isCompleted;

                  return (
                    <View key={idx} style={[styles.weekDayCol, isCurrentDay && styles.weekDayColToday]}>
                      <Text style={[styles.weekDayLabel, isCurrentDay && styles.weekDayLabelToday]}>
                        {item.day}
                      </Text>

                      {/* Status Circle / Badge with Vector Icons */}
                      <View
                        style={[
                          styles.weekStatusCircle,
                          isCompleted && styles.weekStatusDone,
                          isCurrentDay && !isCompleted && styles.weekStatusToday,
                          isPastMissed && styles.weekStatusAbsent,
                          isFutureDate && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                        ]}
                      >
                        {isCompleted ? (
                          <Icon name="checkmark-sharp" size={moderateScale(12)} color="#FFFFFF" />
                        ) : isPastMissed ? (
                          <Icon name="close-sharp" size={moderateScale(12)} color="#EF4444" />
                        ) : isFutureDate ? (
                          <View style={styles.weekPendingDot} />
                        ) : (
                          <View style={[styles.weekPendingDot, styles.weekTodayDot]} />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.weekFocusText,
                          isCompleted && { color: '#00C48C', fontWeight: '800' },
                          isCurrentDay && !isCompleted && styles.weekFocusTextToday,
                          isPastMissed && { color: '#EF4444', fontWeight: '700' },
                          isFutureDate && { color: '#94A3B8' },
                        ]}
                      >
                        {isCompleted ? 'Done' : isPastMissed ? 'Absent' : isCurrentDay ? 'Today' : 'Gym'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Dynamic Weekly Goal Progress Banner */}
              <View style={[styles.weekGoalBox, { marginTop: hp(1.4) }]}>
                <View style={styles.weekGoalHeader}>
                  <Text style={styles.weekGoalTitle}>
                    WEEKLY ATTENDANCE ({Math.min(100, Math.round(((liveWeekOverview?.daysAttended || 0) / (liveWeekOverview?.targetDays || 6)) * 100))}%)
                  </Text>
                  <Text style={styles.weekGoalRemaining}>
                    {Math.max(0, (liveWeekOverview?.targetDays || 6) - (liveWeekOverview?.daysAttended || 0)) > 0
                      ? `${Math.max(0, (liveWeekOverview?.targetDays || 6) - (liveWeekOverview?.daysAttended || 0))} Session(s) Left`
                      : 'Target Reached!'}
                  </Text>
                </View>
                <View style={styles.weekGoalTrack}>
                  <View
                    style={[
                      styles.weekGoalFill,
                      {
                        width: `${Math.min(100, Math.round(((liveWeekOverview?.daysAttended || 0) / (liveWeekOverview?.targetDays || 6)) * 100))}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Tap to View Details Bar */}
              <View style={[styles.attTapHintRow, { marginTop: hp(1.2) }]}>
                <Text style={styles.attTapHintText}>Tap to view full attendance history & dates</Text>
                <Icon name="arrow-forward" size={moderateScale(12)} color="#6C5CE7" />
              </View>
            </TouchableOpacity>

            {/* ── 5. MEMBER QUICK ACCESS SERVICES & SCREENS GRID ── */}
            <View style={[styles.sectionHeaderRow, { marginTop: hp(1) }]}>
              <View>
                <Text style={styles.sectionTitleText}>Member Quick Access</Text>
              </View>
            </View>

            <View style={styles.quickAccessGrid}>
              {/* 1. Nutrition & Diet - Visible only if assigned by trainer */}
              {hasAssignedDiet && (
                <AnimatedPressable
                  style={styles.quickAccessCard}
                  onPress={() => navigation.navigate('Diet')}
                >
                  <View style={[styles.quickAccessIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Image
                      source={nutritionIconImg}
                      style={[styles.quickAccessIcon, { tintColor: '#059669' }]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.quickAccessTitle} numberOfLines={1}>Diet Plan</Text>
                  <Text style={styles.quickAccessSub} numberOfLines={1}>Macro Targets</Text>
                </AnimatedPressable>
              )}

              {/* 4. Body Metrics */}
              <AnimatedPressable
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Progress')}
              >
                <View style={[styles.quickAccessIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Image
                    source={bodyStatsIconImg}
                    style={[styles.quickAccessIcon, { tintColor: '#2563EB' }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessTitle} numberOfLines={1}>Body Stats</Text>
                <Text style={styles.quickAccessSub} numberOfLines={1}>BMI & Weight</Text>
              </AnimatedPressable>

              {/* 5. Assigned Trainer (Shows ONLY if assigned to member) */}
              {hasAssignedTrainer && (
                <AnimatedPressable
                  style={styles.quickAccessCard}
                  onPress={() => navigation.navigate('Trainer')}
                >
                  <View style={[styles.quickAccessIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Image
                      source={trainerIconImg}
                      style={[styles.quickAccessIcon, { tintColor: '#D97706' }]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.quickAccessTitle} numberOfLines={1}>My Trainer</Text>
                  <Text style={styles.quickAccessSub} numberOfLines={1}>Direct Guidance</Text>
                </AnimatedPressable>
              )}

              {/* 6. Membership & Invoices */}
              <AnimatedPressable
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Membership')}
              >
                <View style={[styles.quickAccessIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <Image
                    source={payImg}
                    style={[styles.quickAccessIcon, { tintColor: '#EC4899' }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessTitle} numberOfLines={1}>Membership</Text>
                <Text style={styles.quickAccessSub} numberOfLines={1}>Plan & Invoices</Text>
              </AnimatedPressable>

              {/* 8. Supplement Store */}
              <AnimatedPressable
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('StoreTab')}
              >
                <View style={[styles.quickAccessIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Image
                    source={kettlebellImg}
                    style={[styles.quickAccessIcon, { tintColor: '#EA580C' }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.quickAccessTitle} numberOfLines={1}>FitStore</Text>
                <Text style={styles.quickAccessSub} numberOfLines={1}>Whey & Gear</Text>
              </AnimatedPressable>
            </View>

          </Animated.View>

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── GYM EXPERIENCE SELECTION MODAL (DAY / MONTH / YEAR & LEVELS) ── */}
        <Modal
          visible={showExpModal}
          transparent
          animationType="fade"
          onRequestClose={dismissExperienceModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(8) }}>
                  <View style={styles.modalHeaderIconBox}>
                    <Image
                      source={barbellImg}
                      style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#6C5CE7' }}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Gym Experience</Text>
                    <Text style={styles.modalSubtitle}>How long have you been working out?</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={dismissExperienceModal}
                >
                  <Icon name="close" size={moderateScale(18)} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* 1. Direct Typing: Workout Experience (Month & Year) */}
              <View style={styles.dateSectionBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="time-outline" size={moderateScale(15)} color="#6C5CE7" />
                  <Text style={styles.dateSectionLabel}>HOW LONG HAVE YOU BEEN WORKING OUT?</Text>
                </View>
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateColLbl}>Years</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={expYears}
                      onChangeText={setExpYears}
                      placeholder="0"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateColLbl}>Months</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={expMonths}
                      onChangeText={setExpMonths}
                      placeholder="0"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              {/* Date Joined Inputs: Day / Month / Year */}
              <View style={styles.dateSectionBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="calendar-outline" size={moderateScale(15)} color="#6C5CE7" />
                  <Text style={styles.dateSectionLabel}>GYM JOINED DATE</Text>
                </View>
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateColLbl}>Day</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={joinDay}
                      onChangeText={setJoinDay}
                      placeholder="DD"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.dateSlash}>/</Text>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateColLbl}>Month</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={joinMonth}
                      onChangeText={setJoinMonth}
                      placeholder="MM"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.dateSlash}>/</Text>
                  <View style={[styles.dateCol, { flex: 1.3 }]}>
                    <Text style={styles.dateColLbl}>Year</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={joinYear}
                      onChangeText={setJoinYear}
                      placeholder="YYYY"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>

              {/* Confirm CTA */}
              <TouchableOpacity
                style={styles.confirmExpBtn}
                onPress={handleSaveExperience}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmExpBtnText}>Save & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── HIGH-FIDELITY CHECK-IN & CHECK-OUT POPUP MODAL ── */}
        <CheckInOutModal
          visible={popupModal.visible}
          type={popupModal.type}
          memberName={firstName}
          gymName={gymName || 'FitCore Gym'}
          duration={popupModal.duration || lastSessionDuration || `${Math.max(1, Math.floor(elapsedSeconds / 60))} min`}
          message={popupModal.message}
          timeStr={popupModal.timeStr}
          onClose={() => setPopupModal(prev => ({ ...prev, visible: false }))}
        />
      </View>
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

  // ── Ambient Background Glows ──
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

  // ── Top Navigation Bar ──
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    backgroundColor: 'transparent',
  },
  menuBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFit: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  brandTitleCore: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  headerIconBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#6C5CE7',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.8),
  },

  // ── Greeting ──
  greetingContainer: {
    marginBottom: hp(1.8),
  },
  greeting: {
    fontSize: fontScale(23),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subGreeting: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── 1. MEMBERSHIP CARD ──
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  membershipTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  membershipInfoCol: {
    flex: 1,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
    marginBottom: hp(1),
  },
  membershipActiveText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  gymNameText: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  planDurationText: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  dumbbellContainer: {
    width: moderateScale(80),
    height: moderateScale(65),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dumbbellImage: {
    width: '100%',
    height: '100%',
  },
  membershipBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginTop: hp(1.5),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#F3F2FE',
  },
  progressBarTrack: {
    flex: 1,
    height: moderateScale(5.5),
    backgroundColor: '#F3F2FE',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(3),
  },
  daysLeftBox: {
    alignItems: 'flex-end',
  },
  daysLeftNumber: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#6C5CE7',
    lineHeight: fontScale(19),
  },
  daysLeftSub: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Attendance Check-In / Check-Out Hero Card ──
  compactAttendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: hp(2),
    borderWidth: 1.2,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
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
    gap: moderateScale(2.5),
  },
  liveTimerDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#00C48C',
    marginRight: moderateScale(2),
  },
  compactDigitBox: {
    width: moderateScale(36),
    height: moderateScale(40),
    backgroundColor: '#F8F7FF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  compactDigitText: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  compactColon: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#A29BFE',
  },
  qrPassMiniBtn: {
    width: moderateScale(34),
    height: moderateScale(40),
    backgroundColor: '#F3F0FF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(3),
    borderWidth: 1,
    borderColor: '#E0DBFC',
  },
  compactActionBtn: {
    paddingHorizontal: moderateScale(14),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(6),
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  actionBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  compactActionBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Section Header ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
  },
  sectionTitleText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  sectionLinkText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // ── 2. TODAY'S WORKOUT CARD ──
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  workoutTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  workoutTitleText: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  workoutSubText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  workoutSplitBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    marginBottom: hp(0.6),
  },
  workoutSplitBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  statIslandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  statIslandCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  statIslandVal: {
    fontSize: fontScale(15.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  statIslandLbl: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: moderateScale(26),
    backgroundColor: '#E2E8F0',
  },
  progressRingWrapper: {
    width: moderateScale(58),
    height: moderateScale(58),
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGlowRing: {
    position: 'absolute',
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: 'rgba(108, 92, 231, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 92, 231, 0.30)',
  },
  progressOrbitRing: {
    position: 'absolute',
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: '#6C5CE7',
    borderRightColor: '#6C5CE7',
    borderBottomColor: '#A29BFE',
  },
  orbitDot: {
    position: 'absolute',
    top: -moderateScale(2.5),
    right: moderateScale(6),
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#6C5CE7',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  progressCenterBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  progressRingVal: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  todaySplitBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F0FF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  todaySplitBadgeNumber: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#6C5CE7',
    lineHeight: fontScale(18),
    textAlign: 'center',
  },
  todaySplitBadgeLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },

  // ── 3. QUICK ACTIONS ──
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  quickActionCard: {
    width: (wp(90) - moderateScale(27)) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickActionIconBg: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(7),
  },
  actionIconImage: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  quickActionLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    includeFontPadding: false,
  },

  // ── 4. THIS WEEK OVERVIEW ──
  weekOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(16),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  weekDaysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(2),
  },
  weekDayCol: {
    alignItems: 'center',
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  weekDayColToday: {
    backgroundColor: '#F5F3FF',
  },
  weekDayLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  weekDayLabelToday: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  weekStatusCircle: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  weekStatusDone: {
    backgroundColor: '#00C48C',
  },
  weekStatusAbsent: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  weekAbsentText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#EF4444',
  },
  weekStatusRest: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekStatusToday: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
    backgroundColor: '#FFFFFF',
  },
  weekCheckText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  weekRestDash: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#94A3B8',
  },
  weekPendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  weekTodayDot: {
    backgroundColor: '#6C5CE7',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekFocusText: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '600',
  },
  weekFocusTextToday: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  weekCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(12),
  },
  weekStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  weekStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(2),
  },
  weekStatIconBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(108, 92, 231, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  weekStatTextWrap: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  weekStatValue: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: fontScale(16),
  },
  weekStatTarget: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    fontWeight: '600',
  },
  weekStatLabel: {
    fontSize: fontScale(8.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  weekStatDivider: {
    width: 1,
    height: moderateScale(24),
    backgroundColor: '#F1F5F9',
    marginHorizontal: moderateScale(3),
  },

  weekGoalBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginTop: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  weekGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weekGoalTitle: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  weekGoalRemaining: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#7E22CE',
  },
  weekGoalTrack: {
    height: 5,
    backgroundColor: '#E9D5FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weekGoalFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },

  // ── 5. PROGRESS CARD ──
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(16),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  progTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  progSubLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  progMainWeight: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  progUnitText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  progLossBadge: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  progLossBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#00A86B',
  },
  progGoalRight: {
    alignItems: 'flex-end',
  },
  progGoalPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    marginBottom: 3,
  },
  progGoalPillText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#334155',
  },
  progGoalRemaining: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  progTrackSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  progTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progTrackMilestone: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '700',
  },
  progTrackBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progTrackFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
  },
  progTrackSubtitle: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
    textAlign: 'center',
  },
  progMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: moderateScale(4),
  },
  progMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  progMetricLbl: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  progMetricVal: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  progMetricTrendGood: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#00A86B',
  },
  progMetricStatusTag: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#6C5CE7',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(6),
    paddingVertical: 1,
    borderRadius: moderateScale(4),
  },
  progMetricDivider: {
    width: 1,
    height: moderateScale(30),
    backgroundColor: '#F1F5F9',
  },

  // ── 6. NEW MOTIVATIONAL / TROPHY BANNER ──
  trophyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#F3E8FF',
    elevation: 3,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  trophyBannerLeft: {
    flex: 1,
    paddingRight: moderateScale(10),
  },
  trophyBannerTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#6B21A8',
  },
  trophyBannerSub: {
    fontSize: fontScale(11.5),
    color: '#7E22CE',
    marginTop: 2,
    marginBottom: moderateScale(10),
  },
  trophyTrack: {
    height: moderateScale(6),
    backgroundColor: '#E9D5FF',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  trophyFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: moderateScale(3),
  },
  trophyIconBox: {
    width: moderateScale(50),
    height: moderateScale(50),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Experience Pill & Modal Styles ──
  expLevelPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  expLevelPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expLevelDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  expLevelPillText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#4F46E5',
  },
  modalHeaderIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  autoPlanPreview: {
    marginTop: hp(1),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoPlanBeg: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  autoPlanInt: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  autoPlanText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
  },
  autoPlanTextBeg: {
    color: '#16A34A',
  },
  autoPlanTextInt: {
    color: '#2563EB',
  },
  dateSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateSectionLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: hp(0.8),
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(6),
  },
  dateCol: {
    flex: 1,
  },
  dateColLbl: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 2,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  dateSlash: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: moderateScale(14),
  },
  confirmExpBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  confirmExpBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Member Quick Access Grid ──
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(10),
    marginTop: hp(0.5),
    marginBottom: hp(1.5),
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  quickAccessIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  quickAccessIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  quickAccessTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  quickAccessSub: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },

  // ── This Week Overview Header & Quick Summary Styles ──
  viewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  viewHistoryBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
    marginRight: 2,
  },
  attQuickSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    marginTop: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attQuickCol: {
    flex: 1,
    alignItems: 'center',
  },
  attQuickVal: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  attQuickUnit: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#64748B',
  },
  attQuickLabel: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  attQuickDivider: {
    width: 1,
    height: moderateScale(24),
    backgroundColor: '#E2E8F0',
  },
  attTapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    marginTop: hp(0.8),
  },
  attTapHintText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // ── Full Attendance History Modal & Sheet ──
  attModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  attModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.5),
    maxHeight: hp(85),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  attModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  attModalTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  attModalSubtitle: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  attStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(8),
    marginVertical: hp(1.5),
  },
  attStatCard: {
    width: '48.5%',
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    borderWidth: 1,
  },
  attStatIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    marginBottom: 4,
  },
  attStatCardTitle: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  attStatCardVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  attStatCardUnit: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  attStatCardSub: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  attFilterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
    padding: moderateScale(3),
    marginBottom: hp(1.5),
  },
  attFilterTab: {
    flex: 1,
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  attFilterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  attFilterTabText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  attFilterTabTextActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  attLogsScroll: {
    maxHeight: hp(46),
  },
  attEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
  },
  attEmptyTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#334155',
    marginTop: hp(1.2),
  },
  attEmptySub: {
    fontSize: fontScale(11.5),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: hp(0.5),
    lineHeight: 18,
  },
  attRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(10),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  attRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  attRecordDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  attRecordDateText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  attStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: moderateScale(3),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  attStatusPillDone: {
    backgroundColor: '#ECFDF5',
  },
  attStatusPillLive: {
    backgroundColor: '#EEF2FF',
  },
  attStatusPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  attRecordDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  attTimeCol: {
    alignItems: 'center',
  },
  attTimeLbl: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  attTimeVal: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
  },
  attTimeValHighlight: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
});
