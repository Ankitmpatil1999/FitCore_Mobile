import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Shadows } from '../../theme';

interface PaymentRecord {
  id: string;
  name: string;      // Member or Payee Name
  amount: number;
  type: 'received' | 'sent'; // received = Inflow, sent = Outflow
  method: 'upi' | 'cash' | 'online';
  status: 'completed' | 'pending';
  date: string;
  description: string;
  category: string;
}

const INITIAL_TRANSACTIONS: PaymentRecord[] = [
  { id: 'TX-1001', name: 'Arjun Mehta', amount: 3999, type: 'received', method: 'upi', status: 'completed', date: '2026-06-15', description: '6 Month Pass', category: 'Membership' },
  { id: 'TX-1002', name: 'Priya Sharma', amount: 2499, type: 'received', method: 'online', status: 'completed', date: '2026-06-10', description: '3 Month Pass', category: 'Membership' },
  { id: 'TX-1003', name: 'Kunal Landlord', amount: 35000, type: 'sent', method: 'online', status: 'completed', date: '2026-06-05', description: 'Gym Facility Rent', category: 'Rent' },
  { id: 'TX-1004', name: 'Sneha Kulkarni', amount: 2499, type: 'received', method: 'upi', status: 'pending', date: '2026-06-01', description: '3 Month Renewal', category: 'Membership' },
  { id: 'TX-1005', name: 'Trainer Vikram', amount: 25000, type: 'sent', method: 'upi', status: 'completed', date: '2026-06-01', description: 'Monthly Salary', category: 'Salary' },
  { id: 'TX-1006', name: 'Ananya Jain', amount: 3999, type: 'received', method: 'upi', status: 'completed', date: '2026-06-01', description: '6 Month Pass', category: 'Membership' },
  { id: 'TX-1007', name: 'Tata Power Co', amount: 8500, type: 'sent', method: 'online', status: 'completed', date: '2026-05-28', description: 'Electricity Bill', category: 'Utilities' },
  { id: 'TX-1008', name: 'FitCore Supplements', amount: 15000, type: 'sent', method: 'online', status: 'completed', date: '2026-05-25', description: 'Stock Purchase', category: 'Inventory' },
  { id: 'TX-1009', name: 'Rahul Desai', amount: 999, type: 'received', method: 'cash', status: 'completed', date: '2026-05-01', description: '1 Month Pass', category: 'Membership' },
  { id: 'TX-1010', name: 'Suresh Hardware', amount: 3400, type: 'sent', method: 'cash', status: 'completed', date: '2026-04-20', description: 'Cable wire replacement', category: 'Maintenance' },
];

