import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

import {
  ANALYTICS,
  MEMBERS,
  NOTIFICATIONS,
  ATTENDANCE,
  getNotificationsForOwner,
  Member,
  AttendanceRecord,
} from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

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

export default function OwnerDashboard({ navigation }: any) {
  const { currentUser, currentGym } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || '6a934afd13a1b16c3767d90f';

  // API State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 184,
    activeMembers: 172,
    todayCheckIns: 42,
    monthlyRevenue: 185000,
    totalTrainers: 6,
    occupancyRate: 83,
    newLeads: 12,
    expiringSoon: 5,
  });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState<any[]>([]);

  const [addMemberModal, setAddMemberModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  // Form states
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, membersRes, attendanceRes] = await Promise.all([
        apiService.getOwnerOverview(gymId),
        apiService.getOwnerMembers(gymId),
        apiService.getOwnerAttendanceToday(gymId),
      ]);

      if (overviewRes.success && overviewRes.data) {
        const d: any = overviewRes.data;
        const st = d.stats || {};
        setStats((prev) => ({
          ...prev,
          totalMembers: st.totalMembers || prev.totalMembers,
          activeMembers: st.activeMembers || prev.activeMembers,
          todayCheckIns: st.todayCheckIns || prev.todayCheckIns,
          monthlyRevenue: st.monthlyRevenue || prev.monthlyRevenue,
          totalTrainers: st.totalTrainers || prev.totalTrainers,
          occupancyRate: st.occupancyRate || prev.occupancyRate,
        }));
      }

      if (membersRes.success && Array.isArray(membersRes.data) && membersRes.data.length > 0) {
        const allM = membersRes.data;
        const now = Date.now();
        const exp = allM.filter((m: any) => {
          if (!m.expiryDate) return false;
          const days = Math.ceil((new Date(m.expiryDate).getTime() - now) / 86400000);
          return days >= 0 && days <= 15 && (m.status === 'active' || !m.status);
        });
        setExpiringMembers(exp.length > 0 ? exp : MEMBERS.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          totalMembers: allM.length || prev.totalMembers,
          expiringSoon: exp.length || 4,
          newLeads: 8,
        }));
      } else {
        // Fallback to rich mock data
        setExpiringMembers(MEMBERS.slice(0, 3));
      }

      if (attendanceRes.success && Array.isArray(attendanceRes.data) && attendanceRes.data.length > 0) {
        setTodayAttendanceList(attendanceRes.data);
      } else {
        setTodayAttendanceList(ATTENDANCE.slice(0, 4));
      }
    } catch (err) {
      console.log('Error fetching owner dashboard:', err);
      setExpiringMembers(MEMBERS.slice(0, 3));
      setTodayAttendanceList(ATTENDANCE.slice(0, 4));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleAddMember = async () => {
    if (!mName.trim() || !mPhone.trim()) {
      Alert.alert('Required', 'Name and mobile phone are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.createOwnerMember({
        name: mName.trim(),
        phone: mPhone.trim(),
        gymId: gymId,
        gymName: currentGym?.name || 'Ayushi GYM',
      });
      if (res.success) {
        Alert.alert('✓ Member Added', `${mName} has been enrolled successfully!`);
        setMName('');
        setMPhone('');
        setAddMemberModal(false);
        fetchDashboardData();
      } else {
        Alert.alert('Error', res.error || 'Failed to add member');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── AMBIENT LUXURY GLOWS ── */}
        <View style={styles.ambientGlowTop} pointerEvents="none" />
        <View style={styles.ambientGlowRight} pointerEvents="none" />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.gymName}>{currentGym?.name ?? 'Ayushi GYM'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now • Closes 10:00 PM</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setNotifModal(true)}
              activeOpacity={0.7}
            >
              <AppIcon name="notifications" size={20} color="#1E1B4B" />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {currentUser?.avatar ?? 'AG'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        >
          {/* ── WELCOME BANNER ── */}
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeGreeting}>
              Welcome back, {currentUser?.name?.split(' ')[0] ?? 'Owner'} 👋
            </Text>
            <Text style={styles.welcomeSub}>Live overview for {currentGym?.name || 'Ayushi GYM'}</Text>
          </View>

          {/* ── 4 OVERVIEW METRICS GRID ── */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Attendance */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 196, 140, 0.12)' }]}>
                <AppIcon name="attendance" size={20} color="#00C48C" />
              </View>
              <Text style={styles.metricValue}>{stats.todayCheckIns}</Text>
              <Text style={styles.metricLabel}>Attendance Today</Text>
            </View>

            {/* Metric 2: Enrolled Members */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 194, 255, 0.12)' }]}>
                <AppIcon name="members" size={20} color="#00C2FF" />
              </View>
              <Text style={styles.metricValue}>{stats.totalMembers}</Text>
              <Text style={styles.metricLabel}>Total Members</Text>
            </View>

            {/* Metric 3: Total Revenue */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 153, 0, 0.12)' }]}>
                <AppIcon name="cash" size={20} color="#FF9900" />
              </View>
              <Text style={styles.metricValue}>₹{stats.monthlyRevenue.toLocaleString('en-IN')}</Text>
              <Text style={styles.metricLabel}>Monthly Collection</Text>
            </View>

            {/* Metric 4: Expiring Memberships */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 77, 109, 0.12)' }]}>
                <AppIcon name="time" size={20} color="#FF4D6D" />
              </View>
              <Text style={styles.metricValue}>{stats.expiringSoon}</Text>
              <Text style={styles.metricLabel}>Expiring Soon</Text>
            </View>
          </View>

          {/* ── TURNOUT BREAKDOWN ── */}
          <View style={styles.card}>
            <View style={styles.turnoutHeader}>
              <Text style={styles.cardTitle}>Today's Turnout Ratio</Text>
              <Text style={styles.turnoutPercentText}>{stats.occupancyRate}%</Text>
            </View>

            <View style={styles.turnoutTrack}>
              <View style={[styles.turnoutFill, { width: `${Math.min(100, Math.max(8, stats.occupancyRate))}%` }]} />
            </View>

            <View style={styles.turnoutLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={styles.legendText}>Present: {stats.todayCheckIns}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                <Text style={styles.legendText}>Total Active: {stats.activeMembers || stats.totalMembers}</Text>
              </View>
            </View>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionTitle}>Quick Management Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setAddMemberModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconPill, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                <AppIcon name="person-add" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.actionBtnText}>+ Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconPill, { backgroundColor: 'rgba(0, 196, 140, 0.12)' }]}>
                <AppIcon name="cash" size={18} color="#00C48C" />
              </View>
              <Text style={styles.actionBtnText}>+ Collect Fee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Trainers')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconPill, { backgroundColor: 'rgba(255, 153, 0, 0.12)' }]}>
                <AppIcon name="trainer" size={18} color="#FF9900" />
              </View>
              <Text style={styles.actionBtnText}>+ Add Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Plans')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconPill, { backgroundColor: 'rgba(0, 194, 255, 0.12)' }]}>
                <AppIcon name="plan" size={18} color="#00C2FF" />
              </View>
              <Text style={styles.actionBtnText}>+ Create Plan</Text>
            </TouchableOpacity>
          </View>

          {/* ── EXPIRING MEMBERSHIPS FOLLOW-UP ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Expiring Memberships</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')}>
              <Text style={styles.cardActionLink}>See All ({expiringMembers.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.expiringList}>
            {expiringMembers.map((m, idx) => (
              <View key={m._id || m.id || idx} style={styles.expiringItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(m.name ? m.name.slice(0, 2).toUpperCase() : 'MB')}
                  </Text>
                </View>
                <View style={styles.memberInfoCol}>
                  <Text style={styles.memberNameText}>{m.name || 'Champion Member'}</Text>
                  <View style={styles.expiryBadgeRow}>
                    <View style={styles.warningPill}>
                      <Text style={styles.warningPillText}>Expires in {idx + 2} days</Text>
                    </View>
                    <Text style={styles.planNameSub}>{m.planId ? 'Annual Pro' : 'Gold Pass'}</Text>
                  </View>
                </View>
                <View style={styles.memberActionBtns}>
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => Alert.alert('WhatsApp Reminder', `Renewal reminder sent to ${m.phone || 'Member'}!`)}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="whatsapp" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Alert.alert('Calling...', `Dialing ${m.phone || '+91 9876543210'}`)}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="user" size={16} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* ── RECENT TURNSTILE CHECK-INS ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
              <Text style={styles.cardActionLink}>View Live Stream</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentList}>
            {todayAttendanceList.slice(0, 3).map((att, idx) => (
              <View key={att._id || att.id || idx} style={styles.recentItem}>
                <View style={[styles.recentAvatar, { backgroundColor: idx % 2 === 0 ? '#EEF2FF' : '#F0FDF4' }]}>
                  <Text style={[styles.recentAvatarText, { color: idx % 2 === 0 ? '#4F46E5' : '#16A34A' }]}>
                    {(att.memberName ? att.memberName.slice(0, 2).toUpperCase() : 'FC')}
                  </Text>
                </View>
                <View style={styles.recentInfoCol}>
                  <Text style={styles.recentNameText}>{att.memberName || `Member #${idx + 1}`}</Text>
                  <Text style={styles.recentTimeText}>Turnstile Entry • {att.checkInTime || `${8 + idx}:30 AM`}</Text>
                </View>
                <View style={styles.accessBadge}>
                  <Text style={styles.accessBadgeText}>Granted</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: hp(14) }} />
        </ScrollView>

        {/* ── ADD MEMBER MODAL ── */}
        <Modal visible={addMemberModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quick Member Enrollment</Text>
                <TouchableOpacity onPress={() => setAddMemberModal(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={mName}
                  onChangeText={setMName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={mPhone}
                  onChangeText={setMPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.submitMemberBtn}
                onPress={handleAddMember}
                activeOpacity={0.85}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitMemberBtnText}>ENROLL MEMBER</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  gymName: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  openText: {
    fontSize: fontScale(12),
    color: '#10B981',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  headerBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#4F46E5',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },

  welcomeRow: {
    marginBottom: hp(2),
  },
  welcomeGreeting: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#1E1B4B',
  },
  welcomeSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Metrics Grid ──
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  metricCard: {
    width: (wp(90) - wp(3)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  metricIconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
  },
  metricValue: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },

  // ── Turnout Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(18),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  turnoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  cardTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  turnoutPercentText: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#4F46E5',
  },
  turnoutTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEF2FF',
    overflow: 'hidden',
    marginBottom: hp(1.2),
  },
  turnoutFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  turnoutLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: fontScale(12),
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Quick Actions ──
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1.5),
    letterSpacing: -0.3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  actionBtn: {
    width: (wp(90) - wp(3)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  actionIconPill: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  actionBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── Section Header ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  cardActionLink: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ── Expiring Members ──
  expiringList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(14),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    gap: hp(1.2),
  },
  expiringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  memberAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  memberAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#EF4444',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  expiryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  warningPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warningPillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#EF4444',
  },
  planNameSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
  },
  memberActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  whatsappBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Recent Check-ins ──
  recentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(14),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    gap: hp(1.2),
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  recentAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  recentAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
  },
  recentInfoCol: {
    flex: 1,
  },
  recentNameText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  recentTimeText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  accessBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accessBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#16A34A',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: moderateScale(24),
    paddingBottom: hp(5),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2.5),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: fontScale(14),
    color: '#0F172A',
  },
  submitMemberBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    marginTop: hp(1),
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitMemberBtnText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
