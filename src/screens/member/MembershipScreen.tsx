import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Image, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { Colors, Typography, Radii } from '../../theme';
import { getPlanById, getDaysRemaining, PLANS } from '../../data/mockData';
import { apiService } from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

export default function MembershipScreen({ navigation }: any) {
  const { currentMember, currentGym, currentUser } = useAppContext();
  const [liveProfile, setLiveProfile] = useState<any>(null);
  const [livePayments, setLivePayments] = useState<any[]>([]);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchMembershipData = async () => {
      try {
        const memberId = currentMember?.id || currentUser?.id;
        const [profileRes, paymentRes] = await Promise.all([
          apiService.getMemberProfile(memberId),
          apiService.getPaymentHistory(memberId),
        ]);
        if (profileRes.success && profileRes.data) {
          setLiveProfile(profileRes.data);
        }
        if (paymentRes.success && Array.isArray(paymentRes.data)) {
          setLivePayments(paymentRes.data);
        }
      } catch (err) {
        console.log('Using local cached plan data');
      }
    };
    fetchMembershipData();
  }, [currentMember?.id, currentUser?.id]);

  const plan = liveProfile?.plan || (currentMember ? getPlanById(currentMember.planId) : undefined);
  const daysLeft = liveProfile?.member?.daysRemaining !== undefined
    ? liveProfile.member.daysRemaining
    : currentMember ? getDaysRemaining(currentMember.expiryDate) : 0;
  const totalDays = plan?.durationDays || 365;
  const progressPercent = Math.min(100, (daysLeft / totalDays) * 100);
  const urgencyColor = daysLeft <= 7 ? Colors.danger : daysLeft <= 30 ? Colors.warning : Colors.success;

  const benefits = [
    { icon: 'fitness-outline', label: 'Gym Access', included: true },
    { icon: 'people-outline', label: 'Group Classes', included: true },
    { icon: 'barbell-outline', label: 'Workout Plans', included: true },
    { icon: 'person-outline', label: 'Trainer Support', included: true },
    { icon: 'nutrition-outline', label: 'Diet Plans', included: plan?.name !== 'Basic' },
    { icon: 'videocam-outline', label: 'Video Classes', included: plan?.name === 'Premium' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Image
              source={leftArrowIcon}
              style={{ width: 16, height: 16, tintColor: Colors.textPrimary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Membership</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── MEMBERSHIP HERO CARD ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{plan?.name ?? 'PLAN'}</Text>
            </View>

            <Text style={styles.heroPrice}>
              {plan?.price ? `₹${plan.price.toLocaleString()}` : '₹0'}{' '}
              <Text style={styles.heroPricePeriod}>/ {plan?.duration ?? 'month'}</Text>
            </Text>

            <View style={styles.heroStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: urgencyColor }]} />
              <Text style={styles.heroStatusText}>
                {daysLeft > 0 ? 'Active' : 'Expired'}
              </Text>
            </View>

            <View style={styles.heroDates}>
              <View style={styles.heroDateItem}>
                <Text style={styles.heroDateLabel}>Expires</Text>
                <Text style={styles.heroDateValue}>{currentMember?.expiryDate ?? '—'}</Text>
              </View>
              <View style={styles.heroDateItem}>
                <Text style={styles.heroDateLabel}>Joined</Text>
                <Text style={styles.heroDateValue}>{currentMember?.joinDate ?? '—'}</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: urgencyColor }]} />
              </View>
              <Text style={[styles.daysLeftText, { color: urgencyColor }]}>
                {daysLeft} days left
              </Text>
            </View>
          </View>

          {/* ── BENEFITS ── */}
          <Text style={styles.sectionTitle}>Membership Benefits</Text>
          <View style={styles.benefitsCard}>
            {benefits.map(b => (
              <View key={b.label} style={styles.benefitRow}>
                <View style={[
                  styles.benefitCheck,
                  { backgroundColor: b.included ? Colors.successBg : Colors.bgElevated },
                ]}>
                  <Icon
                    name={b.included ? 'checkmark' : 'close'}
                    size={14}
                    color={b.included ? Colors.success : Colors.textMuted}
                  />
                </View>
                <Icon name={b.icon} size={18} color={b.included ? Colors.textPrimary : Colors.textMuted} />
                <Text style={[
                  styles.benefitLabel,
                  !b.included && { color: Colors.textMuted },
                ]}>
                  {b.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── ACTION BUTTONS ── */}
          <TouchableOpacity
            style={styles.renewBtn}
            activeOpacity={0.85}
            onPress={() => setShowRenewModal(true)}
          >
            <Icon name="refresh-outline" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.renewBtnText}>RENEW MEMBERSHIP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8} onPress={() => setShowRenewModal(true)}>
            <Icon name="arrow-up-outline" size={20} color={Colors.primaryGreen} />
            <Text style={styles.upgradeBtnText}>UPGRADE PLAN</Text>
          </TouchableOpacity>

          {/* ── PAYMENT HISTORY ── */}
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.paymentCard}>
            {(livePayments.length > 0 ? livePayments : [
              { date: '01 Aug 2026', amount: plan?.price ? `₹${plan.price.toLocaleString()}` : '₹2,999', status: 'Paid' },
              { date: '01 May 2026', amount: '₹2,999', status: 'Paid' },
              { date: '01 Feb 2026', amount: '₹2,999', status: 'Paid' },
            ]).map((p: any, i: number) => (
              <View key={i} style={[styles.paymentRow, i < (livePayments.length || 3) - 1 && styles.paymentRowBorder]}>
                <View style={styles.paymentIcon}>
                  <Icon name="receipt-outline" size={18} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentDate}>{p.date || 'Recent Payment'}</Text>
                  <Text style={styles.paymentAmount}>{typeof p.amount === 'number' ? `₹${p.amount.toLocaleString()}` : p.amount}</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>{p.status || 'Paid'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── RENEWAL MODAL ── */}
          <Modal visible={showRenewModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 }}>
                  Renew {plan?.name || 'Membership Plan'}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Select instant UPI payment option to renew your membership for {plan?.durationDays || 365} days.
                </Text>

                <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>Plan Fee</Text>
                    <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>₹{plan?.price?.toLocaleString() || '2,999'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>GST (18%)</Text>
                    <Text style={{ color: '#059669', fontSize: 13 }}>Included</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: 'bold', color: '#0F172A', fontSize: 15 }}>Total Payable</Text>
                    <Text style={{ fontWeight: 'bold', color: '#4F46E5', fontSize: 17 }}>₹{plan?.price?.toLocaleString() || '2,999'}</Text>
                  </View>
                </View>

                {/* Instant UPI Pay Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4F46E5',
                    paddingVertical: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  disabled={isProcessingPayment}
                  onPress={() => {
                    setIsProcessingPayment(true);
                    setTimeout(() => {
                      setIsProcessingPayment(false);
                      setShowRenewModal(false);
                      Alert.alert('✓ Renewal Successful', `Your ${plan?.name || 'Membership'} has been renewed for ${plan?.durationDays || 365} days.`);
                    }, 1200);
                  }}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                      PAY WITH UPI (GPAY / PHONEPE)
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                  onPress={() => setShowRenewModal(false)}
                >
                  <Text style={{ color: '#64748B', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  root: { flex: 1, backgroundColor: Colors.bgBase },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: Typography.fontSizeXl,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroBadge: {
    backgroundColor: 'rgba(184, 242, 58, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.primaryGreen,
    letterSpacing: 1,
  },
  heroPrice: {
    fontSize: Typography.fontSize3xl,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  heroPricePeriod: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textSecondary,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  heroDates: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  heroDateItem: {},
  heroDateLabel: {
    fontSize: Typography.fontSizeXs,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  heroDateValue: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  daysLeftText: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightBold,
  },

  sectionTitle: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: 14,
    marginTop: 4,
  },

  // Benefits
  benefitsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textPrimary,
  },

  // Buttons
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primaryGreen,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    marginBottom: 10,
  },
  renewBtnText: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(184, 242, 58, 0.10)',
    borderRadius: Radii.lg,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 58, 0.20)',
  },
  upgradeBtnText: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primaryGreen,
    letterSpacing: 0.5,
  },

  // Payment History
  paymentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDate: {
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textSecondary,
  },
  paymentAmount: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  paidBadgeText: {
    fontSize: Typography.fontSizeXs,
    fontWeight: Typography.fontWeightBold,
    color: Colors.success,
  },
});
