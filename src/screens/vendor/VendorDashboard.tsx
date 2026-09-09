import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import {
  getVendorOrdersByStore,
  getVendorProductsByStore,
  VENDOR_ANALYTICS,
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

export default function VendorDashboard({ navigation }: any) {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const allOrders = getVendorOrdersByStore(vendorId);
  const products = getVendorProductsByStore(vendorId);
  const newOrders = allOrders.filter((o) => o.status === 'new');
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

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
            <Text style={styles.storeName}>{currentVendor?.storeName ?? 'Muscle Store India'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Store Open • Accepting Orders</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.avatarBox}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{currentVendor?.avatar ?? 'MS'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── 4 VENDOR METRICS ── */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Icon name="cash" size={moderateScale(18)} color="#00C48C" />
              </View>
              <Text style={styles.metricVal}>₹84,200</Text>
              <Text style={styles.metricLbl}>Today's Sales</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(108, 92, 231, 0.10)' }]}>
                <Icon name="receipt" size={moderateScale(18)} color="#6C5CE7" />
              </View>
              <Text style={styles.metricVal}>28</Text>
              <Text style={styles.metricLbl}>Total Orders</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.10)' }]}>
                <Icon name="cube" size={moderateScale(18)} color="#38BDF8" />
              </View>
              <Text style={styles.metricVal}>{products.length}</Text>
              <Text style={styles.metricLbl}>Listed SKUs</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 153, 0, 0.10)' }]}>
                <Icon name="alert-circle" size={moderateScale(18)} color="#FF9900" />
              </View>
              <Text style={[styles.metricVal, { color: '#FF9900' }]}>{lowStock.length}</Text>
              <Text style={styles.metricLbl}>Low Stock Alerts</Text>
            </View>
          </View>

          {/* ── NEW PENDING ORDERS CARD ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pending Orders ({newOrders.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Manage All →</Text>
            </TouchableOpacity>
          </View>

          {newOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="checkmark-done-circle" size={moderateScale(36)} color="#00C48C" />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>No pending orders awaiting dispatch.</Text>
            </View>
          ) : (
            newOrders.slice(0, 3).map((ord) => (
              <AnimatedPressable
                key={ord.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('Orders')}
              >
                <View style={styles.orderIconBox}>
                  <Icon name="bag-handle" size={moderateScale(20)} color="#6C5CE7" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.orderTopRow}>
                    <Text style={styles.orderCustomer}>{ord.buyerName}</Text>
                    <Text style={styles.orderAmount}>₹{ord.total.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.orderItemsSub}>
                    {ord.items.length} items • {ord.deliveryMethod === 'local' ? '⚡ Quick Express' : '🚚 Standard Shipping'}
                  </Text>
                </View>

                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </AnimatedPressable>
            ))
          )}

          {/* ── QUICK ACTIONS ── */}
          <Text style={[styles.sectionTitle, { marginTop: hp(2.5), marginBottom: hp(1.2) }]}>
            Store Quick Actions
          </Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Products')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(108, 92, 231, 0.10)' }]}>
                <Icon name="add-circle" size={moderateScale(22)} color="#6C5CE7" />
              </View>
              <Text style={styles.actionTitle}>Add Product</Text>
              <Text style={styles.actionSub}>Create supplement SKU</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Icon name="trending-up" size={moderateScale(22)} color="#00C48C" />
              </View>
              <Text style={styles.actionTitle}>Sales Trends</Text>
              <Text style={styles.actionSub}>Revenue & volume graph</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  storeName: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#00C48C',
  },
  statusText: {
    fontSize: fontScale(11),
    color: '#00C48C',
    fontWeight: '600',
  },
  avatarBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  avatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // 4 Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  metricCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  metricIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  metricVal: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricLbl: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // Order Card
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  orderIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  orderAmount: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  orderItemsSub: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
  newBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.10)',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  newBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.5),
  },
  emptyTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  actionIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  actionTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
});
