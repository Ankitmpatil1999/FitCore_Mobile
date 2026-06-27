import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Typography, Spacing, Radii, Shadows } from '../../theme';
import {
  ANALYTICS, MEMBERS, NOTIFICATIONS, ATTENDANCE,
  getNotificationsForOwner, Member, AttendanceRecord,
} from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

const GYM_ID = 'gym1';
const analytics = ANALYTICS[GYM_ID];

export default function OwnerDashboard({ navigation }: any) {
  const { currentUser, currentGym, logout } = useAppContext();
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  // Add-member form
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mAge, setMAge] = useState('');

  const notifications = getNotificationsForOwner(GYM_ID);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance: AttendanceRecord[] = ATTENDANCE.filter(a => a.date === todayStr);

  // Members expiring within 7 days
  const expiring: Member[] = MEMBERS.filter(m => {
    const days = Math.ceil(
      (new Date(m.expiryDate).getTime() - Date.now()) / 86400000,
    );
    return days >= 0 && days <= 7 && m.status === 'active';
  });

  const handleAddMember = () => {
    if (!mName.trim() || !mPhone.trim()) {
      Alert.alert('Required', 'Name and phone are required.');
      return;
    }
    Alert.alert('Member Added', `${mName} has been added successfully!`);
    setMName(''); setMPhone(''); setMEmail(''); setMAge('');
    setAddMemberModal(false);
  };

  const StatCard = ({
    icon, value, label, color, bg,
  }: { icon: string; value: string; label: string; color: string; bg: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.gymName}>{currentGym?.name ?? 'FitCore Elite'}</Text>
              <Text style={styles.ownerGreet}>
                Welcome back, {currentUser?.name?.split(' ')[0] ?? 'Owner'} 👋
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => setNotifModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.notifIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── DATE CHIP ── */}
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              📅 {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>

          {/* ── STATS GRID ── */}
          <View style={styles.statsGrid}>
            <StatCard icon="💰" value={`₹${analytics.todayRevenue.toLocaleString('en-IN')}`} label="Today's Revenue" color={LightColors.accentViolet} bg={`${LightColors.accentViolet}15`} />
            <StatCard icon="✅" value={`${analytics.todayCheckIns}`} label="Today's Check-ins" color={LightColors.success} bg={`${LightColors.success}15`} />
            <StatCard icon="👥" value={`${analytics.activeMembers}`} label="Active Members" color={LightColors.info} bg={`${LightColors.info}15`} />
            <StatCard icon="⏳" value={`₹${analytics.pendingAmount.toLocaleString('en-IN')}`} label="Pending Payments" color={LightColors.danger} bg={`${LightColors.danger}15`} />
          </View>

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionTitle}>Gym Management Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LightColors.accentViolet }]}
              onPress={() => setAddMemberModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Add Member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LightColors.success }]}
              onPress={() => navigation.navigate('Plans')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🏷️</Text>
              <Text style={styles.actionLabel}>Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LightColors.info }]}
              onPress={() => navigation.navigate('Payments')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: LightColors.warning }]}
              onPress={() => navigation.navigate('Shop')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🛒</Text>
              <Text style={styles.actionLabel}>Store</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F43F5E' }]}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>📈</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>

          {/* ── EXPIRING SOON ── */}
          {expiring.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>⚠️ Memberships Expiring Soon</Text>
                <View style={styles.urgentPill}>
                  <Text style={styles.urgentText}>{expiring.length} members</Text>
                </View>
              </View>
              <View style={styles.expiryCard}>
                {expiring.map((m, i) => {
                  const days = Math.ceil(
                    (new Date(m.expiryDate).getTime() - Date.now()) / 86400000,
                  );
                  return (
                    <View key={m.id}>
                      <View style={styles.expiryRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{m.avatar}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberPhone}>{m.phone}</Text>
                        </View>
                        <View style={styles.daysLeftPill}>
                          <Text style={styles.daysLeftText}>{days}d left</Text>
                        </View>
                      </View>
                      {i < expiring.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── TODAY'S CHECK-INS FEED ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Today's Gym Activity</Text>
            <Text style={styles.sectionSub}>{todayAttendance.length} check-ins</Text>
          </View>

          {todayAttendance.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏃</Text>
              <Text style={styles.emptyText}>No check-ins yet today</Text>
            </View>
          ) : (
            <View style={styles.attendanceCard}>
              {todayAttendance.map((a, i) => {
                const member = MEMBERS.find(m => m.id === a.memberId);
                return (
                  <View key={a.id}>
                    <View style={styles.checkInRow}>
                      <View style={[styles.memberAvatar, { backgroundColor: `${LightColors.accentViolet}15` }]}>
                        <Text style={[styles.memberAvatarText, { color: LightColors.accentViolet }]}>
                          {member?.avatar ?? '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{member?.name ?? 'Unknown'}</Text>
                        <Text style={styles.checkTime}>
                          🟢 {a.checkIn} {a.checkOut ? `→ ${a.checkOut}` : '(In Progress)'}
                        </Text>
                      </View>
                      {a.duration && (
                        <Text style={styles.durationPill}>{a.duration}</Text>
                      )}
                    </View>
                    {i < todayAttendance.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── RECENT NOTIFICATIONS ── */}
          <Text style={styles.sectionTitle}>Recent Notifications 🔔</Text>
          <View style={styles.notifCard}>
            {notifications.slice(0, 4).map((n, i) => (
              <View key={n.id}>
                <View style={styles.notifRow}>
                  <View style={[styles.notifTypePill, { backgroundColor: getNotifColor(n.type).bg }]}>
                    <Text style={[styles.notifTypeText, { color: getNotifColor(n.type).text }]}>
                      {n.type.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
                  </View>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>
                {i < 3 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* ── MONTHLY SUMMARY ── */}
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>
                ₹{(analytics.monthlyRevenue / 100000).toFixed(1)}L
              </Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{analytics.totalMembers}</Text>
              <Text style={styles.summaryLabel}>Total Members</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{analytics.expiredMembers}</Text>
              <Text style={styles.summaryLabel}>Expired</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{analytics.totalTrainers}</Text>
              <Text style={styles.summaryLabel}>Trainers</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── ADD MEMBER MODAL ── */}
        <Modal visible={addMemberModal} transparent animationType="slide" onRequestClose={() => setAddMemberModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add New Member</Text>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Rahul Sharma" placeholderTextColor="#94A3B8"
                value={mName} onChangeText={setMName} />

              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput style={styles.input} placeholder="10-digit number" placeholderTextColor="#94A3B8"
                value={mPhone} onChangeText={setMPhone} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#94A3B8"
                value={mEmail} onChangeText={setMEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput style={styles.input} placeholder="e.g. 25" placeholderTextColor="#94A3B8"
                value={mAge} onChangeText={setMAge} keyboardType="numeric" />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddMemberModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddMember}>
                  <Text style={styles.submitBtnText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── NOTIFICATIONS MODAL ── */}
        <Modal visible={notifModal} transparent animationType="slide" onRequestClose={() => setNotifModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>All Notifications</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((n, i) => (
                  <View key={n.id}>
                    <View style={styles.notifFullRow}>
                      <View style={[styles.notifTypePill, { backgroundColor: getNotifColor(n.type).bg }]}>
                        <Text style={[styles.notifTypeText, { color: getNotifColor(n.type).text }]}>
                          {n.type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifTitle}>{n.title}</Text>
                        <Text style={styles.notifMessage}>{n.message}</Text>
                        <Text style={styles.notifDate}>{n.date}</Text>
                      </View>
                    </View>
                    {i < notifications.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.submitBtn} onPress={() => setNotifModal(false)}>
                <Text style={styles.submitBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function getNotifColor(type: string) {
  switch (type) {
    case 'payment': return { bg: '#FEE2E2', text: '#EF4444' };
    case 'member': return { bg: '#ECFDF5', text: '#10B981' };
    case 'stock': return { bg: '#FEF3C7', text: '#F59E0B' };
    case 'expiry': return { bg: '#FEE2E2', text: '#EF4444' };
    default: return { bg: '#EFF6FF', text: '#3B82F6' };
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LightColors.bgSurface },
  root: { flex: 1, backgroundColor: LightColors.bgBase },
  header: {
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerLeft: { flex: 1 },
  gymName: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary, letterSpacing: -0.5 },
  ownerGreet: { fontSize: 13, color: LightColors.textSecondary, marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: LightColors.danger, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  scroll: {
    padding: 20, paddingBottom: 100,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  dateChip: { backgroundColor: `${LightColors.accentViolet}15`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start', marginBottom: 20 },
  dateChipText: { fontSize: 12, fontWeight: '600', color: LightColors.accentViolet },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: LightColors.bgSurface,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: LightColors.border,
    ...Shadows.card,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: LightColors.textMuted, fontWeight: '600', marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: LightColors.textPrimary, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionSub: { fontSize: 12, color: LightColors.textMuted, fontWeight: '600' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionBtn: { width: '18%', minWidth: '18%', flexGrow: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 14, gap: 6 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  urgentPill: { backgroundColor: LightColors.dangerBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText: { fontSize: 11, fontWeight: '700', color: LightColors.danger },
  expiryCard: { backgroundColor: LightColors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: LightColors.border, paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  expiryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: LightColors.successBg, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 13, fontWeight: '800', color: LightColors.success },
  memberName: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  memberPhone: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  daysLeftPill: { backgroundColor: LightColors.dangerBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  daysLeftText: { fontSize: 11, fontWeight: '700', color: LightColors.danger },
  divider: { height: 1, backgroundColor: LightColors.bgElevated },
  attendanceCard: { backgroundColor: LightColors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: LightColors.border, paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  checkInRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  checkTime: { fontSize: 12, color: LightColors.success, fontWeight: '600', marginTop: 2 },
  durationPill: { fontSize: 11, fontWeight: '700', color: LightColors.accentViolet, backgroundColor: `${LightColors.accentViolet}15`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  emptyCard: { backgroundColor: LightColors.bgBase, borderRadius: 12, borderWidth: 1, borderColor: LightColors.border, alignItems: 'center', padding: 32, marginBottom: 28 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13, color: LightColors.textMuted, fontWeight: '500' },
  notifCard: { backgroundColor: LightColors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: LightColors.border, paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 10 },
  notifFullRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, gap: 10 },
  notifTypePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 2 },
  notifTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  notifMessage: { fontSize: 12, color: LightColors.textSecondary, marginTop: 2, lineHeight: 17 },
  notifDate: { fontSize: 10, color: LightColors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LightColors.accentViolet, marginTop: 4 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: LightColors.bgSurface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: LightColors.border, alignItems: 'center', ...Shadows.card },
  summaryVal: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  summaryLabel: { fontSize: 10, color: LightColors.textMuted, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: LightColors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: LightColors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: LightColors.bgBase, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
  submitBtn: { flex: 1, backgroundColor: LightColors.accentViolet, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
