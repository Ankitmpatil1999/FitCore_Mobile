import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

type ReportTab = 'revenue' | 'peakhours' | 'retention';

export default function OwnerAnalytics({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId =
    currentGym?.id ||
    (currentGym as any)?._id ||
    (currentUser as any)?.gymId ||
    (currentUser as any)?.gym_id ||
    '';

  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [peakStats, setPeakStats] = useState<any[]>([]);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const fetchAnalytics = async () => {
    try {
      const [ovRes, attStatsRes] = await Promise.all([
        apiService.getOwnerOverview(gymId),
        apiService.getOwnerAttendanceStats(gymId),
      ]);

      if (ovRes?.success && ovRes?.data) {
        setOverview(ovRes.data);
      }
      const attData: any = attStatsRes?.data || (attStatsRes as any)?.stats || {};
      if (Array.isArray(attData?.hourlyDistribution) && attData.hourlyDistribution.length > 0) {
        setPeakStats(attData.hourlyDistribution);
      } else if (Array.isArray(attData?.hourlyFootfall) && attData.hourlyFootfall.length > 0) {
        setPeakStats(attData.hourlyFootfall);
      }
    } catch (err) {
      console.log('Error fetching analytics:', err);
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
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // ── Parsed Metrics ──
  const stats = overview?.stats || overview || {};
  const revenueMonthly = Number(stats?.monthlyRevenue || 45000);
  const activeMembers = Number(stats?.activeMembers || stats?.totalMembers || 58);
  const totalMembers = Number(stats?.totalMembers || activeMembers || 62);
  const expiredMembers = Number(stats?.expiredMembers || Math.max(0, totalMembers - activeMembers) || 4);
  const todayCheckIns = Number(stats?.todayCheckIns || stats?.checkInsToday || 28);
  const totalDailyFootfall = Number(stats?.totalDailyFootfall || 590);
  const avgMembershipMonths = stats?.avgMembershipMonths || '3.5 Months';
  const avgLtv = stats?.avgLtv
    ? `₹${Number(stats.avgLtv).toLocaleString('en-IN')}`
    : `₹${Math.round(revenueMonthly / Math.max(1, activeMembers)).toLocaleString('en-IN')}`;
  const retentionPercent = Math.round((activeMembers / Math.max(1, totalMembers)) * 100) || 92;
  const expiredPercent = Math.max(1, 100 - retentionPercent);

  // ── 6-Month Collection Trend Data ──
  const REVENUE_BARS = [
    { month: 'Apr', amount: '₹28K', value: 28, max: 60 },
    { month: 'May', amount: '₹32K', value: 32, max: 60 },
    { month: 'Jun', amount: '₹38K', value: 38, max: 60 },
    { month: 'Jul', amount: '₹42K', value: 42, max: 60 },
    { month: 'Aug', amount: '₹40K', value: 40, max: 60 },
    { month: 'Oct', amount: '₹45K', value: 45, max: 60 },
  ];

  // ── Gym Footfall by Time Data ──
  const FOOTFALL_BARS = [
    { time: '6 AM', count: 60, isPeak: false },
    { time: '8 AM', count: 120, isPeak: false },
    { time: '10 AM', count: 80, isPeak: false },
    { time: '5 PM', count: 90, isPeak: false },
    { time: '7 PM', count: 140, isPeak: true },
    { time: '9 PM', count: 100, isPeak: false },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── TOP HEADER (EXACT MOCKUP) ── */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={moderateScale(22)} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>Business Analytics</Text>

          <TouchableOpacity style={styles.dateSelectorBtn} activeOpacity={0.8}>
            <Icon name="calendar-outline" size={moderateScale(14)} color="#0F172A" />
            <Text style={styles.dateSelectorText}>October 2026</Text>
            <Icon name="chevron-down" size={moderateScale(12)} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* ── 3 PILL TABS (REVENUE | PEAK HOURS | RETENTION) ── */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'revenue' && styles.tabPillActive]}
            onPress={() => setActiveTab('revenue')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabPillText, activeTab === 'revenue' && styles.tabPillTextActive]}>
              Revenue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'peakhours' && styles.tabPillActive]}
            onPress={() => setActiveTab('peakhours')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabPillText, activeTab === 'peakhours' && styles.tabPillTextActive]}>
              Peak Hours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'retention' && styles.tabPillActive]}
            onPress={() => setActiveTab('retention')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabPillText, activeTab === 'retention' && styles.tabPillTextActive]}>
              Retention
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#1E60FF" />
            <Text style={styles.loadingText}>Loading Analytics...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E60FF']} />
            }
          >
            {/* ══════════════════════════════════════════════════════════
                SCREEN 1: REVENUE TAB
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'revenue' && (
              <View style={styles.tabContentStack}>
                {/* 1. Hero Blue Gradient Card */}
                <View style={styles.heroBlueCard}>
                  <View style={styles.heroBlueTopRow}>
                    <View style={styles.heroBlueIconBox}>
                      <Icon name="bar-chart" size={moderateScale(18)} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                      <Text style={styles.heroBlueTitle}>Total Monthly Revenue</Text>
                    </View>
                    <View style={styles.heroGrowthBadgeWrap}>
                      <View style={styles.heroGrowthPill}>
                        <Icon name="arrow-up" size={moderateScale(12)} color="#15803D" />
                        <Text style={styles.heroGrowthText}>12%</Text>
                      </View>
                      <Text style={styles.heroGrowthSub}>vs last month</Text>
                    </View>
                  </View>

                  <Text style={styles.heroBlueAmount}>₹45,000</Text>

                  <View style={styles.heroGlassRow}>
                    <View style={styles.heroGlassPill}>
                      <Icon name="people" size={moderateScale(15)} color="#FFFFFF" />
                      <View style={{ marginLeft: moderateScale(6) }}>
                        <Text style={styles.heroGlassNum}>{todayCheckIns}</Text>
                        <Text style={styles.heroGlassLabel}>Visits Today</Text>
                      </View>
                    </View>

                    <View style={styles.heroGlassPill}>
                      <Icon name="people" size={moderateScale(15)} color="#FFFFFF" />
                      <View style={{ marginLeft: moderateScale(6) }}>
                        <Text style={styles.heroGlassNum}>{activeMembers}</Text>
                        <Text style={styles.heroGlassLabel}>Active Members</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. 6-Month Collection Trend Chart Card */}
                <View style={styles.whiteCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <Icon name="bar-chart" size={moderateScale(16)} color="#6366F1" />
                      <Text style={styles.cardHeaderTitle}>6-Month Collection Trend</Text>
                    </View>
                    <View style={styles.cardHeaderDropdown}>
                      <Text style={styles.cardHeaderDropdownText}>Last 6 Months</Text>
                      <Icon name="chevron-down" size={moderateScale(11)} color="#64748B" />
                    </View>
                  </View>

                  {/* Chart with Y-Axis & Bars */}
                  <View style={styles.chartAreaWithAxis}>
                    {/* Y-Axis Labels */}
                    <View style={styles.yAxisCol}>
                      <Text style={styles.yAxisText}>60K</Text>
                      <Text style={styles.yAxisText}>45K</Text>
                      <Text style={styles.yAxisText}>30K</Text>
                      <Text style={styles.yAxisText}>15K</Text>
                      <Text style={styles.yAxisText}>0</Text>
                    </View>

                    {/* Bars Grid */}
                    <View style={styles.barsGrid}>
                      {/* Grid Lines */}
                      <View style={[styles.gridLine, { top: '0%' }]} />
                      <View style={[styles.gridLine, { top: '25%' }]} />
                      <View style={[styles.gridLine, { top: '50%' }]} />
                      <View style={[styles.gridLine, { top: '75%' }]} />
                      <View style={[styles.gridLine, { top: '100%' }]} />

                      <View style={styles.barsContainer}>
                        {REVENUE_BARS.map((bar) => {
                          const heightPct = (bar.value / bar.max) * 100;
                          return (
                            <View key={bar.month} style={styles.barItem}>
                              <Text style={styles.barTopAmountText}>{bar.amount}</Text>
                              <View style={styles.barTrackArea}>
                                <View
                                  style={[
                                    styles.barGradientStick,
                                    { height: `${heightPct}%`, backgroundColor: '#38BDF8' },
                                  ]}
                                />
                              </View>
                              <Text style={styles.barMonthLabel}>{bar.month}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Two Small Cards Side by Side */}
                <View style={styles.twoCardsRow}>
                  {/* Avg Revenue / Member */}
                  <View style={styles.miniStatCard}>
                    <View style={[styles.miniStatIconSquare, { backgroundColor: '#DCFCE7' }]}>
                      <Icon name="wallet" size={moderateScale(17)} color="#16A34A" />
                    </View>
                    <Text style={styles.miniStatLabel}>Avg Revenue / Member</Text>
                    <Text style={styles.miniStatValue}>₹1,850</Text>
                  </View>

                  {/* Active Subscriptions */}
                  <View style={styles.miniStatCard}>
                    <View style={[styles.miniStatIconSquare, { backgroundColor: '#EDE9FE' }]}>
                      <Icon name="people" size={moderateScale(17)} color="#7C3AED" />
                    </View>
                    <Text style={styles.miniStatLabel}>Active Subscriptions</Text>
                    <Text style={styles.miniStatValue}>58 <Text style={styles.miniStatValueSub}>Plans</Text></Text>
                  </View>
                </View>

                {/* 4. Tip Card */}
                <View style={styles.tipCard}>
                  <View style={styles.tipIconWrap}>
                    <Icon name="bulb" size={moderateScale(20)} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Tip</Text>
                    <Text style={styles.tipDescription}>
                      Your revenue increased by 12% this month. Keep promoting annual plans to grow faster.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════
                SCREEN 2: PEAK HOURS TAB
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'peakhours' && (
              <View style={styles.tabContentStack}>
                {/* 1. Two Shift Cards Side by Side */}
                <View style={styles.twoCardsRow}>
                  {/* Morning Shift */}
                  <View style={[styles.shiftCard, { backgroundColor: '#F0F9FF' }]}>
                    <View style={[styles.shiftIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Icon name="sunny" size={moderateScale(18)} color="#F59E0B" />
                    </View>
                    <Text style={styles.shiftTitle}>Morning Shift</Text>
                    <Text style={styles.shiftHours}>6 AM – 9:30 AM</Text>
                    <Text style={styles.shiftPercentBlue}>~ 35% members</Text>
                  </View>

                  {/* Evening Max Rush */}
                  <View style={[styles.shiftCard, { backgroundColor: '#FFF1F2' }]}>
                    <View style={[styles.shiftIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Icon name="moon" size={moderateScale(18)} color="#EF4444" />
                    </View>
                    <Text style={styles.shiftTitle}>Evening Max Rush 🔥</Text>
                    <Text style={styles.shiftHours}>6 PM – 9:00 PM</Text>
                    <Text style={styles.shiftPercentRed}>~ 50% members</Text>
                  </View>
                </View>

                {/* 2. Gym Footfall by Time Chart Card */}
                <View style={styles.whiteCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <Icon name="bar-chart" size={moderateScale(16)} color="#6366F1" />
                      <Text style={styles.cardHeaderTitle}>Gym Footfall by Time</Text>
                    </View>
                    <View style={styles.cardHeaderDropdown}>
                      <Text style={styles.cardHeaderDropdownText}>Today</Text>
                      <Icon name="chevron-down" size={moderateScale(11)} color="#64748B" />
                    </View>
                  </View>

                  {/* Chart with Y-Axis */}
                  <View style={styles.chartAreaWithAxis}>
                    <View style={styles.yAxisCol}>
                      <Text style={styles.yAxisText}>150</Text>
                      <Text style={styles.yAxisText}>100</Text>
                      <Text style={styles.yAxisText}>50</Text>
                      <Text style={styles.yAxisText}>0</Text>
                    </View>

                    <View style={styles.barsGrid}>
                      <View style={[styles.gridLine, { top: '0%' }]} />
                      <View style={[styles.gridLine, { top: '33.3%' }]} />
                      <View style={[styles.gridLine, { top: '66.6%' }]} />
                      <View style={[styles.gridLine, { top: '100%' }]} />

                      <View style={styles.barsContainer}>
                        {FOOTFALL_BARS.map((bar) => {
                          const heightPct = (bar.count / 150) * 100;
                          return (
                            <View key={bar.time} style={styles.barItem}>
                              <Text style={[styles.barTopAmountText, bar.isPeak && { fontWeight: '900', color: '#0F172A' }]}>
                                {bar.count}
                              </Text>
                              <View style={styles.barTrackArea}>
                                <View
                                  style={[
                                    styles.barGradientStick,
                                    {
                                      height: `${heightPct}%`,
                                      backgroundColor: bar.isPeak ? '#8B5CF6' : '#38BDF8',
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={[styles.barMonthLabel, bar.isPeak && { fontWeight: '800', color: '#0F172A' }]}>
                                {bar.time}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Floor Staffing Advice */}
                <View style={styles.staffingAdviceCard}>
                  <View style={styles.staffingIconBox}>
                    <Icon name="people" size={moderateScale(18)} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffingTitle}>Floor Staffing Advice</Text>
                    <Text style={styles.staffingDesc}>
                      7:00 PM – 8:30 PM is the busiest time. Keep extra trainers and staff available during this slot to handle the rush.
                    </Text>
                  </View>
                </View>

                {/* 4. Total Daily Footfall */}
                <View style={styles.totalFootfallCard}>
                  <View style={[styles.miniStatIconSquare, { backgroundColor: '#DCFCE7' }]}>
                    <Icon name="people" size={moderateScale(18)} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                    <Text style={styles.footfallLabel}>Total Daily Footfall</Text>
                    <Text style={styles.footfallValue}>590</Text>
                  </View>
                  <View style={styles.footfallGrowthPill}>
                    <View style={styles.greenPillTag}>
                      <Icon name="arrow-up" size={moderateScale(11)} color="#15803D" />
                      <Text style={styles.greenPillText}>18%</Text>
                    </View>
                    <Text style={styles.footfallGrowthSub}>vs last week</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════
                SCREEN 3: RETENTION TAB
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'retention' && (
              <View style={styles.tabContentStack}>
                {/* 1. Retention Health Card */}
                <View style={styles.whiteCard}>
                  <View style={styles.retentionTopRow}>
                    <View style={[styles.miniStatIconSquare, { backgroundColor: '#DCFCE7' }]}>
                      <Icon name="shield-checkmark" size={moderateScale(18)} color="#16A34A" />
                    </View>
                    <View style={{ marginLeft: moderateScale(10) }}>
                      <Text style={styles.retentionHealthTitle}>Retention Health</Text>
                    </View>
                  </View>

                  <Text style={styles.retentionBigPct}>92%</Text>
                  <Text style={styles.retentionSubtitle}>
                    Members are continuing their fitness journey
                  </Text>

                  {/* Thick Rounded Progress Bar */}
                  <View style={styles.thickProgressTrack}>
                    <View style={[styles.thickProgressFill, { width: `${retentionPercent}%` }]} />
                  </View>

                  {/* 2 Status Rows */}
                  <View style={styles.statusRowsContainer}>
                    <View style={styles.statusRowItem}>
                      <View style={styles.statusDotLabel}>
                        <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={styles.statusNameText}>58 Active Members</Text>
                      </View>
                      <Text style={styles.statusPercentText}>92%</Text>
                    </View>

                    <View style={styles.statusRowItem}>
                      <View style={styles.statusDotLabel}>
                        <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.statusNameText}>4 Expired Members</Text>
                      </View>
                      <Text style={styles.statusPercentText}>8%</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Member Lifespan Card */}
                <View style={styles.whiteCard}>
                  <View style={styles.lifespanRow}>
                    <View style={[styles.miniStatIconSquare, { backgroundColor: '#EDE9FE' }]}>
                      <Icon name="calendar" size={moderateScale(18)} color="#7C3AED" />
                    </View>
                    <View style={{ marginLeft: moderateScale(12), flex: 1 }}>
                      <Text style={styles.lifespanTitle}>Member Lifespan</Text>
                      <Text style={styles.lifespanMonths}>3.5 Months</Text>
                      <Text style={styles.lifespanSub}>Average membership duration</Text>
                    </View>
                  </View>
                </View>

                {/* 3. Membership Status Donut Chart Card */}
                <View style={styles.whiteCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <Icon name="calendar" size={moderateScale(16)} color="#6366F1" />
                      <Text style={styles.cardHeaderTitle}>Membership Status</Text>
                    </View>
                  </View>

                  <View style={styles.donutContentRow}>
                    {/* Donut Circle */}
                    <View style={styles.donutWrapper}>
                      <View style={styles.donutOuterGreenRing}>
                        <View style={styles.donutOuterRedSlice} />
                        <View style={styles.donutInnerHole}>
                          <Text style={styles.donutCenterNumber}>62</Text>
                          <Text style={styles.donutCenterLabel}>Total</Text>
                        </View>
                      </View>
                    </View>

                    {/* Donut Legend */}
                    <View style={styles.donutLegendCol}>
                      <View style={styles.donutLegendItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={styles.donutLegendName}>Active</Text>
                        <Text style={styles.donutLegendVal}>58 (92%)</Text>
                      </View>

                      <View style={styles.donutLegendItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.donutLegendName}>Expired</Text>
                        <Text style={styles.donutLegendVal}>4 (8%)</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Bottom Royal Blue Action Button */}
                <TouchableOpacity
                  style={styles.royalBlueBtn}
                  onPress={() => navigation.navigate('PendingDues')}
                  activeOpacity={0.85}
                >
                  <Icon name="list" size={moderateScale(18)} color="#FFFFFF" />
                  <Text style={styles.royalBlueBtnText}>Check Due & Expiring Members</Text>
                  <Icon name="chevron-forward" size={moderateScale(18)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: hp(4) }} />
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp(10),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#1E60FF',
  },

  // ── Top Header ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
    paddingBottom: hp(1.2),
  },
  headerBackBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateSelectorText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Tab Segment Bar ──
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: wp(4.5),
    borderRadius: moderateScale(14),
    padding: moderateScale(3),
    marginBottom: hp(1.4),
  },
  tabPill: {
    flex: 1,
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(11),
  },
  tabPillActive: {
    backgroundColor: '#1E60FF',
    shadowColor: '#1E60FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
  },
  tabContentStack: {
    gap: moderateScale(12),
  },

  // ── Screen 1: Hero Blue Card ──
  heroBlueCard: {
    backgroundColor: '#1E60FF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    shadowColor: '#1E60FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBlueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBlueIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlueTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroGrowthBadgeWrap: {
    alignItems: 'flex-end',
  },
  heroGrowthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  heroGrowthText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#15803D',
  },
  heroGrowthSub: {
    fontSize: fontScale(8.5),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroBlueAmount: {
    fontSize: fontScale(28),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginVertical: moderateScale(10),
  },
  heroGlassRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  heroGlassPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
  },
  heroGlassNum: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroGlassLabel: {
    fontSize: fontScale(9.5),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // ── Universal White Card ──
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  cardHeaderTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderDropdownText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Chart Area with Y-Axis ──
  chartAreaWithAxis: {
    flexDirection: 'row',
    height: hp(15),
  },
  yAxisCol: {
    width: moderateScale(26),
    justifyContent: 'space-between',
    paddingBottom: moderateScale(16),
  },
  yAxisText: {
    fontSize: fontScale(8.5),
    color: '#94A3B8',
    fontWeight: '600',
  },
  barsGrid: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barItem: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  barTopAmountText: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: moderateScale(3),
  },
  barTrackArea: {
    width: moderateScale(14),
    flex: 1,
    justifyContent: 'flex-end',
  },
  barGradientStick: {
    width: '100%',
    borderTopLeftRadius: moderateScale(6),
    borderTopRightRadius: moderateScale(6),
  },
  barMonthLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: moderateScale(4),
  },

  // ── Two Cards Row ──
  twoCardsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  miniStatIconSquare: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  miniStatLabel: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  miniStatValueSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Tip Card ──
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: moderateScale(10),
  },
  tipIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: fontScale(10.5),
    color: '#78350F',
    lineHeight: fontScale(15),
    fontWeight: '500',
  },

  // ── Screen 2: Shifts Row ──
  shiftCard: {
    flex: 1,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftIconBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(6),
  },
  shiftTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  shiftHours: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  shiftPercentBlue: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#2563EB',
  },
  shiftPercentRed: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#EF4444',
  },

  // Staffing Advice Card
  staffingAdviceCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: moderateScale(10),
  },
  staffingIconBox: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffingTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 2,
  },
  staffingDesc: {
    fontSize: fontScale(10.5),
    color: '#5B21B6',
    lineHeight: fontScale(15),
    fontWeight: '500',
  },

  // Total Daily Footfall Card
  totalFootfallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  footfallLabel: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
  },
  footfallValue: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  footfallGrowthPill: {
    alignItems: 'flex-end',
  },
  greenPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  greenPillText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#15803D',
  },
  footfallGrowthSub: {
    fontSize: fontScale(8.5),
    color: '#64748B',
    marginTop: 2,
  },

  // ── Screen 3: Retention Health ──
  retentionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retentionHealthTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  retentionBigPct: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: moderateScale(4),
  },
  retentionSubtitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: moderateScale(10),
  },
  thickProgressTrack: {
    height: moderateScale(10),
    backgroundColor: '#E2E8F0',
    borderRadius: moderateScale(5),
    overflow: 'hidden',
    marginBottom: moderateScale(12),
  },
  thickProgressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: moderateScale(5),
  },
  statusRowsContainer: {
    gap: moderateScale(6),
  },
  statusRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  statusNameText: {
    fontSize: fontScale(11),
    color: '#334155',
    fontWeight: '600',
  },
  statusPercentText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#0F172A',
  },

  // Lifespan Card
  lifespanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifespanTitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  lifespanMonths: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 1,
  },
  lifespanSub: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Donut Chart Row
  donutContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
  },
  donutWrapper: {
    width: moderateScale(90),
    height: moderateScale(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuterGreenRing: {
    width: moderateScale(84),
    height: moderateScale(84),
    borderRadius: moderateScale(42),
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  donutOuterRedSlice: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(30),
    height: moderateScale(30),
    backgroundColor: '#EF4444',
  },
  donutInnerHole: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterNumber: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  donutCenterLabel: {
    fontSize: fontScale(8.5),
    color: '#64748B',
    fontWeight: '600',
  },
  donutLegendCol: {
    flex: 1,
    marginLeft: moderateScale(16),
    gap: moderateScale(8),
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  donutLegendName: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    width: moderateScale(50),
  },
  donutLegendVal: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#0F172A',
  },

  // Royal Blue Action Button
  royalBlueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E60FF',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    shadowColor: '#1E60FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  royalBlueBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: moderateScale(8),
  },
});
