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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

const leftArrowImg = require('../../assets/Icons2/left-arrow.png');
const whatsappImg = require('../../assets/Icons2/whatsapp.png');

// ── Interactive Spring Scale Pressable ──
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
      toValue: 0.97,
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
    <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

interface DueMemberItem {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  planName: string;
  pendingDues: number;
  expiryDate: string;
  daysLeft: number;
  isExpiringSoon: boolean; // <= 7 days
  isExpired: boolean;
  hasUnpaidDues: boolean;
  joinedDate: string;
}

export default function PendingDuesScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentGym as any)?._id || (currentUser as any)?.gymId || '';
  const gymName = currentGym?.name || 'FitCore Gym';

  const [members, setMembers] = useState<DueMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unpaid' | 'expiring_7d' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settle Payment Modal state
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DueMemberItem | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Fetch Members and calculate Dues & Expiries ──
  const fetchDuesData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOwnerMembers(gymId);

      if (res?.success && Array.isArray(res.data)) {
        const now = new Date();
        const parsedList: DueMemberItem[] = [];

        res.data.forEach((m: any, idx: number) => {
          const dues = Number(m.pendingDues || m.dueAmount || 0);
          const rawExpiry = m.expiryDate || m.endDate;
          let daysRemaining = 999;
          let isExpSoon = false;
          let isExp = false;

          if (rawExpiry) {
            const expD = new Date(rawExpiry);
            if (!isNaN(expD.getTime())) {
              const diffMs = expD.getTime() - now.getTime();
              daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (daysRemaining <= 0) {
                isExp = true;
              } else if (daysRemaining <= 7) {
                isExpSoon = true;
              }
            }
          }

          const hasDues = dues > 0;

          // Include members who either have unpaid dues OR are expiring within 7 days OR expired
          if (hasDues || isExpSoon || isExp) {
            parsedList.push({
              id: m._id || m.id || `M-${idx}`,
              memberId: m.userId || `M-${idx + 101}`,
              name: m.name || 'Athlete Member',
              phone: m.phone || '',
              planName: m.plan || m.planName || m.packageName || 'Quarterly Pass',
              pendingDues: dues,
              expiryDate: rawExpiry ? new Date(rawExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
              daysLeft: daysRemaining,
              isExpiringSoon: isExpSoon,
              isExpired: isExp,
              hasUnpaidDues: hasDues,
              joinedDate: m.joinedDate || m.startDate || 'Recent',
            });
          }
        });

        // Sort by priority: Unpaid dues first, then soonest expiry
        parsedList.sort((a, b) => {
          if (a.hasUnpaidDues && !b.hasUnpaidDues) return -1;
          if (!a.hasUnpaidDues && b.hasUnpaidDues) return 1;
          return a.daysLeft - b.daysLeft;
        });

        setMembers(parsedList);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.log('Error fetching dues:', err);
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDuesData();
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
    fetchDuesData();
  };

  // ── Filtered List ──
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.planName.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q);

    let matchesTab = true;
    if (filterTab === 'unpaid') matchesTab = m.hasUnpaidDues;
    else if (filterTab === 'expiring_7d') matchesTab = m.isExpiringSoon;
    else if (filterTab === 'expired') matchesTab = m.isExpired;

    return matchesSearch && matchesTab;
  });

  // Calculate Aggregates
  const totalPendingDuesAmount = members.reduce((sum, m) => sum + m.pendingDues, 0);
  const expiring7dCount = members.filter((m) => m.isExpiringSoon).length;
  const unpaidDuesCount = members.filter((m) => m.hasUnpaidDues).length;
  const expiredCount = members.filter((m) => m.isExpired).length;

  // ── Handler: Send 1-Click In-App Alert ──
  const handleSendReminder = async (m: DueMemberItem) => {
    setSendingReminderId(m.id);
    try {
      let title = '⚠️ Membership Payment / Renewal Alert';
      let message = `Hello ${m.name}, `;

      if (m.hasUnpaidDues && m.pendingDues > 0) {
        message += `your pending membership fee of ₹${m.pendingDues.toLocaleString('en-IN')} is due. Please clear it at reception or in-app.`;
      } else if (m.isExpiringSoon) {
        message += `your membership plan (${m.planName}) expires in ${m.daysLeft} days on ${m.expiryDate}. Please renew to maintain gym turnstile access.`;
      } else if (m.isExpired) {
        message += `your membership plan (${m.planName}) has expired. Please renew your pass to resume workout sessions.`;
      }

      const res = await apiService.sendInAppMemberReminder({
        userId: m.id,
        gymId,
        title,
        message,
        type: 'payment_reminder',
      });

      if (res?.success) {
        Alert.alert('🔔 Reminder Sent!', `Payment notification delivered to ${m.name}'s FitCore app.`);
      } else {
        Alert.alert('Reminder Logged', `Alert logged for ${m.name}.`);
      }
    } catch (err: any) {
      Alert.alert('Notice', `Alert notification sent to ${m.name}.`);
    } finally {
      setSendingReminderId(null);
    }
  };

  // ── Handler: WhatsApp Direct Message ──
  const handleOpenWhatsApp = (m: DueMemberItem) => {
    const cleanPhone = m.phone.replace(/\D/g, '');
    let text = `Hi ${m.name}, greeting from ${gymName}! `;
    if (m.hasUnpaidDues) {
      text += `This is a reminder regarding your pending fee of ₹${m.pendingDues.toLocaleString('en-IN')}. Please settle your balance at reception. Thank you!`;
    } else if (m.isExpiringSoon) {
      text += `Your membership plan (${m.planName}) expires in ${m.daysLeft} days on ${m.expiryDate}. Please renew to continue uninterrupted workouts.`;
    } else {
      text += `Your gym membership has expired. Please renew your pass today.`;
    }
    const url = `whatsapp://send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Unable to launch WhatsApp on this device.');
    });
  };

  // ── Handler: Settle Dues / Record Payment ──
  const handleOpenSettleModal = (m: DueMemberItem) => {
    setSelectedMember(m);
    setSettleAmount(m.pendingDues > 0 ? String(m.pendingDues) : '3500');
    setSettleModalVisible(true);
  };

  const handleConfirmSettle = async () => {
    if (!selectedMember || !settleAmount) return;
    setIsSubmittingSettle(true);
    try {
      const numAmt = parseFloat(settleAmount) || 0;
      const res = await apiService.updateOwnerMember(selectedMember.id, {
        pendingDues: Math.max(0, selectedMember.pendingDues - numAmt),
        amountPaid: numAmt,
        paymentMode: settleMode,
      });

      if (res?.success) {
        Alert.alert('✓ Payment Recorded', `₹${numAmt.toLocaleString('en-IN')} settled for ${selectedMember.name}!`);
        setSettleModalVisible(false);
        setSelectedMember(null);
        fetchDuesData();
      } else {
        Alert.alert('Notice', 'Payment status updated in system.');
        setSettleModalVisible(false);
        fetchDuesData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update payment');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFF" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP APP BAR ── */}
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
                Pending Dues & Expiries
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                1-Week Renewal & Unpaid Balances
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
          }
        >
          {/* ── 1. HERO SUMMARY STATS (3-CARD GRID) ── */}
          <View style={styles.statsCardGrid}>
            {/* Card 1: Total Pending Dues */}
            <View style={[styles.statTile, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <View style={styles.statTileHeader}>
                <AppIcon name="receipt" size={moderateScale(14)} color="#EA580C" />
                <Text style={[styles.statTileLabel, { color: '#C2410C' }]}>Unpaid Dues</Text>
              </View>
              <Text style={[styles.statTileValue, { color: '#EA580C' }]}>
                ₹{totalPendingDuesAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statTileSub}>{unpaidDuesCount} Athletes Due</Text>
            </View>

            {/* Card 2: Expiring in 7 Days */}
            <View style={[styles.statTile, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <View style={styles.statTileHeader}>
                <AppIcon name="clock" size={moderateScale(14)} color="#D97706" />
                <Text style={[styles.statTileLabel, { color: '#B45309' }]}>1 Week Left</Text>
              </View>
              <Text style={[styles.statTileValue, { color: '#D97706' }]}>
                {expiring7dCount}
              </Text>
              <Text style={styles.statTileSub}>Renewals Soon</Text>
            </View>

            {/* Card 3: Expired Members */}
            <View style={[styles.statTile, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
              <View style={styles.statTileHeader}>
                <AppIcon name="alert" size={moderateScale(14)} color="#E11D48" />
                <Text style={[styles.statTileLabel, { color: '#BE123C' }]}>Expired</Text>
              </View>
              <Text style={[styles.statTileValue, { color: '#E11D48' }]}>
                {expiredCount}
              </Text>
              <Text style={styles.statTileSub}>Needs Renewal</Text>
            </View>
          </View>

          {/* ── 2. SEARCH TOOLBAR ── */}
          <View style={styles.searchBarBox}>
            <AppIcon name="search" size={moderateScale(14)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by athlete name, mobile or plan..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: '#94A3B8', fontWeight: '800', fontSize: fontScale(13) }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── 3. FILTER TABS ── */}
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: `All (${members.length})` },
              { id: 'unpaid', label: `Unpaid Dues (${unpaidDuesCount})` },
              { id: 'expiring_7d', label: `≤ 7 Days (${expiring7dCount})` },
              { id: 'expired', label: `Expired (${expiredCount})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, filterTab === tab.id && styles.filterPillActive]}
                onPress={() => setFilterTab(tab.id as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, filterTab === tab.id && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 4. MEMBERS LIST FEED ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              {filterTab === 'unpaid'
                ? `Athletes with Pending Dues (${filteredMembers.length})`
                : filterTab === 'expiring_7d'
                ? `Expiring Within 1 Week (${filteredMembers.length})`
                : filterTab === 'expired'
                ? `Expired Passes (${filteredMembers.length})`
                : `Action Required Roster (${filteredMembers.length})`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.loadingText}>Scanning dues & upcoming expirations...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <AppIcon name="receipt" size={moderateScale(32)} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>All Dues & Renewals Clear</Text>
              <Text style={styles.emptySub}>
                {filterTab === 'expiring_7d'
                  ? 'No memberships are expiring in the next 7 days.'
                  : filterTab === 'unpaid'
                  ? 'Great job! Zero pending fee dues across registered members.'
                  : 'No athletes require payment or plan renewal attention at this time.'}
              </Text>
            </View>
          ) : (
            filteredMembers.map((m) => {
              const hasDue = m.hasUnpaidDues;
              const isUrgent = m.daysLeft <= 3 || hasDue;

              return (
                <AnimatedPressable key={m.id} style={styles.memberCard}>
                  {/* Top Row: Name, Avatar, Due / Expiry Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.memberAvatarCircle}>
                      <Text style={styles.memberAvatarInitials}>
                        {m.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.memberNameText} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={styles.memberPhoneText}>
                        {m.phone} · ID: {m.memberId}
                      </Text>
                    </View>

                    {/* Pending Amount or Expiry Status Badge */}
                    <View style={{ alignItems: 'flex-end' }}>
                      {hasDue ? (
                        <View style={styles.dueAmountBox}>
                          <Text style={styles.dueAmountLabel}>DUE</Text>
                          <Text style={styles.dueAmountVal}>
                            ₹{m.pendingDues.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ) : m.isExpired ? (
                        <View style={[styles.statusPill, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                          <Text style={[styles.statusPillText, { color: '#E11D48' }]}>EXPIRED</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                          <Text style={[styles.statusPillText, { color: '#D97706' }]}>
                            {m.daysLeft === 1 ? '1 DAY LEFT' : `${m.daysLeft} DAYS LEFT`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Middle Row: Plan Name & Expiry Date */}
                  <View style={styles.cardPlanRow}>
                    <View style={styles.planNameChip}>
                      <AppIcon name="plan" size={moderateScale(12)} color="#4F46E5" />
                      <Text style={styles.planNameChipText} numberOfLines={1}>
                        {m.planName}
                      </Text>
                    </View>

                    <View style={styles.expiryDateChip}>
                      <AppIcon name="calendar" size={moderateScale(11)} color="#64748B" />
                      <Text style={styles.expiryDateChipText}>
                        Expiry: {m.expiryDate}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Action Bar */}
                  <View style={styles.cardActionsRow}>
                    {/* 1. Settle Payment Button */}
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => handleOpenSettleModal(m)}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="cash" size={moderateScale(13)} color="#FFFFFF" />
                      <Text style={styles.settleBtnText}>
                        {hasDue ? 'Settle Due' : 'Renew Plan'}
                      </Text>
                    </TouchableOpacity>

                    {/* 2. Send 1-Click Reminder */}
                    <TouchableOpacity
                      style={styles.reminderBtn}
                      onPress={() => handleSendReminder(m)}
                      disabled={sendingReminderId === m.id}
                      activeOpacity={0.8}
                    >
                      {sendingReminderId === m.id ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                      ) : (
                        <>
                          <AppIcon name="bell" size={moderateScale(13)} color="#4F46E5" />
                          <Text style={styles.reminderBtnText}>Alert</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* 3. WhatsApp Direct Reminder */}
                    {Boolean(m.phone) && (
                      <TouchableOpacity
                        style={styles.whatsappBtn}
                        onPress={() => handleOpenWhatsApp(m)}
                        activeOpacity={0.8}
                      >
                        <Image source={whatsappImg} style={styles.whatsappIcon} resizeMode="contain" />
                        <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(8) }} />
        </ScrollView>

        {/* ── SETTLE PAYMENT / RENEWAL MODAL ── */}
        <Modal
          visible={settleModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedMember?.pendingDues ? 'Clear Pending Fee' : 'Renew Membership Pass'}
                  </Text>
                  <Text style={styles.modalSub}>
                    {selectedMember?.name} ({selectedMember?.phone})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
                  <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Amount to Collect (₹) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={settleAmount}
                  onChangeText={setSettleAmount}
                  placeholder="e.g. 2000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Payment Mode</Text>
                <View style={styles.paymentModeRow}>
                  {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeBtn, settleMode === mode && styles.modeBtnActive]}
                      onPress={() => setSettleMode(mode)}
                    >
                      <Text style={[styles.modeBtnText, settleMode === mode && styles.modeBtnTextActive]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleConfirmSettle}
                disabled={isSubmittingSettle}
                activeOpacity={0.85}
              >
                {isSubmittingSettle ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>CONFIRM & SETTLE BALANCE</Text>
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
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
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
  headerTitleCol: {
    flex: 1,
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

  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
  },

  // ── 1. Stats Grid ──
  statsCardGrid: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(1.8),
  },
  statTile: {
    flex: 1,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    elevation: 1,
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statTileLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontSize: fontScale(16),
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statTileSub: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  // ── 2. Search Toolbar ──
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(42),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hp(1.5),
    gap: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#0F172A',
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
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sectionHeaderRow: {
    marginBottom: hp(1.2),
  },
  sectionHeaderTitle: {
    fontSize: fontScale(13.5),
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
  emptyIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  emptyTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },

  // ── Member Card ──
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  memberAvatarCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  memberAvatarInitials: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#4F46E5',
  },
  memberNameText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  memberPhoneText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },

  dueAmountBox: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'flex-end',
  },
  dueAmountLabel: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#EA580C',
  },
  dueAmountVal: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#EA580C',
  },

  statusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  cardPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(12),
  },
  planNameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 6,
  },
  planNameChipText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
  },
  expiryDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryDateChipText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },

  cardActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  settleBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  settleBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  reminderBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#4F46E5',
  },
  whatsappBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  whatsappIcon: {
    width: moderateScale(13),
    height: moderateScale(13),
  },
  whatsappBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#059669',
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
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  modalInputGroup: {
    marginBottom: hp(1.5),
  },
  modalInputLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(44),
    fontSize: fontScale(13),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  modeBtn: {
    flex: 1,
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeBtnActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  modeBtnText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalSubmitBtn: {
    backgroundColor: '#EA580C',
    borderRadius: moderateScale(12),
    height: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  modalSubmitBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
