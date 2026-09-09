import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { GYMS, FACILITIES } from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

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

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  color: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function GymProfileScreen({ navigation }: any) {
  const { logout, currentGym } = useAppContext();
  const gym = currentGym || GYMS[0];

  const [gymName, setGymName] = useState(gym.name);
  const [isOpen, setIsOpen] = useState(gym.isOpen);

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

  const menuSections: MenuSection[] = [
    {
      title: 'Gym Management',
      items: [
        { label: 'Membership Packages', icon: 'pricetags-outline', route: 'Plans', color: '#6C5CE7' },
        { label: 'Business Reports & Analytics', icon: 'stats-chart-outline', route: 'Analytics', color: '#00C48C' },
        { label: 'Fitness Store & Products', icon: 'bag-handle-outline', route: 'Shop', color: '#FF9900' },
      ],
    },
    {
      title: 'Settings & Account',
      items: [
        { label: 'Gym Operating Hours', icon: 'time-outline', color: '#38BDF8' },
        { label: 'Staff & Roles Permission', icon: 'shield-outline', color: '#A855F7' },
        { label: 'Help & Technical Support', icon: 'help-circle-outline', color: '#6C5CE7' },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the owner portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
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
          <Text style={styles.headerTitle}>Gym Management</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── GYM PROFILE CARD ── */}
          <View style={styles.profileCard}>
            <View style={styles.gymLogoBox}>
              <Icon name="barbell" size={moderateScale(32)} color="#6C5CE7" />
            </View>

            <Text style={styles.gymTitle}>{gymName}</Text>
            <Text style={styles.gymAddress}>{gym.address || 'FC Road, Pune, MH'}</Text>

            {/* Status Switcher */}
            <View style={styles.statusToggleRow}>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? '#00C48C' : '#FF4D6D' }]} />
                <Text style={styles.statusLabelText}>
                  {isOpen ? 'Gym Open Now' : 'Gym Closed'}
                </Text>
              </View>
              <Switch
                value={isOpen}
                onValueChange={setIsOpen}
                trackColor={{ false: '#ECEAFD', true: '#6C5CE7' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* ── MENU SECTIONS ── */}
          {menuSections.map((sec) => (
            <View key={sec.title} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <View style={styles.menuCard}>
                {sec.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, idx < sec.items.length - 1 && styles.menuItemBorder]}
                    onPress={() => {
                      if (item.route) navigation.navigate(item.route);
                      else Alert.alert(item.label, 'Configuration module is available in next update.');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconBg, { backgroundColor: item.color + '15' }]}>
                      <Icon name={item.icon as any} size={moderateScale(20)} color={item.color} />
                    </View>
                    <Text style={styles.menuLabelText}>{item.label}</Text>
                    <Icon name="chevron-forward" size={moderateScale(18)} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── LOGOUT BUTTON ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Icon name="log-out-outline" size={moderateScale(18)} color="#FF4D6D" />
            <Text style={styles.logoutBtnText}>Logout of Owner Account</Text>
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
  gymLogoBox: {
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
  gymTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  gymAddress: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    marginBottom: hp(1.5),
  },

  statusToggleRow: {
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
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  statusLabelText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },

  sectionContainer: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    gap: moderateScale(12),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2FE',
  },
  menuIconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabelText: {
    flex: 1,
    fontSize: fontScale(13.5),
    fontWeight: '600',
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
});
