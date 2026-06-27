import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Shadows } from '../../theme';
import { MEMBERSHIP_PLANS, MembershipPlan } from '../../data/mockData';

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  silver: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  gold: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  platinum: { bg: '#EDE9FE', text: '#5B21B6', border: '#A78BFA' },
};

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

export default function MembershipPlansScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>(MEMBERSHIP_PLANS);
  const [addModal, setAddModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);

  // Form
  const [fName, setFName] = useState('');
  const [fDuration, setFDuration] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fOrigPrice, setFOrigPrice] = useState('');
  const [fTier, setFTier] = useState<MembershipPlan['tier']>('bronze');
  const [fFeature, setFFeature] = useState('');

  const openAdd = () => {
    setEditPlan(null);
    setFName(''); setFDuration(''); setFPrice(''); setFOrigPrice('');
    setFTier('bronze'); setFFeature('');
    setAddModal(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditPlan(plan);
    setFName(plan.name);
    setFDuration(String(plan.duration));
    setFPrice(String(plan.price));
    setFOrigPrice(String(plan.originalPrice));
    setFTier(plan.tier);
    setFFeature(plan.features.join(', '));
    setAddModal(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fDuration || !fPrice) {
      Alert.alert('Required', 'Name, duration and price are required.');
      return;
    }
    if (editPlan) {
      setPlans(prev =>
        prev.map(p =>
          p.id === editPlan.id
            ? {
                ...p,
                name: fName.trim(),
                duration: parseInt(fDuration, 10),
                price: parseInt(fPrice, 10),
                originalPrice: parseInt(fOrigPrice, 10) || parseInt(fPrice, 10),
                tier: fTier,
                features: fFeature.split(',').map(f => f.trim()).filter(Boolean),
              }
            : p,
        ),
      );
      Alert.alert('Updated', `${fName} updated!`);
    } else {
      const newPlan: MembershipPlan = {
        id: `plan_${Date.now()}`,
        gymId: 'gym1',
        name: fName.trim(),
        duration: parseInt(fDuration, 10),
        price: parseInt(fPrice, 10),
        originalPrice: parseInt(fOrigPrice, 10) || parseInt(fPrice, 10),
        tier: fTier,
        features: fFeature.split(',').map(f => f.trim()).filter(Boolean),
        isActive: true,
        discount: 0,
      };
      setPlans(prev => [...prev, newPlan]);
      Alert.alert('Created', `${fName} created!`);
    }
    setAddModal(false);
  };

  const togglePause = (plan: MembershipPlan) => {
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
  };

  const deletePlan = (plan: MembershipPlan) => {
    Alert.alert('Delete Plan', `Delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setPlans(prev => prev.filter(p => p.id !== plan.id)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Configure</Text>
              <Text style={styles.headerTitle}>Membership Plans 📋</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ New Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subLabel}>
            {plans.filter(p => p.isActive).length} active plans · {plans.length} total
          </Text>

          {plans.map(plan => {
            const tc = TIER_COLORS[plan.tier];
            const discount = plan.originalPrice > plan.price
              ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
              : 0;
            return (
              <View key={plan.id} style={[styles.planCard, { borderColor: tc.border, opacity: plan.isActive ? 1 : 0.6 }]}>
                {/* Tier badge */}
                <View style={styles.planTop}>
                  <View style={[styles.tierBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                    <Text style={styles.tierIcon}>{TIER_ICONS[plan.tier]}</Text>
                    <Text style={[styles.tierText, { color: tc.text }]}>{plan.tier.toUpperCase()}</Text>
                  </View>
                  {!plan.isActive && (
                    <View style={styles.pausedBadge}>
                      <Text style={styles.pausedText}>PAUSED</Text>
                    </View>
                  )}
                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.planName}>{plan.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>₹{plan.price.toLocaleString('en-IN')}</Text>
                  {discount > 0 && (
                    <Text style={styles.planMRP}>₹{plan.originalPrice.toLocaleString('en-IN')}</Text>
                  )}
                  <Text style={styles.planDuration}> / {plan.duration} month{plan.duration > 1 ? 's' : ''}</Text>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <Text key={i} style={styles.featureItem}>✅ {f}</Text>
                  ))}
                </View>

                <View style={styles.planActions}>
                  <TouchableOpacity style={[styles.planActionBtn, { backgroundColor: LightColors.cyanBg }]} onPress={() => openEdit(plan)}>
                    <Text style={[styles.planActionText, { color: LightColors.info }]}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.planActionBtn, { backgroundColor: plan.isActive ? LightColors.warningBg : LightColors.successBg }]} onPress={() => togglePause(plan)}>
                    <Text style={[styles.planActionText, { color: plan.isActive ? LightColors.warning : LightColors.success }]}>
                      {plan.isActive ? '⏸ Pause' : '▶️ Resume'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.planActionBtn, { backgroundColor: LightColors.dangerBg }]} onPress={() => deletePlan(plan)}>
                    <Text style={[styles.planActionText, { color: LightColors.danger }]}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* MODAL */}
        <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{editPlan ? 'Edit Plan' : 'Create New Plan'}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Plan Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. 6 Month Premium" placeholderTextColor="#94A3B8" value={fName} onChangeText={setFName} />

                <Text style={styles.inputLabel}>Duration (months) *</Text>
                <TextInput style={styles.input} placeholder="e.g. 6" placeholderTextColor="#94A3B8" value={fDuration} onChangeText={setFDuration} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput style={styles.input} placeholder="e.g. 3999" placeholderTextColor="#94A3B8" value={fPrice} onChangeText={setFPrice} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Original MRP (₹)</Text>
                <TextInput style={styles.input} placeholder="e.g. 5500" placeholderTextColor="#94A3B8" value={fOrigPrice} onChangeText={setFOrigPrice} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Tier</Text>
                <View style={styles.tierRow}>
                  {(['bronze', 'silver', 'gold', 'platinum'] as MembershipPlan['tier'][]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tierChip, fTier === t && styles.tierChipActive]}
                      onPress={() => setFTier(t)}
                    >
                      <Text style={styles.tierChipText}>{TIER_ICONS[t]} {t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Features (comma-separated)</Text>
                <TextInput style={[styles.input, { minHeight: 80 }]} placeholder="e.g. Gym access, Trainer, Locker" placeholderTextColor="#94A3B8" value={fFeature} onChangeText={setFFeature} multiline />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                    <Text style={styles.submitBtnText}>{editPlan ? 'Save Changes' : 'Create Plan'}</Text>
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
  scroll: {
    padding: 20, gap: 16, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  subLabel: {
    fontSize: 12, color: LightColors.textMuted, fontWeight: '600', marginBottom: 4,
    width: '90%', maxWidth: 600, alignSelf: 'center',
  },
  planCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 20, borderWidth: 2, ...Shadows.card },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierIcon: { fontSize: 14 },
  tierText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  pausedBadge: { backgroundColor: LightColors.dangerBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pausedText: { fontSize: 9, fontWeight: '800', color: LightColors.danger },
  discountBadge: { backgroundColor: LightColors.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginLeft: 'auto' },
  discountText: { fontSize: 10, fontWeight: '800', color: LightColors.success },
  planName: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  planPrice: { fontSize: 28, fontWeight: '800', color: LightColors.accentViolet },
  planMRP: { fontSize: 14, color: LightColors.textMuted, textDecorationLine: 'line-through', marginLeft: 8 },
  planDuration: { fontSize: 13, color: LightColors.textMuted, fontWeight: '600' },
  featureList: { gap: 6, marginBottom: 20 },
  featureItem: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '500' },
  planActions: { flexDirection: 'row', gap: 10 },
  planActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  planActionText: { fontSize: 12, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: LightColors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: LightColors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: LightColors.bgBase, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tierChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border },
  tierChipActive: { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet },
  tierChipText: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 12 },
  cancelBtn: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
  submitBtn: { flex: 1, backgroundColor: LightColors.accentViolet, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
