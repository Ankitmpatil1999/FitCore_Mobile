import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/api';
import EnrollAthleteModal from '../../components/common/EnrollAthleteModal';

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

const whatsappIconImg = require('../../assets/Icons2/whatsapp.png');

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

export default function MembersScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const { showInAppNotification } = useNotifications();
  const gymId = currentGym?.id || (currentGym as any)?._id || (currentUser as any)?.gymId || '';
  const gymName = currentGym?.name || 'FitCore Gym';

  const [members, setMembers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState<any | null>(null);

  // ── Add Member Form States (Matching Web Fields) ──
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPlan, setFPlan] = useState('Pro Membership');
  const [fPlanPrice, setFPlanPrice] = useState('2999');
  const [fTrainer, setFTrainer] = useState('None');
  const [fStatus, setFStatus] = useState<'Active' | 'Pending' | 'Expired'>('Active');
  const [fFeesPaid, setFFeesPaid] = useState('2999');
  const [fNotes, setFNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, pkgsRes, trainersRes] = await Promise.all([
        apiService.getOwnerMembers(gymId),
        apiService.getOwnerPackages(gymId).catch(() => ({ success: false, data: [] })),
        apiService.getOwnerTrainers(gymId).catch(() => ({ success: false, data: [] })),
      ]);

      if (membersRes.success && Array.isArray(membersRes.data)) {
        setMembers(membersRes.data);
      } else {
        setMembers([]);
      }

      if (pkgsRes.success && Array.isArray(pkgsRes.data) && pkgsRes.data.length > 0) {
        setPackages(pkgsRes.data);
      } else {
        setPackages([
          { id: 'p1', name: 'Monthly Basic Pass', price: 1499, durationDays: 30 },
          { id: 'p2', name: 'Pro Membership', price: 2999, durationDays: 90 },
          { id: 'p3', name: 'Annual VIP Athlete', price: 6999, durationDays: 365 },
        ]);
      }

      if (trainersRes.success && Array.isArray(trainersRes.data)) {
        setTrainers(trainersRes.data);
      }
    } catch (err) {
      console.log('Error fetching members directory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchData();
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
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter calculations
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const daysLeft = m.daysRemaining !== undefined
        ? m.daysRemaining
        : m.expiryDate
        ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
        : 999;

      let matchFilter = true;
      if (filter === 'active') matchFilter = (m.status === 'active' || !m.status) && daysLeft > 15;
      else if (filter === 'expiring') matchFilter = daysLeft >= 0 && daysLeft <= 15;
      else if (filter === 'expired') matchFilter = m.status === 'expired' || daysLeft < 0;

      const matchSearch =
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || '').includes(search) ||
        (m.plan || m.planName || m.packageName || '').toLowerCase().includes(search.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [members, filter, search]);

  const activeCount = useMemo(
    () => members.filter((m) => m.status === 'active' || !m.status).length,
    [members]
  );
  const expiringCount = useMemo(() => {
    return members.filter((m) => {
      const d = m.daysRemaining !== undefined
        ? m.daysRemaining
        : m.expiryDate
        ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
        : 999;
      return d >= 0 && d <= 15;
    }).length;
  }, [members]);
  const expiredCount = useMemo(() => {
    return members.filter((m) => {
      const d = m.daysRemaining !== undefined
        ? m.daysRemaining
        : m.expiryDate
        ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
        : 999;
      return m.status === 'expired' || d < 0;
    }).length;
  }, [members]);

  const resetAddForm = () => {
    setFName('');
    setFPhone('');
    setFEmail('');
    setFPlan('Pro Membership');
    setFPlanPrice('2999');
    setFTrainer('None');
    setFStatus('Active');
    setFFeesPaid('2999');
    setFNotes('');
  };

  const handleAdd = async () => {
    const cleanName = fName.trim();
    const cleanPhone = fPhone.replace(/\D/g, '');

    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter the Member Full Name.');
      return;
    }
    if (cleanPhone.length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPkg = packages.find((p) => p.name === fPlan);
      const durationDays = selectedPkg?.durationDays || 30;

      const payload = {
        gymId,
        gymName,
        name: cleanName,
        phone: cleanPhone,
        email: fEmail.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        plan: fPlan,
        planName: fPlan,
        planPrice: parseFloat(fPlanPrice) || 2999,
        durationDays,
        assignedTrainerName: fTrainer !== 'None' ? fTrainer : undefined,
        status: fStatus.toLowerCase(),
        feesPaid: parseFloat(fFeesPaid) || 0,
        medicalNotes: fNotes.trim() || 'None',
        joinedDate: new Date().toISOString(),
      };

      const res = await apiService.createOwnerMember(payload);
      if (res.success) {
        Alert.alert('Member Enrolled', `Athlete ${cleanName} registered successfully!`);
        showInAppNotification({
          title: 'New Member Registered',
          message: `${cleanName} enrolled under ${fPlan}.`,
          type: 'workout',
        });
        setAddModal(false);
        resetAddForm();
        fetchData();
      } else {
        Alert.alert('Registration Notice', res.error || 'Failed to enroll member.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not register member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(
      `Hello ${name}, greetings from ${gymName}!`
    )}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${phoneWithCountry}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      });
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleRenewMember = (member: any) => {
    Alert.alert('Renew Subscription', `Choose package to extend ${member.name}:`, [
      {
        text: '1 Month (₹999)',
        onPress: () => processRenewal(member, 30, '1 Month Pass', 999),
      },
      {
        text: '3 Months (₹2,499)',
        onPress: () => processRenewal(member, 90, '3 Month Pass', 2499),
      },
      {
        text: '6 Months (₹3,999)',
        onPress: () => processRenewal(member, 180, '6 Month Pass', 3999),
      },
      {
        text: '12 Months (₹6,999)',
        onPress: () => processRenewal(member, 365, '12 Month Pass', 6999),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const processRenewal = async (
    member: any,
    days: number,
    planTitle: string,
    amount: number
  ) => {
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
    setDetailMember((prev: any) =>
      prev
        ? {
            ...prev,
            plan: planTitle,
            planName: planTitle,
            planPrice: amount,
            expiryDate: newExpiry,
            status: 'active',
            daysRemaining: days,
          }
        : null
    );

    try {
      const memberId = member._id || member.id || member.userId || member.phone;
      await apiService.renewMemberSubscription({
        memberId: String(memberId),
        packageName: planTitle,
        durationDays: days,
        planPrice: amount,
        paymentMode: 'UPI / Cash',
      });
      fetchData();
    } catch (e) {
      console.log('Online renewal sync notice:', e);
    }

    Alert.alert(
      'Membership Renewed',
      `Successfully renewed ${member.name} for ${days} days (${planTitle}) until ${newExpiry}!`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View
        style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* ── TOP APP BAR (CENTERED TITLE & SUBTITLE) ── */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <AppIcon name="arrow-back" size={18} color="#0F172A" />
          </TouchableOpacity>

          {/* Centered Title Section */}
          <View style={styles.appBarTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Members Directory
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {members.length} Active Gym Members
            </Text>
          </View>

          {/* Right Action Button: Add Member */}
          <TouchableOpacity
            style={styles.addMemberHeaderBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="person-add" size={14} color="#FFFFFF" />
            <Text style={styles.addMemberHeaderText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Icon name="search-outline" size={moderateScale(18)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone or plan..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close-circle" size={moderateScale(16)} color="#94A3B8" />
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
            {[
              { key: 'all' as FilterType, label: `All (${members.length})` },
              { key: 'active' as FilterType, label: `Active (${activeCount})` },
              { key: 'expiring' as FilterType, label: `Expiring (${expiringCount})` },
              { key: 'expired' as FilterType, label: `Expired (${expiredCount})` },
            ].map((item) => {
              const isActive = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setFilter(item.key)}
                  activeOpacity={0.8}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C5CE7']}
              tintColor="#6C5CE7"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading gym members...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="people-outline" size={moderateScale(32)} color="#6C5CE7" />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No search matches for "${search}"`
                  : 'Enroll your first athlete to start tracking attendance and dues.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setAddModal(true)}
                activeOpacity={0.85}
              >
                <AppIcon name="person-add" size={14} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add Member Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((m) => {
              const daysLeft =
                m.daysRemaining !== undefined
                  ? m.daysRemaining
                  : m.expiryDate
                  ? Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000)
                  : 999;

              const isExpiring = daysLeft >= 0 && daysLeft <= 15;
              const isExpired = m.status === 'expired' || daysLeft < 0;

              return (
                <AnimatedPressable
                  key={m._id || m.id || m.phone}
                  style={styles.memberCard}
                  onPress={() => setDetailMember(m)}
                >
                  <View style={styles.cardMainRow}>
                    {/* Squircle Initials Avatar */}
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>
                        {m.avatar ||
                          (m.name
                            ? m.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'MB')}
                      </Text>
                    </View>

                    {/* Member Details */}
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isExpired
                              ? styles.statusExpired
                              : isExpiring
                              ? styles.statusExpiring
                              : styles.statusActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isExpired
                                ? styles.statusTextExpired
                                : isExpiring
                                ? styles.statusTextExpiring
                                : styles.statusTextActive,
                            ]}
                          >
                            {isExpired ? 'Expired' : isExpiring ? `${daysLeft}d Left` : 'Active'}
                          </Text>
                        </View>
                      </View>

                      {/* Phone & Plan */}
                      <Text style={styles.memberPhone}>{m.phone}</Text>
                      <View style={styles.planPillRow}>
                        <View style={styles.planPill}>
                          <Text style={styles.planPillText}>
                            {m.plan || m.planName || m.packageName || 'Pro Pass'}
                          </Text>
                        </View>
                        {m.assignedTrainerName ? (
                          <View style={styles.trainerPill}>
                            <Text style={styles.trainerPillText}>
                              Trainer: {m.assignedTrainerName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Card Actions Bottom Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.quickChatBtn}
                      onPress={() => handleWhatsApp(m.phone, m.name)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={whatsappIconImg}
                        style={{ width: moderateScale(14), height: moderateScale(14), tintColor: '#10B981' }}
                        resizeMode="contain"
                      />
                      <Text style={styles.quickChatText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCallBtn}
                      onPress={() => handleCall(m.phone)}
                      activeOpacity={0.8}
                    >
                      <Icon name="call-outline" size={moderateScale(13)} color="#6C5CE7" />
                      <Text style={styles.quickCallText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickRenewBtn}
                      onPress={() => handleRenewMember(m)}
                      activeOpacity={0.8}
                    >
                      <Icon name="refresh-outline" size={moderateScale(13)} color="#F59E0B" />
                      <Text style={styles.quickRenewText}>Renew</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedPressable>
              );
            })
          )}
          <View style={{ height: hp(6) }} />
        </ScrollView>

        {/* ── ENROLL ATHLETE MODAL (EXACT 4-SECTION WEB PARITY) ── */}
        <EnrollAthleteModal
          visible={addModal}
          gymId={gymId}
          gymName={gymName}
          packages={packages}
          trainers={trainers}
          onClose={() => setAddModal(false)}
          onSuccess={(newMember) => {
            setAddModal(false);
            fetchData();
            showInAppNotification({
              title: 'Athlete Enrolled 🎉',
              message: `${newMember?.name || 'New Member'} registered successfully under ${newMember?.plan || 'Membership'}.`,
              type: 'workout',
            });
          }}
        />

        {/* ── MEMBER DETAIL SHEET ── */}
        <Modal visible={!!detailMember} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>Member Details</Text>
                  <Text style={styles.modalSubHeading}>Client Profile & Subscription</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDetailMember(null)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={moderateScale(18)} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailProfileRow}>
                <View style={styles.detailAvatarBox}>
                  <Text style={styles.detailAvatarText}>
                    {detailMember?.avatar ||
                      (detailMember?.name
                        ? detailMember.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : 'MB')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{detailMember?.name}</Text>
                  <Text style={styles.detailPhone}>{detailMember?.phone}</Text>
                  <Text style={styles.detailEmail}>{detailMember?.email || 'member@fitcore.io'}</Text>
                </View>
              </View>

              {/* Member Plan & Validity */}
              <View style={styles.detailPlanBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailPlanLabel}>ACTIVE PACKAGE</Text>
                  <Text style={styles.detailPlanName}>
                    {detailMember?.plan || detailMember?.planName || 'Pro Membership'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.detailPlanLabel}>VALID UNTIL</Text>
                  <Text style={styles.detailPlanExpiry}>
                    {detailMember?.expiryDate
                      ? new Date(detailMember.expiryDate).toLocaleDateString('en-GB')
                      : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.renewActionBtn}
                onPress={() => handleRenewMember(detailMember)}
                activeOpacity={0.88}
              >
                <Icon name="refresh-circle-outline" size={moderateScale(18)} color="#FFFFFF" />
                <Text style={styles.renewActionText}>Renew / Extend Membership</Text>
              </TouchableOpacity>

              <View style={styles.detailBottomRow}>
                <TouchableOpacity
                  style={[styles.detailActionPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                  onPress={() => handleWhatsApp(detailMember?.phone || '', detailMember?.name || 'Member')}
                  activeOpacity={0.8}
                >
                  <Image
                    source={whatsappIconImg}
                    style={{ width: moderateScale(15), height: moderateScale(15), tintColor: '#10B981' }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.detailActionText, { color: '#059669' }]}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionPill, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
                  onPress={() => handleCall(detailMember?.phone || '')}
                  activeOpacity={0.8}
                >
                  <Icon name="call-outline" size={moderateScale(15)} color="#6C5CE7" />
                  <Text style={[styles.detailActionText, { color: '#6C5CE7' }]}>Call</Text>
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
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Top App Bar (Centered Text) ──
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
    paddingBottom: hp(1.4),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  appBarTitleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(8),
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
  addMemberHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addMemberHeaderText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Search Bar ──
  searchWrapper: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.4),
    paddingBottom: hp(0.8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(44),
    gap: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
  },

  // ── Filter Tabs ──
  filterScrollWrap: {
    marginBottom: hp(0.8),
  },
  filterContainer: {
    paddingHorizontal: wp(4.5),
    gap: moderateScale(8),
  },
  filterPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  filterPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  filterPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Member List ──
  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
  },
  loadingBox: {
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(1.5),
  },
  loadingText: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
    paddingHorizontal: wp(6),
  },
  emptyIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(18),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
  },
  emptyTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(0.5),
    lineHeight: fontScale(17),
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    marginTop: hp(2),
  },
  emptyAddBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Member Card ──
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.4),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  avatarText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  memberInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: moderateScale(6),
  },
  memberPhone: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  planPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginTop: moderateScale(6),
  },
  planPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planPillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#475569',
  },
  trainerPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  trainerPillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusExpiring: {
    backgroundColor: '#FEF3C7',
  },
  statusExpired: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextExpiring: {
    color: '#D97706',
  },
  statusTextExpired: {
    color: '#DC2626',
  },

  // ── Card Action Row ──
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: moderateScale(8),
    marginTop: moderateScale(10),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  quickChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quickChatText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#166534',
  },
  quickCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  quickCallText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  quickRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#FFFBEB',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  quickRenewText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#B45309',
  },

  // ── Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: hp(85),
    paddingBottom: hp(3),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  modalHeading: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubHeading: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  fieldGroup: {
    marginBottom: hp(1.5),
  },
  fieldLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: moderateScale(6),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(12),
    minHeight: moderateScale(44),
  },
  textInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
    marginLeft: moderateScale(8),
    paddingVertical: Platform.OS === 'ios' ? moderateScale(10) : moderateScale(8),
  },
  multilineInput: {
    minHeight: hp(6),
    textAlignVertical: 'top',
  },
  currencySymbol: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  optionPill: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  optionPillActive: {
    backgroundColor: '#F3F2FE',
    borderColor: '#6C5CE7',
  },
  optionPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  optionPillTextActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: moderateScale(9),
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  segmentText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: hp(1.5),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSubmitText: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // ── Detail Sheet ──
  detailProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  detailAvatarBox: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(18),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    marginRight: moderateScale(14),
  },
  detailAvatarText: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  detailName: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  detailPhone: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  detailEmail: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 1,
  },
  detailPlanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    marginHorizontal: wp(5),
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
  },
  detailPlanLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailPlanName: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  detailPlanExpiry: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  renewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    backgroundColor: '#6C5CE7',
    marginHorizontal: wp(5),
    paddingVertical: hp(1.6),
    borderRadius: moderateScale(12),
    marginBottom: hp(1.5),
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  renewActionText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  detailBottomRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    paddingHorizontal: wp(5),
  },
  detailActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    paddingVertical: hp(1.3),
    borderRadius: moderateScale(10),
    borderWidth: 1,
  },
  detailActionText: {
    fontSize: fontScale(12),
    fontWeight: '800',
  },
});
