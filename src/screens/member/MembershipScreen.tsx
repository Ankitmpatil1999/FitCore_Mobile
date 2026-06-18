import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { MEMBERSHIP_PLANS, getPlanById, getDaysRemaining, MembershipPlan } from '../../data/mockData';

const TIER_COLORS: Record<string, { gradient: string; text: string }> = {
  bronze: { gradient: '#F59E0B', text: '#92400E' },
  silver: { gradient: '#94A3B8', text: '#334155' },
  gold: { gradient: '#EAB308', text: '#713F12' },
  platinum: { gradient: '#8B5CF6', text: '#4C1D95' },
};

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

export default function MembershipScreen() {
  const { currentMember } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const daysLeft = currentMember ? getDaysRemaining(currentMember.expiryDate) : 0;
  const urgencyColor = daysLeft <= 7 ? '#EF4444' : daysLeft <= 30 ? '#F59E0B' : '#10B981';

  const mockInvoices = [
    { id: 'INV-001', date: '2026-01-15', amount: '₹3,999', plan: currentPlan?.name ?? '—', status: 'Paid' },
    { id: 'INV-002', date: '2025-07-15', amount: '₹2,499', plan: '3 Month Pass', status: 'Paid' },
    { id: 'INV-003', date: '2025-04-15', amount: '₹999', plan: '1 Month Pass', status: 'Paid' },
  ];

  const handleRenew = () => {
    if (!selectedPlan) {
      Alert.alert('Select Plan', 'Please select a plan to renew/upgrade.');
      return;
    }
    const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan);
    Alert.alert('Renew Membership', `Proceed to pay ₹${plan?.price.toLocaleString('en-IN')} for ${plan?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay Now', onPress: () => Alert.alert('Payment', 'Redirecting to payment gateway...') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      <View style={styles.root}>

        <View style={styles.header}>
          <Text style={styles.headerSub}>Your Plan</Text>
          <Text style={styles.headerTitle}>Membership 🏷️</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Current plan card */}
          {currentPlan && currentMember ? (
            <View style={[styles.currentPlanCard, { borderTopColor: TIER_COLORS[currentPlan.tier].gradient }]}>
              <View style={styles.planCardTop}>
                <View>
                  <View style={styles.tierRow}>
                    <Text style={styles.tierIcon}>{TIER_ICONS[currentPlan.tier]}</Text>
                    <Text style={styles.tierLabel}>{currentPlan.tier.toUpperCase()} MEMBER</Text>
                  </View>
                  <Text style={styles.planName}>{currentPlan.name}</Text>
                  <Text style={styles.planPrice}>₹{currentPlan.price.toLocaleString('en-IN')}</Text>
                </View>

                {/* Days left ring */}
                <View style={[styles.daysRing, { borderColor: urgencyColor + '40', backgroundColor: urgencyColor + '10' }]}>
                  <Text style={[styles.daysNum, { color: urgencyColor }]}>{daysLeft}</Text>
                  <Text style={[styles.daysLabel, { color: urgencyColor }]}>days</Text>
                  <Text style={[styles.daysLabel, { color: urgencyColor }]}>left</Text>
                </View>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Joined</Text>
                  <Text style={styles.planDetailVal}>{currentMember.joinDate}</Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Expires</Text>
                  <Text style={[styles.planDetailVal, daysLeft <= 7 && { color: '#EF4444' }]}>
                    {currentMember.expiryDate}
                  </Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Status</Text>
                  <View style={[styles.statusPill, { backgroundColor: currentMember.status === 'active' ? '#ECFDF5' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: currentMember.status === 'active' ? '#10B981' : '#EF4444' }]}>
                      {currentMember.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {
                    width: `${Math.min(100, (daysLeft / (currentPlan.duration * 30)) * 100)}%`,
                    backgroundColor: urgencyColor,
                  }]} />
                </View>
                <Text style={styles.progressLabel}>{daysLeft} days remaining of {currentPlan.duration * 30} days</Text>
              </View>

              {/* Features */}
              <View style={styles.featuresSection}>
                {currentPlan.features.map((f, i) => (
                  <Text key={i} style={styles.featureText}>✅ {f}</Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noPlanCard}>
              <Text style={styles.noPlanIcon}>📋</Text>
              <Text style={styles.noPlanText}>No active membership</Text>
              <Text style={styles.noPlanSub}>Choose a plan below to get started</Text>
            </View>
          )}

          {/* Renew / Upgrade */}
          <Text style={styles.sectionTitle}>Renew or Upgrade Plan</Text>
          <Text style={styles.sectionSub}>Select a plan and tap Proceed to Payment</Text>

          {MEMBERSHIP_PLANS.filter(p => p.isActive).map(plan => {
            const tc = TIER_COLORS[plan.tier];
            const isSelected = selectedPlan === plan.id;
            const isCurrent = plan.id === currentMember?.planId;
            const discount = plan.originalPrice > plan.price
              ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planSelectCard, isSelected && styles.planSelectCardActive]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.85}
              >
                <View style={styles.planSelectTop}>
                  <View style={styles.planSelectLeft}>
                    <Text style={styles.planSelectIcon}>{TIER_ICONS[plan.tier]}</Text>
                    <View>
                      <Text style={styles.planSelectName}>{plan.name}</Text>
                      <Text style={styles.planSelectDuration}>{plan.duration} month{plan.duration > 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <View style={styles.planSelectRight}>
                    {discount > 0 && (
                      <Text style={styles.planSelectMRP}>₹{plan.originalPrice.toLocaleString('en-IN')}</Text>
                    )}
                    <Text style={[styles.planSelectPrice, { color: tc.gradient }]}>
                      ₹{plan.price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current</Text></View>}
                  {isSelected && !isCurrent && <Text style={{ fontSize: 20 }}>✅</Text>}
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.payBtn} onPress={handleRenew} activeOpacity={0.85}>
            <Text style={styles.payBtnText}>
              {selectedPlan
                ? `Proceed to Pay ₹${MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString('en-IN')}`
                : 'Select a Plan to Renew'}
            </Text>
          </TouchableOpacity>

          {/* Invoice history */}
          <Text style={styles.sectionTitle}>Invoice History 🧾</Text>
          <View style={styles.invoiceCard}>
            {mockInvoices.map((inv, i) => (
              <View key={inv.id}>
                <View style={styles.invoiceRow}>
                  <View>
                    <Text style={styles.invoiceId}>{inv.id}</Text>
                    <Text style={styles.invoicePlan}>{inv.plan}</Text>
                    <Text style={styles.invoiceDate}>{inv.date}</Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                    <View style={styles.invoicePaid}>
                      <Text style={styles.invoicePaidText}>{inv.status}</Text>
                    </View>
                    <TouchableOpacity>
                      <Text style={styles.downloadLink}>📄 Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {i < mockInvoices.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  currentPlanCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 28, borderTopWidth: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tierIcon: { fontSize: 20 },
  tierLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  planName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  planPrice: { fontSize: 16, fontWeight: '700', color: '#8B5CF6', marginTop: 4 },
  daysRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  daysNum: { fontSize: 22, fontWeight: '800' },
  daysLabel: { fontSize: 10, fontWeight: '700' },
  planDetails: { gap: 10, marginBottom: 16 },
  planDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planDetailLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  planDetailVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  progressSection: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  featuresSection: { gap: 5 },
  featureText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  noPlanCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 40, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  noPlanIcon: { fontSize: 48, marginBottom: 12 },
  noPlanText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  noPlanSub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginBottom: 14 },
  planSelectCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E2E8F0' },
  planSelectCardActive: { borderColor: '#0EA5E9', backgroundColor: '#F0F9FF' },
  planSelectTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planSelectLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  planSelectIcon: { fontSize: 24 },
  planSelectName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  planSelectDuration: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  planSelectRight: { alignItems: 'flex-end' },
  planSelectMRP: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  planSelectPrice: { fontSize: 18, fontWeight: '800' },
  currentBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  currentBadgeText: { fontSize: 11, fontWeight: '700', color: '#0EA5E9' },
  payBtn: { backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 28, marginTop: 4 },
  payBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  invoiceCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  invoiceId: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.3 },
  invoicePlan: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 3 },
  invoiceDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 5 },
  invoiceAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  invoicePaid: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  invoicePaidText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  downloadLink: { fontSize: 11, color: '#0EA5E9', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
