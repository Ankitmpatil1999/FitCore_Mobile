import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
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

// ── Asset Icons ──
const qrIconImg = require('../../assets/Icons2/qr.png');
const payIconImg = require('../../assets/Icons2/pay.png');
const whatsappIconImg = require('../../assets/Icons2/whatsapp.png');

import {
  ANALYTICS,
  MEMBERS,
  NOTIFICATIONS,
  ATTENDANCE,
  getNotificationsForOwner,
  Member,
  AttendanceRecord,
} from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

export default function OwnerDashboard({ navigation }: any) {
  const { currentUser, currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';
  const analytics = ANALYTICS[gymId as keyof typeof ANALYTICS] || ANALYTICS['g1'];

  const [addMemberModal, setAddMemberModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);

  // Form states
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');

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

  const notifications = getNotificationsForOwner(gymId);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Expiring memberships
  const expiring: Member[] = MEMBERS.filter((m) => {
    const days = Math.ceil(
      (new Date(m.expiryDate).getTime() - Date.now()) / 86400000
    );
    return days >= 0 && days <= 15 && m.status === 'active';
  });

  const handleAddMember = () => {
    if (!mName.trim() || !mPhone.trim()) {
      Alert.alert('Required', 'Name and mobile number are required.');
      return;
    }
    Alert.alert('✓ Member Added', `${mName} has been enrolled successfully!`);
    setMName('');
    setMPhone('');
    setAddMemberModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.gymName}>{currentGym?.name ?? 'Fns Fitness Club'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now • Closes 10:00 PM</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setNotifModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="notifications-outline" size={moderateScale(20)} color="#0F172A" />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {currentUser?.avatar ?? 'RB'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── WELCOME BANNER ── */}
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeGreeting}>
              Good Morning, {currentUser?.name?.split(' ')[0] ?? 'Owner'} 
            </Text>
            <Text style={styles.welcomeSub}>Here is your gym summary for today</Text>
          </View>

          {/* ── 4 OVERVIEW METRICS GRID ── */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Attendance */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Image source={qrIconImg} style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#00C48C' }} resizeMode="contain" />
              </View>
              <Text style={styles.metricValue}>426</Text>
              <Text style={styles.metricLabel}>Attendance Today</Text>
            </View>

            {/* Metric 2: New Leads */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(0, 194, 255, 0.10)' }]}>
                <Icon name="person-add" size={moderateScale(18)} color="#00C2FF" />
              </View>
              <Text style={styles.metricValue}>38</Text>
              <Text style={styles.metricLabel}>New Leads</Text>
            </View>

            {/* Metric 3: Today's Collection */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 153, 0, 0.10)' }]}>
                <Image source={payIconImg} style={{ width: moderateScale(18), height: moderateScale(18), tintColor: '#FF9900' }} resizeMode="contain" />
              </View>
              <Text style={styles.metricValue}>₹38,500</Text>
              <Text style={styles.metricLabel}>Today's Collection</Text>
            </View>

            {/* Metric 4: Expiring Memberships */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBg, { backgroundColor: 'rgba(255, 77, 109, 0.10)' }]}>
                <Icon name="time" size={moderateScale(18)} color="#FF4D6D" />
              </View>
              <Text style={styles.metricValue}>46</Text>
              <Text style={styles.metricLabel}>Expiring Soon</Text>
            </View>
          </View>

          {/* ── TURNOUT BREAKDOWN ── */}
          <View style={styles.card}>
            <View style={styles.turnoutHeader}>
              <Text style={styles.cardTitle}>Today's Turnout Ratio</Text>
              <Text style={styles.turnoutPercentText}>83.5%</Text>
            </View>

            <View style={styles.turnoutTrack}>
              <View style={[styles.turnoutFill, { width: '83.5%' }]} />
            </View>

            <View style={styles.turnoutLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6C5CE7' }]} />
                <Text style={styles.legendText}>Present: 426</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                <Text style={styles.legendText}>Absent: 84</Text>
              </View>
            </View>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionTitle}>Quick Management Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setAddMemberModal(true)}
              activeOpacity={0.8}
            >
              <Icon name="person-add-outline" size={moderateScale(18)} color="#6C5CE7" />
              <Text style={styles.actionBtnText}>+ Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.8}
            >
              <Icon name="cash-outline" size={moderateScale(18)} color="#00C48C" />
              <Text style={styles.actionBtnText}>+ Collect Fee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Trainers')}
              activeOpacity={0.8}
            >
              <Icon name="people-outline" size={moderateScale(18)} color="#FF9900" />
              <Text style={styles.actionBtnText}>+ Add Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Plans')}
              activeOpacity={0.8}
            >
              <Icon name="pricetags-outline" size={moderateScale(18)} color="#00C2FF" />
              <Text style={styles.actionBtnText}>+ Create Plan</Text>
            </TouchableOpacity>
          </View>

          {/* ── EXPIRING MEMBERSHIPS FOLLOW-UP ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Expiring Memberships</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')}>
              <Text style={styles.cardActionLink}>See All (46)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.expiringList}>
            {expiring.slice(0, 3).map((m) => (
              <View key={m.id} style={styles.expiringItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{m.avatar}</Text>
                </View>
                <View style={styles.memberInfoCol}>
                  <Text style={styles.memberNameText}>{m.name}</Text>
                  <Text style={styles.memberExpiryText}>Expires: {m.expiryDate}</Text>
                </View>
                <View style={styles.memberActionBtns}>
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => Alert.alert('WhatsApp Reminder', `Renewal reminder sent to ${m.phone}!`)}
                  >
                    <Image source={whatsappIconImg} style={{ width: moderateScale(16), height: moderateScale(16) }} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Alert.alert('Calling...', `Dialing ${m.phone}`)}
                  >
                    <Icon name="call" size={moderateScale(14)} color="#6C5CE7" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD MEMBER MODAL ── */}
        <Modal visible={addMemberModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quick Member Enrollment</Text>
                <TouchableOpacity onPress={() => setAddMemberModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={mName}
                  onChangeText={setMName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={mPhone}
                  onChangeText={setMPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.submitMemberBtn}
                onPress={handleAddMember}
                activeOpacity={0.85}
              >
                <Text style={styles.submitMemberBtnText}>ENROLL MEMBER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  gymName: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C48C',
  },
  openText: {
    fontSize: fontScale(11),
    color: '#00C48C',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  headerBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  avatarBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  avatarText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  welcomeRow: {
    marginBottom: hp(1.8),
  },
  welcomeGreeting: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  metricCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  metricIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  turnoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  turnoutPercentText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  turnoutTrack: {
    height: 6,
    backgroundColor: '#F3F2FE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  turnoutFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 3,
  },
  turnoutLegendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
  },

  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  cardActionLink: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  actionBtn: {
    width: (wp(90) - moderateScale(10)) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  actionBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#0F172A',
  },

  expiringList: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  expiringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  memberExpiryText: {
    fontSize: fontScale(11),
    color: '#FF4D6D',
    marginTop: 2,
  },
  memberActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(22),
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(44),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  submitMemberBtn: {
    backgroundColor: '#1A66FF',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#1A66FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitMemberBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
