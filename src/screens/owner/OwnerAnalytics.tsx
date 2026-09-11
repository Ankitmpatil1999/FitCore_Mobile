import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';

// ── Interactive Scale on Press Component ──
function AnimatedPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

const REVENUE_MONTHS = [
  { label: 'Jan', value: 185000 },
  { label: 'Feb', value: 210000 },
  { label: 'Mar', value: 245000 },
  { label: 'Apr', value: 280000 },
  { label: 'May', value: 390000 },
  { label: 'Jun', value: 482500 },
];

const PEAK_HOURS = [
  { label: '6 AM', value: 45, isPeak: true },
  { label: '7 AM', value: 85, isPeak: true },
  { label: '8 AM', value: 92, isPeak: true },
  { label: '9 AM', value: 60, isPeak: false },
  { label: '10 AM', value: 25, isPeak: false },
  { label: '5 PM', value: 70, isPeak: true },
  { label: '6 PM', value: 98, isPeak: true },
  { label: '7 PM', value: 105, isPeak: true },
  { label: '8 PM', value: 75, isPeak: false },
  { label: '9 PM', value: 40, isPeak: false },
];

import { RefreshControl, ActivityIndicator } from 'react-native';
import apiService from '../../services/api';

type ReportTab = 'revenue' | 'peakhours' | 'retention';

