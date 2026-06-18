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

export default function OwnerDashboard() {
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
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
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
            <StatCard icon="💰" value={`₹${analytics.todayRevenue.toLocaleString('en-IN')}`} label="Today's Revenue" color="#8B5CF6" bg="#EDE9FE" />
            <StatCard icon="✅" value={`${analytics.todayCheckIns}`} label="Today's Check-ins" color="#10B981" bg="#ECFDF5" />
            <StatCard icon="👥" value={`${analytics.activeMembers}`} label="Active Members" color="#3B82F6" bg="#EFF6FF" />
            <StatCard icon="⏳" value={`₹${analytics.pendingAmount.toLocaleString('en-IN')}`} label="Pending Payments" color="#EF4444" bg="#FEE2E2" />
          </View>

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setAddMemberModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Add Member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>📢</Text>
              <Text style={styles.actionLabel}>Notify All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>🎁</Text>
              <Text style={styles.actionLabel}>Offers</Text>
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
                      <View style={[styles.memberAvatar, { backgroundColor: '#EDE9FE' }]}>
                        <Text style={[styles.memberAvatarText, { color: '#8B5CF6' }]}>
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
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  gymName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  ownerGreet: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 40 },
  dateChip: { backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start', marginBottom: 20 },
  dateChipText: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionSub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 14, gap: 6 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  urgentPill: { backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  expiryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  expiryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  memberName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  memberPhone: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  daysLeftPill: { backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  daysLeftText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  attendanceCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  checkInRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  checkTime: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 2 },
  durationPill: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  emptyCard: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', padding: 32, marginBottom: 28 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  notifCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, marginBottom: 28, ...Shadows.card },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 10 },
  notifFullRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, gap: 10 },
  notifTypePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 2 },
  notifTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  notifMessage: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 17 },
  notifDate: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginTop: 4 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', ...Shadows.card },
  summaryVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  summaryLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  submitBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