export default function PaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_TRANSACTIONS);
  const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'upi' | 'cash' | 'online'>('all');

  // Add Transaction Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'received' | 'sent'>('received');
  const [newMethod, setNewMethod] = useState<'upi' | 'cash' | 'online'>('upi');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAddTransaction = () => {
    if (!newName.trim() || !newAmount.trim() || !newCategory.trim()) {
      Alert.alert('Required Fields', 'Name, Amount, and Category are required.');
      return;
    }

    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number for amount.');
      return;
    }

    const newTx: PaymentRecord = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      amount: amt,
      type: newType,
      method: newMethod,
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      description: newDesc.trim() || `${newCategory} transaction`,
      category: newCategory.trim(),
    };

    setPayments(prev => [newTx, ...prev]);
    Alert.alert('Success', `Recorded ₹${amt.toLocaleString('en-IN')} as ${newType.toUpperCase()}`);
    setShowAddModal(false);
    // Reset Form
    setNewName(''); setNewAmount(''); setNewType('received');
    setNewMethod('upi'); setNewCategory(''); setNewDesc('');
  };

  const markPaid = (txId: string) => {
    Alert.alert('Mark Paid', 'Mark this pending invoice as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => setPayments(prev =>
          prev.map(p => p.id === txId ? { ...p, status: 'completed' } : p),
        ),
      },
    ]);
  };

  const filtered = payments.filter(p => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchType && matchMethod;
  });

  // Calculations
  const inflowTotal = payments
    .filter(p => p.type === 'received' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const outflowTotal = payments
    .filter(p => p.type === 'sent' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const netBalance = inflowTotal - outflowTotal;
  const pendingTotal = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const getMethodIcon = (m: string) => {
    if (m === 'upi') return '📱';
    if (m === 'cash') return '💵';
    return '💳';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {navigation && navigation.canGoBack() && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.headerTitleBox, (!navigation || !navigation.canGoBack()) && { marginLeft: 0 }]}>
              <Text style={styles.headerSub}>Financial Ledger</Text>
              <Text style={styles.headerTitle}>Payments & Cash Flow 💰</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Record</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* CASH FLOW SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryLabel}>Net Cash Flow (Completed)</Text>
              <Text style={[styles.summaryVal, { color: netBalance >= 0 ? LightColors.success : LightColors.danger }]}>
                {netBalance >= 0 ? '+' : '-'} ₹{Math.abs(netBalance).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryGrid}>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>🟢 Total Inflow (Received)</Text>
                <Text style={styles.cellValue}>₹{inflowTotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.cellDivider} />
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>🔴 Total Outflow (Sent)</Text>
                <Text style={styles.cellValue}>₹{outflowTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* PENDING NOTIFICATION BANNER */}
          {pendingTotal > 0 && (
            <View style={styles.pendingBanner}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={styles.pendingText}>
                Pending collection: <Text style={{ fontWeight: '800' }}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
              </Text>
            </View>
          )}

          {/* FILTERS */}
          <Text style={styles.sectionTitle}>Transaction Logs</Text>
          <View style={styles.filterGroup}>
            {/* Inflow vs Outflow */}
            <View style={styles.filterRow}>
              {(['all', 'received', 'sent'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, typeFilter === f && styles.filterChipActive]}
                  onPress={() => setTypeFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, typeFilter === f && { color: '#FFFFFF' }]}>
                    {f === 'all' ? 'All Logs' : f === 'received' ? 'Received (Inflow)' : 'Sent (Outflow)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Methods */}
            <View style={styles.filterRow}>
              {(['all', 'upi', 'cash', 'online'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, methodFilter === m && styles.methodChipActive]}
                  onPress={() => setMethodFilter(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.methodChipText, methodFilter === m && { color: LightColors.accentViolet }]}>
                    {m === 'all' ? 'All Methods' : `${getMethodIcon(m)} ${m.toUpperCase()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.countLabel}>{filtered.length} transactions match filters</Text>

          {/* TRANSACTION LEDGER LIST */}
          <View style={styles.ledgerList}>
            {filtered.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>📊</Text>
                <Text style={styles.emptyText}>No matching transactions found</Text>
              </View>
            ) : (
              filtered.map(tx => {
                const isInflow = tx.type === 'received';
                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txLeft}>
                      <View style={[styles.iconWrapper, { backgroundColor: isInflow ? `${LightColors.success}10` : `${LightColors.danger}10` }]}>
                        <Text style={{ fontSize: 18 }}>{isInflow ? '📥' : '📤'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.name}</Text>
                        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                        <Text style={styles.txMeta}>{tx.date} · {tx.category} · {getMethodIcon(tx.method)} {tx.method.toUpperCase()}</Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: isInflow ? LightColors.success : LightColors.danger }]}>
                        {isInflow ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                      </Text>
                      {tx.status === 'pending' ? (
                        <TouchableOpacity style={styles.payBtn} onPress={() => markPaid(tx.id)} activeOpacity={0.8}>
                          <Text style={styles.payBtnText}>Collect Payment</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: isInflow ? `${LightColors.success}15` : `${LightColors.danger}15` }]}>
                          <Text style={[styles.statusBadgeText, { color: isInflow ? LightColors.success : LightColors.danger }]}>
                            {tx.status.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* ADD TRANSACTION MODAL */}
        <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
          <SafeAreaView style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Type Switch */}
              <Text style={styles.inputLabel}>Transaction Type *</Text>
              <View style={styles.modalTypeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, newType === 'received' && { backgroundColor: LightColors.success, borderColor: LightColors.success }]}
                  onPress={() => setNewType('received')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, newType === 'received' && { color: '#FFFFFF' }]}>📥 Inflow (Money Received)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, newType === 'sent' && { backgroundColor: LightColors.danger, borderColor: LightColors.danger }]}
                  onPress={() => setNewType('sent')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, newType === 'sent' && { color: '#FFFFFF' }]}>📤 Outflow (Money Sent)</Text>
                </TouchableOpacity>
              </View>

              {/* Payee / Member Name */}
              <Text style={styles.inputLabel}>{newType === 'received' ? 'Received From (Member Name) *' : 'Paid To (Supplier / Payee Name) *'}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={newType === 'received' ? 'e.g. Rahul Patil' : 'e.g. Power Grid Co.'}
                placeholderTextColor={LightColors.textMuted}
                value={newName}
                onChangeText={setNewName}
              />

              {/* Amount */}
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 5000"
                placeholderTextColor={LightColors.textMuted}
                keyboardType="numeric"
                value={newAmount}
                onChangeText={setNewAmount}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={newType === 'received' ? 'e.g. Membership, Store Sale' : 'e.g. Rent, Salary, Maintenance'}
                placeholderTextColor={LightColors.textMuted}
                value={newCategory}
                onChangeText={setNewCategory}
              />

              {/* Method */}
              <Text style={styles.inputLabel}>Payment Method *</Text>
              <View style={styles.modalTypeRow}>
                {(['upi', 'cash', 'online'] as const).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, newMethod === m && { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet }]}
                    onPress={() => setNewMethod(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.methodBtnText, newMethod === m && { color: '#FFFFFF' }]}>
                      {getMethodIcon(m)} {m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Details of the payment..."
                placeholderTextColor={LightColors.textMuted}
                multiline={true}
                numberOfLines={3}
                value={newDesc}
                onChangeText={setNewDesc}
              />

              {/* Save Button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTransaction} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>💾 Save Transaction</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary },
  headerTitleBox: { flex: 1, marginLeft: 12 },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LightColors.textPrimary },
  addBtn: {
    backgroundColor: `${LightColors.accentViolet}15`,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: LightColors.accentViolet,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: LightColors.accentViolet },
  scroll: {
    padding: 20, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: LightColors.bgSurface, borderRadius: 18, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: LightColors.border, ...Shadows.card,
  },
  summaryMain: { alignItems: 'center', marginBottom: 14 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: LightColors.textMuted },
  summaryVal: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  summaryDivider: { height: 1, backgroundColor: LightColors.border, marginBottom: 14 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridCell: { flex: 1, alignItems: 'center' },
  cellLabel: { fontSize: 11, fontWeight: '600', color: LightColors.textMuted },
  cellValue: { fontSize: 16, fontWeight: '800', color: LightColors.textPrimary, marginTop: 4 },
  cellDivider: { width: 1, height: 30, backgroundColor: LightColors.border },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: LightColors.warningBg, borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: LightColors.warning,
  },
  pendingText: { fontSize: 13, fontWeight: '600', color: LightColors.warning },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 12 },
  filterGroup: { gap: 8, marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: LightColors.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: LightColors.border },
  filterChipActive: { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet },
  filterChipText: { fontSize: 11, fontWeight: '700', color: LightColors.textMuted },
  methodChip: { flex: 1, paddingVertical: 9, borderRadius: 20, backgroundColor: LightColors.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: LightColors.border },
  methodChipActive: { backgroundColor: `${LightColors.accentViolet}15`, borderColor: LightColors.accentViolet },
  methodChipText: { fontSize: 10, fontWeight: '700', color: LightColors.textMuted },
  countLabel: { fontSize: 12, color: LightColors.textMuted, fontWeight: '600', marginBottom: 12 },
  ledgerList: { gap: 12 },
  emptyCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: LightColors.border, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600', color: LightColors.textMuted },
  txCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: LightColors.bgSurface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: LightColors.border, ...Shadows.card,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  iconWrapper: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  txDesc: { fontSize: 12, color: LightColors.textSecondary, marginTop: 1 },
  txMeta: { fontSize: 10, color: LightColors.textMuted, marginTop: 3 },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  payBtn: { backgroundColor: LightColors.warningBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: LightColors.warning },
  payBtnText: { fontSize: 10, fontWeight: '700', color: LightColors.warning },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  // Add Modal styles
  modalRoot: { flex: 1, backgroundColor: LightColors.bgBase },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: LightColors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: LightColors.textSecondary },
  modalScroll: { padding: 20, gap: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginTop: 6 },
  modalInput: { backgroundColor: LightColors.bgSurface, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  modalTypeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: LightColors.border, backgroundColor: LightColors.bgSurface, alignItems: 'center' },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary },
  methodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: LightColors.border, backgroundColor: LightColors.bgSurface, alignItems: 'center' },
  methodBtnText: { fontSize: 11, fontWeight: '700', color: LightColors.textSecondary },
  saveBtn: { backgroundColor: LightColors.accentViolet, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
