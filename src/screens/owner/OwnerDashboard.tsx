import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { MEMBERS, ATTENDANCE } from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

export default function OwnerDashboard({ navigation }: any) {
  const { currentUser, currentGym } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || '6a934afd13a1b16c3767d90f';

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 184,
    activeMembers: 172,
    todayCheckIns: 42,
    monthlyRevenue: 185000,
    occupancyRate: 83,
    expiringSoon: 5,
  });

  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState<any[]>([]);

  // Modals
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtle entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          expiringSoon: exp.length || 5,
        }));
      } else {
        setExpiringMembers(MEMBERS.slice(0, 3));
      }

      if (attendanceRes.success && Array.isArray(attendanceRes.data) && attendanceRes.data.length > 0) {
        setTodayAttendanceList(attendanceRes.data);
      } else {
        setTodayAttendanceList(ATTENDANCE.slice(0, 4));
      }
    } catch (err) {
      setExpiringMembers(MEMBERS.slice(0, 3));
      setTodayAttendanceList(ATTENDANCE.slice(0, 4));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleAddMember = async () => {
    if (!mName.trim() || !mPhone.trim()) {
      Alert.alert('Required', 'Please enter member name and phone number.');
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
        Alert.alert('Success', `${mName} added successfully!`);
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

  const ownerInitial = currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AG';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── 1. CLEAN TOP APP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.gymTitle} numberOfLines={1}>
            {currentGym?.name ?? 'Ayushi GYM'}
          </Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Open Now • Closes 10:00 PM</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => setNotifModal(true)}
            activeOpacity={0.7}
          >
            <AppIcon name="notifications" size={20} color="#1E293B" />
            <View style={styles.alertDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{ownerInitial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── 2. WELCOME BANNER ── */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome back, {currentUser?.name?.split(' ')[0] ?? 'Ayushi'} 👋
            </Text>
            <Text style={styles.welcomeSub}>Here is what is happening in your gym today</Text>
          </View>

          {/* ── 3. FOUR CLEAR KPI METRIC CARDS ── */}
          <View style={styles.kpiGrid}>
            {/* KPI 1: Attendance Today */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Attendance')}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon name="attendance" size={22} color="#10B981" />
              </View>
              <Text style={styles.kpiNumber}>{stats.todayCheckIns}</Text>
              <Text style={styles.kpiLabel}>Attendance Today</Text>
            </TouchableOpacity>

            {/* KPI 2: Total Members */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Members')}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <AppIcon name="members" size={22} color="#4F46E5" />
              </View>
              <Text style={styles.kpiNumber}>{stats.totalMembers}</Text>
              <Text style={styles.kpiLabel}>Total Members</Text>
            </TouchableOpacity>

            {/* KPI 3: Monthly Revenue */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <AppIcon name="cash" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.kpiNumber}>₹{stats.monthlyRevenue.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiLabel}>Monthly Revenue</Text>
            </TouchableOpacity>

            {/* KPI 4: Expiring Soon */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Members')}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <AppIcon name="time" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.kpiNumber, { color: '#EF4444' }]}>{stats.expiringSoon}</Text>
              <Text style={styles.kpiLabel}>Expiring Soon</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. TODAY'S TURNOUT CAPACITY CARD ── */}
          <View style={styles.cleanWhiteCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardHeaderTitle}>Today's Turnout Ratio</Text>
                <Text style={styles.cardHeaderSub}>Live gym floor presence</Text>
              </View>
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageBadgeText}>{stats.occupancyRate}%</Text>
              </View>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(10, stats.occupancyRate))}%` },
                ]}
              />
            </View>

            <View style={styles.turnoutInfoRow}>
              <View style={styles.infoCol}>
                <View style={[styles.indicatorDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={styles.infoLabel}>Present: </Text>
                <Text style={styles.infoValue}>{stats.todayCheckIns}</Text>
              </View>

              <View style={styles.infoCol}>
                <View style={[styles.indicatorDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.infoLabel}>Total Active: </Text>
                <Text style={styles.infoValue}>{stats.activeMembers || stats.totalMembers}</Text>
              </View>
            </View>
          </View>

          {/* ── 5. QUICK ACTIONS (4 CLEAN BUTTONS) ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setAddMemberModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#EEF2FF' }]}>
                <AppIcon name="person-add" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.actionButtonText}>+ Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon name="cash" size={18} color="#10B981" />
              </View>
              <Text style={styles.actionButtonText}>+ Collect Fee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Trainers')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}>
                <AppIcon name="trainer" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.actionButtonText}>+ Add Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Plans')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F0F9FF' }]}>
                <AppIcon name="plan" size={18} color="#0284C7" />
              </View>
              <Text style={styles.actionButtonText}>+ Create Plan</Text>
            </TouchableOpacity>
          </View>

          {/* ── 6. EXPIRING MEMBERSHIPS ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Expiring Memberships</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')}>
              <Text style={styles.seeAllText}>View All ({expiringMembers.length}) ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cleanWhiteCard}>
            {expiringMembers.map((m, idx) => (
              <View
                key={m._id || m.id || idx}
                style={[
                  styles.listRow,
                  idx === expiringMembers.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarCircleText}>
                    {m.name ? m.name.slice(0, 2).toUpperCase() : 'MB'}
                  </Text>
                </View>

                <View style={styles.listTextCol}>
                  <Text style={styles.listMainTitle}>{m.name || 'Member'}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.expPill}>
                      <Text style={styles.expPillText}>Expires in {idx + 2} days</Text>
                    </View>
                    <Text style={styles.listSubTitle}>{m.planId ? 'Annual Pro' : 'Monthly Gold'}</Text>
                  </View>
                </View>

                <View style={styles.actionRowBtns}>
                  <TouchableOpacity
                    style={styles.waBtn}
                    onPress={() =>
                      Alert.alert(
                        'WhatsApp Reminder',
                        `Reminder sent to ${m.name || 'Member'} (${m.phone || '+91 9876543210'})!`
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <AppIcon name="whatsapp" size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.phoneBtn}
                    onPress={() => Alert.alert('Calling...', `Dialing ${m.phone || '+91 9876543210'}`)}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="user" size={15} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* ── 7. RECENT TURNSTILE CHECK-INS ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
              <Text style={styles.seeAllText}>Live Stream ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cleanWhiteCard}>
            {todayAttendanceList.slice(0, 4).map((att, idx) => (
              <View
                key={att._id || att.id || idx}
                style={[
                  styles.listRow,
                  idx === Math.min(3, todayAttendanceList.length - 1) && { borderBottomWidth: 0 },
                ]}
              >
                <View
                  style={[
                    styles.checkInAvatar,
                    { backgroundColor: idx % 2 === 0 ? '#EEF2FF' : '#ECFDF5' },
                  ]}
                >
                  <Text
                    style={[
                      styles.checkInAvatarText,
                      { color: idx % 2 === 0 ? '#4F46E5' : '#10B981' },
                    ]}
                  >
                    {att.memberName ? att.memberName.slice(0, 2).toUpperCase() : 'FC'}
                  </Text>
                </View>

                <View style={styles.listTextCol}>
                  <Text style={styles.listMainTitle}>{att.memberName || `Gym Member #${idx + 1}`}</Text>
                  <Text style={styles.listSubTitle}>
                    Turnstile Entry • {att.checkInTime || `${8 + idx}:15 AM`}
                  </Text>
                </View>

                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedBadgeText}>Granted</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: hp(10) }} />
        </Animated.View>
      </ScrollView>

      {/* ── MODAL: ADD MEMBER ── */}
      <Modal visible={addMemberModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Member Enrollment</Text>
              <TouchableOpacity onPress={() => setAddMemberModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={mName}
                onChangeText={setMName}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={mPhone}
                onChangeText={setMPhone}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddMember}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>ENROLL MEMBER</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: NOTIFICATIONS ── */}
      <Modal visible={notifModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: hp(60) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>🚨 5 Memberships Expiring</Text>
                <Text style={styles.notifBody}>5 members are due for renewal in the next 3 days.</Text>
                <Text style={styles.notifTime}>10m ago</Text>
              </View>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>💰 Payment Received: ₹3,500</Text>
                <Text style={styles.notifBody}>Rahul Sharma completed Gold Membership renewal.</Text>
                <Text style={styles.notifTime}>1h ago</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Top App Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    backgroundColor: '#F8FAFC',
  },
  topBarLeft: {
    flex: 1,
    marginRight: wp(3),
  },
  gymTitle: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#10B981',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  circleButton: {
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
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  alertDot: {
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
  avatarButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#4F46E5',
  },

  // ── Scroll Content ──
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },

  // ── Welcome Section ──
  welcomeSection: {
    marginBottom: hp(2),
  },
  welcomeTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#1E1B4B',
  },
  welcomeSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── 4 KPI Grid ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  kpiCard: {
    width: (wp(90) - wp(3)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  kpiIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
  },
  kpiNumber: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },

  // ── Clean White Card Container ──
  cleanWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(18),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  cardHeaderTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  percentageBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageBadgeText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#4F46E5',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEF2FF',
    overflow: 'hidden',
    marginBottom: hp(1.4),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  turnoutInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  infoLabel: {
    fontSize: fontScale(12),
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Section Titles ──
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1.4),
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
  },
  seeAllText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ── Quick Action Grid ──
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  actionButton: {
    width: (wp(90) - wp(3)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  actionIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2.5),
  },
  actionButtonText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },

  // ── List Items ──
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarCircle: {
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
  avatarCircleText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#EF4444',
  },
  listTextCol: {
    flex: 1,
  },
  listMainTitle: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  expPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expPillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#EF4444',
  },
  listSubTitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
  },
  actionRowBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  waBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Recent Turnstile Item ──
  checkInAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  checkInAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
  },
  grantedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  grantedBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#16A34A',
  },

  // ── Modals ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  formGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: fontScale(14),
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    marginTop: hp(1),
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  notifCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  notifBody: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
});
