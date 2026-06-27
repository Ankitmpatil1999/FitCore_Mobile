import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors, Shadows } from '../../theme';
import { PAYMENTS, MEMBERS, Payment, Member } from '../../data/mockData';

// ── Analytics data derived from mockData ────────────────────────

const REVENUE_MONTHS = [
  { label: 'Jan', value: 28500 },
  { label: 'Feb', value: 34200 },
  { label: 'Mar', value: 41800 },
  { label: 'Apr', value: 38600 },
  { label: 'May', value: 52100 },
  { label: 'Jun', value: 46950 },
];

const MEMBER_GROWTH = [
  { label: 'Jan', value: 68 },
  { label: 'Feb', value: 79 },
  { label: 'Mar', value: 91 },
  { label: 'Apr', value: 107 },
  { label: 'May', value: 122 },
  { label: 'Jun', value: 138 },
];

const PRODUCT_SALES = [
  { label: 'Whey', value: 89 },
  { label: 'Creatine', value: 67 },
  { label: 'Pre-WO', value: 45 },
  { label: 'Mass\nGainer', value: 32 },
  { label: 'BCAA', value: 54 },
  { label: 'PB', value: 78 },
];

const PEAK_HOURS = [
  { label: '5am', value: 12 },
  { label: '6am', value: 38 },
  { label: '7am', value: 65 },
  { label: '8am', value: 82 },
  { label: '9am', value: 55 },
  { label: '10am', value: 30 },
  { label: '5pm', value: 60 },
  { label: '6pm', value: 88 },
  { label: '7pm', value: 95 },
  { label: '8pm', value: 70 },
  { label: '9pm', value: 35 },
];

type ChartMode = 'revenue' | 'members' | 'products' | 'peak';

