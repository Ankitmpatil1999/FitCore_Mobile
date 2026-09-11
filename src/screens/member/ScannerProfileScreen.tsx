import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { getPlanById, getDaysRemaining } from '../../data/mockData';
import { apiService } from '../../services/api';

const qrAssetImg = require('../../assets/Icons2/qr.png');
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const clockImg = require('../../assets/Icons2/clock.png');

export default function CheckInScreen({ navigation }: any) {
  const { currentMember, currentUser, currentGym } = useAppContext();
  const plan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const daysLeft = currentMember ? getDaysRemaining(currentMember.expiryDate) : 149;

  const [activeTab, setActiveTab] = useState<'qr' | 'history'>('qr');
  const [qrToken, setQrToken] = useState<string>('FITCORE_PASS:LIVE_TOKEN');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live Attendance State
  const [attendanceData, setAttendanceData] = useState<any>({
    records: [],
    totalVisits: 0,
    thisMonthVisits: 0,
    totalHoursSpent: '0.0 hrs',
    avgTimeFormatted: '0m',
    currentStreakDays: 0,
    todaySession: {
      isCheckedIn: false,
      isCheckedOut: false,
      checkInFormatted: null,
      checkOutFormatted: null,
      durationFormatted: null,
      durationMinutes: 0,
    },
  });

  // Elapsed Live Timer for Active Check-In
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Fetch QR Token ──
  useEffect(() => {
    let timer: any = null;
    const fetchQR = async () => {
      try {
        const memberId = currentMember?.id || currentUser?.id;
        const res: any = await apiService.getMemberQRPass(memberId);
        if (res.success && res.data?.qrCode) {
          setQrToken(res.data.qrCode);
          setRefreshCountdown(60);
        }
      } catch (e) {
        setQrToken(`FITCORE:${currentMember?.id || 'MEMBER'}:${Date.now()}`);
      }
    };

    fetchQR();
    const interval = setInterval(fetchQR, 60000);
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [currentMember?.id, currentUser?.id]);

  // ── Fetch Attendance & Time Spent History ──
  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      const memberId = currentMember?.id || currentUser?.id;
      if (memberId) {
        const res: any = await apiService.getAttendanceHistory(memberId);
        if (res.success && res.data) {
          setAttendanceData(res.data);
        }
      }
    } catch (e) {
      console.log('Error loading attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceHistory();
  }, [currentMember?.id, currentUser?.id]);

  // ── Live Counter if in Gym ──
  useEffect(() => {
    let interval: any = null;
    if (attendanceData.todaySession?.isCheckedIn && !attendanceData.todaySession?.isCheckedOut) {
      interval = setInterval(() => {
        setLiveElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attendanceData.todaySession?.isCheckedIn, attendanceData.todaySession?.isCheckedOut]);

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

  // ── Handle Check-In ──
  const handleCheckIn = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const memberId = currentMember?.id || currentUser?.id || 'm1';
      const gymId = currentGym?.id || '65123456789abcdef0123456';
      const res: any = await apiService.checkIn(memberId, gymId, 'qr_code');

      if (res.success) {
        await loadAttendanceHistory();
      }
    } catch (err: any) {
      console.log('Check-in error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Handle Check-Out ──
  const handleCheckOut = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const memberId = currentMember?.id || currentUser?.id || 'm1';
      const res: any = await apiService.checkOut(memberId);

      if (res.success) {
        await loadAttendanceHistory();
      }
    } catch (err: any) {
      console.log('Check-out error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const isCurrentlyInGym =
    attendanceData.todaySession?.isCheckedIn && !attendanceData.todaySession?.isCheckedOut;
  const isCompletedToday =
    attendanceData.todaySession?.isCheckedIn && attendanceData.todaySession?.isCheckedOut;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Digital Gym Pass</Text>
            <Text style={styles.headerSub}>Check-In • Check-Out • Time Spent</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadAttendanceHistory}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6C5CE7" />
            ) : (
              <Icon name="refresh" size={moderateScale(18)} color="#6C5CE7" />
            )}
          </TouchableOpacity>
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'qr' && styles.tabBtnActive]}
            onPress={() => setActiveTab('qr')}
            activeOpacity={0.7}
          >
            <Icon name="qr-code-outline" size={moderateScale(16)} color={activeTab === 'qr' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive]}>
              QR Pass & Access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Icon name="time-outline" size={moderateScale(16)} color={activeTab === 'history' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Time Spent & History
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeTab === 'qr' ? (
            <>
              {/* ── LIVE GYM STATUS BANNER ── */}
              {isCurrentlyInGym ? (
                <View style={styles.activeGymBanner}>
                  <View style={styles.livePulseDot} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activeGymTitle}>🟢 YOU ARE CURRENTLY IN GYM</Text>
                    <Text style={styles.activeGymSub}>
                      Checked In: {attendanceData.todaySession?.checkInFormatted} • {attendanceData.todaySession?.durationFormatted}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkOutSmallBtn}
                    onPress={handleCheckOut}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.checkOutSmallText}>CHECK OUT</Text>
                  </TouchableOpacity>
                </View>
              ) : isCompletedToday ? (
                <View style={styles.completedGymBanner}>
                  <Icon name="checkmark-circle" size={moderateScale(22)} color="#00C48C" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.completedGymTitle}>🏆 Today's Session Completed!</Text>
                    <Text style={styles.completedGymSub}>
                      {attendanceData.todaySession?.checkInFormatted} → {attendanceData.todaySession?.checkOutFormatted} ({attendanceData.todaySession?.durationFormatted})
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* ── DIGITAL MEMBER PASS (CARD) ── */}
              <View style={styles.passCard}>
                {/* Gym Header */}
                <View style={styles.passHeader}>
                  <View>
                    <Text style={styles.passGymTitle}>{currentGym?.name ?? 'FitCore Elite Gym'}</Text>
                    <Text style={styles.passPlanText}>{plan?.name ?? 'Annual Gold Pass'} Member</Text>
                  </View>
                  <View style={styles.passStatusBadge}>
                    <Text style={styles.passStatusText}>ACTIVE PASS</Text>
                  </View>
                </View>

                {/* QR Code Container */}
                <View style={styles.qrCodeFrame}>
                  <View style={styles.qrInnerBox}>
                    <Image source={qrAssetImg} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.scanInstruction}>
                    Scan at turnstile scanner or front desk
                  </Text>
                  <View style={styles.tokenTimerRow}>
                    <Icon name="sync-outline" size={moderateScale(12)} color="#64748B" />
                    <Text style={styles.tokenTimerText}>
                      Rotating secure token: auto-refreshes in {refreshCountdown}s
                    </Text>
                  </View>
                </View>

                {/* Member Details Row */}
                <View style={styles.passFooter}>
                  <View style={styles.passAvatar}>
                    <Text style={styles.passAvatarText}>
                      {currentUser?.avatar ?? 'AP'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passMemberName}>{currentUser?.name ?? 'Arjun Patil'}</Text>
                    <Text style={styles.passMemberId}>ID: FC-892019 • Valid {daysLeft} days remaining</Text>
                  </View>
                  <Icon name="shield-checkmark" size={moderateScale(22)} color="#6C5CE7" />
                </View>
              </View>

              {/* ── 1-TAP CHECK-IN & CHECK-OUT CTA BUTTONS ── */}
              <View style={styles.actionButtonsRow}>
                {isCurrentlyInGym ? (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.checkOutActionBtn]}
                    onPress={handleCheckOut}
                    activeOpacity={0.85}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="exit-outline" size={moderateScale(20)} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>TAP TO CHECK OUT</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.checkInActionBtn]}
                    onPress={handleCheckIn}
                    activeOpacity={0.85}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="enter-outline" size={moderateScale(20)} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>TAP TO CHECK IN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            /* ── ATTENDANCE & TIME SPENT ANALYTICS TAB ── */
            <>
              {/* ── 4-STAT SUMMARY HERO GRID ── */}
              <View style={styles.statsHeroGrid}>
                <View style={styles.statHeroBox}>
                  <Text style={styles.statHeroLabel}>TOTAL TIME SPENT</Text>
                  <Text style={styles.statHeroVal}>{attendanceData.totalHoursSpent}</Text>
                  <Text style={styles.statHeroSub}>Across all visits</Text>
                </View>

                <View style={styles.statHeroBox}>
                  <Text style={styles.statHeroLabel}>AVG PER SESSION</Text>
                  <Text style={[styles.statHeroVal, { color: '#00C48C' }]}>{attendanceData.avgTimeFormatted}</Text>
                  <Text style={styles.statHeroSub}>Per workout</Text>
                </View>

                <View style={styles.statHeroBox}>
                  <Text style={styles.statHeroLabel}>THIS MONTH</Text>
                  <Text style={[styles.statHeroVal, { color: '#F59E0B' }]}>{attendanceData.thisMonthVisits} Days</Text>
                  <Text style={styles.statHeroSub}>Gym check-ins</Text>
                </View>

                <View style={styles.statHeroBox}>
                  <Text style={styles.statHeroLabel}>CURRENT STREAK</Text>
                  <Text style={[styles.statHeroVal, { color: '#6C5CE7' }]}>{attendanceData.currentStreakDays} Days 🔥</Text>
                  <Text style={styles.statHeroSub}>Consistent</Text>
                </View>
              </View>

              {/* ── DATE-WISE LOGS LIST ── */}
              <Text style={styles.sectionLabel}>Daily Attendance & Duration Log</Text>

              {attendanceData.records && attendanceData.records.length > 0 ? (
                attendanceData.records.map((rec: any) => {
                  const isLive = rec.status === 'in_gym';
                  return (
                    <View key={rec.id || rec.date} style={styles.logCard}>
                      <View style={styles.logLeft}>
                        <View style={[styles.logDateBadge, isLive && styles.logDateBadgeLive]}>
                          <Text style={[styles.logDateText, isLive && styles.logDateTextLive]}>
                            {rec.formattedDate || rec.date}
                          </Text>
                        </View>
                        <View style={styles.logTimeCol}>
                          <Text style={styles.logTimeIn}>🟢 In: {rec.checkInFormatted}</Text>
                          <Text style={[styles.logTimeOut, isLive && { color: '#6C5CE7', fontWeight: '800' }]}>
                            {isLive ? '⏱️ In Gym Currently' : `🔴 Out: ${rec.checkOutFormatted}`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.logRight}>
                        <View style={[styles.durationPill, isLive && styles.durationPillLive]}>
                          <Text style={[styles.durationPillText, isLive && styles.durationPillTextLive]}>
                            {rec.durationFormatted}
                          </Text>
                        </View>
                        <Text style={styles.caloriesText}>🔥 {rec.caloriesBurned} kcal</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>⏱️</Text>
                  <Text style={styles.emptyTitle}>No attendance records yet</Text>
                  <Text style={styles.emptySub}>Scan or tap Check-In when you enter the gym</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: hp(6) }} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  refreshBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: 4,
    marginHorizontal: wp(5),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(9),
  },
  tabBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Live Gym Banners
  activeGymBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  livePulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  activeGymTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '900',
    color: '#065F46',
  },
  activeGymSub: {
    fontSize: fontScale(11),
    color: '#047857',
    fontWeight: '600',
    marginTop: 2,
  },
  checkOutSmallBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  checkOutSmallText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  completedGymBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  completedGymTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  completedGymSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  // Pass Card
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    marginBottom: hp(2),
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: moderateScale(10),
  },
  passGymTitle: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  passPlanText: {
    fontSize: fontScale(11),
    color: '#6C5CE7',
    fontWeight: '700',
    marginTop: 2,
  },
  passStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  passStatusText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#00A86B',
  },
  qrCodeFrame: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  qrInnerBox: {
    width: moderateScale(170),
    height: moderateScale(170),
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  qrImage: {
    width: moderateScale(140),
    height: moderateScale(140),
    tintColor: '#2D3748',
  },
  scanInstruction: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: moderateScale(10),
  },
  tokenTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tokenTimerText: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '500',
  },
  passFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: moderateScale(12),
    gap: moderateScale(10),
  },
  passAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  passMemberName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  passMemberId: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },

  // Action Buttons
  actionButtonsRow: {
    marginBottom: hp(2),
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(15),
    elevation: 3,
  },
  checkInActionBtn: {
    backgroundColor: '#00C48C',
  },
  checkOutActionBtn: {
    backgroundColor: '#EF4444',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: fontScale(14),
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Hero Grid Stats
  statsHeroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  statHeroBox: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 1,
  },
  statHeroLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  statHeroVal: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  statHeroSub: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Log Cards
  sectionLabel: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: hp(1.2),
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  logDateBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logDateBadgeLive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  logDateText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#334155',
  },
  logDateTextLive: {
    color: '#6C5CE7',
  },
  logTimeCol: {},
  logTimeIn: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#00A86B',
  },
  logTimeOut: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  durationPill: {
    backgroundColor: 'rgba(0, 196, 140, 0.12)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  durationPillLive: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
  },
  durationPillText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#00A86B',
  },
  durationPillTextLive: {
    color: '#6C5CE7',
  },
  caloriesText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  emptyIcon: {
    fontSize: fontScale(36),
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
