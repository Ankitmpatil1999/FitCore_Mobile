import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors, Shadows } from '../../theme';
import {
  getVendorOrdersByStore, getVendorProductsByStore,
  VENDOR_ANALYTICS, OrderStatus,
} from '../../data/mockData';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  new:       { label: 'New',       color: LightColors.info, bg: LightColors.cyanBg, icon: '🆕' },
  accepted:  { label: 'Accepted',  color: LightColors.accentViolet, bg: `${LightColors.accentViolet}15`, icon: '✅' },
  packed:    { label: 'Packed',    color: LightColors.warning, bg: LightColors.warningBg, icon: '📦' },
  shipped:   { label: 'Shipped',   color: LightColors.info, bg: LightColors.cyanBg, icon: '🚚' },
  delivered: { label: 'Delivered', color: LightColors.success, bg: LightColors.successBg, icon: '✔️' },
  cancelled: { label: 'Cancelled', color: LightColors.danger, bg: LightColors.dangerBg, icon: '❌' },
};

export default function VendorDashboard() {
  const { currentUser, currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';
  const analytics = VENDOR_ANALYTICS[vendorId as keyof typeof VENDOR_ANALYTICS] ?? VENDOR_ANALYTICS.vs1;

  const allOrders  = getVendorOrdersByStore(vendorId);
  const products   = getVendorProductsByStore(vendorId);
  const newOrders  = allOrders.filter(o => o.status === 'new');
  const activeOrds = allOrders.filter(o => !['delivered','cancelled'].includes(o.status));
  const lowStock   = products.filter(p => p.stock <= p.lowStockThreshold);

  const ownerOrders  = allOrders.filter(o => o.buyerType === 'gym_owner');
  const memberOrders = allOrders.filter(o => o.buyerType === 'member');
  const ownerRevenue = ownerOrders.reduce((s, o) => s + o.total, 0);
  const memberRevenue = memberOrders.reduce((s, o) => s + o.total, 0);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // chart helpers
  const maxRev = Math.max(...analytics.revenueChart.map(r => r.value));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.storeName}>{currentVendor?.storeName ?? 'Your Store'}</Text>
            </View>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{currentVendor?.avatar ?? 'V'}</Text>
              {newOrders.length > 0 && (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>{newOrders.length}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── TODAY STATS ── */}
          <View style={styles.todayBanner}>
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>₹{analytics.todayRevenue.toLocaleString('en-IN')}</Text>
              <Text style={styles.todayLabel}>Today's Revenue</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{analytics.todayOrders}</Text>
              <Text style={styles.todayLabel}>Today's Orders</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{analytics.pendingOrders}</Text>
              <Text style={styles.todayLabel}>Pending</Text>
            </View>
          </View>

          {/* ── KPI CARDS ── */}
          <View style={styles.kpiGrid}>
            {[
              { icon: '💰', label: 'Monthly Revenue', val: `₹${(analytics.monthlyRevenue/1000).toFixed(0)}K`, color: LightColors.accentViolet, bg: `${LightColors.accentViolet}15` },
              { icon: '📦', label: 'Total Products', val: analytics.totalProducts.toString(), color: LightColors.info, bg: LightColors.cyanBg },
              { icon: '⭐', label: 'Avg. Rating', val: analytics.avgRating.toString(), color: LightColors.warning, bg: LightColors.warningBg },
              { icon: '🔄', label: 'Returns (Month)', val: analytics.returnsThisMonth.toString(), color: LightColors.danger, bg: LightColors.dangerBg },
              { icon: '✅', label: 'Delivered', val: analytics.deliveredOrders.toString(), color: LightColors.success, bg: LightColors.successBg },
              { icon: '💬', label: 'Reviews', val: analytics.totalReviews.toString(), color: LightColors.accentViolet, bg: `${LightColors.accentViolet}15` },
            ].map(kpi => (
              <View key={kpi.label} style={[styles.kpiCard, { borderLeftColor: kpi.color, backgroundColor: LightColors.bgSurface }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: kpi.bg }]}>
                  <Text style={{ fontSize: 18 }}>{kpi.icon}</Text>
                </View>
                <Text style={[styles.kpiVal, { color: kpi.color }]}>{kpi.val}</Text>
                <Text style={styles.kpiLabel} numberOfLines={2}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* ── BUYER SPLIT WIDGET ── */}
          <Text style={styles.sectionTitle}>👥 Buyer Breakdown</Text>
          <View style={styles.buyerSplitCard}>
            <View style={styles.buyerSplitRow}>
              <View style={[styles.buyerSplitItem, { borderColor: '#7C3AED' }]}>
                <Text style={styles.buyerSplitIcon}>🏢</Text>
                <Text style={[styles.buyerSplitCount, { color: '#7C3AED' }]}>{ownerOrders.length}</Text>
                <Text style={styles.buyerSplitLabel}>Owner Orders</Text>
                <Text style={[styles.buyerSplitRevenue, { color: '#7C3AED' }]}>₹{ownerRevenue.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.buyerSplitDivider} />
              <View style={[styles.buyerSplitItem, { borderColor: '#0EA5E9' }]}>
                <Text style={styles.buyerSplitIcon}>👤</Text>
                <Text style={[styles.buyerSplitCount, { color: '#0EA5E9' }]}>{memberOrders.length}</Text>
                <Text style={styles.buyerSplitLabel}>Member Orders</Text>
                <Text style={[styles.buyerSplitRevenue, { color: '#0EA5E9' }]}>₹{memberRevenue.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            {/* Mini progress bar */}
            {(ownerOrders.length + memberOrders.length) > 0 && (
              <View style={styles.splitBarTrack}>
                <View style={[styles.splitBarFill, {
                  width: `${Math.round((ownerOrders.length / (ownerOrders.length + memberOrders.length)) * 100)}%`,
                  backgroundColor: '#7C3AED',
                }]} />
                <View style={[styles.splitBarFill, {
                  width: `${Math.round((memberOrders.length / (ownerOrders.length + memberOrders.length)) * 100)}%`,
                  backgroundColor: '#0EA5E9',
                }]} />
              </View>
            )}
          </View>

          {/* ── ORDER STATUS FLOW ── */}
          <Text style={styles.sectionTitle}>Order Status Overview</Text>
          <View style={styles.statusGrid}>
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const count = analytics.ordersByStatus[s as keyof typeof analytics.ordersByStatus] ?? 0;
              return (
                <View key={s} style={[styles.statusCard, { backgroundColor: cfg.bg }]}>
                  <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
                  <Text style={[styles.statusCount, { color: cfg.color }]}>{count}</Text>
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>

          {/* ── REVENUE CHART ── */}
          <Text style={styles.sectionTitle}>Revenue Trend (2026)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {analytics.revenueChart.map((r, i) => {
                const isLast = i === analytics.revenueChart.length - 1;
                const heightPct = 20 + ((r.value / maxRev) * 80);
                return (
                  <View key={r.label} style={styles.barCol}>
                    <Text style={[styles.barVal, isLast && { color: LightColors.accentViolet, fontWeight: '800' }]}>
                      {(r.value / 1000).toFixed(0)}K
                    </Text>
                    <View style={[styles.bar, {
                      height: heightPct,
                      backgroundColor: isLast ? LightColors.accentViolet : `${LightColors.accentViolet}80`,
                    }]} />
                    <Text style={[styles.barLabel, isLast && { color: LightColors.accentViolet, fontWeight: '800' }]}>
                      {r.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── NEW ORDERS ALERT ── */}
          {newOrders.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🆕 New Orders — Action Required</Text>
              {newOrders.map(ord => (
                <View key={ord.id} style={styles.newOrderCard}>
                  <View style={styles.newOrderTop}>
                    <View>
                      <Text style={styles.newOrderId}>{ord.id}</Text>
                      <Text style={styles.newOrderBuyer}>👤 {ord.buyerName}</Text>
                      <Text style={styles.newOrderItems}>{ord.items.length} item{ord.items.length > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.newOrderRight}>
                      <Text style={styles.newOrderTotal}>₹{ord.total.toLocaleString('en-IN')}</Text>
                      <Text style={styles.newOrderDate}>{ord.orderedAt}</Text>
                    </View>
                  </View>
                  <View style={styles.newOrderActions}>
                    <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.85}>
                      <Text style={styles.acceptBtnText}>✅ Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.85}>
                      <Text style={styles.rejectBtnText}>❌ Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── LOW STOCK ALERTS ── */}
          {lowStock.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚠️ Low Stock Alerts</Text>
              <View style={styles.alertCard}>
                {lowStock.map((p, i) => (
                  <View key={p.id}>
                    <View style={styles.alertRow}>
                      <Text style={{ fontSize: 22 }}>{p.images[0]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertName}>{p.name}</Text>
                        <Text style={styles.alertBrand}>{p.brand} · {p.weight}</Text>
                      </View>
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>{p.stock} left</Text>
                      </View>
                    </View>
                    {i < lowStock.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── TOP PRODUCT ── */}
          <Text style={styles.sectionTitle}>🏆 Top Selling Product</Text>
          <View style={styles.topProductCard}>
            <Text style={{ fontSize: 48 }}>🥇</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topProductName}>{analytics.topProduct}</Text>
              <Text style={styles.topProductStat}>All-time bestseller · 145 units sold</Text>
            </View>
          </View>

          {/* STORE STATUS */}
          {currentVendor && (
            <View style={[styles.storeStatusCard, { borderLeftColor: currentVendor.status === 'approved' ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.storeStatusIcon}>{currentVendor.status === 'approved' ? '✅' : '⏳'}</Text>
              <View>
                <Text style={styles.storeStatusTitle}>Store Status: {currentVendor.status.toUpperCase()}</Text>
                <Text style={styles.storeStatusSub}>
                  {currentVendor.status === 'approved'
                    ? 'Your store is live and accepting orders'
                    : 'Your store is pending admin approval'}
                </Text>
              </View>
            </View>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerLeft: {},
  greeting: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  storeName: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary, marginTop: 2 },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 16, fontWeight: '800', color: LightColors.textPrimary },
  notifDot: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: LightColors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LightColors.bgSurface },
  notifDotText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  scroll: {
    padding: 20, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  todayBanner: { backgroundColor: '#0F172A', borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  todayStat: { flex: 1, alignItems: 'center' },
  todayVal: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  todayLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  todayDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 14, marginTop: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  kpiCard: { width: '30%', flex: 1, minWidth: '30%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderLeftWidth: 3, borderWidth: 1, borderColor: LightColors.border },
  kpiIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kpiVal: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 9, color: LightColors.textMuted, fontWeight: '600', textAlign: 'center' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statusCard: { flex: 1, minWidth: '30%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 5 },
  statusCount: { fontSize: 20, fontWeight: '800' },
  statusLabel: { fontSize: 9, fontWeight: '700' },
  chartCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: LightColors.border },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingTop: 20 },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 9, color: LightColors.textMuted, fontWeight: '600', marginBottom: 4 },
  bar: { width: 20, borderRadius: 5, minHeight: 8 },
  barLabel: { fontSize: 9, color: LightColors.textMuted, marginTop: 6, fontWeight: '600' },
  newOrderCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: LightColors.accentViolet },
  newOrderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  newOrderId: { fontSize: 10, fontWeight: '700', color: LightColors.textMuted, letterSpacing: 0.5 },
  newOrderBuyer: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary, marginTop: 3 },
  newOrderItems: { fontSize: 12, color: LightColors.textMuted, marginTop: 2 },
  newOrderRight: { alignItems: 'flex-end' },
  newOrderTotal: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  newOrderDate: { fontSize: 11, color: LightColors.textMuted, marginTop: 4 },
  newOrderActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: LightColors.successBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: LightColors.success },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: LightColors.success },
  rejectBtn: { flex: 1, backgroundColor: LightColors.dangerBg, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: LightColors.danger },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: LightColors.danger },
  alertCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: LightColors.warning },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  alertName: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  alertBrand: { fontSize: 11, color: LightColors.textMuted, marginTop: 2 },
  stockBadge: { backgroundColor: LightColors.warningBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stockBadgeText: { fontSize: 12, fontWeight: '800', color: LightColors.warning },
  divider: { height: 1, backgroundColor: LightColors.bgElevated },
  topProductCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, borderWidth: 1, borderColor: LightColors.border },
  topProductName: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 4 },
  topProductStat: { fontSize: 12, color: LightColors.textMuted },
  buyerSplitCard: {
    backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: LightColors.border, gap: 14,
  },
  buyerSplitRow: { flexDirection: 'row', alignItems: 'stretch' },
  buyerSplitItem: { flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, borderWidth: 1.5 },
  buyerSplitDivider: { width: 12 },
  buyerSplitIcon: { fontSize: 28 },
  buyerSplitCount: { fontSize: 24, fontWeight: '800' },
  buyerSplitLabel: { fontSize: 10, color: LightColors.textMuted, fontWeight: '700' },
  buyerSplitRevenue: { fontSize: 11, fontWeight: '700' },
  splitBarTrack: {
    height: 8, borderRadius: 4, backgroundColor: LightColors.bgElevated,
    flexDirection: 'row', overflow: 'hidden',
  },
  splitBarFill: { height: 8 },
  storeStatusCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: LightColors.border, borderLeftWidth: 4 },
  storeStatusIcon: { fontSize: 28 },
  storeStatusTitle: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary },
  storeStatusSub: { fontSize: 12, color: LightColors.textMuted, marginTop: 3 },
});
