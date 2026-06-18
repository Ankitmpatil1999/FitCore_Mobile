import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import {
  getVendorWallet, getVendorTransactions, VENDOR_STORES,
  VendorStore, VendorTransaction, VendorWallet as WalletType,
} from '../../data/mockData';

const CAT_LABELS: Record<string, string> = {
  supplement_store: 'Supplement Store 💊',
  nutrition_shop: 'Nutrition Shop 🥗',
  equipment_dealer: 'Equipment Dealer 🏋️',
  accessories_store: 'Gym Accessories 🎒',
  sports_nutrition: 'Sports Nutrition 🥛',
};

export default function VendorProfileScreen() {
  const { currentVendor, logout } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [store, setStore] = useState<VendorStore | null>(currentVendor);
  const [wallet, setWallet] = useState<WalletType | undefined>(getVendorWallet(vendorId));
  const [transactions, setTransactions] = useState<VendorTransaction[]>(getVendorTransactions(vendorId));

  // Edit delivery settings states
  const [freeDelAbove, setFreeDelAbove] = useState(store?.freeDeliveryAbove.toString() ?? '999');
  const [delCharges, setDelCharges] = useState(store?.deliveryCharges.toString() ?? '49');

  const handleSimulateApproval = () => {
    if (!store) return;
    const updatedStore = { ...store, status: 'approved' as const };
    setStore(updatedStore);

    // Update globally in mock data
    const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
    if (idx !== -1) {
      VENDOR_STORES[idx].status = 'approved';
    }

    // Update in context if possible. Since context reference is direct to mockData, this works in-memory!
    Alert.alert('Demo Mode Success', 'Vendor store approved! Refreshing layout...');
  };

  const handleRequestPayout = () => {
    if (!wallet || wallet.availableBalance <= 0) {
      Alert.alert('Insufficient Balance', 'You do not have any available balance to withdraw.');
      return;
    }

    const withdrawAmt = wallet.availableBalance;
    Alert.alert(
      'Request Payout',
      `Transfer ₹${withdrawAmt.toLocaleString('en-IN')} to your bank account (${store?.bankAccount}) or UPI ID (${wallet.upiId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            // Update wallet
            const updatedWallet = {
              ...wallet,
              availableBalance: 0,
              totalWithdrawn: wallet.totalWithdrawn + withdrawAmt,
              lastWithdrawalDate: new Date().toISOString().split('T')[0],
            };
            setWallet(updatedWallet);

            // Add transaction
            const newTx: VendorTransaction = {
              id: `VT-${Date.now().toString().slice(-4)}`,
              vendorId,
              type: 'withdrawal',
              amount: withdrawAmt,
              description: `Payout to bank account ****${store?.bankAccount.slice(-4)}`,
              date: new Date().toISOString().split('T')[0],
              status: 'completed',
            };
            setTransactions(prev => [newTx, ...prev]);

            Alert.alert('Transfer Initiated', 'Payout transfer completed successfully!');
          },
        },
      ]
    );
  };

  const handleSaveDelivery = () => {
    if (!store) return;
    const updatedStore = {
      ...store,
      freeDeliveryAbove: parseFloat(freeDelAbove) || 0,
      deliveryCharges: parseFloat(delCharges) || 0,
    };
    setStore(updatedStore);

    const idx = VENDOR_STORES.findIndex(s => s.id === store.id);
    if (idx !== -1) {
      VENDOR_STORES[idx].freeDeliveryAbove = parseFloat(freeDelAbove) || 0;
      VENDOR_STORES[idx].deliveryCharges = parseFloat(delCharges) || 0;
    }
    Alert.alert('Saved', 'Delivery preferences updated successfully.');
  };

  if (!store) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No Store Context Found</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = store.status === 'approved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerSub}>Store Profile</Text>
            <Text style={styles.headerTitle}>{store.storeName} Settings ⚙️</Text>
          </View>
          <TouchableOpacity style={styles.headerLogout} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* PROFILE HERO */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{store.avatar}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.storeNameText}>{store.storeName}</Text>
                <Text style={styles.categoryText}>{CAT_LABELS[store.category] ?? store.category}</Text>
                <Text style={styles.taglineText}>"{store.tagline}"</Text>
              </View>
            </View>

            {/* STATUS BADGE */}
            <View style={[
              styles.statusBanner,
              {
                backgroundColor: isApproved ? '#ECFDF5' : store.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                borderColor: isApproved ? '#A7F3D0' : store.status === 'pending' ? '#FDE68A' : '#FCA5A5',
              }
            ]}>
              <Text style={{ fontSize: 18 }}>{isApproved ? '✅' : store.status === 'pending' ? '⏳' : '❌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, { color: isApproved ? '#065F46' : store.status === 'pending' ? '#92400E' : '#991B1B' }]}>
                  Status: {store.status.toUpperCase()}
                </Text>
                <Text style={styles.statusDesc}>
                  {isApproved
                    ? 'Your products are live on the FitCore store'
                    : store.status === 'pending'
                    ? 'Registration pending Admin verification'
                    : 'Your store is currently suspended'}
                </Text>
              </View>
              {!isApproved && store.status === 'pending' && (
                <TouchableOpacity style={styles.approveBtnSim} onPress={handleSimulateApproval}>
                  <Text style={styles.approveBtnSimText}>Approve (Demo)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* WALLET & PAYOUTS */}
          {wallet && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💰 Wallet & Payouts</Text>
              <View style={styles.walletStats}>
                <View style={styles.walletRow}>
                  <View style={styles.walletCol}>
                    <Text style={styles.walletLabel}>Available Balance</Text>
                    <Text style={styles.walletValAccent}>₹{wallet.availableBalance.toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity style={styles.payoutBtn} onPress={handleRequestPayout} activeOpacity={0.85}>
                    <Text style={styles.payoutBtnText}>Payout 🚀</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.walletDivider} />

                <View style={styles.walletGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Total Earnings</Text>
                    <Text style={styles.gridVal}>₹{wallet.totalEarnings.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Pending Payout</Text>
                    <Text style={styles.gridVal}>₹{wallet.pendingSettlement.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Total Withdrawn</Text>
                    <Text style={styles.gridVal}>₹{wallet.totalWithdrawn.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                {wallet.lastWithdrawalDate && (
                  <Text style={styles.walletDateText}>Last payout: {wallet.lastWithdrawalDate}</Text>
                )}
              </View>
            </View>
          )}

          {/* RECENT Payout/Wallet ledger */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📊 Wallet Transactions</Text>
            {transactions.length === 0 ? (
              <Text style={styles.noTxText}>No transactions recorded yet.</Text>
            ) : (
              transactions.slice(0, 5).map((tx, idx) => {
                const isDebit = tx.type === 'withdrawal' || tx.type === 'refund';
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc}>{tx.description}</Text>
                      <Text style={styles.txDate}>{tx.date} · {tx.status.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.txAmt, { color: isDebit ? '#EF4444' : '#10B981' }]}>
                      {isDebit ? '-' : '+'} ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* DELIVERY PREFERENCES */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚚 Delivery Preferences</Text>
            <View style={styles.deliveryFields}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Standard Shipping Charge (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={delCharges}
                  onChangeText={setDelCharges}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Free Shipping Order Value (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={freeDelAbove}
                  onChangeText={setFreeDelAbove}
                />
              </View>
              <TouchableOpacity style={styles.saveDelBtn} onPress={handleSaveDelivery} activeOpacity={0.85}>
                <Text style={styles.saveDelBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BUSINESS DETAILS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏢 Store Details</Text>
            {[
              { l: 'Store Name', v: store.storeName },
              { l: 'Owner Name', v: store.ownerName },
              { l: 'GSTIN Registration', v: store.gstNumber || 'N/A' },
              { l: 'Store Contact', v: `📞 ${store.phone}` },
              { l: 'Store Email', v: `✉️ ${store.email}` },
              { l: 'Address', v: store.address },
              { l: 'City/State/Zip', v: `${store.city}, ${store.state} - ${store.pincode}` },
            ].map(row => (
              <View key={row.l} style={styles.rowField}>
                <Text style={styles.rowLabel}>{row.l}</Text>
                <Text style={styles.rowValue}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* BANKING DETAILS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏦 Settlement Bank Account</Text>
            {[
              { l: 'UPI Address (VPA)', v: store.upiId || wallet?.upiId || 'N/A' },
              { l: 'Bank Account Number', v: store.bankAccount },
              { l: 'Bank IFSC Code', v: store.ifsc },
              { l: 'Settlement Speed', v: 'Instant (UPI) / T+1 (Bank)' },
            ].map(row => (
              <View key={row.l} style={styles.rowField}>
                <Text style={styles.rowLabel}>{row.l}</Text>
                <Text style={styles.rowValue}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Text style={styles.logoutBtnText}>🚪 Logout from Store</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7C3AED' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  errorText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  header: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
  },
  headerLeft: {},
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerLogout: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderStyle: 'solid', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  heroTop: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#7C3AED' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  storeNameText: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  categoryText: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },
  taglineText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 4 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderRadius: 10, padding: 12, borderWidth: 1 },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  statusDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  approveBtnSim: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  approveBtnSimText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  walletStats: { gap: 12 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletCol: {},
  walletLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
  walletValAccent: { fontSize: 28, fontWeight: '800', color: '#10B981' },
  payoutBtn: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  payoutBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  walletDivider: { height: 1, backgroundColor: '#F1F5F9' },
  walletGrid: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, gap: 4 },
  gridLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700' },
  gridVal: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  walletDateText: { fontSize: 10, color: '#94A3B8', fontStyle: 'italic', alignSelf: 'flex-end' },
  noTxText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  txDesc: { fontSize: 13, fontWeight: '700', color: '#334155' },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  deliveryFields: { gap: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  fieldInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 80, fontSize: 13, color: '#0F172A', textAlign: 'center' },
  saveDelBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  saveDelBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  rowField: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  rowValue: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
  logoutBtn: { backgroundColor: '#FEE2E2', borderStyle: 'solid', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  logoutBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
});
