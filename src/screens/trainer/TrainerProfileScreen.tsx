import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

export default function TrainerProfileScreen({ navigation }: any) {
  const { currentTrainer, currentUser, logout } = useAppContext();
  const [available, setAvailable] = useState(currentTrainer?.available !== false);

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

  const handleToggleAvailable = async (val: boolean) => {
    setAvailable(val);
    if (currentTrainer) {
      currentTrainer.available = val;
    }
    // Persist to backend
    try {
      const trainerId = currentTrainer?.id || currentUser?.id;
      if (trainerId) {
        await apiService.updateOwnerTrainer(trainerId, { available: val });
      }
    } catch (e) {
      console.log('Availability sync error:', e);
    }
    Alert.alert('Status Updated', `Your status has been set to ${val ? 'Available ●' : 'Busy ○'}.`);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from FitCore?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
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
          <Text style={styles.headerTitle}>Coach Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── HERO PROFILE CARD ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{currentTrainer?.avatar ?? 'VS'}</Text>
            </View>

            <Text style={styles.trainerName}>{currentTrainer?.name ?? 'Coach Vikram Singh'}</Text>
            <Text style={styles.trainerSpec}>{currentTrainer?.specialization ?? 'Hypertrophy & Strength Conditioning'}</Text>
            <View style={styles.trainerPhoneRow}>
              <Icon name="call-outline" size={moderateScale(14)} color="#64748B" />
              <Text style={styles.trainerPhone}>{currentTrainer?.phone ?? '8180093401'}</Text>
            </View>

            <View style={styles.availRow}>
              <Text style={styles.availLabel}>Live Availability Status</Text>
              <Switch
                value={available}
                onValueChange={handleToggleAvailable}
                trackColor={{ false: '#ECEAFD', true: '#6C5CE7' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* ── COACH DETAILS CARD ── */}
          <Text style={styles.sectionHeader}>Credentials & Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Certifications</Text>
              <Text style={styles.infoVal}>{currentTrainer?.certifications || 'ISSA / ACE Certified'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoVal}>{currentTrainer?.experience || '5+ Years'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Operating Shift</Text>
              <Text style={styles.infoVal}>{currentTrainer?.timings || '06:00 AM – 02:00 PM'}</Text>
            </View>
          </View>

          {/* ── QUICK LINKS ── */}
          <Text style={styles.sectionHeader}>Coach Tools</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation && navigation.navigate('TrainerAttendance')}
              activeOpacity={0.75}
            >
              <View style={[styles.linkIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="checkmark-done" size={moderateScale(16)} color="#059669" />
              </View>
              <Text style={styles.linkLabel}>My Attendance Record</Text>
              <Icon name="chevron-forward" size={moderateScale(14)} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.linkSeparator} />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation && navigation.navigate('ScheduleSessions')}
              activeOpacity={0.75}
            >
              <View style={[styles.linkIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="calendar-outline" size={moderateScale(16)} color="#D97706" />
              </View>
              <Text style={styles.linkLabel}>Schedule PT Sessions</Text>
              <Icon name="chevron-forward" size={moderateScale(14)} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.linkSeparator} />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation && navigation.navigate('TrainerLeaveRequest')}
              activeOpacity={0.75}
            >
              <View style={[styles.linkIconBg, { backgroundColor: '#FFF1F2' }]}>
                <Icon name="umbrella-outline" size={moderateScale(16)} color="#E11D48" />
              </View>
              <Text style={styles.linkLabel}>Apply for Leave</Text>
              <Icon name="chevron-forward" size={moderateScale(14)} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.linkSeparator} />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation && navigation.navigate('TrainerReviews')}
              activeOpacity={0.75}
            >
              <View style={[styles.linkIconBg, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="star-outline" size={moderateScale(16)} color="#F59E0B" />
              </View>
              <Text style={styles.linkLabel}>Coach Ratings & Reviews</Text>
              <Icon name="chevron-forward" size={moderateScale(14)} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.linkSeparator} />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation && navigation.navigate('UploadVideos')}
              activeOpacity={0.75}
            >
              <View style={[styles.linkIconBg, { backgroundColor: '#EDE9FE' }]}>
                <Icon name="videocam-outline" size={moderateScale(16)} color="#6C5CE7" />
              </View>
              <Text style={styles.linkLabel}>Exercise Video Library</Text>
              <Icon name="chevron-forward" size={moderateScale(14)} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── LOGOUT BUTTON ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Icon name="log-out-outline" size={moderateScale(18)} color="#FF4D6D" />
            <Text style={styles.logoutBtnText}>Logout of Coach Account</Text>
          </TouchableOpacity>

          <View style={{ height: hp(12) }} />
        </ScrollView>
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
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  headerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  avatarBox: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  avatarText: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  trainerName: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  trainerSpec: {
    fontSize: fontScale(12.5),
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 2,
  },
  trainerPhone: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    marginBottom: hp(1.5),
  },
  trainerPhoneRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 2,
    marginBottom: hp(1.5),
  },

  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  availLabel: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },

  sectionHeader: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  infoRow: {
    paddingVertical: moderateScale(10),
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F2FE',
  },
  infoLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginBottom: 2,
  },
  infoVal: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.25)',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: hp(1),
  },
  logoutBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#FF4D6D',
  },

  // Coach Tools link rows
  linkRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  linkIconBg: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  linkLabel: {
    flex: 1,
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#0F172A',
  },
  linkSeparator: {
    height: 1,
    backgroundColor: '#F3F2FE',
    marginLeft: moderateScale(46),
  },
});
