import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors } from '../../theme';
import {
  getVendorOrdersByStore, VENDOR_ORDERS, VendorOrder, OrderStatus, DeliveryMethod,
} from '../../data/mockData';

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  new:       { label: 'New',       color: LightColors.info, bg: LightColors.cyanBg, icon: '🆕' },
  accepted:  { label: 'Accepted',  color: LightColors.accentViolet, bg: `${LightColors.accentViolet}15`, icon: '✅' },
  packed:    { label: 'Packed',    color: LightColors.warning, bg: LightColors.warningBg, icon: '📦' },
  shipped:   { label: 'Shipped',   color: LightColors.info, bg: LightColors.cyanBg, icon: '🚚' },
  delivered: { label: 'Delivered', color: LightColors.success, bg: LightColors.successBg, icon: '✔️' },
  cancelled: { label: 'Cancelled', color: LightColors.danger, bg: LightColors.dangerBg, icon: '❌' },
};

const BUYER_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gym_owner: { label: 'Gym Owner', icon: '🏢', color: '#7C3AED', bg: '#EDE9FE' },
  member:    { label: 'Member',   icon: '👤', color: '#0EA5E9', bg: '#E0F2FE' },
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'new', label: 'Ordered' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'packed', label: 'Packed' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

export default function VendorOrdersScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [orders, setOrders] = useState<VendorOrder[]>(getVendorOrdersByStore(vendorId));
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [showShipModal, setShowShipModal] = useState(false);

  // Filter orders based on tabs
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return ['new', 'accepted', 'packed', 'shipped'].includes(order.status);
    }
    if (activeTab === 'completed') {
      return order.status === 'delivered';
    }
    if (activeTab === 'cancelled') {
      return order.status === 'cancelled';
    }
    return true; // 'all'
  });

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, trackingId?: string) => {
    // Update local state
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          status: newStatus,
          updatedAt: new Date().toISOString().split('T')[0],
          ...(trackingId ? { trackingId } : {}),
        };
        // Also update selectedOrder details modal if open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updated);
        }
        return updated;
      }
      return o;
    }));

    // Update global mockData array
    const idx = VENDOR_ORDERS.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      VENDOR_ORDERS[idx].status = newStatus;
      VENDOR_ORDERS[idx].updatedAt = new Date().toISOString().split('T')[0];
      if (trackingId) {
        VENDOR_ORDERS[idx].trackingId = trackingId;
      }
    }
  };

  const handleAccept = (orderId: string) => {
    Alert.alert('Accept Order', `Accept order ${orderId}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => updateOrderStatus(orderId, 'accepted') },
    ]);
  };

  const handleReject = (orderId: string) => {
    Alert.alert('Reject Order', `Reject and cancel order ${orderId}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateOrderStatus(orderId, 'cancelled') },
    ]);
  };

  const handlePack = (orderId: string) => {
    Alert.alert('Pack Order', `Mark order ${orderId} as packed?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pack', onPress: () => updateOrderStatus(orderId, 'packed') },
    ]);
  };

  const handleShipPress = (order: VendorOrder) => {
    setTrackingInput(order.trackingId || '');
    setShowShipModal(true);
  };

  const handleConfirmShip = () => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, 'shipped', trackingInput);
    setShowShipModal(false);
    setTrackingInput('');
    Alert.alert('Order Shipped', `Order ${selectedOrder.id} has been marked as shipped.`);
  };

  const handleDeliver = (orderId: string) => {
    Alert.alert('Deliver Order', `Mark order ${orderId} as delivered?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deliver', onPress: () => updateOrderStatus(orderId, 'delivered') },
    ]);
  };

  // Helper to render step in Stepper
  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    return STEPS.findIndex(s => s.status === status);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Order Fulfillment</Text>
              <Text style={styles.headerTitle}>Store Orders 📦</Text>
            </View>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {(['pending', 'completed', 'cancelled', 'all'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ORDERS LIST */}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyText}>No {activeTab} orders found.</Text>
            </View>
          ) : (
            filteredOrders.map(order => {
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.new;
              const buyerCfg = BUYER_CFG[order.buyerType] ?? BUYER_CFG.member;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => setSelectedOrder(order)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderId}>{order.id}</Text>
                      <Text style={styles.orderDate}>Ordered on {order.orderedAt}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                          {cfg.icon} {cfg.label}
                        </Text>
                      </View>
                      <View style={[styles.buyerBadge, { backgroundColor: buyerCfg.bg }]}>
                        <Text style={[styles.buyerBadgeText, { color: buyerCfg.color }]}>
                          {buyerCfg.icon} {buyerCfg.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.buyerName}>👤 {order.buyerName}</Text>
                    <Text style={styles.itemSummary}>
                      🛒 {order.items.length} item{order.items.length > 1 ? 's' : ''} ({order.items.map(i => i.productName).join(', ')})
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.paymentMethod}>💳 {order.paymentMethod.toUpperCase()}</Text>
                      <Text style={styles.deliveryMethod}>🚚 {order.deliveryMethod.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.totalLabel}>Total Value:</Text>
                    <Text style={styles.totalValue}>₹{order.total.toLocaleString('en-IN')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* DETAIL MODAL */}
        {selectedOrder && (
          <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedOrder(null)}>
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <View>
                    <Text style={styles.modalSub}>{selectedOrder.id}</Text>
                    <Text style={styles.modalTitle}>Order Details</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Stepper */}
                {selectedOrder.status !== 'cancelled' && (
                  <View style={styles.stepperContainer}>
                    <Text style={styles.sectionTitle}>Fulfillment Status</Text>
                    <View style={styles.stepper}>
                      {STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(selectedOrder.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <View key={step.status} style={styles.stepCol}>
                            {idx > 0 && (
                              <View style={[
                                styles.stepLine,
                                { backgroundColor: idx <= currentIdx ? LightColors.success : LightColors.border },
                              ]} />
                            )}
                            <View style={[
                              styles.stepNode,
                              isCompleted && { backgroundColor: LightColors.success, borderColor: LightColors.success },
                              isCurrent && { backgroundColor: LightColors.bgSurface, borderColor: LightColors.accentViolet, borderWidth: 3 },
                            ]}>
                              {isCompleted && !isCurrent ? (
                                <Text style={styles.stepCheck}>✓</Text>
                              ) : (
                                <Text style={[styles.stepNum, isCurrent && { color: LightColors.accentViolet, fontWeight: '800' }]}>{idx + 1}</Text>
                              )}
                            </View>
                            <Text style={[
                              styles.stepLabel,
                              isCompleted && { color: LightColors.success, fontWeight: '700' },
                              isCurrent && { color: LightColors.accentViolet, fontWeight: '800' },
                            ]}>
                              {step.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Buyer & Shipping details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Customer & Delivery</Text>
                  {/* Buyer type pill */}
                  <View style={styles.buyerTypePill}>
                    {(() => {
                      const bc = BUYER_CFG[selectedOrder.buyerType] ?? BUYER_CFG.member;
                      return (
                        <View style={[styles.buyerTypeBadgeFull, { backgroundColor: bc.bg, borderColor: bc.color }]}>
                          <Text style={{ fontSize: 18 }}>{bc.icon}</Text>
                          <View>
                            <Text style={[styles.buyerTypeTitle, { color: bc.color }]}>{bc.label}</Text>
                            <Text style={styles.buyerTypeDesc}>
                              {selectedOrder.buyerType === 'gym_owner'
                                ? 'Bulk/Owner pricing applied'
                                : 'Member pricing applied'}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Buyer Name:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.buyerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>📞 {selectedOrder.buyerPhone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.paymentMethod.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Method:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.deliveryMethod.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Address:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                  {selectedOrder.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Order Notes:</Text>
                      <Text style={[styles.detailValue, { fontStyle: 'italic', color: '#EF4444' }]}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                  {selectedOrder.trackingId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tracking ID:</Text>
                      <Text style={[styles.detailValue, { fontWeight: '800', color: '#0EA5E9' }]}>{selectedOrder.trackingId}</Text>
                    </View>
                  )}
                </View>

                {/* Items */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Items Ordered</Text>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemQty}>₹{item.price.toLocaleString('en-IN')} × {item.qty}</Text>
                      </View>
                      <Text style={styles.itemTotal}>₹{item.total.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{(selectedOrder.total - selectedOrder.deliveryCharge + selectedOrder.discount).toLocaleString('en-IN')}</Text>
                  </View>
                  {selectedOrder.deliveryCharge > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Charges</Text>
                      <Text style={styles.summaryValue}>+ ₹{selectedOrder.deliveryCharge}</Text>
                    </View>
                  )}
                  {selectedOrder.discount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount Applied</Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>- ₹{selectedOrder.discount}</Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, { marginTop: 6 }]}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹{selectedOrder.total.toLocaleString('en-IN')}</Text>
                  </View>
                  {/* Pricing type applied */}
                  <View style={styles.pricingAppliedBanner}>
                    {(() => {
                      const bc = BUYER_CFG[selectedOrder.buyerType] ?? BUYER_CFG.member;
                      return (
                        <Text style={[styles.pricingAppliedText, { color: bc.color }]}>
                          {bc.icon} {bc.label} pricing applied to this order
                        </Text>
                      );
                    })()}
                  </View>
                </View>

                {/* Fulfillment Actions */}
                <View style={styles.actionsSection}>
                  {selectedOrder.status === 'new' && (
                    <View style={styles.rowActions}>
                      <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => handleAccept(selectedOrder.id)}>
                        <Text style={styles.btnText}>✅ Accept Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => handleReject(selectedOrder.id)}>
                        <Text style={styles.btnText}>❌ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedOrder.status === 'accepted' && (
                    <TouchableOpacity style={[styles.btnFull, styles.btnAccent]} onPress={() => handlePack(selectedOrder.id)}>
                      <Text style={styles.btnFullText}>📦 Mark Packed</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'packed' && (
                    <TouchableOpacity style={[styles.btnFull, styles.btnBlue]} onPress={() => handleShipPress(selectedOrder)}>
                      <Text style={styles.btnFullText}>🚚 Ship Order (Add Tracking)</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <TouchableOpacity style={[styles.btnFull, styles.btnSuccess]} onPress={() => handleDeliver(selectedOrder.id)}>
                      <Text style={styles.btnFullText}>✔️ Mark Delivered</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <View style={styles.completedBanner}>
                      <Text style={styles.completedBannerText}>🎉 Order Fulfilled Successfully</Text>
                    </View>
                  )}
                  {selectedOrder.status === 'cancelled' && (
                    <View style={styles.cancelledBanner}>
                      <Text style={styles.cancelledBannerText}>❌ This order was cancelled/rejected</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* SHIP TRACKING MODAL */}
        <Modal visible={showShipModal} transparent animationType="fade" onRequestClose={() => setShowShipModal(false)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBox}>
              <Text style={styles.dialogTitle}>Ship Order 🚚</Text>
              <Text style={styles.dialogDesc}>Please enter the shipping details / tracking code for this order (optional):</Text>
              <TextInput
                style={styles.dialogInput}
                placeholder="e.g. DTDC-19283921-IN"
                placeholderTextColor="#94A3B8"
                value={trackingInput}
                onChangeText={setTrackingInput}
              />
              <View style={styles.dialogActions}>
                <TouchableOpacity style={[styles.dialogBtn, styles.dialogBtnCancel]} onPress={() => setShowShipModal(false)}>
                  <Text style={styles.dialogBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dialogBtn, styles.dialogBtnConfirm]} onPress={handleConfirmShip}>
                  <Text style={styles.dialogBtnTextConfirm}>Confirm Shipment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  tabBarContainer: { backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  tabBar: { flexDirection: 'row', width: '100%', maxWidth: 600, alignSelf: 'center' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: LightColors.accentViolet },
  tabLabel: { fontSize: 10, fontWeight: '700', color: LightColors.textMuted },
  tabLabelActive: { color: LightColors.accentViolet },
  scroll: {
    padding: 16, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: LightColors.textMuted, fontWeight: '600' },
  orderCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: LightColors.border, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: LightColors.border, paddingBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary },
  orderDate: { fontSize: 11, color: LightColors.textMuted, marginTop: 2, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { paddingVertical: 12, gap: 8 },
  buyerName: { fontSize: 13, fontWeight: '700', color: LightColors.textSecondary },
  itemSummary: { fontSize: 13, color: LightColors.textMuted, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  paymentMethod: { fontSize: 11, color: LightColors.textMuted, fontWeight: '600' },
  deliveryMethod: { fontSize: 11, color: LightColors.textMuted, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: LightColors.border, paddingTop: 12 },
  totalLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textMuted },
  totalValue: { fontSize: 16, fontWeight: '800', color: LightColors.textPrimary },
  // Detail Modal
  modalSafeArea: { flex: 1, backgroundColor: LightColors.bgSurface },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: LightColors.border, backgroundColor: LightColors.bgSurface },
  modalHeaderContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary },
  modalSub: { fontSize: 11, fontWeight: '700', color: LightColors.textMuted, letterSpacing: 0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: LightColors.textSecondary, fontWeight: '700' },
  modalScroll: {
    padding: 20, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepperContainer: { backgroundColor: LightColors.bgElevated, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: LightColors.border },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: 10 },
  stepCol: { flex: 1, alignItems: 'center', position: 'relative' },
  stepLine: { position: 'absolute', top: 12, left: '-50%', right: '50%', height: 3, zIndex: -1 },
  stepNode: { width: 26, height: 26, borderRadius: 13, backgroundColor: LightColors.bgBase, borderWidth: 2, borderColor: LightColors.border, alignItems: 'center', justifyContent: 'center' },
  stepCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stepNum: { color: LightColors.textMuted, fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 9, color: LightColors.textMuted, marginTop: 6, fontWeight: '600', textAlign: 'center' },
  detailsSection: { backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border, paddingBottom: 16, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 14 },
  detailLabel: { fontSize: 13, color: LightColors.textMuted, fontWeight: '600', width: 110 },
  detailValue: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  itemName: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  itemQty: { fontSize: 12, color: LightColors.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  divider: { height: 1, backgroundColor: LightColors.border, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: LightColors.textMuted, fontWeight: '600' },
  summaryValue: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '600' },
  grandTotalLabel: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: LightColors.accentViolet },
  actionsSection: { marginTop: 10 },
  rowActions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSuccess: { backgroundColor: LightColors.successBg, borderWidth: 1, borderColor: LightColors.success },
  btnDanger: { backgroundColor: LightColors.dangerBg, borderWidth: 1, borderColor: LightColors.danger },
  btnText: { fontSize: 13, fontWeight: '700', color: LightColors.textPrimary },
  btnFull: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccent: { backgroundColor: `${LightColors.accentViolet}15`, borderWidth: 1, borderColor: LightColors.accentViolet },
  btnBlue: { backgroundColor: LightColors.cyanBg, borderWidth: 1, borderColor: LightColors.info },
  btnFullText: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  completedBanner: { backgroundColor: LightColors.successBg, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: LightColors.success },
  completedBannerText: { fontSize: 13, fontWeight: '700', color: LightColors.success },
  cancelledBanner: { backgroundColor: LightColors.dangerBg, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: LightColors.danger },
  cancelledBannerText: { fontSize: 13, fontWeight: '700', color: LightColors.danger },
  buyerBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  buyerBadgeText: { fontSize: 10, fontWeight: '700' },
  buyerTypePill: { marginBottom: 12 },
  buyerTypeBadgeFull: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  buyerTypeTitle: { fontSize: 13, fontWeight: '800' },
  buyerTypeDesc: { fontSize: 10, color: LightColors.textMuted, marginTop: 1 },
  pricingAppliedBanner: { backgroundColor: LightColors.bgElevated, borderRadius: 8, padding: 10, marginTop: 8, alignItems: 'center' },
  pricingAppliedText: { fontSize: 12, fontWeight: '700' },
  // Dialog (Ship tracking)
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogBox: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, gap: 14 },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  dialogDesc: { fontSize: 13, color: LightColors.textSecondary, lineHeight: 18 },
  dialogInput: { backgroundColor: LightColors.bgElevated, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: LightColors.textPrimary },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  dialogBtnCancel: { backgroundColor: LightColors.bgElevated },
  dialogBtnConfirm: { backgroundColor: LightColors.accentViolet },
  dialogBtnTextCancel: { fontSize: 13, fontWeight: '700', color: LightColors.textMuted },
  dialogBtnTextConfirm: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
