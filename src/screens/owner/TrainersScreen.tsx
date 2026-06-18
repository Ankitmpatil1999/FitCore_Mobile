import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '../../theme';
import { TRAINERS, MEMBERS, Trainer } from '../../data/mockData';

export default function TrainersScreen() {
  const [trainers, setTrainers] = useState<Trainer[]>(TRAINERS);
  const [addModal, setAddModal] = useState(false);
  const [detailTrainer, setDetailTrainer] = useState<Trainer | null>(null);

  // Form
  const [fName, setFName] = useState('');
  const [fSpec, setFSpec] = useState('');
  const [fExp, setFExp] = useState('');
  const [fSalary, setFSalary] = useState('');
  const [fTimings, setFTimings] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fCerts, setFCerts] = useState('');
  const [fAvail, setFAvail] = useState(true);

  const resetForm = () => {
    setFName(''); setFSpec(''); setFExp(''); setFSalary('');
    setFTimings(''); setFPhone(''); setFCerts(''); setFAvail(true);
  };

  const handleAdd = () => {
    if (!fName.trim() || !fSpec.trim()) {
      Alert.alert('Required', 'Name and specialization are required.');
      return;
    }
    const newTrainer: Trainer = {
      id: `t${Date.now()}`,
      gymId: 'gym1',
      name: fName.trim(),
      avatar: fName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      specialization: fSpec.trim(),
      experience: fExp.trim(),
      salary: fSalary.trim(),
      timings: fTimings.trim(),
      available: fAvail,
      assignedMemberIds: [],
      certifications: fCerts.trim(),
      phone: fPhone.trim(),
      joinDate: new Date().toISOString().split('T')[0],
    };
    setTrainers(prev => [...prev, newTrainer]);
    Alert.alert('Success', `${fName} has been added!`);
    setAddModal(false);
    resetForm();
  };

  const toggleAvail = (trainer: Trainer) => {
    setTrainers(prev =>
      prev.map(t => t.id === trainer.id ? { ...t, available: !t.available } : t),
    );
    if (detailTrainer?.id === trainer.id) {
      setDetailTrainer(prev => prev ? { ...prev, available: !prev.available } : null);
    }
  };

  const removeTrainer = (trainer: Trainer) => {
    Alert.alert('Remove Trainer', `Remove ${trainer.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          setTrainers(prev => prev.filter(t => t.id !== trainer.id));
          setDetailTrainer(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Manage</Text>
            <Text style={styles.headerTitle}>Trainers 🏋️</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add Trainer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subLabel}>{trainers.filter(t => t.available).length} available · {trainers.length} total</Text>

          {trainers.map(trainer => {
            const assigned = MEMBERS.filter(m => trainer.assignedMemberIds.includes(m.id));
            return (
              <TouchableOpacity
                key={trainer.id}
                style={styles.trainerCard}
                activeOpacity={0.85}
                onPress={() => setDetailTrainer(trainer)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{trainer.avatar}</Text>
                  </View>
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <Text style={styles.trainerSpec}>{trainer.specialization}</Text>
                    <Text style={styles.trainerExp}>🎓 {trainer.experience} experience</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.availPill, { backgroundColor: trainer.available ? '#ECFDF5' : '#FEE2E2' }]}
                    onPress={() => toggleAvail(trainer)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.availText, { color: trainer.available ? '#10B981' : '#EF4444' }]}>
                      {trainer.available ? '● Active' : '○ Busy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatVal}>{assigned.length}</Text>
                    <Text style={styles.cardStatLabel}>Members</Text>
                  </View>
                  <View style={styles.cardStatDivider} />
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatVal}>{trainer.salary || '—'}</Text>
                    <Text style={styles.cardStatLabel}>Salary</Text>
                  </View>
                  <View style={styles.cardStatDivider} />
                  <View style={[styles.cardStat, { flex: 2 }]}>
                    <Text style={styles.cardStatVal} numberOfLines={1}>{trainer.timings || '—'}</Text>
                    <Text style={styles.cardStatLabel}>Timings</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* DETAIL MODAL */}
        <Modal visible={!!detailTrainer} transparent animationType="slide" onRequestClose={() => setDetailTrainer(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
              <View style={styles.modalHandle} />
              {detailTrainer && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailHeader}>
                    <View style={[styles.avatar, { width: 64, height: 64, borderRadius: 32 }]}>
                      <Text style={[styles.avatarText, { fontSize: 22 }]}>{detailTrainer.avatar}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.detailName}>{detailTrainer.name}</Text>
                      <Text style={styles.detailSpec}>{detailTrainer.specialization}</Text>
                      <TouchableOpacity
                        style={[styles.availPill, { backgroundColor: detailTrainer.available ? '#ECFDF5' : '#FEE2E2', alignSelf: 'flex-start', marginTop: 8 }]}
                        onPress={() => toggleAvail(detailTrainer)}
                      >
                        <Text style={[styles.availText, { color: detailTrainer.available ? '#10B981' : '#EF4444' }]}>
                          {detailTrainer.available ? '● Available — Tap to set Busy' : '○ Busy — Tap to set Available'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.detailGrid}>
                    {[
                      { label: 'Experience', val: detailTrainer.experience },
                      { label: 'Phone', val: detailTrainer.phone || '—' },
                      { label: 'Salary', val: detailTrainer.salary || '—' },
                      { label: 'Joined', val: detailTrainer.joinDate },
                    ].map(item => (
                      <View key={item.label} style={styles.detailCell}>
                        <Text style={styles.detailCellLabel}>{item.label}</Text>
                        <Text style={styles.detailCellVal}>{item.val}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>⏱ Timings</Text>
                    <Text style={styles.detailText}>{detailTrainer.timings || '—'}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📜 Certifications</Text>
                    <Text style={styles.detailText}>{detailTrainer.certifications || '—'}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>👥 Assigned Members ({detailTrainer.assignedMemberIds.length})</Text>
                    {MEMBERS.filter(m => detailTrainer.assignedMemberIds.includes(m.id)).map(m => (
                      <View key={m.id} style={styles.assignedRow}>
                        <View style={styles.smallAvatar}>
                          <Text style={styles.smallAvatarText}>{m.avatar}</Text>
                        </View>
                        <Text style={styles.assignedName}>{m.name}</Text>
                        <Text style={styles.assignedPhone}>{m.phone}</Text>
                      </View>
                    ))}
                    {detailTrainer.assignedMemberIds.length === 0 && (
                      <Text style={styles.detailText}>No members assigned yet.</Text>
                    )}
                  </View>

                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeTrainer(detailTrainer)}>
                    <Text style={styles.removeBtnText}>🗑️ Remove Trainer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailTrainer(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* ADD MODAL */}
        <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => { setAddModal(false); resetForm(); }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add New Trainer</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Full Name *', val: fName, set: setFName, ph: 'e.g. Vikram Singh' },
                  { label: 'Specialization *', val: fSpec, set: setFSpec, ph: 'e.g. Strength & HIIT' },
                  { label: 'Experience', val: fExp, set: setFExp, ph: 'e.g. 5 years' },
                  { label: 'Salary', val: fSalary, set: setFSalary, ph: 'e.g. ₹30,000/month' },
                  { label: 'Timings', val: fTimings, set: setFTimings, ph: 'e.g. 6AM-11AM & 5PM-9PM' },
                  { label: 'Phone', val: fPhone, set: setFPhone, ph: '10-digit number' },
                  { label: 'Certifications', val: fCerts, set: setFCerts, ph: 'e.g. ACE, NSCA-CPT' },
                ].map(field => (
                  <View key={field.label}>
                    <Text style={styles.inputLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.ph}
                      placeholderTextColor="#94A3B8"
                      value={field.val}
                      onChangeText={field.set}
                      keyboardType={field.label === 'Phone' ? 'phone-pad' : 'default'}
                    />
                  </View>
                ))}

                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Available Now</Text>
                  <Switch
                    value={fAvail}
                    onValueChange={setFAvail}
                    trackColor={{ false: '#CBD5E1', true: '#C4B5FD' }}
                    thumbColor={fAvail ? '#8B5CF6' : '#F8FAFC'}
                  />
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddModal(false); resetForm(); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                    <Text style={styles.submitBtnText}>Add Trainer</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  subLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
  trainerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#8B5CF6' },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  trainerSpec: { fontSize: 13, color: '#475569', marginTop: 2 },
  trainerExp: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  availPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  availText: { fontSize: 11, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9' },
  cardBottom: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatVal: { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  cardStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  cardStatDivider: { width: 1, backgroundColor: '#E2E8F0' },
  // Detail
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  detailName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  detailSpec: { fontSize: 14, color: '#475569', marginTop: 4 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  detailCell: { width: '50%', padding: 8 },
  detailCellLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  detailCellVal: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 3 },
  detailSection: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 12 },
  detailSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  detailText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  assignedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  smallAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { fontSize: 11, fontWeight: '800', color: '#8B5CF6' },
  assignedName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0F172A' },
  assignedPhone: { fontSize: 11, color: '#94A3B8' },
  removeBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  removeBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  closeBtn: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  submitBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
