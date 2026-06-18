import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '../../theme';
import { PAYMENTS, ANALYTICS, Payment, PaymentStatus } from '../../data/mockData';

const GYM_ID = 'gym1';
const analytics = ANALYTICS[GYM_ID];

type FilterType = 'all' | 'completed' | 'pending' | 'refunded';
type MethodType = 'all' | 'upi' | 'cash' | 'online';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [methodFilter, setMethodFilter] = useState<MethodType>('all');

  const filtered = payments.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchStatus && matchMethod;
  });

  const todayTotal = payments.filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);

  const upiTotal = payments.filter(p => p.method === 'upi' && p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);
  const cashTotal = payments.filter(p => p.method === 'cash' && p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);
  const onlineTotal = payments.filter(p => p.method === 'online' && p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);

  const markPaid = (payment: Payment) => {
    Alert.alert('Mark as Paid', `Mark ${payment.memberName}'s ₹${payment.amount} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: () => setPayments(prev =>
          prev.map(p => p.id === payment.id ? { ...p, status: 'completed' } : p),
        ),
      },
    ]);
  };

  const statusColor = (s: PaymentStatus) => {
    if (s === 'completed') return { bg: '#ECFDF5', text: '#10B981' };
    if (s === 'pending') return { bg: '#FEF3C7', text: '#F59E0B' };
    return { bg: '#FEE2E2', text: '#EF4444' };
  };

  const methodIcon = (m: string) => {
    if (m === 'upi') return '📱';
    if (m === 'cash') return '💵';
    return '💳';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Financial</Text>
            <Text style={styles.headerTitle}>Payments 💰</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Revenue hero */}
          <View style={styles.revenueBanner}>
            <View style={styles.revenuePrimary}>
              <Text style={styles.revenueLabel}>Monthly Revenue</Text>
              <Text style={styles.revenueVal}>
                ₹{analytics.monthlyRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.revenueGrowth}>↑ +18.4% from last month</Text>
            </View>
            <View style={styles.revenueSecondary}>
              <View style={styles.revenueMini}>
                <Text style={styles.revenueMiniLabel}>Today</Text>
                <Text style={styles.revenueMiniVal}>₹{todayTotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.revenueMiniDivider} />
              <View style={styles.revenueMini}>
                <Text style={[styles.revenueMiniLabel, { color: '#FCA5A5' }]}>Pending</Text>
                <Text style={[styles.revenueMiniVal, { color: '#FCA5A5' }]}>
                  ₹{pendingTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Method breakdown */}
          <Text style={styles.sectionTitle}>Payment Method Breakdown</Text>
          <View style={styles.methodGrid}>
            <View style={[styles.methodCard, { borderLeftColor: '#8B5CF6' }]}>
              <Text style={styles.methodIcon}>📱</Text>
              <Text style={styles.methodVal}>₹{upiTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.methodLabel}>UPI</Text>
            </View>
            <View style={[styles.methodCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.methodIcon}>💵</Text>
              <Text style={styles.methodVal}>₹{cashTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.methodLabel}>Cash</Text>
            </View>
            <View style={[styles.methodCard, { borderLeftColor: '#3B82F6' }]}>
              <Text style={styles.methodIcon}>💳</Text>
              <Text style={styles.methodVal}>₹{onlineTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.methodLabel}>Online</Text>
            </View>
          </View>

          {/* Pending alert */}
          {payments.filter(p => p.status === 'pending').length > 0 && (
            <View style={styles.pendingAlert}>
              <Text style={styles.pendingAlertIcon}>⚠️</Text>
              <Text style={styles.pendingAlertText}>
                {payments.filter(p => p.status === 'pending').length} payment
                {payments.filter(p => p.status === 'pending').length > 1 ? 's' : ''} pending — ₹{pendingTotal.toLocaleString('en-IN')} to collect
              </Text>
            </View>
          )}

          {/* Filters */}
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.filterRow}>
            {(['all', 'completed', 'pending', 'refunded'] as FilterType[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
                onPress={() => setStatusFilter(f)}
              >
                <Text style={[styles.filterChipText, statusFilter === f && { color: '#FFFFFF' }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.methodFilterRow}>
            {(['all', 'upi', 'cash', 'online'] as MethodType[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodFilterChip, methodFilter === m && styles.methodFilterChipActive]}
                onPress={() => setMethodFilter(m)}
              >
                <Text style={[styles.methodFilterText, methodFilter === m && { color: '#8B5CF6' }]}>
                  {m === 'all' ? 'All Methods' : `${methodIcon(m)} ${m.toUpperCase()}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.countLabel}>{filtered.length} transactions</Text>

          {/* Transaction list */}
          <View style={styles.txList}>
            {filtered.map(tx => {
              const sc = statusColor(tx.status);
              return (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txLeft}>
                    <View style={styles.txAvatar}>
                      <Text style={{ fontSize: 20 }}>{methodIcon(tx.method)}</Text>
                    </View>
                    <View>
                      <Text style={styles.txMember}>{tx.memberName}</Text>
                      <Text style={styles.txDesc}>{tx.description}</Text>
                      <Text style={styles.txDate}>{tx.date}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>₹{tx.amount.toLocaleString('en-IN')}</Text>
                    <View style={[styles.txStatusPill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.txStatusText, { color: sc.text }]}>
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.txId}>{tx.id}</Text>
                    {tx.status === 'pending' && (
                      <TouchableOpacity style={styles.markPaidBtn} onPress={() => markPaid(tx)}>
                        <Text style={styles.markPaidText}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  revenueBanner: { backgroundColor: '#8B5CF6', borderRadius: 20, padding: 20, marginBottom: 20 },
  revenuePrimary: { marginBottom: 16 },
  revenueLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  revenueVal: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  revenueGrowth: { fontSize: 12, color: '#A7F3D0', fontWeight: '600', marginTop: 4 },
  revenueSecondary: { flexDirection: 'row', alignItems: 'center' },
  revenueMini: { flex: 1 },
  revenueMiniLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  revenueMiniVal: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  revenueMiniDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  methodGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  methodCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 3, alignItems: 'center', ...Shadows.card },
  methodIcon: { fontSize: 22, marginBottom: 6 },
  methodVal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  methodLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 3 },
  pendingAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#FCD34D' },
  pendingAlertIcon: { fontSize: 18 },
  pendingAlertText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400E' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterChip: { flex: 1, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  methodFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  methodFilterChip: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  methodFilterChipActive: { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' },
  methodFilterText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  countLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 12 },
  txList: { gap: 12 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card },
  txLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  txAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  txMember: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txDesc: { fontSize: 12, color: '#475569', marginTop: 2 },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  txStatusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  txStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  txId: { fontSize: 9, color: '#94A3B8', fontWeight: '600', letterSpacing: 0.3 },
  markPaidBtn: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  markPaidText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
});
