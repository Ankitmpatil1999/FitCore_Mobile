import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Modal, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Shadows } from '../../theme';
import {
  MEMBERS, MEMBERSHIP_PLANS, TRAINERS, Member, MemberStatus,
  getPlanById, getTrainerById, getDaysRemaining,
} from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

type FilterType = 'all' | 'active' | 'expired' | 'frozen';

export default function MembersScreen() {
  const { currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';

  const [members, setMembers] = useState<Member[]>(() => MEMBERS.filter(m => m.gymId === gymId || !m.gymId || m.gymId === 'gym1'));
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  // Form state
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fAge, setFAge] = useState('');
  const [fHeight, setFHeight] = useState('');
  const [fWeight, setFWeight] = useState('');
  const [fGoal, setFGoal] = useState<Member['goal']>('general_fitness');
  const [fMedical, setFMedical] = useState('');
  const [fEmContact, setFEmContact] = useState('');
  const [fPlanId, setFPlanId] = useState('plan1');

  const filtered = members.filter(m => {
    const matchFilter = filter === 'all' || m.status === filter;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const handleAdd = () => {
    if (!fName.trim() || !fPhone.trim()) {
      Alert.alert('Required', 'Name and phone are required.');
      return;
    }
    const heightN = parseFloat(fHeight) || 170;
    const weightN = parseFloat(fWeight) || 70;
    const bmi = parseFloat((weightN / ((heightN / 100) ** 2)).toFixed(1));
    const newMember: Member = {
      id: `m${Date.now()}`,
      userId: `u${Date.now()}`,
      gymId: gymId,
      name: fName.trim(),
      phone: fPhone.trim(),
      email: fEmail.trim(),
      avatar: fName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      age: parseInt(fAge, 10) || 25,
      height: heightN,
      weight: weightN,
      bmi,
      goal: fGoal,
      medicalIssues: fMedical.trim() || 'None',
      emergencyContact: fEmContact.trim(),
      emergencyPhone: '',
      planId: fPlanId,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: (() => {
        const plan = getPlanById(fPlanId);
        const d = new Date();
        d.setMonth(d.getMonth() + (plan?.duration ?? 1));
        return d.toISOString().split('T')[0];
      })(),
      trainerId: 't1',
      photo: '',
    };
    setMembers(prev => [newMember, ...prev]);
    Alert.alert('Success', `${fName} added successfully!`);
    setAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFName(''); setFPhone(''); setFEmail(''); setFAge('');
    setFHeight(''); setFWeight(''); setFGoal('general_fitness');
    setFMedical(''); setFEmContact(''); setFPlanId('plan1');
  };

  const toggleFreeze = (m: Member) => {
    setMembers(prev =>
      prev.map(x =>
        x.id === m.id
          ? { ...x, status: x.status === 'frozen' ? 'active' : 'frozen' }
          : x,
      ),
    );
    setDetailMember(null);
  };

  const removeMember = (m: Member) => {
    Alert.alert('Remove Member', `Remove ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          setMembers(prev => prev.filter(x => x.id !== m.id));
          setDetailMember(null);
        },
      },
    ]);
  };

  const statusColor = (s: MemberStatus) => {
    if (s === 'active') return { bg: LightColors.successBg, text: LightColors.success };
    if (s === 'expired') return { bg: LightColors.dangerBg, text: LightColors.danger };
    return { bg: LightColors.warningBg, text: LightColors.warning };
  };

  const goalLabel = (g: Member['goal']) => {
    const map: Record<Member['goal'], string> = {
      fat_loss: 'Fat Loss',
      weight_gain: 'Weight Gain',
      muscle_building: 'Muscle Building',
      general_fitness: 'General Fitness',
    };
    return map[g];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Manage</Text>
              <Text style={styles.headerTitle}>Members 👥</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add Member</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FILTER TABS */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'expired', 'frozen'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.countLabel}>{filtered.length} members</Text>

        {/* MEMBER LIST */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          )}
          {filtered.map(m => {
            const plan = getPlanById(m.planId);
            const daysLeft = getDaysRemaining(m.expiryDate);
            const sc = statusColor(m.status);
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberCard}
                activeOpacity={0.85}
                onPress={() => setDetailMember(m)}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{m.avatar}</Text>
                  </View>
                </View>
                <View style={styles.cardMid}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberPhone}>{m.phone}</Text>
                  <Text style={styles.memberPlan}>{plan?.name ?? 'No Plan'}</Text>
                  <Text style={[styles.memberDays, daysLeft <= 7 && { color: '#EF4444' }]}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>
                      {m.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.goalChip}>{goalLabel(m.goal)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── MEMBER DETAIL MODAL ── */}
        <Modal visible={!!detailMember} transparent animationType="slide" onRequestClose={() => setDetailMember(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              {detailMember && (() => {
                const plan = getPlanById(detailMember.planId);
                const trainer = getTrainerById(detailMember.trainerId);
                const daysLeft = getDaysRemaining(detailMember.expiryDate);
                const sc = statusColor(detailMember.status);
                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Avatar header */}
                    <View style={styles.detailAvatarRow}>
                      <View style={[styles.avatar, { width: 64, height: 64, borderRadius: 32 }]}>
                        <Text style={[styles.avatarText, { fontSize: 22 }]}>{detailMember.avatar}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={styles.detailName}>{detailMember.name}</Text>
                        <Text style={styles.detailPhone}>📞 {detailMember.phone}</Text>
                        <View style={[styles.statusPill, { backgroundColor: sc.bg, alignSelf: 'flex-start', marginTop: 6 }]}>
                          <Text style={[styles.statusText, { color: sc.text }]}>{detailMember.status.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Info grid */}
                    <View style={styles.detailGrid}>
                      <DetailItem label="Age" value={`${detailMember.age} yrs`} />
                      <DetailItem label="Height" value={`${detailMember.height} cm`} />
                      <DetailItem label="Weight" value={`${detailMember.weight} kg`} />
                      <DetailItem label="BMI" value={`${detailMember.bmi}`} />
                      <DetailItem label="Goal" value={goalLabel(detailMember.goal)} />
                      <DetailItem label="Email" value={detailMember.email || '—'} />
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Membership</Text>
                      <Text style={styles.detailRow}>📋 Plan: {plan?.name ?? '—'}</Text>
                      <Text style={styles.detailRow}>📅 Joined: {detailMember.joinDate}</Text>
                      <Text style={styles.detailRow}>⏰ Expires: {detailMember.expiryDate}</Text>
                      <Text style={[styles.detailRow, daysLeft <= 7 && { color: '#EF4444' }]}>
                        ⏳ {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                      </Text>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Trainer & Health</Text>
                      <Text style={styles.detailRow}>🏋️ Trainer: {trainer?.name ?? '—'}</Text>
                      <Text style={styles.detailRow}>🏥 Medical: {detailMember.medicalIssues}</Text>
                      <Text style={styles.detailRow}>🆘 Emergency: {detailMember.emergencyContact}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: LightColors.warningBg }]} onPress={() => toggleFreeze(detailMember)}>
                        <Text style={[styles.actionBtnText, { color: LightColors.warning }]}>
                          {detailMember.status === 'frozen' ? '▶️ Unfreeze' : '❄️ Freeze'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: LightColors.successBg }]}>
                        <Text style={[styles.actionBtnText, { color: LightColors.success }]}>🔄 Renew</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: LightColors.dangerBg }]} onPress={() => removeMember(detailMember)}>
                        <Text style={[styles.actionBtnText, { color: LightColors.danger }]}>🗑️ Remove</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailMember(null)}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>

        {/* ── ADD MEMBER MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => { setAddModal(false); resetForm(); }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add New Member</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <FormField label="Full Name *" placeholder="John Doe" value={fName} onChange={setFName} />
                <FormField label="Mobile Number *" placeholder="10-digit phone" value={fPhone} onChange={setFPhone} keyboard="phone-pad" />
                <FormField label="Email" placeholder="email@example.com" value={fEmail} onChange={setFEmail} keyboard="email-address" />
                <FormField label="Age" placeholder="e.g. 25" value={fAge} onChange={setFAge} keyboard="numeric" />
                <FormField label="Height (cm)" placeholder="e.g. 175" value={fHeight} onChange={setFHeight} keyboard="numeric" />
                <FormField label="Weight (kg)" placeholder="e.g. 70" value={fWeight} onChange={setFWeight} keyboard="numeric" />
                <FormField label="Medical Issues" placeholder="None / details" value={fMedical} onChange={setFMedical} />
                <FormField label="Emergency Contact Name" placeholder="e.g. Suresh" value={fEmContact} onChange={setFEmContact} />

                <Text style={styles.inputLabel}>Membership Plan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {MEMBERSHIP_PLANS.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.planChip, fPlanId === p.id && styles.planChipActive]}
                      onPress={() => setFPlanId(p.id)}
                    >
                      <Text style={[styles.planChipText, fPlanId === p.id && { color: '#FFFFFF' }]}>
                        {p.name} — ₹{p.price}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Goal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {(['fat_loss', 'weight_gain', 'muscle_building', 'general_fitness'] as Member['goal'][]).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.planChip, fGoal === g && styles.planChipActive]}
                      onPress={() => setFGoal(g)}
                    >
                      <Text style={[styles.planChipText, fGoal === g && { color: '#FFFFFF' }]}>
                        {g.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddModal(false); resetForm(); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                    <Text style={styles.submitBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailItemStyles.box}>
      <Text style={detailItemStyles.label}>{label}</Text>
      <Text style={detailItemStyles.value}>{value}</Text>
    </View>
  );
}
const detailItemStyles = StyleSheet.create({
  box: { width: '50%', paddingVertical: 8, paddingHorizontal: 4 },
  label: { fontSize: 10, fontWeight: '600', color: LightColors.textMuted, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary, marginTop: 3 },
});

function FormField({
  label, placeholder, value, onChange, keyboard,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  keyboard?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
}) {
  return (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
      />
    </>
  );
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary },
  addBtn: { backgroundColor: LightColors.accentViolet, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LightColors.accentViolet },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: LightColors.bgSurface,
    marginHorizontal: 16, marginTop: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: LightColors.border,
    width: '90%', maxWidth: 600, alignSelf: 'center',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: LightColors.textPrimary },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8,
    width: '90%', maxWidth: 600, alignSelf: 'center',
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: LightColors.bgElevated, alignItems: 'center' },
  filterTabActive: { backgroundColor: LightColors.accentViolet },
  filterTabText: { fontSize: 11, fontWeight: '700', color: LightColors.textMuted },
  filterTabTextActive: { color: '#FFFFFF' },
  countLabel: {
    fontSize: 12, color: LightColors.textMuted, fontWeight: '600', paddingHorizontal: 16, marginTop: 10, marginBottom: 4,
    width: '90%', maxWidth: 600, alignSelf: 'center',
  },
  list: {
    padding: 16, gap: 12, paddingBottom: 100,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  memberCard: { flexDirection: 'row', backgroundColor: LightColors.bgSurface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LightColors.border, gap: 12, ...Shadows.card },
  cardLeft: {},
  cardMid: { flex: 1, gap: 3 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${LightColors.accentViolet}15`, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: LightColors.accentViolet },
  memberName: { fontSize: 15, fontWeight: '700', color: LightColors.textPrimary },
  memberPhone: { fontSize: 12, color: LightColors.textMuted },
  memberPlan: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '600' },
  memberDays: { fontSize: 12, color: LightColors.success, fontWeight: '600' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  goalChip: { fontSize: 10, fontWeight: '600', color: LightColors.accentViolet, backgroundColor: `${LightColors.accentViolet}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: LightColors.textMuted, fontWeight: '500' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: LightColors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: LightColors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: LightColors.bgBase, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 12 },
  cancelBtn: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
  submitBtn: { flex: 1, backgroundColor: LightColors.accentViolet, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  planChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: LightColors.bgElevated, marginRight: 8, borderWidth: 1, borderColor: LightColors.border },
  planChipActive: { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet },
  planChipText: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary },
  // Detail modal
  detailAvatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailName: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  detailPhone: { fontSize: 13, color: LightColors.textSecondary, marginTop: 4 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: LightColors.bgBase, borderRadius: 12, padding: 12, marginBottom: 16 },
  detailSection: { backgroundColor: LightColors.bgBase, borderRadius: 12, padding: 14, marginBottom: 16 },
  detailSectionTitle: { fontSize: 13, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 10 },
  detailRow: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '500', marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: LightColors.textPrimary },
  closeBtn: { backgroundColor: LightColors.bgElevated, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
});
