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
  Switch,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { TRAINERS, MEMBERS, Trainer } from '../../data/mockData';
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

export default function TrainersScreen() {
  const { currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';

  const [trainers, setTrainers] = useState<Trainer[]>(() =>
    TRAINERS.filter((t) => t.gymId === gymId || !t.gymId || t.gymId === 'gym1')
  );
  const [addModal, setAddModal] = useState(false);
  const [detailTrainer, setDetailTrainer] = useState<Trainer | null>(null);

  // Form
  const [fName, setFName] = useState('');
  const [fSpec, setFSpec] = useState('');
  const [fExp, setFExp] = useState('');
  const [fSalary, setFSalary] = useState('');
  const [fTimings, setFTimings] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fJoinDate, setFJoinDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fAvail, setFAvail] = useState(true);

  // ── Leave Requests State ──
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  const [rejectingLeaveReq, setRejectingLeaveReq] = useState<any | null>(null);
  const [ownerRejectNote, setOwnerRejectNote] = useState('');

  const loadLeaveRequests = async () => {
    try {
      setLoadingLeaves(true);
      const res: any = await apiService.getTrainerLeaveRequests(gymId);
      if (res?.success && Array.isArray(res.data)) {
        setLeaveRequests(res.data);
      }
    } catch (err) {
      console.log('Error loading leave requests:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected', customNote?: string) => {
    setProcessingLeaveId(id);
    try {
      const noteToSend = customNote || (status === 'approved' ? 'Approved by Gym Owner' : 'Declined by Gym Owner');
      const res: any = await apiService.updateTrainerLeaveRequest(id, status, noteToSend);
      if (res?.success) {
        Alert.alert(status === 'approved' ? 'Leave Approved ✅' : 'Leave Rejected ❌', `The trainer leave request has been ${status}. Attendance records and calendars updated.`);
        setRejectingLeaveReq(null);
        setOwnerRejectNote('');
        loadLeaveRequests();
      } else {
        Alert.alert('Action Failed', res?.message || 'Unable to update leave request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error updating leave');
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadLeaveRequests();
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

  const resetForm = () => {
    setFName('');
    setFSpec('');
    setFExp('');
    setFSalary('');
    setFTimings('');
    setFPhone('');
    setFJoinDate(new Date().toISOString().split('T')[0]);
    setFAvail(true);
  };

  const handleAdd = async () => {
    if (!fName.trim() || !fSpec.trim()) {
      Alert.alert('Required', 'Name and specialization are required.');
      return;
    }
    const chosenJoinDate = fJoinDate.trim() || new Date().toISOString().split('T')[0];
    const newTrainer: Trainer = {
      id: `t${Date.now()}`,
      gymId: gymId,
      name: fName.trim(),
      avatar: fName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
      specialization: fSpec.trim(),
      experience: fExp.trim() || '3+ years',
      salary: fSalary.trim() || '35,000',
      timings: fTimings.trim() || '06:00 AM – 02:00 PM',
      available: fAvail,
      assignedMemberIds: [],
      certifications: 'ISSA / ACE Certified',
      phone: fPhone.trim() || '9876543210',
      joinDate: chosenJoinDate,
    };

    try {
      await apiService.createOwnerTrainer({
        gymId: gymId,
        name: fName.trim(),
        phone: fPhone.trim() || '9876543210',
        specialty: fSpec.trim(),
        experience: fExp.trim() || '3+ years',
        salary: fSalary.trim() || '35,000',
        shift: fTimings.trim() || '06:00 AM – 02:00 PM',
        joinDate: chosenJoinDate,
      });
    } catch (err) {
      console.log('Error creating trainer in backend DB:', err);
    }

    setTrainers((prev) => [...prev, newTrainer]);
    Alert.alert('✓ Added', `${fName} has been added as coach starting from ${chosenJoinDate}!`);
    setAddModal(false);
    resetForm();
  };

  const toggleAvail = (trainer: Trainer) => {
    const updated = trainers.map((t) => (t.id === trainer.id ? { ...t, available: !t.available } : t));
    setTrainers(updated);
    if (detailTrainer && detailTrainer.id === trainer.id) {
      setDetailTrainer((prev) => (prev ? { ...prev, available: !prev.available } : null));
    }
  };

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
            <Text style={styles.headerTitle}>Trainers & Coaches</Text>
            <Text style={styles.headerSub}>
              {trainers.filter((t) => t.available).length} Active • {trainers.length} Total
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="person-add" size={moderateScale(16)} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Add Coach</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* ════════════════════════════════════════════════════════════════
              1. TRAINER LEAVE REQUESTS (APPROVAL / REJECTION BANNER)
          ════════════════════════════════════════════════════════════════ */}
          {leaveRequests.filter((r) => r.status === 'pending').length > 0 && (
            <View style={styles.pendingLeavesContainer}>
              <View style={styles.pendingLeavesHeader}>
                <View style={styles.pendingLeavesTitleBox}>
                  <View style={styles.pendingLeavesPulseDot} />
                  <Text style={styles.pendingLeavesTitle}>
                    Pending Leave Requests ({leaveRequests.filter((r) => r.status === 'pending').length})
                  </Text>
                </View>
                <TouchableOpacity onPress={loadLeaveRequests} activeOpacity={0.7}>
                  <AppIcon name="refresh" size={moderateScale(15)} color="#6366F1" />
                </TouchableOpacity>
              </View>

              {leaveRequests
                .filter((r) => r.status === 'pending')
                .map((req: any) => (
                  <View key={req._id || req.id} style={styles.leaveApprovalCard}>
                    <View style={styles.leaveCardTopRow}>
                      <View style={styles.leaveTrainerBadge}>
                        <AppIcon name="person" size={moderateScale(13)} color="#4338CA" />
                        <Text style={styles.leaveTrainerName}>{req.trainerName || 'Coach'}</Text>
                      </View>
                      <View style={styles.leaveDurationPill}>
                        <AppIcon name="calendar" size={moderateScale(12)} color="#D97706" />
                        <Text style={styles.leaveDurationText}>
                          {req.startDate} {req.startDate !== req.endDate ? `→ ${req.endDate}` : ''}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.leaveReasonText}>
                      <Text style={{ fontWeight: '700', color: '#334155' }}>Reason: </Text>
                      {req.reason}
                    </Text>

                    <View style={styles.leaveActionBtnsRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => {
                          setRejectingLeaveReq(req);
                          setOwnerRejectNote('');
                        }}
                        disabled={processingLeaveId === (req._id || req.id)}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="close-circle" size={moderateScale(14)} color="#E11D48" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleDecision(req._id || req.id, 'approved')}
                        disabled={processingLeaveId === (req._id || req.id)}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="checkmark-circle" size={moderateScale(14)} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>
                          {processingLeaveId === (req._id || req.id) ? 'Updating...' : 'Approve Leave'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* Section title for trainers list */}
          <View style={styles.trainersListHeader}>
            <Text style={styles.trainersListTitle}>Gym Coaches & Roster</Text>
          </View>

          {trainers.map((trainer) => {
            const assignedCount = MEMBERS.filter((m) => trainer.assignedMemberIds.includes(m.id)).length || 14;
            const isLiveFloor = trainer.available;

            return (
              <AnimatedPressable
                key={trainer.id}
                style={styles.trainerCard}
                onPress={() => setDetailTrainer(trainer)}
              >
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                  {isLiveFloor && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.trainerInfoCol}>
                  <View style={styles.trainerTopRow}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <View
                      style={[
                        styles.availBadge,
                        { backgroundColor: isLiveFloor ? 'rgba(0, 196, 140, 0.12)' : 'rgba(148, 163, 184, 0.15)' },
                      ]}
                    >
                      <View style={[styles.miniStatusDot, { backgroundColor: isLiveFloor ? '#00C48C' : '#94A3B8' }]} />
                      <Text
                        style={[
                          styles.availBadgeText,
                          { color: isLiveFloor ? '#00C48C' : '#64748B' },
                        ]}
                      >
                        {isLiveFloor ? 'On Floor (06:15 AM)' : 'Off Duty'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.trainerSpec}>{trainer.specialization}</Text>

                  {/* Punch & Floor Hours summary */}
                  <View style={styles.trainerPunchRow}>
                    <Text style={styles.trainerPunchTime}>
                      🕒 {isLiveFloor ? 'Shift In: 06:15 AM (Active)' : 'Last Shift: 06:00 AM – 02:30 PM'}
                    </Text>
                    <Text style={styles.trainerHoursBadge}>
                      {isLiveFloor ? 'Floor: 2.8 hrs' : '8h 30m'}
                    </Text>
                  </View>

                  <View style={styles.trainerMetaRow}>
                    <Text style={styles.trainerMetaText}>⭐ 4.9 Rating</Text>
                    <Text style={styles.trainerMetaDivider}>•</Text>
                    <Text style={styles.trainerMetaText}>🏋️ {assignedCount} Clients</Text>
                    <Text style={styles.trainerMetaDivider}>•</Text>
                    <Text style={styles.trainerMetaText}>📅 22 Days Present</Text>
                  </View>
                </View>

                <AppIcon name="chevron-forward" size={moderateScale(18)} color="#94A3B8" />
              </AnimatedPressable>
            );
          })}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD TRAINER MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Coach</Text>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                  <AppIcon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coach Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="e.g. Vikram Singh"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fSpec}
                  onChangeText={setFSpec}
                  placeholder="e.g. Hypertrophy & Powerlifting"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fPhone}
                  onChangeText={setFPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Joining Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fJoinDate}
                  onChangeText={setFJoinDate}
                  placeholder="e.g. 2026-09-16"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>CONFIRM TRAINER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── TRAINER DETAIL & ATTENDANCE LOGS MODAL ── */}
        <Modal visible={!!detailTrainer} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Coach Attendance & Duty Roster</Text>
                <TouchableOpacity onPress={() => setDetailTrainer(null)}>
                  <AppIcon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailProfileRow}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{detailTrainer?.avatar ?? 'C'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{detailTrainer?.name}</Text>
                  <Text style={styles.detailSpec}>{detailTrainer?.specialization}</Text>
                  <Text style={styles.detailPhone}>📞 {detailTrainer?.phone}</Text>
                </View>
              </View>

              {/* Monthly Attendance Summary for Owner */}
              <View style={styles.ownerAttSummaryGrid}>
                <View style={styles.attBox}>
                  <Text style={styles.attBoxVal}>22 Days</Text>
                  <Text style={styles.attBoxLabel}>Present (Sep)</Text>
                </View>
                <View style={styles.attBox}>
                  <Text style={styles.attBoxVal}>168.5 hrs</Text>
                  <Text style={styles.attBoxLabel}>Working Hours</Text>
                </View>
                <View style={styles.attBox}>
                  <Text style={[styles.attBoxVal, { color: '#FF4D6D' }]}>2 Leaves</Text>
                  <Text style={styles.attBoxLabel}>Chhutti (Sutti)</Text>
                </View>
                <View style={styles.attBox}>
                  <Text style={[styles.attBoxVal, { color: '#00C48C' }]}>95%</Text>
                  <Text style={styles.attBoxLabel}>Punctuality</Text>
                </View>
              </View>

              {/* Daily Shift Logs Table */}
              <Text style={styles.shiftLogsTitle}>Recent Daily Shift Logs</Text>
              <ScrollView style={{ maxHeight: hp(22) }} showsVerticalScrollIndicator={false}>
                {[
                  { date: 'Today (17 Sep)', in: '06:15 AM', out: 'Active (On Floor)', hours: 'Live 2.8h', status: 'present' },
                  { date: 'Yesterday (16 Sep)', in: '06:00 AM', out: '02:30 PM', hours: '8h 30m', status: 'present' },
                  { date: '15 Sep 2026', in: '06:05 AM', out: '02:35 PM', hours: '8h 30m', status: 'present' },
                  { date: '14 Sep 2026', in: '06:00 AM', out: '10:30 AM', hours: '4h 30m', status: 'half_day' },
                  { date: '12 Sep 2026', in: '--:--', out: '--:--', hours: '0h (Leave)', status: 'leave' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.shiftLogRow}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.logDate}>{item.date}</Text>
                      <Text style={styles.logHours}>{item.hours}</Text>
                    </View>
                    <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                      <Text style={styles.logTimes}>In: {item.in}</Text>
                      <Text style={styles.logTimes}>Out: {item.out}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Floor Availability</Text>
                <Switch
                  value={detailTrainer?.available ?? true}
                  onValueChange={() => {
                    if (detailTrainer) toggleAvail(detailTrainer);
                  }}
                  trackColor={{ false: '#ECEAFD', true: '#6C5CE7' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* ── REJECT LEAVE MODAL WITH CUSTOM REASON ── */}
        <Modal visible={!!rejectingLeaveReq} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#E11D48' }]}>Reject Leave Request</Text>
                <TouchableOpacity onPress={() => setRejectingLeaveReq(null)}>
                  <AppIcon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: fontScale(13), color: '#334155', marginBottom: 12 }}>
                Reject leave for <Text style={{ fontWeight: '800' }}>{rejectingLeaveReq?.trainerName || 'Coach'}</Text> ({rejectingLeaveReq?.startDate} {rejectingLeaveReq?.startDate !== rejectingLeaveReq?.endDate ? `to ${rejectingLeaveReq?.endDate}` : ''})?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Rejection (Visible to Trainer):</Text>
                <TextInput
                  style={[styles.modalInput, { height: moderateScale(70), textAlignVertical: 'top', paddingTop: 8 }]}
                  value={ownerRejectNote}
                  onChangeText={setOwnerRejectNote}
                  placeholder="e.g. Need coverage for peak evening batch, please reschedule..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: hp(1) }}>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                  onPress={() => setRejectingLeaveReq(null)}
                >
                  <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 1.5, backgroundColor: '#E11D48' }]}
                  onPress={() => handleDecision(rejectingLeaveReq?._id || rejectingLeaveReq?.id, 'rejected', ownerRejectNote)}
                  disabled={processingLeaveId === (rejectingLeaveReq?._id || rejectingLeaveReq?.id)}
                >
                  <Text style={styles.submitBtnText}>
                    {processingLeaveId === (rejectingLeaveReq?._id || rejectingLeaveReq?.id) ? 'Rejecting...' : 'Confirm Reject'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  headerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.8),
  },

  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  trainerAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  trainerAvatarText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: moderateScale(11),
    height: moderateScale(11),
    borderRadius: moderateScale(5.5),
    backgroundColor: '#00C48C',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  trainerInfoCol: {
    flex: 1,
  },
  trainerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trainerName: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  availBadge: {
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  availBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
  },
  trainerSpec: {
    fontSize: fontScale(11.5),
    color: '#6C5CE7',
    fontWeight: '600',
    marginBottom: 4,
  },
  trainerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trainerMetaText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  trainerMetaDivider: {
    fontSize: fontScale(10.5),
    color: '#CBD5E1',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  miniStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  trainerPunchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  trainerPunchTime: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#0F172A',
  },
  trainerHoursBadge: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    backgroundColor: '#ECEAFD',
    paddingHorizontal: moderateScale(6),
    paddingVertical: 1,
    borderRadius: moderateScale(4),
  },

  // Detail Modal
  detailProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
    marginBottom: hp(1.5),
  },
  detailAvatar: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  detailAvatarText: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  detailName: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailSpec: {
    fontSize: fontScale(12.5),
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 2,
  },
  detailPhone: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },

  ownerAttSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F7FF',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  attBox: {
    flex: 1,
    alignItems: 'center',
  },
  attBoxVal: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  attBoxLabel: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },

  shiftLogsTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  shiftLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logDate: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  logHours: {
    fontSize: fontScale(10),
    color: '#6C5CE7',
    fontWeight: '700',
    marginTop: 1,
  },
  logTimes: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F2FE',
    marginTop: hp(1),
  },
  toggleLabel: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Pending Leaves Approval Styles ──
  pendingLeavesContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(2),
  },
  pendingLeavesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  pendingLeavesTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingLeavesPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  pendingLeavesTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#991B1B',
  },
  leaveApprovalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FEE2E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  leaveCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leaveTrainerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  leaveTrainerName: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#4338CA',
  },
  leaveDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  leaveDurationText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#B45309',
  },
  leaveReasonText: {
    fontSize: fontScale(12),
    color: '#475569',
    marginBottom: moderateScale(10),
  },
  leaveActionBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: moderateScale(8),
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(8),
  },
  rejectBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#E11D48',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(8),
    elevation: 1,
  },
  approveBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trainersListHeader: {
    marginBottom: moderateScale(8),
    marginTop: moderateScale(4),
  },
  trainersListTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#334155',
  },
});
