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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import {
  MEMBERS,
  MEMBERSHIP_PLANS,
  TRAINERS,
  Member,
  MemberStatus,
  getPlanById,
  getTrainerById,
  getDaysRemaining,
} from '../../data/mockData';
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

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const whatsappIconImg = require('../../assets/Icons2/whatsapp.png');

type FilterType = 'all' | 'active' | 'expiring' | 'expired' | 'leads';

export default function MembersScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || 'g1';

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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMembers(res.data);
      } else {
        setMembers(MEMBERS);
      }
    } catch (err) {
      console.log('Error fetching members:', err);
      setMembers(MEMBERS);
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
  }, [gymId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

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
      (m.phone || '').includes(search);
    return matchFilter && matchSearch;
  });

  const handleAdd = async () => {
    if (!fName.trim() || !fPhone.trim()) {
      Alert.alert('Required', 'Name and mobile number are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.createOwnerMember({
        gymId,
        gymName: currentGym?.name || 'Ayushi GYM',
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
            <Text style={styles.headerTitle}>Members Directory</Text>
            <Text style={styles.headerSub}>Total Enrolled: {members.length} Members</Text>
          </View>
          <TouchableOpacity
            style={styles.addMemberHeaderBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="person-add" size={moderateScale(16)} color="#FFFFFF" />
            <Text style={styles.addMemberHeaderText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <AppIcon name="search" size={moderateScale(18)} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member name or phone..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTER PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
        >
          {(['all', 'active', 'expiring', 'expired', 'leads'] as FilterType[]).map((ft) => {
            const isActive = filter === ft;
            const labels: Record<FilterType, string> = {
              all: `All (${members.length})`,
              active: 'Active',
              expiring: 'Expiring Soon',
              expired: 'Expired',
              leads: 'Leads',
            };
            return (
              <TouchableOpacity
                key={ft}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(ft)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {labels[ft]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── MEMBER LIST ── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C5CE7']} />
          }
        >
          {loading ? (
            <View style={{ paddingVertical: hp(6), alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600', fontSize: fontScale(13) }}>
                Loading live members...
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="members" size={moderateScale(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySub}>Try searching with another name or filter criteria.</Text>
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
                  key={m._id || m.id}
                  style={styles.memberCard}
                  onPress={() => setDetailMember(m)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.name ? m.name.slice(0, 2).toUpperCase() : 'M'}
                    </Text>
                  </View>

                  <View style={styles.memberInfoCol}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      {isExpired ? (
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 77, 109, 0.10)' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#FF4D6D' }]}>Expired</Text>
                        </View>
                      ) : isExpiring ? (
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 153, 0, 0.10)' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#FF9900' }]}>{daysLeft}d left</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#00C48C' }]}>Active</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.memberPlanSub}>
                      {m.plan || m.packageName || 'Standard Pass'} • {m.phone}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '600' }}>›</Text>
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ENROLL MEMBER MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enroll New Member</Text>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                  <Text style={{ fontSize: 18, color: '#0F172A', fontWeight: '700' }}>✕</Text>
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

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>CONFIRM ENROLLMENT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MEMBER DETAIL SHEET ── */}
        <Modal visible={!!detailMember} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Member Details</Text>
                <TouchableOpacity onPress={() => setDetailMember(null)}>
                  <Text style={{ fontSize: 18, color: '#0F172A', fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailProfileRow}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{detailMember?.avatar ?? 'M'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{detailMember?.name}</Text>
                  <Text style={styles.detailPhone}>{detailMember?.phone}</Text>
                  <Text style={styles.detailEmail}>{detailMember?.email}</Text>
                </View>
              </View>

              <View style={styles.detailActionRow}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => Alert.alert('WhatsApp', `Sending reminder message to ${detailMember?.name}`)}
                  activeOpacity={0.85}
                >
                  <Image source={whatsappIconImg} style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#FFFFFF' }} resizeMode="contain" />
                  <Text style={styles.quickActionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#6C5CE7' }]}
                  onPress={() => Alert.alert('Calling...', `Dialing ${detailMember?.phone}`)}
                  activeOpacity={0.85}
                >
                  <AppIcon name="user" size={moderateScale(16)} color="#FFFFFF" />
                  <Text style={styles.quickActionBtnText}>Call</Text>
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
  addMemberHeaderBtn: {
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
  addMemberHeaderText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    marginHorizontal: wp(5),
    height: moderateScale(44),
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.2),
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
  },

  filterScroll: {
    maxHeight: moderateScale(42),
    marginBottom: hp(1.5),
  },
  filterPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
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
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  memberAvatar: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  memberAvatarText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  memberName: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  memberPlanSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  statusBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(4),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
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

  // Detail Modal
  detailProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
    marginBottom: hp(2),
  },
  detailAvatar: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  detailAvatarText: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  detailName: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  detailPhone: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
  },
  detailEmail: {
    fontSize: fontScale(11.5),
    color: '#94A3B8',
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
  },
  quickActionBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
