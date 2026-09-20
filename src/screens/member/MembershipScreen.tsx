import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { getDaysRemaining, MEMBERSHIP_PLANS, MembershipPlan } from '../../data/mockData';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Clean Vector PNG Asset Icons (No Icon Fonts / No Raw Emojis) ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const gymIcon = require('../../assets/Icons2/gym.png');
const barbellIcon = require('../../assets/Icons2/barbell.png');
const calendarIcon = require('../../assets/Icons2/calendar.png');
const trainerIcon = require('../../assets/Icons2/user.png');
const healthyIcon = require('../../assets/Icons2/healthy.png');
const payIcon = require('../../assets/Icons2/pay.png');
const activeIcon = require('../../assets/Icons2/active.png');
const clockIcon = require('../../assets/Icons2/clock.png');
const kettlebellIcon = require('../../assets/Icons2/kettlebell.png');

export default function MembershipScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentMember, currentGym, currentUser } = useAppContext();
  const [liveProfile, setLiveProfile] = useState<any>(null);
  const [livePayments, setLivePayments] = useState<any[]>([]);

  const gymId = currentGym?.id || 'gym1';
  const availablePlans: MembershipPlan[] = MEMBERSHIP_PLANS.filter(
    (p) => p.gymId === gymId || !p.gymId || p.gymId === 'gym1'
  );

  useEffect(() => {
    const fetchMembershipData = async () => {
      try {
        const memberId = currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1';
        if (!memberId) return;
        const [profileRes, paymentRes]: any[] = await Promise.all([
          apiService.getMemberProfile(memberId),
          apiService.getPaymentHistory(memberId),
        ]);
        if (profileRes.success && profileRes.data) {
          setLiveProfile(profileRes.data);
          if (profileRes.data.payments && Array.isArray(profileRes.data.payments) && profileRes.data.payments.length > 0) {
            setLivePayments(profileRes.data.payments);
          }
        }
        if (paymentRes.success && Array.isArray(paymentRes.data) && paymentRes.data.length > 0) {
          setLivePayments(paymentRes.data);
        }
      } catch (err) {
        console.log('Using cached membership data');
      }
    };
    fetchMembershipData();
  }, [currentMember?.id, currentUser?.id]);

  const memberData = liveProfile?.member || currentMember;
  const gymData = liveProfile?.gym || currentGym;
  const planName = liveProfile?.plan?.name || memberData?.planName || memberData?.plan || '3 Month Pass';
  const planPrice = liveProfile?.plan?.price || memberData?.planPrice || 2499;
  const daysLeft = memberData?.daysRemaining !== undefined
    ? memberData.daysRemaining
    : (memberData?.expiryDate ? getDaysRemaining(memberData.expiryDate) : 88);
  const totalDays = liveProfile?.plan?.durationDays || 90;
  const progressPercent = Math.min(100, Math.max(5, (daysLeft / totalDays) * 100));

  const benefits = [
    { icon: gymIcon, title: 'Gym Floor & Free Weights', desc: 'Full access to state-of-the-art strength zones', included: true },
    { icon: calendarIcon, title: 'Locker & Facility Access', desc: 'Full access to lockers, showers & amenities', included: true },
    { icon: barbellIcon, title: 'Personalized Workout Splits', desc: 'Auto-adaptive weekly hypertrophy routine', included: true },
    { icon: trainerIcon, title: 'Dedicated Trainer Guidance', desc: 'Form correction & coach consultation', included: true },
    { icon: healthyIcon, title: 'Custom Diet & Macro Targets', desc: 'Calorie breakdown & nutrition planning', included: true },
    { icon: kettlebellIcon, title: 'FitStore Member Privilege', desc: 'Exclusive discount on supplements & gear', included: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Membership</Text>
          <View style={{ width: moderateScale(42) }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + hp(4) }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={true}
          overScrollMode="never"
        >

          {/* ── 1. LUXURY MEMBERSHIP HERO CARD ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.activePillRow}>
                  <View style={styles.activePillDot} />
                  <Text style={styles.activePillText}>{daysLeft > 0 ? 'ACTIVE PASS' : 'EXPIRED'}</Text>
                </View>
                <Text style={styles.heroGymName}>{gymData?.name || 'FitCore Gym'}</Text>
                <Text style={styles.heroPlanTitle}>{planName}</Text>
              </View>

              <View style={styles.heroIconBox}>
                <Image
                  source={gymIcon}
                  style={{ width: moderateScale(34), height: moderateScale(34), tintColor: '#6C5CE7' }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Price & Plan Tag */}
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPriceVal}>₹{typeof planPrice === 'number' ? planPrice.toLocaleString() : planPrice}</Text>
              <Text style={styles.heroPricePeriod}>/ {totalDays} Days</Text>
            </View>

            {/* Dates Grid Island */}
            <View style={styles.heroDatesIsland}>
              <View style={styles.heroDateCol}>
                <View style={styles.heroDateLabelRow}>
                  <Image source={calendarIcon} style={styles.miniDateIcon} resizeMode="contain" />
                  <Text style={styles.heroDateLbl}>JOINED</Text>
                </View>
                <Text style={styles.heroDateVal}>{memberData?.joinDate || '13 Sep 2026'}</Text>
              </View>

              <View style={styles.heroDateDivider} />

              <View style={styles.heroDateCol}>
                <View style={styles.heroDateLabelRow}>
                  <Image source={clockIcon} style={styles.miniDateIcon} resizeMode="contain" />
                  <Text style={styles.heroDateLbl}>VALID UNTIL</Text>
                </View>
                <Text style={styles.heroDateVal}>{memberData?.expiryDate || '12 Dec 2026'}</Text>
              </View>

              <View style={styles.heroDateDivider} />

              <View style={styles.heroDateCol}>
                <View style={styles.heroDateLabelRow}>
                  <Image source={activeIcon} style={styles.miniDateIcon} resizeMode="contain" />
                  <Text style={styles.heroDateLbl}>DAYS LEFT</Text>
                </View>
                <Text style={[styles.heroDateVal, { color: '#6C5CE7' }]}>{daysLeft} Days</Text>
              </View>
            </View>

            {/* Progress Gauge */}
            <View style={styles.heroProgressSection}>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.heroProgressInfoRow}>
                <Text style={styles.heroProgressSub}>Membership Validity Cycle</Text>
                <Text style={styles.heroProgressPercent}>{daysLeft} of {totalDays} days</Text>
              </View>
            </View>
          </View>


          {/* ── 3. ALL AVAILABLE GYM MEMBERSHIP PLANS (VIEW ONLY) ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Gym Plans</Text>
            <Text style={styles.sectionSub}>All packages in gym</Text>
          </View>

          <View style={styles.plansListContainer}>
            {availablePlans.map((p) => {
              const isCurrent =
                planName.toLowerCase().includes(p.name.toLowerCase()) ||
                p.name.toLowerCase().includes(planName.toLowerCase());

              return (
                <View key={p.id} style={[styles.planCard, isCurrent && styles.planCardActive]}>
                  {isCurrent && (
                    <View style={styles.currentPlanRibbon}>
                      <Text style={styles.currentPlanRibbonText}>CURRENT PLAN</Text>
                    </View>
                  )}

                  <View style={styles.planCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planCardName}>{p.name}</Text>
                      <Text style={styles.planCardDuration}>Duration: {p.duration} {p.duration === 1 ? 'Month' : 'Months'}</Text>
                    </View>

                    <View style={styles.planPriceContainer}>
                      <Text style={styles.planPriceText}>₹{p.price.toLocaleString()}</Text>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <Text style={styles.planOriginalPrice}>₹{p.originalPrice.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>

                  {p.discount > 0 && (
                    <View style={styles.discountPill}>
                      <Text style={styles.discountPillText}>Save {p.discount}% Off</Text>
                    </View>
                  )}

                  {/* Features List */}
                  <View style={styles.planFeaturesBox}>
                    {p.features && p.features.map((feat, idx) => (
                      <View key={idx} style={styles.planFeatureRow}>
                        <Image source={activeIcon} style={styles.planFeatureCheck} resizeMode="contain" />
                        <Text style={styles.planFeatureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Informational Footer Badge */}
                  <View style={styles.planFooterNote}>
                    <Image source={calendarIcon} style={styles.miniPlanIcon} resizeMode="contain" />
                    <Text style={styles.planFooterText}>Contact Gym Reception Desk to Subscribe</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: hp(4) }} />
        </ScrollView>
      </View>
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  activePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  heroGymName: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  heroPlanTitle: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  heroIconBox: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0DBFC',
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: moderateScale(14),
  },
  heroPriceVal: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: -0.5,
  },
  heroPricePeriod: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  heroDatesIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: moderateScale(14),
  },
  heroDateCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroDateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  miniDateIcon: {
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#64748B',
  },
  heroDateLbl: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  heroDateVal: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  heroDateDivider: {
    width: 1,
    height: moderateScale(22),
    backgroundColor: '#E2E8F0',
  },
  heroProgressSection: {
    marginTop: moderateScale(2),
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 3,
  },
  heroProgressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressSub: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#94A3B8',
  },
  heroProgressPercent: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // ── Desk Managed Notice Card ──
  deskNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    gap: moderateScale(12),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  deskNoticeIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deskNoticeIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#FFFFFF',
  },
  deskNoticeTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#3730A3',
    marginBottom: 2,
  },
  deskNoticeDesc: {
    fontSize: fontScale(11),
    color: '#4F46E5',
    lineHeight: fontScale(16),
    fontWeight: '500',
  },

  // ── Section Headers ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: moderateScale(10),
    marginTop: moderateScale(4),
  },
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Available Plans List ──
  plansListContainer: {
    gap: moderateScale(12),
    marginBottom: hp(2),
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardActive: {
    borderColor: '#6C5CE7',
    borderWidth: 1.5,
    backgroundColor: '#FAFAFF',
  },
  currentPlanRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderBottomLeftRadius: moderateScale(10),
  },
  currentPlanRibbonText: {
    fontSize: fontScale(8.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
  },
  planCardName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  planCardDuration: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPriceText: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  planOriginalPrice: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(8),
  },
  discountPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#D97706',
  },
  planFeaturesBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: moderateScale(8),
    marginTop: moderateScale(4),
    gap: 4,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planFeatureCheck: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: '#10B981',
  },
  planFeatureText: {
    fontSize: fontScale(11),
    color: '#475569',
    fontWeight: '500',
  },
  planFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    marginTop: moderateScale(10),
    alignSelf: 'flex-start',
  },
  miniPlanIcon: {
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#64748B',
  },
  planFooterText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Benefits Card ──
  benefitsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  benefitItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(11),
  },
  benefitRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  benefitIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#6C5CE7',
  },
  benefitTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  benefitIncludedBadge: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconSmall: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: '#10B981',
  },

  // ── Payments Card ──
  paymentsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  paymentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  paymentRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  paymentIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#059669',
  },
  paymentDescText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  paymentDateText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  paymentAmountText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 3,
  },
  paidPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  paidPillText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#059669',
  },
});
