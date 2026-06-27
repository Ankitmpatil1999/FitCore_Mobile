import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { Colors } from '../../theme';
import { getPlanById, getTrainerById, getDaysRemaining } from '../../data/mockData';

export default function ProfileScreen({ navigation }: any) {
  const { currentUser, currentMember, currentGym, logout } = useAppContext();
  const plan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const trainer = currentMember ? getTrainerById(currentMember.trainerId) : undefined;
  const daysLeft = currentMember ? getDaysRemaining(currentMember.expiryDate) : 0;

  const [notifMembership, setNotifMembership] = useState(true);
  const [notifWorkout, setNotifWorkout] = useState(true);
  const [notifDiet, setNotifDiet] = useState(false);
  const [notifOffers, setNotifOffers] = useState(true);

  const goalLabel = (g: string) => {
    const map: Record<string, string> = {
      fat_loss: 'Fat Loss', weight_gain: 'Weight Gain',
      muscle_building: 'Muscle Building', general_fitness: 'General Fitness',
    };
    return map[g] ?? g;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerSub}>Account</Text>
            <Text style={styles.headerTitle}>My Profile 👤</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Profile hero */}
          <View style={styles.profileHero}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{currentUser?.avatar ?? 'CH'}</Text>
            </View>
            <Text style={styles.profileName}>{currentUser?.name ?? 'Champion'}</Text>
            <Text style={styles.profilePhone}>📞 {currentUser?.phone ?? '—'}</Text>
            {currentGym && (
              <View style={styles.gymBadge}>
                <Text style={styles.gymBadgeIcon}>🏋️</Text>
                <Text style={styles.gymBadgeText}>{currentGym.name}</Text>
              </View>
            )}
          </View>

          {/* Membership summary */}
          {plan && currentMember && (
            <View style={styles.membershipBar}>
              <View>
                <Text style={styles.membershipBarLabel}>Current Plan</Text>
                <Text style={styles.membershipBarPlan}>{plan.name}</Text>
              </View>
              <View style={styles.membershipBarRight}>
                <Text style={[styles.daysLeft, { color: daysLeft <= 30 ? '#EF4444' : '#10B981' }]}>
                  {daysLeft} days left
                </Text>
                <TouchableOpacity style={styles.renewBtn} onPress={() => navigation?.navigate?.('Membership')}>
                  <Text style={styles.renewBtnText}>Renew</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Personal details */}
          {currentMember && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <View style={styles.detailsGrid}>
                {[
                  { label: 'Age', val: `${currentMember.age} years` },
                  { label: 'Height', val: `${currentMember.height} cm` },
                  { label: 'Weight', val: `${currentMember.weight} kg` },
                  { label: 'BMI', val: `${currentMember.bmi}` },
                  { label: 'Goal', val: goalLabel(currentMember.goal) },
                  { label: 'Email', val: currentMember.email || '—' },
                  { label: 'Medical', val: currentMember.medicalIssues || 'None' },
                  { label: 'Emergency', val: currentMember.emergencyContact || '—' },
                ].map(item => (
                  <View key={item.label} style={styles.detailCell}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailVal}>{item.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trainer */}
          {trainer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Trainer</Text>
              <View style={styles.trainerCard}>
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpec}>{trainer.specialization}</Text>
                  <Text style={styles.trainerTimings}>{trainer.timings}</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatTrainerBtn}
                  onPress={() => navigation?.navigate?.('Trainer Chat')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chatTrainerBtnText}>💬 Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Notification preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            {[
              { label: 'Membership Reminders', sub: 'Expiry & renewal alerts', val: notifMembership, set: setNotifMembership },
              { label: 'Workout Reminders', sub: 'Daily workout alerts', val: notifWorkout, set: setNotifWorkout },
              { label: 'Diet Reminders', sub: 'Meal & water reminders', val: notifDiet, set: setNotifDiet },
              { label: 'Offers & Events', sub: 'Gym offers and events', val: notifOffers, set: setNotifOffers },
            ].map(item => (
              <View key={item.label} style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifLabel}>{item.label}</Text>
                  <Text style={styles.notifSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.val}
                  onValueChange={item.set}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(0, 240, 255, 0.2)' }}
                  thumbColor={item.val ? Colors.accentCyan : '#4B5563'}
                />
              </View>
            ))}
          </View>

          {/* Quick links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            {[
              { icon: '🏷️', label: 'My Membership', tab: 'Membership' },
              { icon: '📅', label: 'Attendance History', tab: 'Check-In' },
              { icon: '📈', label: 'Body Progress', tab: 'Progress' },
              { icon: '💬', label: 'Chat with Trainer', tab: 'Trainer Chat' },
            ].map(item => (
              <TouchableOpacity
                key={item.tab}
                style={styles.quickLinkRow}
                activeOpacity={0.8}
                onPress={() => navigation?.navigate?.(item.tab)}
              >
                <Text style={styles.quickLinkIcon}>{item.icon}</Text>
                <Text style={styles.quickLinkLabel}>{item.label}</Text>
                <Text style={styles.quickLinkArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutBtnText}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgSurface },
  root: { flex: 1, backgroundColor: Colors.bgBase },
  header: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerContent: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  scroll: {
    padding: 20, paddingBottom: 80,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  profileHero: { alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(121, 40, 202, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.accentViolet },
  avatarLargeText: { fontSize: 28, fontWeight: '800', color: Colors.accentViolet },
  profileName: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  profilePhone: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500', marginBottom: 12 },
  gymBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.cyanBg, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.accentCyan },
  gymBadgeIcon: { fontSize: 14 },
  gymBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.accentCyan },
  membershipBar: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  membershipBarLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  membershipBarPlan: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  membershipBarRight: { alignItems: 'flex-end', gap: 8 },
  daysLeft: { fontSize: 13, fontWeight: '800' },
  renewBtn: { backgroundColor: Colors.accentCyan, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  renewBtnText: { fontSize: 12, fontWeight: '700', color: '#000000' },
  section: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailCell: { width: '50%', paddingVertical: 8, paddingRight: 8 },
  detailLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase' },
  detailVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 3 },
  trainerCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trainerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(121, 40, 202, 0.15)', alignItems: 'center', justifyContent: 'center' },
  trainerAvatarText: { fontSize: 16, fontWeight: '800', color: Colors.accentViolet },
  trainerName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  trainerSpec: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  trainerTimings: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  chatTrainerBtn: { backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chatTrainerBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accentCyan },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  notifLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  notifSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  quickLinkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  quickLinkIcon: { fontSize: 20 },
  quickLinkLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  quickLinkArrow: { fontSize: 22, color: Colors.textSecondary },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
