import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

export default function TrainerLeaveRequestScreen({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Coach Kunal';
  const gymName = currentGym?.name || 'FitCore Gym';

  // ── Form State ──
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<'Full Day' | 'Half Day' | 'Sick Leave' | 'Vacation'>('Full Day');
  const [submitting, setSubmitting] = useState(false);

  // ── History & Stats State ──
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Animations ──
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
    fetchLeaveHistory();
  }, [trainerId]);

  const fetchLeaveHistory = async () => {
    try {
      setLoadingHistory(true);
      const res: any = await apiService.getTrainerLeaveRequests(currentGym?.id, trainerId);
      if (res?.success && Array.isArray(res.data)) {
        setMyLeaveRequests(res.data);
      }
    } catch (e) {
      console.log('Error fetching leave history:', e);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Missing Dates', 'Please provide start and end dates for your leave.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please enter a brief explanation for your leave.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedReason = `[${leaveType}] ${reason.trim()}`;
      const res: any = await apiService.createTrainerLeaveRequest({
        trainerId,
        trainerName,
        gymId: currentGym?.id || 'gym1',
        startDate,
        endDate,
        reason: formattedReason,
      });

      if (res?.success) {
        Alert.alert('Leave Submitted ✅', 'Your leave application has been submitted to the gym owner for approval.');
        setReason('');
        fetchLeaveHistory();
      } else {
        Alert.alert('Submission Failed', res?.message || 'Unable to submit leave request.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error submitting leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = myLeaveRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = myLeaveRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = myLeaveRequests.filter((r) => r.status === 'rejected').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* ── Ambient Glows ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

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
          <View style={styles.headerCenterBox}>
            <Text style={styles.headerTitle}>Leave Management</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {gymName} • {trainerName}
            </Text>
          </View>
          <View style={{ width: moderateScale(38) }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLeaveHistory();
              }}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {/* ════════════════════════════════════════════════════════════════
              1. LEAVE SUMMARY STATS CARDS
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.25)', backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.statVal, { color: '#B45309' }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.25)', backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.statVal, { color: '#047857' }]}>{approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>

            <View style={[styles.statCard, { borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.statVal, { color: '#B91C1C' }]}>{rejectedCount}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              2. APPLY LEAVE APPLICATION CARD
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formIconBox}>
                <Icon name="calendar" size={moderateScale(18)} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.formCardTitle}>New Leave Request</Text>
                <Text style={styles.formCardSub}>Owner approval required to reflect on attendance</Text>
              </View>
            </View>

            {/* Leave Type Selector */}
            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['Full Day', 'Half Day', 'Sick Leave', 'Vacation'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, leaveType === t && styles.typePillActive]}
                  onPress={() => setLeaveType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typePillText, leaveType === t && styles.typePillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dates Grid */}
            <View style={styles.datesGrid}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-09-18"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-09-18"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Reason Input */}
            <Text style={styles.inputLabel}>Reason / Notes</Text>
            <TextInput
              style={[styles.inputBox, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Family function, Health checkup, Personal time off"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleApplyLeave}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.submitInnerRow}>
                  <Icon name="paper-plane" size={moderateScale(15)} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit to Gym Owner</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              3. LEAVE APPLICATIONS HISTORY
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.historyHeaderRow}>
            <Text style={styles.sectionTitle}>Application History</Text>
            <TouchableOpacity onPress={fetchLeaveHistory} activeOpacity={0.7}>
              <Icon name="refresh" size={moderateScale(16)} color="#6366F1" />
            </TouchableOpacity>
          </View>

          {loadingHistory && !refreshing ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 20 }} />
          ) : myLeaveRequests.length > 0 ? (
            <View style={styles.historyList}>
              {myLeaveRequests.map((req) => {
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';
                const isPending = !isApproved && !isRejected;

                const badgeBg = isApproved ? '#DCFCE7' : isRejected ? '#FFE4E6' : '#FEF3C7';
                const badgeColor = isApproved ? '#059669' : isRejected ? '#E11D48' : '#D97706';
                const badgeLabel = isApproved ? 'Approved ✅' : isRejected ? 'Rejected ❌' : 'Pending ⏳';

                return (
                  <View key={req._id || req.id} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View style={styles.historyDateBadge}>
                        <Icon name="calendar-outline" size={moderateScale(14)} color="#475569" />
                        <Text style={styles.historyDateText}>
                          {req.startDate} {req.startDate !== req.endDate ? `→ ${req.endDate}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                      </View>
                    </View>

                    <Text style={styles.historyReason}>
                      <Text style={{ fontWeight: '700', color: '#334155' }}>Reason: </Text>
                      {req.reason}
                    </Text>

                    {req.notes ? (
                      <View style={styles.ownerNoteBox}>
                        <Icon name="chatbox-ellipses-outline" size={moderateScale(13)} color="#059669" />
                        <Text style={styles.ownerNoteText}>Owner: {req.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyHistoryBox}>
              <Icon name="document-text-outline" size={moderateScale(24)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Leave Applications Found</Text>
              <Text style={styles.emptySub}>When you submit leave requests, they will appear here along with owner decision updates.</Text>
            </View>
          )}

          <View style={{ height: hp(6) }} />
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
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(1.4),
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerCenterBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  statCard: {
    flex: 1,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    borderWidth: 1,
  },
  statVal: {
    fontSize: fontScale(18),
    fontWeight: '900',
  },
  statLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  // ── Form Card ──
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: hp(2.5),
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: hp(1.8),
    paddingBottom: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  formCardSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },

  // Type Selector
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: hp(1.5),
  },
  typePill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typePillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },

  // Inputs
  datesGrid: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: fontScale(12.5),
    color: '#0F172A',
  },
  textArea: {
    height: moderateScale(70),
    textAlignVertical: 'top',
    marginBottom: hp(2),
  },

  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── History List ──
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  sectionTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  historyList: {
    gap: moderateScale(10),
  },
  historyCard: {
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
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  statusBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '800',
  },
  historyReason: {
    fontSize: fontScale(12),
    color: '#64748B',
    lineHeight: fontScale(17),
  },
  ownerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  ownerNoteText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#15803D',
  },

  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(22),
    paddingHorizontal: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  emptyTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 3,
    textAlign: 'center',
    lineHeight: fontScale(16),
  },
});
