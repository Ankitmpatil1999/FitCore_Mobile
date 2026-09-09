import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
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

interface PaymentRecord {
  id: string;
  name: string;
  amount: number;
  type: 'received' | 'sent';
  method: 'upi' | 'cash' | 'online';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  category: string;
}

const INITIAL_TRANSACTIONS: PaymentRecord[] = [
  { id: 'TX-1001', name: 'Arjun Mehta', amount: 3999, type: 'received', method: 'upi', status: 'completed', date: 'Today, 09:15 AM', description: '6 Month Pass', category: 'Membership' },
  { id: 'TX-1002', name: 'Priya Sharma', amount: 2499, type: 'received', method: 'online', status: 'completed', date: 'Today, 08:30 AM', description: '3 Month Pass', category: 'Membership' },
  { id: 'TX-1003', name: 'Facility Rent (Kunal)', amount: 35000, type: 'sent', method: 'online', status: 'completed', date: 'Yesterday', description: 'Gym Facility Rent', category: 'Rent' },
  { id: 'TX-1004', name: 'Sneha Kulkarni', amount: 2499, type: 'received', method: 'upi', status: 'pending', date: 'Yesterday', description: '3 Month Renewal', category: 'Membership' },
  { id: 'TX-1005', name: 'Coach Vikram Singh', amount: 35000, type: 'sent', method: 'upi', status: 'completed', date: '18 Aug', description: 'Monthly Trainer Salary', category: 'Salary' },
  { id: 'TX-1006', name: 'Ananya Jain', amount: 3999, type: 'received', method: 'upi', status: 'completed', date: '17 Aug', description: '6 Month Pass', category: 'Membership' },
  { id: 'TX-1007', name: 'Tata Power Electricity', amount: 8500, type: 'sent', method: 'online', status: 'completed', date: '15 Aug', description: 'Monthly Electricity', category: 'Utilities' },
  { id: 'TX-1008', name: 'Rahul Desai', amount: 999, type: 'received', method: 'cash', status: 'completed', date: '14 Aug', description: '1 Month Pass', category: 'Membership' },
];

export default function PaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_TRANSACTIONS);
  const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'received' | 'sent'>('received');
  const [newMethod, setNewMethod] = useState<'upi' | 'cash' | 'online'>('upi');
  const [newCategory, setNewCategory] = useState('Membership');

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

  const filtered = payments.filter((p) => {
    if (typeFilter === 'received') return p.type === 'received';
    if (typeFilter === 'sent') return p.type === 'sent';
    return true;
  });

  const totalReceived = payments.filter((p) => p.type === 'received' && p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalSent = payments.filter((p) => p.type === 'sent').reduce((s, p) => s + p.amount, 0);
  const netRevenue = totalReceived - totalSent;

  const handleAddTransaction = () => {
    if (!newName.trim() || !newAmount.trim()) {
      Alert.alert('Required', 'Name and amount are required.');
      return;
    }
    const newTx: PaymentRecord = {
      id: `TX-${Date.now()}`,
      name: newName.trim(),
      amount: parseFloat(newAmount) || 0,
      type: newType,
      method: newMethod,
      status: 'completed',
      date: 'Just now',
      description: newCategory,
      category: newCategory,
    };
    setPayments((prev) => [newTx, ...prev]);
    setShowAddModal(false);
    setNewName('');
    setNewAmount('');
    Alert.alert('✓ Recorded', 'Payment record added successfully!');
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
            <Text style={styles.headerTitle}>Financial Ledger</Text>
            <Text style={styles.headerSub}>Revenue, Expenses & Dues</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Record</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── SUMMARY STATS 3-COLUMN CARD ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Inflow</Text>
              <Text style={[styles.summaryVal, { color: '#00C48C' }]}>
                ₹{(totalReceived / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.summarySub}>Collections</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryVal, { color: '#FF4D6D' }]}>
                ₹{(totalSent / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.summarySub}>Outflow</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={[styles.summaryVal, { color: '#6C5CE7' }]}>
                ₹{(netRevenue / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.summarySub}>Profit</Text>
            </View>
          </View>

          {/* ── FILTER PILLS ── */}
          <View style={styles.filterRow}>
            {(['all', 'received', 'sent'] as const).map((ft) => (
              <TouchableOpacity
                key={ft}
                style={[styles.filterPill, typeFilter === ft && styles.filterPillActive]}
                onPress={() => setTypeFilter(ft)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, typeFilter === ft && styles.filterPillTextActive]}>
                  {ft === 'all' ? 'All Activity' : ft === 'received' ? '↓ Inflow (Collected)' : '↑ Outflow (Expenses)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── TRANSACTION FEED ── */}
          <Text style={styles.sectionHeader}>Recent Transactions</Text>

          {filtered.map((item) => {
            const isReceived = item.type === 'received';
            const isPending = item.status === 'pending';

            return (
              <AnimatedPressable key={item.id} style={styles.txCard}>
                <View
                  style={[
                    styles.txIconBox,
                    {
                      backgroundColor: isPending
                        ? 'rgba(255, 153, 0, 0.10)'
                        : isReceived
                        ? 'rgba(0, 196, 140, 0.10)'
                        : 'rgba(255, 77, 109, 0.10)',
                    },
                  ]}
                >
                  <Icon
                    name={isPending ? 'time' : isReceived ? 'arrow-down' : 'arrow-up'}
                    size={moderateScale(18)}
                    color={isPending ? '#FF9900' : isReceived ? '#00C48C' : '#FF4D6D'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.txNameRow}>
                    <Text style={styles.txName}>{item.name}</Text>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isPending ? '#FF9900' : isReceived ? '#00C48C' : '#FF4D6D' },
                      ]}
                    >
                      {isReceived ? '+' : '-'}₹{item.amount.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.txSubRow}>
                    <Text style={styles.txSub}>
                      {item.description} • {item.method.toUpperCase()}
                    </Text>
                    <Text style={styles.txDate}>{item.date}</Text>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── RECORD TRANSACTION MODAL ── */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Transaction</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Party Name / Vendor *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Arjun Mehta or Tata Power"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAmount}
                  onChangeText={setNewAmount}
                  placeholder="e.g. 3999"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Transaction Type</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, newType === 'received' && styles.typeBtnActive]}
                    onPress={() => setNewType('received')}
                  >
                    <Text style={[styles.typeBtnText, newType === 'received' && styles.typeBtnTextActive]}>
                      ↓ Received
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, newType === 'sent' && styles.typeBtnActiveSent]}
                    onPress={() => setNewType('sent')}
                  >
                    <Text style={[styles.typeBtnText, newType === 'sent' && styles.typeBtnTextActive]}>
                      ↑ Paid Out
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddTransaction}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>SAVE TRANSACTION</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  summaryVal: {
    fontSize: fontScale(17),
    fontWeight: '800',
    marginVertical: 3,
  },
  summarySub: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: moderateScale(42),
    backgroundColor: '#F3F2FE',
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  filterPill: {
    flex: 1,
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  filterPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  filterPillText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sectionHeader: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1.2),
  },

  // Transaction Card
  txCard: {
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
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  txIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  txNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  txName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  txAmount: {
    fontSize: fontScale(14),
    fontWeight: '800',
  },
  txSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
  },
  txDate: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
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
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  typeBtn: {
    flex: 1,
    height: moderateScale(42),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  typeBtnActive: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  typeBtnActiveSent: {
    backgroundColor: '#FF4D6D',
    borderColor: '#FF4D6D',
  },
  typeBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
