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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

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

interface PaymentRecord {
  id: string;
  name: string;
  phone?: string;
  amount: number;
  type: 'received' | 'sent';
  method: 'upi' | 'cash' | 'online' | 'card';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  rawDate: string;
  isThisMonth: boolean;
  packageName: string;
  billingCycle: string; // 'Per Month' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | string
  description: string;
  category: string;
}

const leftArrowImg = require('../../assets/Icons2/left-arrow.png');

export default function PaymentsScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentGym as any)?._id || (currentUser as any)?.gymId || '';

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'month' | 'all' | 'received' | 'sent'>('month');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'received' | 'sent'>('sent');
  const [newCategory, setNewCategory] = useState('Rent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Helper to format billing cycle
  const getBillingCycle = (months?: number, days?: number, planName?: string): string => {
    const planLower = (planName || '').toLowerCase();
    if (months === 1 || planLower.includes('month') || planLower.includes('1 month')) return 'Per Month';
    if (months === 3 || planLower.includes('quarter') || planLower.includes('3 month')) return 'Quarterly';
    if (months === 6 || planLower.includes('half') || planLower.includes('6 month')) return 'Half-Yearly';
    if (months === 12 || planLower.includes('year') || planLower.includes('annual') || planLower.includes('12 month')) return 'Yearly';
    if (days && days > 0) {
      if (days === 30 || days === 31) return 'Per Month';
      if (days === 90) return 'Quarterly';
      if (days === 180) return 'Half-Yearly';
      if (days === 365) return 'Yearly';
      return `${days} Days`;
    }
    if (months && months > 0) return `${months} Months`;
    return 'Per Month';
  };

  // Helper to format date cleanly and check if in This Month
  const formatDisplayDate = (dateStr?: string | Date): { formatted: string; isThisMonth: boolean; rawIso: string } => {
    if (!dateStr) {
      const now = new Date();
      return {
        formatted: `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        isThisMonth: true,
        rawIso: now.toISOString(),
      };
    }

    const targetDate = new Date(dateStr);
    const now = new Date();

    const isThisMonth =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth();

    const formatted = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return {
      formatted,
      isThisMonth,
      rawIso: targetDate.toISOString(),
    };
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [expRes, memRes] = await Promise.all([
        apiService.getOwnerExpenses(gymId),
        apiService.getOwnerMembers(gymId),
      ]);

      const combined: PaymentRecord[] = [];

      // 1. Members revenue / package collections from API
      if (memRes?.success && Array.isArray(memRes.data) && memRes.data.length > 0) {
        memRes.data.forEach((m: any, idx: number) => {
          const amt = Number(m.amountPaid || m.planPrice || 0);
          const rawJoined = m.joinedDate || m.startDate || m.createdAt;
          const { formatted, isThisMonth, rawIso } = formatDisplayDate(rawJoined);
          const planTitle = (typeof m.plan === 'object' && m.plan !== null ? m.plan.name : m.plan) || m.planName || m.packageName || 'Standard Gym Pass';
          const billingCycle = getBillingCycle(m.durationMonths, m.durationDays, planTitle);

          let methodType: 'upi' | 'cash' | 'online' | 'card' = 'upi';
          const pMode = String(m.paymentMode || m.paymentMethod || '').toLowerCase();
          if (pMode.includes('cash')) methodType = 'cash';
          else if (pMode.includes('card')) methodType = 'card';
          else if (pMode.includes('online') || pMode.includes('netbanking')) methodType = 'online';
          else methodType = 'upi';

          combined.push({
            id: `MEM-${m._id || m.id || idx}`,
            name: m.name || 'Member Admission',
            phone: m.phone || '',
            amount: amt,
            type: 'received',
            method: methodType,
            status: 'completed',
            date: formatted,
            rawDate: rawIso,
            isThisMonth: isThisMonth,
            packageName: planTitle,
            billingCycle: billingCycle,
            description: `${planTitle} (${billingCycle})`,
            category: 'Membership',
          });
        });
      }

      // 2. Gym Expenses from API
      const expList = expRes?.data || (expRes as any)?.expenses || [];
      if (Array.isArray(expList) && expList.length > 0) {
        expList.forEach((e: any, idx: number) => {
          const { formatted, isThisMonth, rawIso } = formatDisplayDate(e.date || e.createdAt);
          let methodType: 'upi' | 'cash' | 'online' | 'card' = 'cash';
          const pMode = String(e.method || '').toLowerCase();
          if (pMode.includes('card')) methodType = 'card';
          else if (pMode.includes('online')) methodType = 'online';
          else if (pMode.includes('upi')) methodType = 'upi';

          const expTitle = e.title || e.name || (e.category ? `${e.category} Expense` : 'Gym Operational Expense');
          const expCat = e.category || 'Operations';

          combined.push({
            id: `EXP-${e._id || e.id || idx}`,
            name: expTitle,
            amount: Number(e.amount) || 0,
            type: 'sent',
            method: methodType,
            status: 'completed',
            date: formatted,
            rawDate: rawIso,
            isThisMonth: isThisMonth,
            packageName: '',
            billingCycle: '',
            description: e.description || e.notes || `${expCat} Outflow`,
            category: expCat,
          });
        });
      }

      // Sort by latest date
      combined.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

      setPayments(combined);
    } catch (err) {
      console.log('Error fetching finance:', err);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  // Filtered list based on active tab
  const filtered = payments.filter((p) => {
    if (typeFilter === 'month') return p.isThisMonth && p.type === 'received';
    if (typeFilter === 'received') return p.type === 'received';
    if (typeFilter === 'sent') return p.type === 'sent';
    return true;
  });

  // Calculate live financial metrics from API
  const thisMonthReceivedList = payments.filter((p) => p.type === 'received' && p.isThisMonth);
  const thisMonthTotalAmount = thisMonthReceivedList.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthMembersCount = thisMonthReceivedList.length;

  const thisMonthExpenseList = payments.filter((p) => p.type === 'sent' && p.isThisMonth);
  const thisMonthExpenseTotal = thisMonthExpenseList.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthNetProfit = thisMonthTotalAmount - thisMonthExpenseTotal;

  const totalReceived = payments.filter((p) => p.type === 'received').reduce((s, p) => s + p.amount, 0);
  const totalSent = payments.filter((p) => p.type === 'sent').reduce((s, p) => s + p.amount, 0);
  const netRevenue = totalReceived - totalSent;

  const handleAddTransaction = async () => {
    if (!newName.trim() || !newAmount.trim()) {
      Alert.alert('Validation Error', 'Please enter expense title and amount.');
      return;
    }
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.createOwnerExpense({
        gymId,
        title: newName.trim(),
        name: newName.trim(),
        amount: parsedAmount,
        category: newCategory,
        description: `${newCategory}: ${newName.trim()}`,
        notes: `${newCategory} expense`,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
      });
      if (res?.success) {
        setShowAddModal(false);
        setNewName('');
        setNewAmount('');
        await fetchFinanceData();
        Alert.alert('Expense Recorded', `₹${parsedAmount.toLocaleString('en-IN')} added to gym expense ledger.`);
      } else {
        Alert.alert('Error', res?.error || 'Failed to save expense');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP APP HEADER (CLEAN & SPACIOUS) ── */}
        <View style={styles.header}>
          <View style={styles.headerLeftRow}>
            {navigation?.canGoBack?.() && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Image source={leftArrowImg} style={styles.backIcon} resizeMode="contain" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Collections
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                Live Member Admissions & Revenue
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="cash" size={moderateScale(14)} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Expense</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C5CE7']} />
          }
        >
          {/* ── 1. THIS MONTH'S COLLECTION HERO BANNER (CLEAN & BALANCED) ── */}
          <View style={styles.todayHeroCard}>
            <View style={styles.todayHeroTopRow}>
              <View style={styles.todayLiveIndicatorRow}>
                <View style={styles.pulsingGreenDot} />
                <Text style={styles.todayLiveText}>THIS MONTH'S REVENUE</Text>
              </View>
              <View style={styles.todayCountBadge}>
                <AppIcon name="members" size={moderateScale(11)} color="#4338CA" />
                <Text style={styles.todayCountText}>{thisMonthMembersCount} Joined</Text>
              </View>
            </View>

            <View style={styles.todayAmountRow}>
              <Text style={styles.todayAmountCurrency}>₹</Text>
              <Text style={styles.todayAmountValue}>
                {thisMonthTotalAmount.toLocaleString('en-IN')}
              </Text>
            </View>

            <Text style={styles.todaySubText}>
              Total revenue collected from athlete admissions & renewals this month
            </Text>
          </View>

          {/* ── 2. SUMMARY STATS 3-COLUMN CARD (MONTHLY LEDGER) ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Inflow</Text>
              <Text style={[styles.summaryVal, { color: '#00C48C' }]}>
                ₹{totalReceived >= 1000 ? `${(totalReceived / 1000).toFixed(1)}k` : totalReceived.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summarySub}>All Members</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryVal, { color: '#FF4D6D' }]}>
                ₹{totalSent >= 1000 ? `${(totalSent / 1000).toFixed(1)}k` : totalSent.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summarySub}>Outflow</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <Text style={[styles.summaryVal, { color: '#6C5CE7' }]}>
                ₹{netRevenue >= 1000 ? `${(netRevenue / 1000).toFixed(1)}k` : netRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summarySub}>Balance</Text>
            </View>
          </View>

          {/* ── 3. FILTER TABS ── */}
          <View style={styles.filterRow}>
            {[
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Collections' },
              { id: 'received', label: 'Memberships' },
              { id: 'sent', label: 'Expenses' },
            ].map((ft) => (
              <TouchableOpacity
                key={ft.id}
                style={[styles.filterPill, typeFilter === ft.id && styles.filterPillActive]}
                onPress={() => setTypeFilter(ft.id as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, typeFilter === ft.id && styles.filterPillTextActive]}>
                  {ft.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 4. TRANSACTION FEED TITLE & RECORD COUNT ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>
              {typeFilter === 'month'
                ? "This Month's Member Admissions"
                : typeFilter === 'received'
                ? `Member Collections (${filtered.length})`
                : typeFilter === 'sent'
                ? `Recorded Expenses (${filtered.length})`
                : `All Activity (${filtered.length})`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Fetching live ledger from API...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <AppIcon name="finance" size={moderateScale(36)} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {typeFilter === 'month' ? 'No Member Admissions This Month' : 'No Records Found'}
              </Text>
              <Text style={styles.emptySub}>
                {typeFilter === 'month'
                  ? 'When members join or renew packages this month, their package name, cycle (Per Month/Yearly), and amount will appear here automatically.'
                  : 'Enroll new members or record expenses to track them live.'}
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const isReceived = item.type === 'received';

              return (
                <AnimatedPressable key={item.id} style={styles.txCard}>
                  {/* Left Icon Badge */}
                  <View
                    style={[
                      styles.txIconBox,
                      {
                        backgroundColor: isReceived ? '#ECFDF5' : '#FFF1F2',
                        borderColor: isReceived ? '#A7F3D0' : '#FECDD3',
                      },
                    ]}
                  >
                    <AppIcon
                      name={isReceived ? 'cash' : 'finance'}
                      size={moderateScale(18)}
                      color={isReceived ? '#059669' : '#E11D48'}
                    />
                  </View>

                  {/* Main Details Body */}
                  <View style={{ flex: 1 }}>
                    {/* Row 1: Member Name & Amount */}
                    <View style={styles.txNameRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.txName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {Boolean(item.phone) && (
                          <Text style={styles.txPhone}>{item.phone}</Text>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isReceived ? '#059669' : '#E11D48' },
                          ]}
                        >
                          {isReceived ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        {item.isThisMonth && (
                          <View style={styles.todayNewPill}>
                            <Text style={styles.todayNewPillText}>THIS MONTH</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Row 2: Package Name & Billing Cycle Badge (Per Month / Yearly) */}
                    {isReceived && (
                      <View style={styles.packageInfoRow}>
                        <View style={styles.packageBadge}>
                          <AppIcon name="plan" size={moderateScale(11)} color="#4F46E5" />
                          <Text style={styles.packageBadgeText} numberOfLines={1}>
                            {item.packageName || 'Standard Pass'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.cycleBadge,
                            item.billingCycle === 'Yearly'
                              ? styles.cycleBadgeYearly
                              : item.billingCycle === 'Quarterly'
                              ? styles.cycleBadgeQuarterly
                              : styles.cycleBadgeMonthly,
                          ]}
                        >
                          <Text
                            style={[
                              styles.cycleBadgeText,
                              item.billingCycle === 'Yearly'
                                ? styles.cycleBadgeTextYearly
                                : item.billingCycle === 'Quarterly'
                                ? styles.cycleBadgeTextQuarterly
                                : styles.cycleBadgeTextMonthly,
                            ]}
                          >
                            {item.billingCycle}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Row 3: Date & Payment Method */}
                    <View style={styles.txSubRow}>
                      <View style={styles.dateTag}>
                        <AppIcon name="calendar" size={moderateScale(11)} color="#64748B" />
                        <Text style={styles.txDate}>{item.date}</Text>
                      </View>

                      <View style={styles.methodPill}>
                        <Text style={styles.methodPillText}>
                          {item.method.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(10) }} />
        </ScrollView>

        {/* ── RECORD TRANSACTION MODAL ── */}
        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Record Expense</Text>
                  <Text style={styles.modalSub}>Log operational expense to ledger</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddModal(false)}>
                  <AppIcon name="close" size={moderateScale(16)} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title / Vendor Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Electricity Bill or Equipment Maintenance"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAmount}
                  onChangeText={setNewAmount}
                  placeholder="e.g. 3500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.modalCategoryRow}>
                  {['Rent', 'Electricity', 'Salaries', 'Equipment', 'Maintenance'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCatPill, newCategory === cat && styles.modalCatPillActive]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.modalCatPillText, newCategory === cat && styles.modalCatPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddTransaction}
                activeOpacity={0.85}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>SAVE EXPENSE</Text>
                )}
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
    backgroundColor: '#F8FAFF',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.8),
    paddingBottom: hp(1.2),
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
    marginRight: moderateScale(10),
  },
  headerTitleCol: {
    flex: 1,
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    tintColor: '#0F172A',
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3730A3',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
  },

  // ── 1. Today's Collection Hero Banner ──
  todayHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: hp(1.8),
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  todayHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  todayLiveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  pulsingGreenDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#10B981',
  },
  todayLiveText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  todayCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  todayCountText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#4338CA',
  },
  todayAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(4),
  },
  todayAmountCurrency: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
    marginRight: 2,
  },
  todayAmountValue: {
    fontSize: fontScale(32),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  todaySubText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
  },

  // ── 2. Summary Card ──
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  summaryVal: {
    fontSize: fontScale(15.5),
    fontWeight: '800',
    marginVertical: 2,
  },
  summarySub: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: moderateScale(36),
    backgroundColor: '#E2E8F0',
  },

  // ── 3. Filter Row ──
  filterRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
    marginBottom: hp(1.8),
  },
  filterPill: {
    flex: 1,
    paddingVertical: moderateScale(7),
    alignItems: 'center',
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#3730A3',
    borderColor: '#3730A3',
  },
  filterPillText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  sectionHeader: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  loadingBox: {
    paddingVertical: hp(6),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
    fontSize: fontScale(12.5),
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: hp(1),
  },
  emptyIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  emptyTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(17),
    paddingHorizontal: moderateScale(10),
  },

  // ── 4. Transaction & Member Card ──
  txCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  txIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  txNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  txName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  txPhone: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  txAmount: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
  },
  todayNewPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginTop: 3,
  },
  todayNewPillText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },

  // Package info & Billing Cycle
  packageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginVertical: moderateScale(4),
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: wp(45),
  },
  packageBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#334155',
  },
  cycleBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
  },
  cycleBadgeMonthly: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cycleBadgeQuarterly: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  cycleBadgeYearly: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  cycleBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
  },
  cycleBadgeTextMonthly: {
    color: '#1D4ED8',
  },
  cycleBadgeTextQuarterly: {
    color: '#6D28D9',
  },
  cycleBadgeTextYearly: {
    color: '#B45309',
  },

  txSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txDate: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  methodPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  methodPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#475569',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.8),
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: moderateScale(4),
  },
  inputGroup: {
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(44),
    fontSize: fontScale(13),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  modalCatPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCatPillActive: {
    backgroundColor: '#3730A3',
    borderColor: '#3730A3',
  },
  modalCatPillText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  modalCatPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#3730A3',
    borderRadius: moderateScale(12),
    height: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  submitBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