export default function OwnerAnalytics() {
  const { currentGym } = useAppContext();
  const [chartMode, setChartMode] = useState<ChartMode>('revenue');

  const gym = currentGym;

  // Derived stats from mockData
  const totalRevenue = PAYMENTS.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const thisMonthRevenue = PAYMENTS.filter(p => p.status === 'completed' && p.date.startsWith('2026-06')).reduce((s, p) => s + p.amount, 0);
  const activeMembers = MEMBERS.filter(m => m.gymId === 'gym1' && m.status === 'active').length;
  const expiredMembers = MEMBERS.filter(m => m.gymId === 'gym1' && m.status === 'expired').length;
  const totalMembers = MEMBERS.filter(m => m.gymId === 'gym1').length;
  const pendingPayments = PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const renewalRate = Math.round((activeMembers / Math.max(totalMembers, 1)) * 100);

  // Chart data and config
  const chartConfigs: Record<ChartMode, { data: { label: string; value: number }[]; color: string; unit: string; title: string; subtitle: string }> = {
    revenue: {
      data: REVENUE_MONTHS, color: LightColors.accentViolet, unit: 'K',
      title: 'Monthly Revenue', subtitle: '6-month trend (₹ thousands)',
    },
    members: {
      data: MEMBER_GROWTH, color: LightColors.info, unit: '',
      title: 'Member Growth', subtitle: 'Total members over 6 months',
    },
    products: {
      data: PRODUCT_SALES, color: LightColors.success, unit: ' sold',
      title: 'Product Sales', subtitle: 'Top selling products this month',
    },
    peak: {
      data: PEAK_HOURS, color: LightColors.warning, unit: '',
      title: 'Peak Hours', subtitle: 'Average daily check-ins per hour',
    },
  };

  const current = chartConfigs[chartMode];
  const maxVal = Math.max(...current.data.map(d => d.value));
  const MIN_BAR_PCT = 8; // minimum visible height

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>{gym?.name ?? 'FitCore'} · Analytics</Text>
              <Text style={styles.headerTitle}>Reports & Insights 📈</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>LIVE DATA</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── KPI CARDS ── */}
          <View style={styles.kpiGrid}>
            {[
              { icon: '💰', label: 'Total Revenue', val: `₹${(totalRevenue / 1000).toFixed(1)}K`, color: LightColors.accentViolet, bg: `${LightColors.accentViolet}15` },
              { icon: '📅', label: 'This Month', val: `₹${(thisMonthRevenue / 1000).toFixed(1)}K`, color: LightColors.info, bg: LightColors.cyanBg },
              { icon: '✅', label: 'Active Members', val: activeMembers.toString(), color: LightColors.success, bg: LightColors.successBg },
              { icon: '⏰', label: 'Expired', val: expiredMembers.toString(), color: LightColors.danger, bg: LightColors.dangerBg },
              { icon: '🔄', label: 'Renewal Rate', val: `${renewalRate}%`, color: LightColors.warning, bg: LightColors.warningBg },
              { icon: '⚠️', label: 'Pending Dues', val: `₹${(pendingPayments / 1000).toFixed(1)}K`, color: LightColors.danger, bg: LightColors.dangerBg },
            ].map(kpi => (
              <View key={kpi.label} style={[styles.kpiCard, { backgroundColor: kpi.bg }]}>
                <Text style={styles.kpiIcon}>{kpi.icon}</Text>
                <Text style={[styles.kpiVal, { color: kpi.color }]}>{kpi.val}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* ── CHART TABS ── */}
          <View style={styles.chartTabs}>
            {(['revenue', 'members', 'products', 'peak'] as ChartMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.chartTab, chartMode === mode && styles.chartTabActive]}
                onPress={() => setChartMode(mode)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chartTabText, chartMode === mode && styles.chartTabTextActive]}>
                  {mode === 'revenue' ? 'Revenue' : mode === 'members' ? 'Members' : mode === 'products' ? 'Products' : 'Peak Hours'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── BAR CHART ── */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{current.title}</Text>
            <Text style={styles.chartSubtitle}>{current.subtitle}</Text>
            <View style={styles.chartArea}>
              {current.data.map((d, i) => {
                const pct = maxVal > 0 ? MIN_BAR_PCT + ((d.value / maxVal) * (100 - MIN_BAR_PCT)) : MIN_BAR_PCT;
                const isLast = i === current.data.length - 1;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barVal, { color: current.color }]}>
                      {chartMode === 'revenue'
                        ? `${(d.value / 1000).toFixed(0)}K`
                        : `${d.value}${current.unit}`}
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        {
                          height: `${pct}%`,
                          backgroundColor: current.color,
                          opacity: isLast ? 1 : 0.55 + (i / current.data.length) * 0.45,
                        },
                      ]} />
                    </View>
                    <Text style={styles.barLabel} numberOfLines={2}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── REVENUE BREAKDOWN ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💰 Revenue Breakdown</Text>
            {[
              { label: 'UPI Payments', val: PAYMENTS.filter(p => p.method === 'upi' && p.status === 'completed').reduce((s, p) => s + p.amount, 0), color: LightColors.accentViolet },
              { label: 'Cash Payments', val: PAYMENTS.filter(p => p.method === 'cash' && p.status === 'completed').reduce((s, p) => s + p.amount, 0), color: LightColors.success },
              { label: 'Online / Card', val: PAYMENTS.filter(p => p.method === 'online' && p.status === 'completed').reduce((s, p) => s + p.amount, 0), color: LightColors.info },
            ].map(row => {
              const pct = totalRevenue > 0 ? Math.round((row.val / totalRevenue) * 100) : 0;
              return (
                <View key={row.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: row.color }]} />
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: row.color }]} />
                    </View>
                    <Text style={[styles.breakdownVal, { color: row.color }]}>
                      ₹{row.val.toLocaleString('en-IN')} ({pct}%)
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── MEMBER STATUS DONUT (simulated) ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>👥 Member Status Overview</Text>
            <View style={styles.memberStatusGrid}>
              {[
                { label: 'Active', count: activeMembers, color: LightColors.success, bg: LightColors.successBg, pct: Math.round((activeMembers / Math.max(totalMembers, 1)) * 100) },
                { label: 'Expired', count: expiredMembers, color: LightColors.danger, bg: LightColors.dangerBg, pct: Math.round((expiredMembers / Math.max(totalMembers, 1)) * 100) },
                { label: 'Frozen', count: MEMBERS.filter(m => m.status === 'frozen').length, color: LightColors.info, bg: LightColors.cyanBg, pct: Math.round((MEMBERS.filter(m => m.status === 'frozen').length / Math.max(totalMembers, 1)) * 100) },
              ].map(item => (
                <View key={item.label} style={[styles.memberStatusCard, { backgroundColor: item.bg }]}>
                  <Text style={[styles.memberStatusCount, { color: item.color }]}>{item.count}</Text>
                  <Text style={[styles.memberStatusLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={[styles.memberStatusPct, { color: item.color }]}>{item.pct}%</Text>
                </View>
              ))}
            </View>
            {/* Visual progress bar for active members */}
            <View style={styles.totalBar}>
              <View style={[styles.totalBarFill, { width: `${renewalRate}%`, backgroundColor: LightColors.success }]} />
              {expiredMembers > 0 && <View style={[styles.totalBarFill, { width: `${Math.round((expiredMembers / Math.max(totalMembers, 1)) * 100)}%`, backgroundColor: LightColors.danger }]} />}
            </View>
            <Text style={styles.totalBarLabel}>{totalMembers} Total Registered Members</Text>
          </View>

          {/* ── TOP INSIGHTS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏆 Business Insights</Text>
            {[
              { icon: '🔥', label: 'Peak Check-in Hour', val: '7:00 PM — 8:00 PM' },
              { icon: '📅', label: 'Most Active Day', val: 'Monday & Thursday' },
              { icon: '💊', label: 'Top Selling Product', val: 'Whey Protein (89 sold)' },
              { icon: '🎯', label: 'Avg Revenue/Member', val: `₹${Math.round(totalRevenue / Math.max(totalMembers, 1)).toLocaleString('en-IN')}` },
              { icon: '🔄', label: 'Renewal Rate', val: `${renewalRate}% of members active` },
              { icon: '⭐', label: 'Gym Rating', val: `${gym?.rating ?? '4.8'} / 5.0 ★` },
            ].map(insight => (
              <View key={insight.label} style={styles.insightRow}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>{insight.label}</Text>
                  <Text style={styles.insightVal}>{insight.val}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── RECENT PAYMENTS LEDGER ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧾 Recent Payments</Text>
            {PAYMENTS.slice(0, 6).map((tx: Payment, idx) => (
              <View key={tx.id} style={[styles.txRow, idx < Math.min(PAYMENTS.length, 6) - 1 && { borderBottomWidth: 1, borderBottomColor: LightColors.bgElevated }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txId}>{tx.id}</Text>
                  <Text style={styles.txMember}>{tx.memberName}</Text>
                  <Text style={styles.txDesc}>{tx.description} · {tx.date}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmt}>₹{tx.amount.toLocaleString('en-IN')}</Text>
                  <View style={[styles.txBadge, {
                    backgroundColor: tx.status === 'completed' ? LightColors.successBg : tx.status === 'pending' ? LightColors.warningBg : LightColors.dangerBg,
                  }]}>
                    <Text style={[styles.txBadgeText, {
                      color: tx.status === 'completed' ? LightColors.success : tx.status === 'pending' ? LightColors.warning : LightColors.danger,
                    }]}>
                      {tx.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── RECENTLY JOINED MEMBERS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>👤 Recently Joined</Text>
            {MEMBERS.filter(m => m.gymId === 'gym1').slice(0, 5).map((m: Member, idx) => (
              <View key={m.id} style={[styles.memberRow, idx < 4 && { borderBottomWidth: 1, borderBottomColor: LightColors.bgElevated }]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{m.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberMeta}>{m.phone} · Joined {m.joinDate}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: m.status === 'active' ? LightColors.successBg : m.status === 'expired' ? LightColors.dangerBg : LightColors.cyanBg,
                }]}>
                  <Text style={[styles.statusBadgeText, {
                    color: m.status === 'active' ? LightColors.success : m.status === 'expired' ? LightColors.danger : LightColors.info,
                  }]}>
                    {m.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border },
  roleBadgeText: { color: LightColors.textPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  scroll: {
    padding: 16, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  kpiCard: { width: '30%', flex: 1, minWidth: '30%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 5 },
  kpiIcon: { fontSize: 22 },
  kpiVal: { fontSize: 16, fontWeight: '800' },
  kpiLabel: { fontSize: 9, color: LightColors.textMuted, fontWeight: '600', textAlign: 'center' },
  // Chart tabs
  chartTabs: { flexDirection: 'row', backgroundColor: LightColors.bgSurface, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: LightColors.border },
  chartTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  chartTabActive: { backgroundColor: LightColors.accentViolet },
  chartTabText: { fontSize: 10, fontWeight: '700', color: LightColors.textMuted },
  chartTabTextActive: { color: '#FFFFFF' },
  // Bar chart
  chartCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: LightColors.border },
  chartTitle: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: LightColors.textMuted, marginBottom: 16 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 140, justifyContent: 'space-around' },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 8, fontWeight: '800', marginBottom: 4 },
  barTrack: { width: 18, flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 9 },
  barLabel: { fontSize: 8, color: LightColors.textMuted, fontWeight: '600', marginTop: 5, textAlign: 'center' },
  // Sections
  sectionCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: LightColors.border },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.4 },
  // Revenue breakdown
  breakdownRow: { marginBottom: 14 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 13, fontWeight: '600', color: LightColors.textPrimary },
  breakdownRight: { gap: 4 },
  breakdownBar: { height: 8, backgroundColor: LightColors.bgElevated, borderRadius: 4, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 4 },
  breakdownVal: { fontSize: 12, fontWeight: '700' },
  // Member status
  memberStatusGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  memberStatusCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  memberStatusCount: { fontSize: 22, fontWeight: '800' },
  memberStatusLabel: { fontSize: 11, fontWeight: '700' },
  memberStatusPct: { fontSize: 10, fontWeight: '600' },
  totalBar: { height: 8, backgroundColor: LightColors.bgElevated, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginBottom: 8 },
  totalBarFill: { height: '100%' },
  totalBarLabel: { fontSize: 11, color: LightColors.textMuted, fontWeight: '600', textAlign: 'center' },
  // Insights
  insightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LightColors.bgElevated, gap: 12 },
  insightIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  insightLabel: { fontSize: 11, color: LightColors.textMuted, fontWeight: '600', marginBottom: 2 },
  insightVal: { fontSize: 13, fontWeight: '800', color: LightColors.textPrimary },
  // Payments ledger
  txRow: { paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txId: { fontSize: 9, fontWeight: '700', color: LightColors.textMuted, letterSpacing: 0.5 },
  txMember: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary, marginVertical: 2 },
  txDesc: { fontSize: 11, color: LightColors.textMuted },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmt: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary },
  txBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  txBadgeText: { fontSize: 9, fontWeight: '800' },
  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${LightColors.accentViolet}15`, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 13, fontWeight: '800', color: LightColors.accentViolet },
  memberName: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  memberMeta: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
});
