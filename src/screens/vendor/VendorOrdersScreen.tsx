import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  TextInput,
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
  VENDOR_ORDERS,
  VendorOrder,
  OrderStatus,
  DeliveryMethod,
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

export default function VendorOrdersScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [orders, setOrders] = useState<VendorOrder[]>(getVendorOrdersByStore(vendorId));
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);

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

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'pending') {
      return ['new', 'accepted', 'packed', 'shipped'].includes(order.status);
    }
    if (activeTab === 'completed') {
      return order.status === 'delivered';
    }
    if (activeTab === 'cancelled') {
      return order.status === 'cancelled';
    }
    return true;
  });

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    Alert.alert('Status Updated', `Order ${orderId} marked as ${newStatus.toUpperCase()}.`);
  };

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
            <Text style={styles.headerTitle}>Order Fulfillment</Text>
            <Text style={styles.headerSub}>{orders.length} Total Store Orders</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabRow}>
          {(['pending', 'completed', 'cancelled', 'all'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="cube-outline" size={moderateScale(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySub}>There are no {activeTab} orders at this moment.</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const isNew = order.status === 'new';
              const isDelivered = order.status === 'delivered';
              const isCancelled = order.status === 'cancelled';

              return (
                <AnimatedPressable
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => setSelectedOrder(order)}
                >
                  <View style={styles.orderHeaderRow}>
                    <View style={styles.orderIdBadge}>
                      <Text style={styles.orderIdText}>{order.id}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isNew
                            ? 'rgba(108, 92, 231, 0.10)'
                            : isDelivered
                            ? 'rgba(0, 196, 140, 0.10)'
                            : isCancelled
                            ? 'rgba(255, 77, 109, 0.10)'
                            : 'rgba(255, 153, 0, 0.10)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isNew
                              ? '#6C5CE7'
                              : isDelivered
                              ? '#00C48C'
                              : isCancelled
                              ? '#FF4D6D'
                              : '#FF9900',
                          },
                        ]}
                      >
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.customerName}>{order.buyerName}</Text>
                  <Text style={styles.customerPhone}>📞 {order.buyerPhone}</Text>

                  {/* Items List */}
                  <View style={styles.itemsBox}>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemTitle}>
                          {item.qty}x {item.productName}
                        </Text>
                        <Text style={styles.itemPrice}>₹{(item.price * item.qty).toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Total & Action */}
                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Total Bill</Text>
                      <Text style={styles.totalVal}>₹{order.total.toLocaleString()}</Text>
                    </View>

                    {isNew && (
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => updateOrderStatus(order.id, 'accepted')}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.acceptBtnText}>ACCEPT ORDER</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ORDER DETAIL MODAL ── */}
        <Modal visible={!!selectedOrder} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order #{selectedOrder?.id}</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailCustomer}>{selectedOrder?.buyerName}</Text>
              <Text style={styles.detailAddress}>📍 {selectedOrder?.deliveryAddress}</Text>

              <View style={styles.modalStatusRow}>
                <TouchableOpacity
                  style={[styles.statusActionBtn, { backgroundColor: '#6C5CE7' }]}
                  onPress={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'shipped')}
                >
                  <Text style={styles.statusActionText}>Mark Shipped 🚚</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusActionBtn, { backgroundColor: '#00C48C' }]}
                  onPress={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'delivered')}
                >
                  <Text style={styles.statusActionText}>Mark Delivered ✔️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: moderateScale(8),
    marginBottom: hp(1.5),
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
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  orderIdBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  orderIdText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  statusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  statusPillText: {
    fontSize: fontScale(10),
    fontWeight: '800',
  },
  customerName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },

  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginVertical: hp(1.2),
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: fontScale(12),
    color: '#0F172A',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: fontScale(12),
    color: '#64748B',
  },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: fontScale(10.5),
    color: '#64748B',
  },
  totalVal: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  acceptBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  acceptBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(4),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailCustomer: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailAddress: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginVertical: hp(1),
  },
  modalStatusRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: hp(1.5),
  },
  statusActionBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActionText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
