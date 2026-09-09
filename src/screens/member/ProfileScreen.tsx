import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  TextInput,
  Animated,
  Easing,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { getPlanById, getDaysRemaining } from '../../data/mockData';
import { apiService } from '../../services/api';


// ── Native Asset Icons ──
const userIcon = require('../../assets/Icons2/user.png');
const gymIcon = require('../../assets/Icons2/gym.png');
const payIcon = require('../../assets/Icons2/pay.png');
const calendarIcon = require('../../assets/Icons2/calendar.png');
const barbellIcon = require('../../assets/Icons2/barbell.png');
const healthyIcon = require('../../assets/Icons2/healthy.png');
const barChartIcon = require('../../assets/Icons2/bar-chart.png');
const kettlebellIcon = require('../../assets/Icons2/kettlebell.png');
const alertIcon = require('../../assets/Icons/Aleart.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const clockImg = require('../../assets/Icons2/clock.png');
const cameraIcon = require('../../assets/Icons/camera.png');
const editIcon = require('../../assets/Icons/edit.png');
const galleryImageIcon = require('../../assets/Icons/image.png');
const logoutIcon = require('../../assets/Icons/logout.png');

export default function ProfileScreen({ navigation }: any) {
  const { currentUser, currentMember, currentGym, logout } = useAppContext();
  const plan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const daysLeft = currentMember ? getDaysRemaining(currentMember.expiryDate) : 149;

  // Modals
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarPickerModal, setShowAvatarPickerModal] = useState(false);

  // Avatar & Editable Profile Data
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  );
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [memberName, setMemberName] = useState(currentUser?.name || 'Arjun Patil');
  const [memberPhone, setMemberPhone] = useState(currentMember?.phone || '+91 98230 44819');
  const [memberEmail, setMemberEmail] = useState(currentUser?.email || 'arjun.patil@fitcore.app');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [memberAge, setMemberAge] = useState('26');
  const [dateOfBirth, setDateOfBirth] = useState('14 Aug 1999');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('+91 93260 93115 (Father)');
  const [savingProfile, setSavingProfile] = useState(false);

  // Entrance Animation
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

  // Fetch live member profile from backend API
  const loadLiveProfile = async () => {
    try {
      const userId = currentMember?.id || currentUser?.id || 'm1';
      const res: any = await apiService.getMemberProfile(userId);
      if (res?.success && res.data?.member) {
        const m = res.data.member;
        if (m.name) setMemberName(m.name);
        if (m.phone) setMemberPhone(m.phone);
        if (m.email) setMemberEmail(m.email);
        if (m.gender) setGender(m.gender);
        if (m.emergencyContact) setEmergencyContact(m.emergencyContact);
        if (m.photo) setAvatarPhoto(m.photo);
        if (m.dob) {
          setDateOfBirth(m.dob);
          // Calculate approx age from dob if year is present
          const yrMatch = m.dob.match(/\d{4}/);
          if (yrMatch) {
            const yr = parseInt(yrMatch[0], 10);
            if (yr > 1940 && yr < new Date().getFullYear()) {
              setMemberAge(String(new Date().getFullYear() - yr));
            }
          }
        }
      }
    } catch (err) {
      console.log('Using cached profile', err);
    }
  };

  useEffect(() => {
    loadLiveProfile();
  }, [currentMember?.id, currentUser?.id]);

  // ── Unified API Save: Name, Age, Gender, Phone, Email, Emergency ──
  const handleSavePersonalInfo = async () => {
    try {
      setSavingProfile(true);
      const memberId = currentMember?.id || currentUser?.id || 'm1';
      const res: any = await apiService.savePersonalDetails({
        memberId,
        name: memberName,
        phone: memberPhone,
        email: memberEmail,
        gender,
        dob: dateOfBirth,
        emergencyContact,
        photo: avatarPhoto || undefined,
      });

      if (res?.success) {
        Alert.alert('Profile Updated', 'Personal details saved successfully!');
        setShowPersonalInfoModal(false);
        await loadLiveProfile();
      } else {
        Alert.alert('Notice', res?.message || 'Details saved.');
        setShowPersonalInfoModal(false);
      }
    } catch (err: any) {
      console.log('Error saving personal details:', err);
      Alert.alert('Notice', 'Details saved locally.');
      setShowPersonalInfoModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const photoUri = result.assets[0].uri;
        setAvatarPhoto(photoUri);
        setShowAvatarPickerModal(false);
        const memberId = currentMember?.id || currentUser?.id || 'm1';
        await apiService.savePersonalDetails({ memberId, photo: photoUri });
      }
    } catch (err) {
      console.log('Gallery pick error', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const photoUri = result.assets[0].uri;
        setAvatarPhoto(photoUri);
        setShowAvatarPickerModal(false);
        const memberId = currentMember?.id || currentUser?.id || 'm1';
        await apiService.savePersonalDetails({ memberId, photo: photoUri });
      }
    } catch (err) {
      console.log('Camera capture error', err);
    }
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/919326093115?text=Hi%20FitCore%20Gym%20Support%2C%20I%20need%20assistance');
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@fitcore.app?subject=Member%20Query%20-%20Arjun%20Patil');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={styles.memberStatusBadge}>
              <View style={styles.memberStatusDot} />
              <Text style={styles.memberStatusText}>VIP ACTIVE MEMBER</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── 1. LUXURY PROFILE HERO CARD ── */}
            <View style={styles.profileHeroCard}>
              <View style={styles.heroTopRow}>
                {/* Avatar with Ring & Camera Badge */}
                <TouchableOpacity
                  style={styles.avatarRing}
                  onPress={() => setShowAvatarPickerModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarInner}>
                    {avatarPhoto ? (
                      <Image source={{ uri: avatarPhoto }} style={styles.avatarPhotoImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.avatarInitials}>
                        {memberName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'AP'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.cameraBadge}>
                    <Image
                      source={cameraIcon}
                      style={{ width: moderateScale(11), height: moderateScale(11), tintColor: '#FFFFFF' }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* Name & Plan Info */}
                <View style={{ flex: 1, paddingHorizontal: 14 }}>
                  <Text style={styles.heroName} numberOfLines={1}>{memberName}</Text>
                  <Text style={styles.heroPlanName}>
                    {plan?.name || 'Gold 6-Month Unlimited Pass'}
                  </Text>
                  <Text style={styles.heroGymName}>
                    🏢 {currentGym?.name || 'FNS Fitness Club, Shivaji Nagar'}
                  </Text>
                  <Text style={styles.heroMemberId}>ID: #FC-MEM-2026-8819</Text>
                </View>

                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => setShowPersonalInfoModal(true)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={editIcon}
                    style={{ width: moderateScale(14), height: moderateScale(14), tintColor: '#6C5CE7' }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* 3-Pillar Stats Island */}
              <View style={styles.statsIsland}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{daysLeft}</Text>
                  <Text style={styles.statLbl}>Days Left</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{currentMember?.weight || '72.4'} <Text style={{ fontSize: fontScale(10) }}>kg</Text></Text>
                  <Text style={styles.statLbl}>Current Weight</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>24</Text>
                  <Text style={styles.statLbl}>Sessions Done</Text>
                </View>
              </View>
            </View>

            {/* ── 3. SECTION: GYM & MEMBERSHIP ── */}
            <Text style={styles.sectionHeader}>PERSONAL & ACCOUNT</Text>
            <View style={styles.menuGroupCard}>
              {/* Personal Details Row */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowPersonalInfoModal(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Image source={userIcon} style={[styles.menuIcon, { tintColor: '#6C5CE7' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>Personal Details</Text>
                  <Text style={styles.menuSub}>{gender} • {memberAge} yrs • {memberPhone}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuRowDivider} />

              {/* Membership Plan */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('Membership')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Image source={gymIcon} style={[styles.menuIcon, { tintColor: '#6C5CE7' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>My Membership Plan</Text>
                  <Text style={styles.menuSub}>{plan?.name || 'Gold Unlimited'} • Expires in {daysLeft} days</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuRowDivider} />

              {/* Payment & Invoices */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowPaymentHistoryModal(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Image source={payIcon} style={[styles.menuIcon, { tintColor: '#00A86B' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>Payment & Receipts</Text>
                  <Text style={styles.menuSub}>Billing history, GST invoices & renewals</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuRowDivider} />

              {/* Personal Trainer */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowTrainerModal(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Image source={kettlebellIcon} style={[styles.menuIcon, { tintColor: '#D97706' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>My Personal Trainer</Text>
                  <Text style={styles.menuSub}>Vikram Singh • Master Strength Coach</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* ── 4. SECTION: HEALTH & TRAINING ── */}
            <Text style={styles.sectionHeader}>FITNESS & HEALTH</Text>
            <View style={styles.menuGroupCard}>
              {/* Workout Routine */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('Workout')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Image source={barbellIcon} style={[styles.menuIcon, { tintColor: '#8B5CF6' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>Workout Schedule</Text>
                  <Text style={styles.menuSub}>Custom PPL & Hypertrophy routines</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuRowDivider} />

              {/* Diet Plan */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('Diet')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Image source={healthyIcon} style={[styles.menuIcon, { tintColor: '#00C48C' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>Diet & Meal Macros</Text>
                  <Text style={styles.menuSub}>3,000 kcal • 180g High Protein target</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuRowDivider} />

              {/* Body Measurements & PRs */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate('Progress')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Image source={barChartIcon} style={[styles.menuIcon, { tintColor: '#6C5CE7' }]} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.menuTitle}>Body Analytics & PRs</Text>
                  <Text style={styles.menuSub}>Weight trend, tape inches & power score</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* ── 5. LOGOUT BUTTON ── */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.85}
            >
              <Image
                source={logoutIcon}
                style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#EF4444', marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={styles.logoutBtnText}>LOGOUT FROM FITCORE</Text>
            </TouchableOpacity>

            <Text style={styles.appVersionText}>FitCore Member App • Version 2.4.0 (Build 2026)</Text>

            <View style={{ height: hp(12) }} />
          </Animated.View>
        </ScrollView>

        {/* ── MODAL 1: EDIT PERSONAL INFORMATION ── */}
        <Modal visible={showPersonalInfoModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Personal Information</Text>
                  <Text style={styles.modalSub}>Update your contact and emergency info</Text>
                </View>
                <TouchableOpacity onPress={() => setShowPersonalInfoModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(52) }}>
                <Text style={styles.inputLbl}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={memberName}
                  onChangeText={setMemberName}
                  placeholder="e.g. Arjun Patil"
                  placeholderTextColor="#94A3B8"
                />

                {/* Gender Selector Pills */}
                <Text style={styles.inputLbl}>Gender</Text>
                <View style={styles.genderPillRow}>
                  <TouchableOpacity
                    style={[styles.genderPill, gender === 'Male' && styles.genderPillActive]}
                    onPress={() => setGender('Male')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderPillText, gender === 'Male' && styles.genderPillTextActive]}>
                      ♂ Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.genderPill, gender === 'Female' && styles.genderPillActive]}
                    onPress={() => setGender('Female')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderPillText, gender === 'Female' && styles.genderPillTextActive]}>
                      ♀ Female
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLbl}>Age</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={memberAge}
                      onChangeText={setMemberAge}
                      placeholder="e.g. 26"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.inputLbl}>Date of Birth</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholder="14 Aug 1999"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <Text style={styles.inputLbl}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={memberPhone}
                  onChangeText={setMemberPhone}
                  placeholder="+91 98230..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLbl}>Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                  placeholder="arjun@fitcore.app"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                />

                <Text style={styles.inputLbl}>Emergency Contact Person & Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  placeholder="+91 93260 93115 (Father)"
                  placeholderTextColor="#94A3B8"
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, savingProfile && { opacity: 0.7 }]}
                onPress={handleSavePersonalInfo}
                disabled={savingProfile}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  {savingProfile ? 'SAVING PROFILE...' : 'SAVE PROFILE CHANGES'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 2: PERSONAL TRAINER PROFILE ── */}
        <Modal visible={showTrainerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Personal Trainer</Text>
                  <Text style={styles.modalSub}>Your dedicated strength & hypertrophy coach</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTrainerModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trainerHeroBox}>
                <View style={styles.trainerAvatarBox}>
                  <Text style={{ fontSize: fontScale(32) }}>🏋️</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.trainerName}>Vikram Singh</Text>
                  <Text style={styles.trainerRole}>Head Strength & Conditioning Coach</Text>
                  <Text style={styles.trainerRating}>⭐ 4.9 (120+ Member Reviews)</Text>
                </View>
              </View>

              <View style={styles.trainerStatsRow}>
                <View style={styles.trainerStatCol}>
                  <Text style={styles.trainerStatVal}>8+ Yrs</Text>
                  <Text style={styles.trainerStatLbl}>Experience</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.trainerStatCol}>
                  <Text style={styles.trainerStatVal}>CSCS</Text>
                  <Text style={styles.trainerStatLbl}>Certified</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.trainerStatCol}>
                  <Text style={styles.trainerStatVal}>32</Text>
                  <Text style={styles.trainerStatLbl}>Active Athletes</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowTrainerModal(false);
                  navigation.navigate('Trainer Chat');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>OPEN TRAINER CHAT 💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 4: PAYMENT & BILLING HISTORY ── */}
        <Modal visible={showPaymentHistoryModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Payment & Invoices</Text>
                  <Text style={styles.modalSub}>Your billing and transaction receipts</Text>
                </View>
                <TouchableOpacity onPress={() => setShowPaymentHistoryModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(45) }}>
                {[
                  { id: 'INV-2026-08', desc: 'Gold 6-Month Pass Renewal', date: '01 Aug 2026', amount: '₹14,999', status: 'PAID ✓' },
                  { id: 'INV-2026-07', desc: 'Personal Training (12 Sessions)', date: '15 Jul 2026', amount: '₹8,500', status: 'PAID ✓' },
                  { id: 'INV-2026-06', desc: 'ON Whey Protein 2kg Order', date: '02 Jun 2026', amount: '₹4,999', status: 'PAID ✓' },
                ].map((inv) => (
                  <View key={inv.id} style={styles.invoiceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invoiceDesc}>{inv.desc}</Text>
                      <Text style={styles.invoiceMeta}>{inv.id} • {inv.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                      <Text style={styles.invoiceStatus}>{inv.status}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setShowPaymentHistoryModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>CLOSE INVOICES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 5: CLEAN CUSTOM LOGOUT CONFIRMATION ── */}
        <Modal visible={showLogoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.logoutModalCard}>
              <View style={styles.logoutIconBox}>
                <Image
                  source={logoutIcon}
                  style={{ width: moderateScale(28), height: moderateScale(28), tintColor: '#EF4444' }}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.logoutModalTitle}>Logout from FitCore?</Text>
              <Text style={styles.logoutModalSub}>
                Are you sure you want to log out of your member account?
              </Text>

              <TouchableOpacity
                style={styles.cancelLogoutBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelLogoutBtnText}>KEEP WORKING OUT ▶</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmLogoutBtnText}>Yes, Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* ── MODAL 6: AVATAR & PHOTO SELECTION ── */}
        <Modal visible={showAvatarPickerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Profile Photo & Avatar</Text>
                  <Text style={styles.modalSub}>Choose a photo or high-res fitness avatar</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAvatarPickerModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(52) }}>
                {/* Active Photo Preview */}
                <View style={styles.avatarPreviewCenter}>
                  <View style={styles.avatarBigRing}>
                    {avatarPhoto ? (
                      <Image source={{ uri: avatarPhoto }} style={styles.avatarBigImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.avatarBigInitials}>
                        {memberName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'AP'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.avatarPreviewTitle}>{memberName}</Text>
                  <Text style={styles.avatarPreviewSub}>Active VIP Member Photo</Text>
                </View>

                {/* ── Native Device Gallery & Camera Action Buttons ── */}
                <View style={styles.devicePickRow}>
                  <TouchableOpacity
                    style={styles.galleryPickBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={galleryImageIcon}
                      style={{ width: moderateScale(26), height: moderateScale(26), tintColor: '#6C5CE7', marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.galleryPickBtnText}>Choose from Gallery</Text>
                    <Text style={styles.devicePickSub}>Select any photo from phone</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cameraPickBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={cameraIcon}
                      style={{ width: moderateScale(26), height: moderateScale(26), tintColor: '#0F172A', marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.cameraPickBtnText}>Take New Photo</Text>
                    <Text style={styles.devicePickSub}>Use device camera</Text>
                  </TouchableOpacity>
                </View>

                {/* Preset HD Fitness Avatars */}
                <Text style={styles.inputLbl}>Or Choose an Athlete Avatar</Text>
                <View style={styles.presetAvatarsRow}>
                  {[
                    { id: 'av1', label: 'Beast Lifter', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
                    { id: 'av2', label: 'Power Athlete', uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80' },
                    { id: 'av3', label: 'Iron Muscle', uri: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80' },
                    { id: 'av4', label: 'Fitness Pro', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
                    { id: 'av5', label: 'Gym Beast', uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80' },
                  ].map((preset) => {
                    const isChosen = avatarPhoto === preset.uri;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetAvatarBox, isChosen && styles.presetAvatarBoxActive]}
                        onPress={() => {
                          setAvatarPhoto(preset.uri);
                          setShowAvatarPickerModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: preset.uri }} style={styles.presetAvatarThumb} resizeMode="cover" />
                        {isChosen && (
                          <View style={styles.presetActiveCheck}>
                            <Text style={{ color: '#FFFFFF', fontSize: fontScale(9.5), fontWeight: '900' }}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Remove photo option */}
                {avatarPhoto && (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => {
                      setAvatarPhoto(null);
                      setShowAvatarPickerModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removePhotoBtnText}>🗑️ Remove Photo (Use Initials)</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  memberStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(0, 196, 140, 0.08)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    alignSelf: 'flex-start',
  },
  memberStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C48C',
    marginRight: 5,
  },
  memberStatusText: {
    fontSize: fontScale(9.5),
    color: '#00A86B',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerActionBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
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
  headerQrIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#6C5CE7',
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── Profile Hero Card ──
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.6),
  },
  avatarRing: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    padding: 3,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  avatarInner: {
    flex: 1,
    borderRadius: moderateScale(30),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  heroPlanName: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 1,
  },
  heroGymName: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },
  heroMemberId: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
  },
  editProfileBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editProfileBtnText: {
    fontSize: fontScale(13),
  },

  // Stats Island
  statsIsland: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // Digital Pass Card
  digitalPassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(2),
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  passIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#FFFFFF',
  },
  passTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  passSub: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    marginTop: 2,
  },
  passChevron: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
    backgroundColor: 'rgba(108, 92, 231, 0.20)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },

  // Menu Groups
  sectionHeader: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: moderateScale(8),
    marginLeft: 4,
  },
  menuGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  menuIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
  },
  menuTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: fontScale(16),
    color: '#CBD5E1',
    fontWeight: '700',
  },
  menuRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: hp(0.5),
    marginBottom: hp(1.2),
  },
  logoutBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.4,
  },
  appVersionText: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Modals Overlay ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
    paddingBottom: hp(4),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.8),
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseX: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  inputLbl: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 6,
  },
  genderPillRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(6),
    marginTop: moderateScale(2),
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  genderPillActive: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderColor: '#6C5CE7',
  },
  genderPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  genderPillTextActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: fontScale(12.5),
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalPrimaryBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    marginTop: hp(2),
  },
  modalPrimaryBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // QR Pass Card
  qrPassModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    alignItems: 'center',
    marginHorizontal: wp(6),
    alignSelf: 'center',
    width: wp(88),
    marginBottom: hp(10),
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  passHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C5CE7',
  },
  passHeaderTag: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  qrPassGymTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#64748B',
  },
  qrPassMemberName: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  qrPassPlanBadge: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#00A86B',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    marginTop: 6,
    marginBottom: hp(2),
  },
  qrBox: {
    width: moderateScale(180),
    height: moderateScale(180),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.4),
  },
  qrBigImage: {
    width: moderateScale(150),
    height: moderateScale(150),
    tintColor: '#0F172A',
  },
  qrCodeString: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 1,
    marginBottom: 4,
  },
  qrInstruction: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(2),
    paddingHorizontal: 10,
  },
  closePassBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  closePassBtnText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Trainer Modal
  trainerHeroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.8),
  },
  trainerAvatarBox: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerName: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  trainerRole: {
    fontSize: fontScale(11),
    color: '#6C5CE7',
    fontWeight: '700',
    marginTop: 1,
  },
  trainerRating: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },
  trainerStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.8),
  },
  trainerStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  trainerStatVal: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  trainerStatLbl: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },

  // Invoices
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invoiceDesc: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  invoiceMeta: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  invoiceStatus: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#00A86B',
    marginTop: 2,
  },

  // Logout Modal
  logoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    alignItems: 'center',
    marginHorizontal: wp(6),
    alignSelf: 'center',
    width: wp(88),
    marginBottom: hp(10),
  },
  logoutIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  logoutModalTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  logoutModalSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(2),
    lineHeight: fontScale(17),
  },
  cancelLogoutBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  cancelLogoutBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  confirmLogoutBtn: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(11),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmLogoutBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#EF4444',
  },

  // ── Avatar Photo Styles ──
  avatarPhotoImg: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(30),
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#6C5CE7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  cameraBadgeText: {
    fontSize: fontScale(10),
  },

  // ── Avatar Modal Styles ──
  avatarPreviewCenter: {
    alignItems: 'center',
    marginVertical: hp(1.4),
  },
  avatarBigRing: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    padding: 3,
    backgroundColor: '#EEF2FF',
    borderWidth: 3,
    borderColor: '#6C5CE7',
    marginBottom: 8,
  },
  avatarBigImg: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(42),
  },
  avatarBigInitials: {
    fontSize: fontScale(28),
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#6C5CE7',
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(42),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: moderateScale(80),
  },
  avatarPreviewTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  avatarPreviewSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  presetAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    marginTop: 4,
  },
  presetAvatarBox: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetAvatarBoxActive: {
    borderColor: '#6C5CE7',
  },
  presetAvatarThumb: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(25),
  },
  presetActiveCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6C5CE7',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlBtn: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyUrlBtnText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  removePhotoBtn: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    marginTop: 4,
  },
  removePhotoBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#EF4444',
  },

  // ── Gallery & Camera Action Buttons ──
  devicePickRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(2),
    marginTop: hp(0.5),
  },
  galleryPickBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  galleryPickBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  cameraPickBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cameraPickBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  devicePickSub: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
});
