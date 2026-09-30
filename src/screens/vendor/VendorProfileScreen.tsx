import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import {
  VendorStore,
} from '../../data/mockData';

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

export default function VendorProfileScreen() {
  const { currentVendor, logout } = useAppContext();
  const vendorId = currentVendor?.id ?? '';

  const [store, setStore] = useState<VendorStore | null>(currentVendor);
  const [freeDelAbove, setFreeDelAbove] = useState(store?.freeDeliveryAbove?.toString() ?? '999');
  const [delCharges, setDelCharges] = useState(store?.deliveryCharges?.toString() ?? '49');
  const [saving, setSaving] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadProfile = async () => {
    if (!vendorId) return;
    try {
      const res = await apiService.getVendorProfile(vendorId);
      const vData: any = (res as any)?.data || res;
      if (vData && typeof vData === 'object') {
        setStore(vData as VendorStore);
        if (vData.freeDeliveryAbove !== undefined) setFreeDelAbove(vData.freeDeliveryAbove.toString());
        if (vData.deliveryCharges !== undefined) setDelCharges(vData.deliveryCharges.toString());
      }
    } catch (e) {
      console.log('Error loading vendor profile:', e);
    }
  };

  useEffect(() => {
    loadProfile();
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
  }, [vendorId]);

  const handleSaveSettings = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      await apiService.updateVendorProfile(vendorId, {
        freeDeliveryAbove: Number(freeDelAbove) || 0,
        deliveryCharges: Number(delCharges) || 0,
      });
      Alert.alert('Success', 'Store delivery settings updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout of the vendor store account?', [
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
          <Text style={styles.headerTitle}>Vendor Store Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── STORE PROFILE CARD ── */}
          <View style={styles.profileCard}>
            <View style={styles.storeLogoBox}>
              <Icon name="storefront" size={moderateScale(32)} color="#6C5CE7" />
            </View>

            <Text style={styles.storeTitle}>{store?.storeName || 'FitCore Official Partner Store'}</Text>
            <Text style={styles.ownerText}>Owner: {store?.ownerName || 'Store Manager'}</Text>
            <Text style={styles.gstText}>GSTIN: {store?.gstNumber || 'Active Enterprise'}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ GST Verified</Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: '#F3F2FE' }]}>
                <Text style={[styles.verifiedBadgeText, { color: '#6C5CE7' }]}>4.9 Rating</Text>
              </View>
            </View>
          </View>

          {/* ── SETTLEMENT BANK DETAILS ── */}
          <Text style={styles.sectionHeader}>Bank Settlement Account</Text>
          <View style={styles.menuCard}>
            <View style={styles.bankRow}>
              <View style={styles.bankIconBox}>
                <Icon name="business" size={moderateScale(20)} color="#6C5CE7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>Verified Settlement Account</Text>
                <Text style={styles.bankDetails}>A/C: •••• {typeof store?.bankAccount === 'string' ? store.bankAccount.slice(-4) : '8492'} • IFSC: {store?.ifsc || 'HDFC0001824'}</Text>
                <Text style={styles.upiDetails}>UPI ID: {store?.upiId || 'store@upi'}</Text>
              </View>
            </View>
          </View>

          {/* ── SHIPPING SETTINGS ── */}
          <Text style={styles.sectionHeader}>Shipping & Delivery Thresholds</Text>
          <View style={styles.menuCard}>
            <View style={styles.inputItem}>
              <Text style={styles.inputItemLabel}>Free Delivery Above (₹)</Text>
              <TextInput
                style={styles.fieldInput}
                value={freeDelAbove}
                onChangeText={setFreeDelAbove}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputItem, { borderTopWidth: 1, borderTopColor: '#F3F2FE' }]}>
              <Text style={styles.inputItemLabel}>Standard Delivery Fee (₹)</Text>
              <TextInput
                style={styles.fieldInput}
                value={delCharges}
                onChangeText={setDelCharges}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSaveSettings}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving Settings...' : 'Save Delivery Settings'}</Text>
          </TouchableOpacity>

          {/* ── LOGOUT BUTTON ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Icon name="log-out-outline" size={moderateScale(18)} color="#FF4D6D" />
            <Text style={styles.logoutBtnText}>Logout of Vendor Store</Text>
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
  storeLogoBox: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  storeEmoji: {
    fontSize: fontScale(32),
  },
  storeTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  ownerText: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginTop: 2,
  },
  gstText: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: hp(1.5),
  },

  badgeRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  verifiedBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#00C48C',
  },

  sectionHeader: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1),
  },

  menuCard: {
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
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  bankIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  bankDetails: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  upiDetails: {
    fontSize: fontScale(11),
    color: '#6C5CE7',
    marginTop: 2,
    fontWeight: '600',
  },

  inputItem: {
    paddingVertical: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputItemLabel: {
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(38),
    fontSize: fontScale(13),
    color: '#0F172A',
    width: moderateScale(100),
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    marginBottom: hp(1),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
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
