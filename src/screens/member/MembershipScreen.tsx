import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Clean Vector PNG Asset Icons (No Raw Emojis) ──
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

interface PlanItem {
  id: string;
  name: string;
  durationDays?: number;
  duration?: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  description?: string;
  perks?: string[];
  features?: string[];
  popular?: boolean;
}

export default function MembershipScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { currentMember, currentGym, currentUser } = useAppContext();

  const [liveProfile, setLiveProfile] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const gymId = currentGym?.id || (currentGym as any)?._id || (currentMember as any)?.gymId || (currentUser as any)?.gymId || '';
  const memberId = String(
    currentMember?.userId ||
    currentMember?.id ||
    currentUser?.id ||
    currentUser?.phone ||
    ''
  );

  const fetchMembershipData = useCallback(async () => {
    try {
      if (!memberId) return;

      const [profileRes, packagesRes]: any[] = await Promise.all([
        apiService.getMemberProfile(memberId).catch(() => ({ success: false, data: null })),
        apiService.getOwnerPackages(gymId).catch(() => ({ success: false, data: [] })),
      ]);

      if (profileRes?.success && profileRes?.data) {
        setLiveProfile(profileRes.data);
      }

      if (packagesRes?.success && Array.isArray(packagesRes.data) && packagesRes.data.length > 0) {
        setAvailablePlans(packagesRes.data);
      } else if (packagesRes?.data && Array.isArray(packagesRes.data.packages)) {
        setAvailablePlans(packagesRes.data.packages);
      }
    } catch (err) {
      console.log('Error fetching live membership data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [memberId, gymId]);

  useEffect(() => {
    if (isFocused) {
      fetchMembershipData();
    }
  }, [isFocused, fetchMembershipData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembershipData();
  };

  // ── Dynamic Member & Plan Computations ──
  const memberData = liveProfile?.member || currentMember;
  const gymData = liveProfile?.gym || currentGym;

  const rawPlanCandidate =
    liveProfile?.plan?.name ||
    memberData?.planName ||
    memberData?.plan ||
    'Pro Studio Pass';

  const planName =
    typeof rawPlanCandidate === 'object' && rawPlanCandidate !== null
      ? (rawPlanCandidate.name || 'Pro Studio Pass')
      : String(rawPlanCandidate || 'Pro Studio Pass');

  const planPrice =
    liveProfile?.plan?.price !== undefined
      ? liveProfile.plan.price
      : (memberData?.planPrice !== undefined ? memberData.planPrice : 0);

  // Format Join Date
  const rawJoinDate = memberData?.joinDate || memberData?.joinedDate || memberData?.createdAt;
  const formattedJoinDate = rawJoinDate
    ? new Date(rawJoinDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--';

  // Format Expiry Date & Calculate Real Days Remaining
  const rawExpiryDate = memberData?.expiryDate || memberData?.planExpiry;
  let formattedExpiryDate = '--';
  let daysLeft = 0;

  if (rawExpiryDate) {
    const expDate = new Date(rawExpiryDate);
    if (!isNaN(expDate.getTime())) {
      formattedExpiryDate = expDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  } else if (memberData?.daysRemaining !== undefined) {
    daysLeft = Number(memberData.daysRemaining);
  }

  // Dynamic Total Days calculation from API / Dates / Plan Duration
  let calculatedDaysFromDates = 0;
  if (rawJoinDate && rawExpiryDate) {
    const sDate = new Date(rawJoinDate);
    const eDate = new Date(rawExpiryDate);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime()) && eDate.getTime() > sDate.getTime()) {
      calculatedDaysFromDates = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const extractDaysFromName = (name?: string): number => {
    if (!name) return 0;
    const lower = name.toLowerCase();
    const matchMonths = lower.match(/(\d+)\s*(?:month|mo)/);
    if (matchMonths && matchMonths[1]) {
      return parseInt(matchMonths[1], 10) * 30;
    }
    const matchDays = lower.match(/(\d+)\s*(?:day|d\b)/);
    if (matchDays && matchDays[1]) {
      return parseInt(matchDays[1], 10);
    }
    const matchYears = lower.match(/(\d+)\s*(?:year|yr)/);
    if (matchYears && matchYears[1]) {
      return parseInt(matchYears[1], 10) * 365;
    }
    if (lower.includes('annual') || lower.includes('yearly')) return 365;
    if (lower.includes('half year') || lower.includes('semi')) return 180;
    if (lower.includes('quarter')) return 90;
    return 0;
  };

  const nameDuration = extractDaysFromName(planName || memberData?.plan || memberData?.planName);

  const totalDays = Number(
    liveProfile?.plan?.durationDays ||
    memberData?.durationDays ||
    memberData?.planDurationDays ||
    (memberData?.durationMonths ? Number(memberData.durationMonths) * 30 : 0) ||
    calculatedDaysFromDates ||
    nameDuration ||
    (daysLeft > 0 ? daysLeft : 30)
  );

  const progressPercent = totalDays > 0 ? Math.min(100, Math.max(5, (daysLeft / totalDays) * 100)) : 0;
  const isActive = daysLeft > 0 || memberData?.status === 'Active' || memberData?.status === 'active';

  // Default Included Membership Privileges
  const benefits = [
    { icon: gymIcon, title: 'Gym Floor & Strength Zone', desc: 'Full access to weightlifting, cardio & machines', included: true },
    { icon: calendarIcon, title: 'Locker & Shower Access', desc: 'Dedicated lockers, changing suites & hot showers', included: true },
    { icon: barbellIcon, title: 'Smart Workout Routines', desc: 'Personalized hypertrophy & strength split plans', included: true },
    { icon: trainerIcon, title: 'Certified Trainer Support', desc: 'Form correction, floor guidance & advice', included: true },
    { icon: healthyIcon, title: 'Custom Diet & Calorie Targets', desc: 'Auto macro breakdown tailored to your goal', included: true },
    { icon: kettlebellIcon, title: 'FitStore Member Privilege', desc: 'Special member discount on gym supplements', included: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP HEADER (CENTERED & RESPONSIVE) ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#6C5CE7' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>My Membership</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {gymData?.name || 'FitCore Gym & Fitness Club'}
            </Text>
          </View>

          <View style={{ width: moderateScale(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + hp(4) }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C5CE7']}
              tintColor="#6C5CE7"
            />
          }
        >
          {isLoading && !refreshing ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loaderText}>Loading Membership Details...</Text>
            </View>
          ) : (
            <>
              {/* ── 1. LUXURY MEMBERSHIP HERO CARD ── */}
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={{ flex: 1, paddingRight: moderateScale(8) }}>
                    <View style={[styles.activePillRow, { backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2' }]}>
                      <View style={[styles.activePillDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
                      <Text style={[styles.activePillText, { color: isActive ? '#059669' : '#DC2626' }]}>
                        {isActive ? 'ACTIVE MEMBERSHIP' : 'EXPIRED / INACTIVE'}
                      </Text>
                    </View>
                    <Text style={styles.heroGymName} numberOfLines={1}>{gymData?.name || 'FitCore Gym'}</Text>
                    <Text style={styles.heroPlanTitle} numberOfLines={1}>{planName}</Text>
                  </View>

                  <View style={styles.heroIconBox}>
                    <Image
                      source={gymIcon}
                      style={{ width: moderateScale(28), height: moderateScale(28), tintColor: '#6C5CE7' }}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Price & Duration */}
                <View style={styles.heroPriceRow}>
                  <Text style={styles.heroPriceVal}>
                    ₹{typeof planPrice === 'number' ? planPrice.toLocaleString() : planPrice}
                  </Text>
                  <Text style={styles.heroPricePeriod}>/ {totalDays} Days Validity</Text>
                </View>

                {/* Dates Island Grid */}
                <View style={styles.heroDatesIsland}>
                  <View style={styles.heroDateCol}>
                    <View style={styles.heroDateLabelRow}>
                      <Image source={calendarIcon} style={styles.miniDateIcon} resizeMode="contain" />
                      <Text style={styles.heroDateLbl}>JOINED</Text>
                    </View>
                    <Text style={styles.heroDateVal} numberOfLines={1}>{formattedJoinDate}</Text>
                  </View>

                  <View style={styles.heroDateDivider} />

                  <View style={styles.heroDateCol}>
                    <View style={styles.heroDateLabelRow}>
                      <Image source={clockIcon} style={styles.miniDateIcon} resizeMode="contain" />
                      <Text style={styles.heroDateLbl}>VALID UNTIL</Text>
                    </View>
                    <Text style={styles.heroDateVal} numberOfLines={1}>{formattedExpiryDate}</Text>
                  </View>

                  <View style={styles.heroDateDivider} />

                  <View style={styles.heroDateCol}>
                    <View style={styles.heroDateLabelRow}>
                      <Image source={activeIcon} style={styles.miniDateIcon} resizeMode="contain" />
                      <Text style={styles.heroDateLbl}>REMAINING</Text>
                    </View>
                    <Text style={[styles.heroDateVal, { color: isActive ? '#6C5CE7' : '#EF4444' }]} numberOfLines={1}>
                      {daysLeft} Days
                    </Text>
                  </View>
                </View>

                {/* Validity Progress Bar */}
                <View style={styles.heroProgressSection}>
                  <View style={styles.heroProgressTrack}>
                    <View style={[styles.heroProgressFill, { width: `${progressPercent}%`, backgroundColor: isActive ? '#6C5CE7' : '#EF4444' }]} />
                  </View>
                  <View style={styles.heroProgressInfoRow}>
                    <Text style={styles.heroProgressSub}>Membership Validity Cycle</Text>
                    <Text style={styles.heroProgressPercent}>
                      {daysLeft} of {totalDays} days left
                    </Text>
                  </View>
                </View>
              </View>
              {/* ── 2. ALL AVAILABLE GYM PLANS (LIVE FROM MONGODB) ── */}
              {availablePlans && availablePlans.length > 0 && (
                <>
                  <View style={[styles.sectionHeaderRow, { marginTop: hp(1) }]}>
                    <Text style={styles.sectionTitle}>Gym Packages</Text>
                    <Text style={styles.sectionSub}>All Available Plans</Text>
                  </View>

                  <View style={styles.plansListContainer}>
                    {availablePlans.map((p, idx) => {
                      const isCurrent =
                        planName.toLowerCase().includes((p.name || '').toLowerCase()) ||
                        (p.name || '').toLowerCase().includes(planName.toLowerCase());

                      const perksList = p.perks || p.features || [];
                      const durationStr = p.durationDays ? `${p.durationDays} Days` : p.duration ? `${p.duration} Months` : '1 Month';

                      return (
                        <View key={p.id || idx} style={[styles.planCard, isCurrent && styles.planCardActive]}>
                          {isCurrent && (
                            <View style={styles.currentPlanRibbon}>
                              <Text style={styles.currentPlanRibbonText}>CURRENT PLAN</Text>
                            </View>
                          )}

                          <View style={styles.planCardHeader}>
                            <View style={{ flex: 1, paddingRight: moderateScale(8) }}>
                              <Text style={styles.planCardName}>{p.name}</Text>
                              <Text style={styles.planCardDuration}>Duration: {durationStr}</Text>
                            </View>

                            <View style={styles.planPriceContainer}>
                              <Text style={styles.planPriceText}>₹{Number(p.price || 0).toLocaleString()}</Text>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <Text style={styles.planOriginalPrice}>₹{Number(p.originalPrice).toLocaleString()}</Text>
                              )}
                            </View>
                          </View>

                          {p.discount !== undefined && p.discount > 0 && (
                            <View style={styles.discountPill}>
                              <Text style={styles.discountPillText}>Save {p.discount}% Off</Text>
                            </View>
                          )}

                          {p.description ? (
                            <Text style={styles.planDescriptionText}>{p.description}</Text>
                          ) : null}

                          {/* Features List */}
                          {perksList.length > 0 && (
                            <View style={styles.planFeaturesBox}>
                              {perksList.map((feat: string, fIdx: number) => (
                                <View key={fIdx} style={styles.planFeatureRow}>
                                  <Image source={activeIcon} style={styles.planFeatureCheck} resizeMode="contain" />
                                  <Text style={styles.planFeatureText}>{feat}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* Contact Reception Footer Note */}
                          <View style={styles.planFooterNote}>
                            <Image source={calendarIcon} style={styles.miniPlanIcon} resizeMode="contain" />
                            <Text style={styles.planFooterText}>Contact Reception Desk to Subscribe / Renew</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}

          <View style={{ height: hp(2) }} />
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

  // ── Ambient Background Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(25),
    left: -wp(15),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: '#E8E5FD',
    opacity: 0.6,
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(20),
    right: -wp(25),
    width: wp(70),
    height: wp(70),
    borderRadius: wp(35),
    backgroundColor: '#F0EEFF',
    opacity: 0.5,
  },

  // ── Header (Centered Layout matching FitCore Standards) ──
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    minHeight: hp(6),
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 2,
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: wp(18),
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },

  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
  },

  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  loaderText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#64748B',
    marginTop: moderateScale(12),
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
    shadowOpacity: 0.08,
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
  },
  activePillText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroGymName: {
    fontSize: fontScale(19),
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
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(16),
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
    flexWrap: 'wrap',
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
    paddingHorizontal: 2,
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
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
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
    height: moderateScale(6),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: moderateScale(3),
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
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(13),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deskNoticeIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#FFFFFF',
  },
  deskNoticeTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#3730A3',
    marginBottom: 2,
  },
  deskNoticeDesc: {
    fontSize: fontScale(10.5),
    color: '#4F46E5',
    lineHeight: fontScale(15),
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
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Benefits Card ──
  benefitsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    marginBottom: hp(1.5),
  },
  benefitItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  benefitRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  benefitIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(11),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    width: moderateScale(17),
    height: moderateScale(17),
    tintColor: '#6C5CE7',
  },
  benefitTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  benefitDesc: {
    fontSize: fontScale(10),
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
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#10B981',
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
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  planCardDuration: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPriceText: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  planOriginalPrice: {
    fontSize: fontScale(10.5),
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
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#D97706',
  },
  planDescriptionText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginBottom: moderateScale(6),
    lineHeight: fontScale(15),
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
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#10B981',
  },
  planFeatureText: {
    fontSize: fontScale(10.5),
    color: '#475569',
    fontWeight: '500',
  },
  planFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(9),
    marginTop: moderateScale(10),
    alignSelf: 'flex-start',
  },
  miniPlanIcon: {
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#64748B',
  },
  planFooterText: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#64748B',
  },
});
