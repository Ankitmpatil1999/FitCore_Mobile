import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors } from '../../theme';
import {
  VENDOR_ANALYTICS, getVendorOrdersByStore, getVendorTransactions,
} from '../../data/mockData';

type BuyerFilter = 'all' | 'gym_owner' | 'member';

const BUYER_BADGE: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gym_owner: { label: 'Gym Owner', icon: '🏢', color: '#7C3AED', bg: '#EDE9FE' },
  member:    { label: 'Member',   icon: '👤', color: '#0EA5E9', bg: '#E0F2FE' },
};

const TX_TYPE_CFG: Record<string, { icon: string; color: string }> = {
  credit:     { icon: '⬇️', color: '#10B981' },
  debit:      { icon: '⬆️', color: '#EF4444' },
  withdrawal: { icon: '🏦', color: '#F59E0B' },
  refund:     { icon: '↩️', color: '#EF4444' },
};

export default function VendorAnalyticsScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';
  const analytics = VENDOR_ANALYTICS[vendorId as keyof typeof VENDOR_ANALYTICS] ?? VENDOR_ANALYTICS.vs1;

  const allOrders = getVendorOrdersByStore(vendorId);
  const transactions = getVendorTransactions(vendorId);

  const [orderFilter, setOrderFilter] = useState<BuyerFilter>('all');
  const [activeSection, setActiveSection] = useState<'analytics' | 'history'>('analytics');

  const filteredOrders = allOrders.filter(o =>
    orderFilter === 'all' || o.buyerType === orderFilter,
  );

  const ownerOrders = allOrders.filter(o => o.buyerType === 'gym_owner');
  const memberOrders = allOrders.filter(o => o.buyerType === 'member');
  const ownerTotal = ownerOrders.reduce((s, o) => s + o.total, 0);
  const memberTotal = memberOrders.reduce((s, o) => s + o.total, 0);
  const grandTotal = ownerTotal + memberTotal;

  // bar chart
  const maxOwner = Math.max(...analytics.ownerRevenueChart.map(r => r.value));
  const maxMember = Math.max(...analytics.memberRevenueChart.map(r => r.value));
  const chartMax = Math.max(maxOwner, maxMember);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Revenue Intelligence</Text>
              <Text style={styles.headerTitle}>Analytics 📈</Text>
            </View>
          </View>
        </View>

        {/* SECTION TABS */}
        <View style={styles.segmentContainer}>
          <View style={styles.segment}>
            {(['analytics', 'history'] as const).map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.segBtn, activeSection === sec && styles.segBtnActive]}
                onPress={() => setActiveSection(sec)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segBtnText, activeSection === sec && styles.segBtnTextActive]}>
                  {sec === 'analytics' ? '📊 Buyer Analytics' : '💳 Payment History'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {activeSection === 'analytics' ? (
            <>
              {/* ── BUYER SPLIT HERO ── */}
              <View style={styles.splitHero}>
                <View style={styles.splitHeroTop}>
                  <Text style={styles.splitHeroTitle}>Total Revenue Breakdown</Text>
                  <Text style={styles.splitHeroTotal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  {grandTotal > 0 && (
                    <>
                      <View style={[styles.progressFill, {
                        width: `${Math.round((ownerTotal / grandTotal) * 100)}%`,
                        backgroundColor: '#7C3AED',
                        borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
                      }]} />
                      <View style={[styles.progressFill, {
                        width: `${Math.round((memberTotal / grandTotal) * 100)}%`,
                        backgroundColor: '#0EA5E9',
                        borderTopRightRadius: 6, borderBottomRightRadius: 6,
                      }]} />
                    </>
                  )}
                </View>

                <View style={styles.splitLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                    <Text style={styles.legendLabel}>🏢 Owners</Text>
                    <Text style={styles.legendPct}>{grandTotal > 0 ? Math.round((ownerTotal / grandTotal) * 100) : 0}%</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#0EA5E9' }]} />
                    <Text style={styles.legendLabel}>👤 Members</Text>
                    <Text style={styles.legendPct}>{grandTotal > 0 ? Math.round((memberTotal / grandTotal) * 100) : 0}%</Text>
                  </View>
                </View>
              </View>

              {/* ── BUYER STAT CARDS ── */}
              <View style={styles.buyerCards}>
                {/* Owner card */}
                <View style={[styles.buyerCard, { borderColor: '#7C3AED' }]}>
                  <View style={styles.buyerCardHeader}>
                    <Text style={styles.buyerCardIcon}>🏢</Text>
                    <Text style={[styles.buyerCardTitle, { color: '#7C3AED' }]}>Gym Owners</Text>
                  </View>
                  <Text style={[styles.buyerCardRevenue, { color: '#7C3AED' }]}>
                    ₹{ownerTotal.toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.buyerCardMeta}>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>{ownerOrders.length}</Text>
                      <Text style={styles.buyerStatLabel}>Orders</Text>
                    </View>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>
                        ₹{ownerOrders.length > 0 ? Math.round(ownerTotal / ownerOrders.length).toLocaleString('en-IN') : 0}
                      </Text>
                      <Text style={styles.buyerStatLabel}>Avg Order</Text>
                    </View>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>{analytics.ownerOrderCount}</Text>
                      <Text style={styles.buyerStatLabel}>Total (Month)</Text>
                    </View>
                  </View>
                </View>

                {/* Member card */}
                <View style={[styles.buyerCard, { borderColor: '#0EA5E9' }]}>
                  <View style={styles.buyerCardHeader}>
                    <Text style={styles.buyerCardIcon}>👤</Text>
                    <Text style={[styles.buyerCardTitle, { color: '#0EA5E9' }]}>Members</Text>
                  </View>
                  <Text style={[styles.buyerCardRevenue, { color: '#0EA5E9' }]}>
                    ₹{memberTotal.toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.buyerCardMeta}>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>{memberOrders.length}</Text>
                      <Text style={styles.buyerStatLabel}>Orders</Text>
                    </View>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>
                        ₹{memberOrders.length > 0 ? Math.round(memberTotal / memberOrders.length).toLocaleString('en-IN') : 0}
                      </Text>
                      <Text style={styles.buyerStatLabel}>Avg Order</Text>
                    </View>
                    <View style={styles.buyerCardStat}>
                      <Text style={styles.buyerStatVal}>{analytics.memberOrderCount}</Text>
                      <Text style={styles.buyerStatLabel}>Total (Month)</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ── MONTHLY COMPARISON CHART ── */}
              <Text style={styles.sectionTitle}>Monthly Revenue by Buyer Type</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartLegend}>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                    <Text style={styles.chartLegendText}>Owners</Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#0EA5E9' }]} />
                    <Text style={styles.chartLegendText}>Members</Text>
                  </View>
                </View>
                <View style={styles.chartBars}>
                  {analytics.ownerRevenueChart.map((r, i) => {
                    const ownerH = 20 + ((r.value / chartMax) * 80);
                    const memberH = 20 + ((analytics.memberRevenueChart[i].value / chartMax) * 80);
                    return (
                      <View key={r.label} style={styles.chartGroup}>
                        <View style={styles.barPair}>
                          <View style={[styles.groupBar, { height: ownerH, backgroundColor: '#7C3AED' }]} />
                          <View style={[styles.groupBar, { height: memberH, backgroundColor: '#0EA5E9' }]} />
                        </View>
                        <Text style={styles.barLabel}>{r.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ── TOP BUYERS ── */}
              <Text style={styles.sectionTitle}>Top Buyers</Text>
              <View style={styles.card}>
                {[...allOrders]
                  .filter(o => o.status === 'delivered' || o.status === 'shipped' || o.status === 'packed')
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 4)
                  .map((order, idx) => {
                    const bc = BUYER_BADGE[order.buyerType];
                    return (
                      <View key={order.id} style={[styles.buyerRow, idx > 0 && styles.buyerRowBorder]}>
                        <View style={styles.buyerRank}>
                          <Text style={styles.buyerRankText}>#{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.buyerName}>{order.buyerName}</Text>
                          <Text style={styles.buyerDate}>{order.orderedAt} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</Text>
                        </View>
                        <View>
                          <Text style={styles.buyerAmt}>₹{order.total.toLocaleString('en-IN')}</Text>
                          <View style={[styles.miniTypeBadge, { backgroundColor: bc.bg }]}>
                            <Text style={[styles.miniTypeBadgeText, { color: bc.color }]}>{bc.icon} {bc.label}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : (
            <>
              {/* ── PAYMENT HISTORY ── */}
              {/* Filter chips */}
              <View style={styles.filterRow}>
                {(['all', 'gym_owner', 'member'] as BuyerFilter[]).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, orderFilter === f && styles.filterChipActive]}
                    onPress={() => setOrderFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, orderFilter === f && styles.filterChipTextActive]}>
                      {f === 'all' ? '🔍 All' : f === 'gym_owner' ? '🏢 Owners' : '👤 Members'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary stats */}
              <View style={styles.historyStats}>
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatVal}>{filteredOrders.length}</Text>
                  <Text style={styles.historyStatLabel}>Orders</Text>
                </View>
                <View style={styles.historyStatDivider} />
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatVal}>
                    ₹{filteredOrders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.historyStatLabel}>Total Revenue</Text>
                </View>
                <View style={styles.historyStatDivider} />
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatVal}>
                    {filteredOrders.filter(o => o.status === 'delivered').length}
                  </Text>
                  <Text style={styles.historyStatLabel}>Completed</Text>
                </View>
              </View>

              {/* Orders history list */}
              <Text style={styles.sectionTitle}>Order Payment History</Text>
              {filteredOrders.map(order => {
                const bc = BUYER_BADGE[order.buyerType];
                const isCompleted = order.status === 'delivered';
                return (
                  <View key={order.id} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyOrderId}>{order.id}</Text>
                        <Text style={styles.historyBuyer}>{order.buyerName}</Text>
                        <Text style={styles.historyDate}>📅 {order.orderedAt}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={[styles.historyTotal, { color: isCompleted ? LightColors.success : LightColors.warning }]}>
                          ₹{order.total.toLocaleString('en-IN')}
                        </Text>
                        <View style={[styles.miniTypeBadge, { backgroundColor: bc.bg }]}>
                          <Text style={[styles.miniTypeBadgeText, { color: bc.color }]}>{bc.icon} {bc.label}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.historyCardBottom}>
                      <View style={[styles.statusDot, {
                        backgroundColor: isCompleted ? LightColors.success
                          : order.status === 'cancelled' ? LightColors.danger
                          : LightColors.warning,
                      }]} />
                      <Text style={styles.historyStatus}>{order.status.toUpperCase()}</Text>
                      <Text style={styles.historyPayMethod}>· {order.paymentMethod.toUpperCase()}</Text>
                      <Text style={styles.historyItems}>· {order.items.length} item{order.items.length > 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Wallet Transactions */}
              <Text style={styles.sectionTitle}>Wallet Transactions</Text>
              <View style={styles.card}>
                {transactions.map((tx, idx) => {
                  const cfg = TX_TYPE_CFG[tx.type] ?? TX_TYPE_CFG.credit;
                  const isDebit = tx.type === 'withdrawal' || tx.type === 'refund';
                  return (
                    <View key={tx.id} style={[styles.txRow, idx > 0 && styles.txRowBorder]}>
                      <View style={styles.txIconBox}>
                        <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txDesc}>{tx.description}</Text>
                        <Text style={styles.txMeta}>{tx.date} · {tx.status.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.txAmt, { color: isDebit ? LightColors.danger : LightColors.success }]}>
                        {isDebit ? '-' : '+'} ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
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
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary },
  segmentContainer: {
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: LightColors.bgElevated,
    borderRadius: 12,
    padding: 3,
    width: '100%', maxWidth: 500, alignSelf: 'center',
  },
  segBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
  },
  segBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segBtnText: { fontSize: 12, fontWeight: '600', color: LightColors.textMuted },
  segBtnTextActive: { color: LightColors.textPrimary, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  splitHero: {
    backgroundColor: '#0F172A', borderRadius: 20, padding: 20, marginBottom: 16,
  },
  splitHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  splitHeroTitle: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  splitHeroTotal: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  progressTrack: {
    height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', overflow: 'hidden', marginBottom: 14,
  },
  progressFill: { height: 12 },
  splitLegend: { flexDirection: 'row', gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  legendPct: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  buyerCards: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  buyerCard: {
    flex: 1, backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 14,
    borderWidth: 1.5, gap: 8,
  },
  buyerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buyerCardIcon: { fontSize: 18 },
  buyerCardTitle: { fontSize: 13, fontWeight: '800' },
  buyerCardRevenue: { fontSize: 18, fontWeight: '800' },
  buyerCardMeta: { flexDirection: 'row', gap: 8 },
  buyerCardStat: { flex: 1, backgroundColor: LightColors.bgElevated, borderRadius: 8, padding: 7, alignItems: 'center' },
  buyerStatVal: { fontSize: 12, fontWeight: '800', color: LightColors.textPrimary },
  buyerStatLabel: { fontSize: 8, color: LightColors.textMuted, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 12, marginTop: 4 },
  chartCard: {
    backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: LightColors.border,
  },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chartLegendText: { fontSize: 11, fontWeight: '600', color: LightColors.textMuted },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130 },
  chartGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
  groupBar: { width: 12, borderRadius: 4, minHeight: 6 },
  barLabel: { fontSize: 9, color: LightColors.textMuted, marginTop: 6, fontWeight: '600' },
  card: {
    backgroundColor: LightColors.bgSurface, borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: LightColors.border,
  },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  buyerRowBorder: { borderTopWidth: 1, borderTopColor: LightColors.border },
  buyerRank: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: LightColors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  buyerRankText: { fontSize: 11, fontWeight: '800', color: LightColors.textPrimary },
  buyerName: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  buyerDate: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  buyerAmt: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary, textAlign: 'right' },
  miniTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  miniTypeBadgeText: { fontSize: 10, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: LightColors.bgSurface, borderWidth: 1, borderColor: LightColors.border,
  },
  filterChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: LightColors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  historyStats: {
    flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 16,
    padding: 16, marginBottom: 20, alignItems: 'center',
  },
  historyStat: { flex: 1, alignItems: 'center' },
  historyStatVal: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  historyStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  historyStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  historyCard: {
    backgroundColor: LightColors.bgSurface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: LightColors.border,
  },
  historyCardTop: { flexDirection: 'row', marginBottom: 10 },
  historyOrderId: { fontSize: 10, fontWeight: '700', color: LightColors.textMuted, letterSpacing: 0.5 },
  historyBuyer: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary, marginTop: 2 },
  historyDate: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  historyTotal: { fontSize: 16, fontWeight: '800' },
  historyCardBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: LightColors.border, paddingTop: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  historyStatus: { fontSize: 11, fontWeight: '700', color: LightColors.textSecondary },
  historyPayMethod: { fontSize: 11, color: LightColors.textMuted },
  historyItems: { fontSize: 11, color: LightColors.textMuted },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  txRowBorder: { borderTopWidth: 1, borderTopColor: LightColors.border },
  txIconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LightColors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  txDesc: { fontSize: 13, fontWeight: '700', color: LightColors.textSecondary },
  txMeta: { fontSize: 10, color: LightColors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '800' },
});
