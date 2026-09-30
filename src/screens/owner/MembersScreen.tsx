import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { MEMBERS } from '../../data/mockData';
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

const whatsappIconImg = require('../../assets/Icons2/whatsapp.png');

type FilterType = 'all' | 'active' | 'expiring' | 'expired' | 'leads';

export default function MembersScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || '6a934afd13a1b16c3767d90f';

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState<any | null>(null);

  // Form states
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPlan, setFPlan] = useState('Pro Membership');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchMembers = async () => {
    try {
      const res = await apiService.getOwnerMembers(gymId);
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.log('Error fetching members:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  // Filter calculations
  const filtered = members.filter((m) => {
    const daysLeft = m.expiryDate
      ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
      : 999;

    let matchFilter = true;
    if (filter === 'active') matchFilter = (m.status === 'active' || !m.status) && daysLeft > 15;
    else if (filter === 'expiring') matchFilter = daysLeft >= 0 && daysLeft <= 15;
    else if (filter === 'expired') matchFilter = m.status === 'expired' || daysLeft < 0;
    else if (filter === 'leads') matchFilter = m.status === 'lead' || m.status === 'trial' || m.status === 'frozen';

    const matchSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || '').includes(search) ||
      (m.plan || m.packageName || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activeCount = members.filter(m => (m.status === 'active' || !m.status)).length;
  const expiringCount = members.filter(m => {
    const d = m.expiryDate ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000) : 999;
    return d >= 0 && d <= 15;
  }).length;
  const expiredCount = members.filter(m => {
    const d = m.expiryDate ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000) : 999;
    return m.status === 'expired' || d < 0;
  }).length;

  const handleAdd = async () => {
    if (!fName.trim() || !fPhone.trim()) {
      Alert.alert('Required', 'Name and mobile number are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.createOwnerMember({
        gymId,
        gymName: currentGym?.name || 'FitCore Gym',
        name: fName.trim(),
        phone: fPhone.trim(),
        email: fEmail.trim() || `${fName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        plan: fPlan,
        status: 'active',
      });
      if (res.success) {
        Alert.alert('✓ Enrolled', `${fName} has been enrolled successfully!`);
        setFName('');
        setFPhone('');
        setFEmail('');
        setAddModal(false);
        fetchMembers();
      } else {
        Alert.alert('Error', res.error || 'Could not enroll member.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(`Hello ${name}, greetings from ${currentGym?.name || 'FitCore Gym'}!`)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      }
    }).catch(() => {
      Linking.openURL(`https://wa.me/${phoneWithCountry}`);
    });
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleRenewMember = (member: any) => {
    Alert.alert(
      'Renew Member Subscription',
      `Select membership package to renew ${member.name}:`,
      [
        {
          text: '1 Month Pass (₹999)',
          onPress: () => processRenewal(member, 30, '1 Month Pass', 999),
        },
        {
          text: '3 Month Pass (₹2,499)',
          onPress: () => processRenewal(member, 90, '3 Month Pass', 2499),
        },
        {
          text: '6 Month Pass (₹3,999)',
          onPress: () => processRenewal(member, 180, '6 Month Pass', 3999),
        },
        {
          text: '12 Month Pass (₹6,999)',
          onPress: () => processRenewal(member, 365, '12 Month Pass', 6999),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const processRenewal = async (member: any, days: number, planTitle: string, amount: number) => {
    const currentExpiry = member.expiryDate ? new Date(member.expiryDate).getTime() : Date.now();
    const baseDate = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseDate + days * 86400000).toISOString().split('T')[0];

    const updated = members.map((m) => {
      if (m.id === member.id || m._id === member._id || m.phone === member.phone) {
        return {
          ...m,
          plan: planTitle,
          planName: planTitle,
          planPrice: amount,
          expiryDate: newExpiry,
          status: 'active',
          daysRemaining: days,
        };
      }
      return m;
    });

    setMembers(updated);
    setDetailMember((prev: any) => prev ? {
      ...prev,
      plan: planTitle,
      planName: planTitle,
      planPrice: amount,
      expiryDate: newExpiry,
      status: 'active',
      daysRemaining: days,
    } : null);

    try {
      const memberId = member._id || member.id || member.userId || member.phone;
      await apiService.renewMemberSubscription({
        memberId: String(memberId),
        packageName: planTitle,
        durationDays: days,
        planPrice: amount,
        paymentMode: 'UPI / Online',
      });
      fetchMembers();
    } catch (e) {
      console.log('Online renewal sync notice:', e);
    }

    Alert.alert('✓ Membership Renewed', `Successfully renewed ${member.name}'s membership for ${days} days (${planTitle}) until ${newExpiry}!`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* ── TOP APP BAR ── */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.appBarTitleCol}>
            <Text style={styles.headerTitle}>Members Directory</Text>
            <Text style={styles.headerSub}>{members.length} Active Gym Members</Text>
          </View>

          <TouchableOpacity
            style={styles.addMemberHeaderBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="person-add" size={15} color="#FFFFFF" />
            <Text style={styles.addMemberHeaderText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <AppIcon name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone or plan..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── FILTER TABS ── */}
        <View style={styles.filterScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {(
              [
                { key: 'all', label: `All (${members.length})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'expiring', label: `Expiring (${expiringCount})` },
                { key: 'expired', label: `Expired (${expiredCount})` },
              ] as { key: FilterType; label: string }[]
            ).map((item) => {
              const isActive = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setFilter(item.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── MEMBER LIST ── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
          }
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading members roster...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <AppIcon name="members" size={36} color="#6366F1" />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySub}>
                {search ? `No results for "${search}".` : 'No members found in this filter category.'}
              </Text>
            </View>
          ) : (
            filtered.map((m) => {
              const daysLeft = m.expiryDate
                ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
                : 999;
              const isExpired = m.status === 'expired' || daysLeft < 0;
              const isExpiring = daysLeft >= 0 && daysLeft <= 15;

              return (
                <AnimatedPressable
                  key={m._id || m.id || m.phone}
                  style={styles.memberCard}
                  onPress={() => setDetailMember(m)}
                >
                  <View style={styles.memberTopRow}>
                    {/* Avatar */}
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {m.name ? m.name.slice(0, 2).toUpperCase() : 'M'}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.memberMainInfo}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name || 'Member'}
                        </Text>
                        {isExpired ? (
                          <View style={[styles.statusBadge, styles.statusExpired]}>
                            <Text style={styles.statusExpiredText}>Expired</Text>
                          </View>
                        ) : isExpiring ? (
                          <View style={[styles.statusBadge, styles.statusExpiring]}>
                            <Text style={styles.statusExpiringText}>{daysLeft}d left</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, styles.statusActive]}>
                            <Text style={styles.statusActiveText}>Active</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.memberPhoneText}>{m.phone || 'No phone'}</Text>
                    </View>
                  </View>

                  {/* Card Bottom / Actions Strip */}
                  <View style={styles.memberCardFooter}>
                    <View style={styles.planInfoBox}>
                      <Text style={styles.planLabelText}>PLAN</Text>
                      <Text style={styles.planNameText} numberOfLines={1}>
                        {m.plan || m.packageName || 'Standard Pass'}
                      </Text>
                    </View>

                    <View style={styles.actionIconsRow}>
                      {/* WhatsApp */}
                      <TouchableOpacity
                        style={[styles.smallIconBtn, { backgroundColor: '#ECFDF5' }]}
                        onPress={() => handleWhatsApp(m.phone || '', m.name || 'Member')}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={whatsappIconImg}
                          style={{ width: 15, height: 15, tintColor: '#10B981' }}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>

                      {/* Phone Call */}
                      <TouchableOpacity
                        style={[styles.smallIconBtn, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => handleCall(m.phone || '')}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="phone" size={14} color="#6366F1" />
                      </TouchableOpacity>

                      {/* Details Chevron */}
                      <TouchableOpacity
                        style={[styles.smallIconBtn, { backgroundColor: '#F8FAFC' }]}
                        onPress={() => setDetailMember(m)}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="chevron-forward" size={14} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(10) }} />
        </ScrollView>

        {/* ── ENROLL MEMBER MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Enroll New Member</Text>
                  <Text style={styles.modalSub}>{currentGym?.name || 'FitCore Gym'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setAddModal(false)}
                >
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fPhone}
                  onChangeText={setFPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Membership Plan</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fPlan}
                  onChangeText={setFPlan}
                  placeholder="e.g. Pro Membership"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAdd}
                activeOpacity={0.85}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>CONFIRM ENROLLMENT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MEMBER DETAIL SHEET ── */}
        <Modal visible={!!detailMember} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Member Details</Text>
                  <Text style={styles.modalSub}>Client Profile & Subscription</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setDetailMember(null)}
                >
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailProfileRow}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>
                    {detailMember?.avatar ?? (detailMember?.name ? detailMember.name.slice(0, 2).toUpperCase() : 'MB')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{detailMember?.name}</Text>
                  <Text style={styles.detailPhone}>{detailMember?.phone}</Text>
                  <Text style={styles.detailEmail}>{detailMember?.email || 'member@fitcore.io'}</Text>
                </View>
              </View>

              {/* Member Plan & Validity Pill */}
              <View style={styles.detailPlanBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailPlanLabel}>ACTIVE PLAN</Text>
                  <Text style={styles.detailPlanName}>
                    {detailMember?.plan || detailMember?.planName || 'Standard Pass'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.detailPlanLabel}>VALID UNTIL</Text>
                  <Text style={styles.detailPlanExpiry}>
                    {detailMember?.expiryDate ? new Date(detailMember.expiryDate).toLocaleDateString('en-GB') : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Owner Renew Membership Action */}
              <TouchableOpacity
                style={styles.ownerRenewBtn}
                onPress={() => handleRenewMember(detailMember)}
                activeOpacity={0.88}
              >
                <AppIcon name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.ownerRenewBtnText}>RENEW / EXTEND MEMBERSHIP</Text>
              </TouchableOpacity>

              <View style={styles.detailActionRow}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleWhatsApp(detailMember?.phone || '', detailMember?.name || 'Member')}
                  activeOpacity={0.85}
                >
                  <Image source={whatsappIconImg} style={{ width: 17, height: 17, tintColor: '#FFFFFF' }} resizeMode="contain" />
                  <Text style={styles.quickActionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#6366F1' }]}
                  onPress={() => handleCall(detailMember?.phone || '')}
                  activeOpacity={0.85}
                >
                  <AppIcon name="phone" size={16} color="#FFFFFF" />
                  <Text style={styles.quickActionBtnText}>Call Member</Text>
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
    backgroundColor: '#F8FAFC',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Top App Bar ──
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: moderateScale(10),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  addMemberHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addMemberHeaderText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Search Bar ──
  searchWrapper: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(44),
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: fontScale(14),
    color: '#94A3B8',
    fontWeight: '800',
    padding: 4,
  },

  // ── Filter Tabs ──
  filterScrollWrap: {
    marginBottom: hp(1),
  },
  filterContainer: {
    paddingHorizontal: wp(4),
    gap: moderateScale(8),
  },
  filterPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // ── Member List ──
  scroll: {
    paddingHorizontal: wp(4),
    paddingTop: hp(0.5),
  },
  loadingBox: {
    paddingVertical: hp(8),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
    fontSize: fontScale(13),
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginTop: hp(4),
  },
  emptyIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '80%',
  },

  // ── Member Card ──
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  memberAvatar: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  memberAvatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#6366F1',
  },
  memberMainInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberName: {
    flex: 1,
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  memberPhoneText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#059669',
  },
  statusExpiring: {
    backgroundColor: '#FEF3C7',
  },
  statusExpiringText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#D97706',
  },
  statusExpired: {
    backgroundColor: '#FEF2F2',
  },
  statusExpiredText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#DC2626',
  },

  // Card Footer Strip
  memberCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: moderateScale(8),
  },
  planInfoBox: {
    flex: 1,
  },
  planLabelText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  planNameText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 1,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  smallIconBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  closeModalBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#64748B',
  },

  inputGroup: {
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(44),
    fontSize: fontScale(13),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#6366F1',
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
    letterSpacing: 0.3,
  },

  // Detail Modal
  detailProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: hp(1.8),
  },
  detailAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(14),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  detailAvatarText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#6366F1',
  },
  detailName: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailPhone: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  detailEmail: {
    fontSize: fontScale(11),
    color: '#94A3B8',
  },
  detailPlanBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hp(1.5),
  },
  detailPlanLabel: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailPlanName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailPlanExpiry: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6366F1',
  },
  ownerRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: '#6366F1',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(11),
    marginBottom: hp(1.2),
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  ownerRenewBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: moderateScale(42),
    borderRadius: moderateScale(10),
  },
  quickActionBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
