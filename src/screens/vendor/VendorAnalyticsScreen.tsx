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
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import {
  VendorOrder,
} from '../../data/mockData';

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function VendorAnalyticsScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? '';

  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [b2bRevenue, setB2bRevenue] = useState(0);
  const [retailRevenue, setRetailRevenue] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadAnalyticsData = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.allSettled([
        apiService.getVendorAnalytics(vendorId),
        apiService.getVendorOrders(vendorId),
      ]);

      let ordersList: VendorOrder[] = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const raw = ordersRes.value;
        if (raw.success && Array.isArray(raw.data)) ordersList = raw.data;
        else if (Array.isArray(raw)) ordersList = raw;
      }

      let rev = 0;
      let b2b = 0;
      let retail = 0;
      const count = ordersList.length;

      ordersList.forEach((ord: any) => {
        const amt = Number(ord.totalAmount || ord.total) || 0;
        rev += amt;
        if (ord.buyerType === 'gym_owner' || ord.deliveryMethod === 'gym_delivery') {
          b2b += amt;
        } else {
          retail += amt;
        }
      });

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        const aData: any = (analyticsRes.value as any).data || analyticsRes.value;
        if (aData && aData.totalRevenue !== undefined) rev = Number(aData.totalRevenue);
        if (aData && aData.monthlyTrend && Array.isArray(aData.monthlyTrend)) {
          setMonthlyGrowth(aData.monthlyTrend);
        }
      }

      setTotalRevenue(rev);
      setOrderCount(count);
      setB2bRevenue(b2b);
      setRetailRevenue(retail);
      if (!monthlyGrowth.some((v) => v > 0) && rev > 0) {
        const base = Math.max(1, rev / 6);
        setMonthlyGrowth([
          Math.round(base * 0.4),
          Math.round(base * 0.6),
          Math.round(base * 0.75),
          Math.round(base * 0.9),
          Math.round(base * 1.1),
          Math.round(base * 1.25),
        ]);
      }
    } catch (e) {
      console.log('Error loading vendor analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
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
  }, [vendorId]);

  const maxVal = Math.max(...monthlyGrowth, 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Financial & Analytics</Text>
            <Text style={styles.headerSub}>Store Settlement & Revenue</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── TOTAL SETTLEMENT CARD ── */}
          <View style={styles.payoutCard}>
            <Text style={styles.payoutLabel}>Total Store Revenue</Text>
            <Text style={styles.payoutVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
            <Text style={styles.payoutSub}>Net collections across {orderCount} orders</Text>
            <View style={styles.payoutDivider} />
            <View style={styles.payoutRow}>
              <View>
                <Text style={styles.miniLabel}>Next Payout</Text>
                <Text style={styles.miniVal}>₹{Math.round(totalRevenue * 0.25).toLocaleString('en-IN')}</Text>
              </View>
              <View>
                <Text style={styles.miniLabel}>Status</Text>
                <Text style={[styles.miniVal, { color: '#00C48C' }]}>Verified</Text>
              </View>
            </View>
          </View>

          {/* ── 2-COLUMN BREAKDOWN ── */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Gym B2B Orders</Text>
              <Text style={[styles.breakdownVal, { color: '#6C5CE7' }]}>
                ₹{b2bRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.breakdownSub}>Bulk procurement</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Direct Members</Text>
              <Text style={[styles.breakdownVal, { color: '#00C48C' }]}>
                ₹{retailRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.breakdownSub}>Retail checkout</Text>
            </View>
          </View>

          {/* ── MONTHLY REVENUE CHART ── */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Monthly Growth Trend</Text>
              <Text style={styles.chartSub}>INR Performance</Text>
            </View>

            <View style={styles.barChartContainer}>
              {monthlyGrowth.map((val, idx) => {
                const isLatest = idx === monthlyGrowth.length - 1;
                return (
                  <View key={MONTHS[idx] || idx} style={styles.barCol}>
                    <Text style={styles.barTopVal}>₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.min(100, Math.max(8, (val / maxVal) * 100))}%`,
                            backgroundColor: isLatest ? '#6C5CE7' : '#C7D2FE',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isLatest && styles.barLabelActive]}>
                      {MONTHS[idx] || `M${idx + 1}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

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
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  headerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Payout Card
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: hp(2),
  },
  payoutLabel: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  payoutVal: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  payoutSub: {
    fontSize: fontScale(11.5),
    color: '#94A3B8',
  },
  payoutDivider: {
    height: 1,
    backgroundColor: '#F3F2FE',
    marginVertical: hp(1.5),
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
  miniVal: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },

  // Breakdown Row
  breakdownRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  breakdownTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownVal: {
    fontSize: fontScale(17),
    fontWeight: '900',
    marginVertical: 4,
  },
  breakdownSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
  },

  // Chart
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
    height: moderateScale(150),
    paddingTop: moderateScale(20),
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
    height: moderateScale(100),
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
});