export default function OwnerAnalytics({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || 'g1';

  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [peakStats, setPeakStats] = useState<any[]>([]);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchAnalytics = async () => {
    try {
      const [ovRes, attStatsRes] = await Promise.all([
        apiService.getOwnerOverview(gymId),
        apiService.getOwnerAttendanceStats(gymId),
      ]);

      if (ovRes.success && ovRes.data) {
        setOverview(ovRes.data);
      }
      const attData: any = attStatsRes.data;
      if (attStatsRes.success && Array.isArray(attData?.hourlyDistribution)) {
        setPeakStats(attData.hourlyDistribution);
      }

    } catch (err) {
      console.log('Error fetching owner analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const revenueMonthly = overview?.stats?.monthlyRevenue || 385000;
  const activeMembers = overview?.stats?.activeMembers || overview?.stats?.totalMembers || 240;
  const occupancyRate = overview?.stats?.occupancyRate || 78;

  const REVENUE_MONTHS = [
    { label: 'Jan', value: Math.round(revenueMonthly * 0.7) },
    { label: 'Feb', value: Math.round(revenueMonthly * 0.78) },
    { label: 'Mar', value: Math.round(revenueMonthly * 0.85) },
    { label: 'Apr', value: Math.round(revenueMonthly * 0.9) },
    { label: 'May', value: Math.round(revenueMonthly * 0.95) },
    { label: 'Jun', value: revenueMonthly },
  ];

  const PEAK_HOURS = peakStats.length > 0 ? peakStats : [
    { label: '6 AM', value: 45, isPeak: true },
    { label: '7 AM', value: 85, isPeak: true },
    { label: '8 AM', value: 92, isPeak: true },
    { label: '9 AM', value: 60, isPeak: false },
    { label: '10 AM', value: 25, isPeak: false },
    { label: '5 PM', value: 70, isPeak: true },
    { label: '6 PM', value: 98, isPeak: true },
    { label: '7 PM', value: 105, isPeak: true },
    { label: '8 PM', value: 75, isPeak: false },
    { label: '9 PM', value: 40, isPeak: false },
  ];

  const maxRevenue = Math.max(...REVENUE_MONTHS.map((m) => m.value)) || 1;
  const maxPeak = Math.max(...PEAK_HOURS.map((h) => h.value)) || 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Business Analytics</Text>
            <Text style={styles.headerSub}>{currentGym?.name ?? 'FitCore Gym'}</Text>
          </View>
          <View style={{ width: moderateScale(38) }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C5CE7']} />
          }
        >
          {/* ── METRIC CARDS 3-GRID ── */}
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly Inflow</Text>
              <Text style={[styles.metricVal, { color: '#00C48C' }]}>
                ₹{(revenueMonthly / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.metricTrend}>↑ Active Plan Rates</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Turnout Ratio</Text>
              <Text style={[styles.metricVal, { color: '#6C5CE7' }]}>{occupancyRate}%</Text>
              <Text style={styles.metricTrend}>Floor Capacity Usage</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Members Active</Text>
              <Text style={[styles.metricVal, { color: '#38BDF8' }]}>{activeMembers}</Text>
              <Text style={styles.metricTrend}>Enrolled Database</Text>
            </View>
          </View>

          {/* ── REPORT TABS ── */}
          <View style={styles.tabRow}>
            {(['revenue', 'peakhours', 'retention'] as ReportTab[]).map((tab) => {
              const tabIcons: Record<ReportTab, string> = {
                revenue: 'finance',
                peakhours: 'time',
                retention: 'members',
              };
              const tabTitles: Record<ReportTab, string> = {
                revenue: 'Revenue',
                peakhours: 'Peak Hours',
                retention: 'Retention',
              };

              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppIcon
                      name={tabIcons[tab]}
                      size={moderateScale(15)}
                      color={activeTab === tab ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                      {tabTitles[tab]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>


          {/* ── REVENUE BAR CHART ── */}
          {activeTab === 'revenue' && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Monthly Revenue Trend (2026)</Text>
                <Text style={styles.chartSub}>In Lakhs INR</Text>
              </View>

              <View style={styles.barChartContainer}>
                {REVENUE_MONTHS.map((item, idx) => {
                  const heightPercent = (item.value / maxRevenue) * 100;
                  const isLatest = idx === REVENUE_MONTHS.length - 1;

                  return (
                    <View key={item.label} style={styles.barCol}>
                      <Text style={styles.barTopVal}>₹{(item.value / 100000).toFixed(1)}L</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: isLatest ? '#6C5CE7' : '#C7D2FE',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isLatest && styles.barLabelActive]}>
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── PEAK HOURS BAR CHART ── */}
          {activeTab === 'peakhours' && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Floor Occupancy by Hour</Text>
                <Text style={styles.chartSub}>Simultaneous Members On-Floor</Text>
              </View>

              <View style={styles.peakChartContainer}>
                {PEAK_HOURS.map((item) => {
                  const heightPercent = (item.value / maxPeak) * 100;

                  return (
                    <View key={item.label} style={styles.barCol}>
                      <Text style={styles.barTopVal}>{item.value}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: item.isPeak ? '#FF9900' : '#E2E8F0',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── RETENTION CARDS ── */}
          {activeTab === 'retention' && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Member Cohort Retention</Text>
                <Text style={styles.chartSub}>Average Lifetime Value</Text>
              </View>

              <View style={styles.retentionRow}>
                <View style={styles.retentionPill}>
                  <Text style={styles.retentionPillVal}>7.4 mos</Text>
                  <Text style={styles.retentionPillLabel}>Avg Membership</Text>
                </View>
                <View style={styles.retentionPill}>
                  <Text style={styles.retentionPillVal}>₹18,450</Text>
                  <Text style={styles.retentionPillLabel}>Avg LTV</Text>
                </View>
                <View style={styles.retentionPill}>
                  <Text style={styles.retentionPillVal}>3.2%</Text>
                  <Text style={styles.retentionPillLabel}>Churn Rate</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  root: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(108, 92, 231, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Metric Grid
  metricGrid: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  metricLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  metricVal: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    marginVertical: 2,
  },
  metricTrend: {
    fontSize: fontScale(9),
    color: '#00C48C',
    fontWeight: '700',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  tabBtnText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: hp(2),
  },
  chartHeader: {
    marginBottom: hp(2),
  },
  chartTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },

  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: moderateScale(160),
    paddingTop: moderateScale(20),
  },
  peakChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: moderateScale(160),
    paddingTop: moderateScale(20),
    gap: moderateScale(4),
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopVal: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  barTrack: {
    width: moderateScale(18),
    height: moderateScale(110),
    backgroundColor: '#F3F2FE',
    borderRadius: moderateScale(9),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: moderateScale(9),
  },
  barLabel: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
  barLabelActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },

  // Retention
  retentionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  retentionPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  retentionPillVal: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  retentionPillLabel: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
});
