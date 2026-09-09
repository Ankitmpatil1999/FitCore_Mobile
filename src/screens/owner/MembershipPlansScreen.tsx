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
import { MEMBERSHIP_PLANS, MembershipPlan } from '../../data/mockData';
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

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

export default function MembershipPlansScreen({ navigation }: any) {
  const { currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';

  const [plans, setPlans] = useState<MembershipPlan[]>(() =>
    MEMBERSHIP_PLANS.filter((p) => p.gymId === gymId || !p.gymId || p.gymId === 'gym1')
  );
  const [addModal, setAddModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);

  // Form states
  const [fName, setFName] = useState('');
  const [fDuration, setFDuration] = useState('');
  const [fPrice, setFPrice] = useState('');

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

  const openAdd = () => {
    setEditPlan(null);
    setFName('');
    setFDuration('');
    setFPrice('');
    setAddModal(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fDuration || !fPrice) {
      Alert.alert('Required', 'Name, duration and price are required.');
      return;
    }
    const newP: MembershipPlan = {
      id: editPlan ? editPlan.id : `plan_${Date.now()}`,
      gymId: gymId,
      name: fName.trim(),
      duration: parseInt(fDuration, 10),
      price: parseFloat(fPrice),
      originalPrice: parseFloat(fPrice) * 1.25,
      tier: 'gold',
      features: ['Full gym access', 'Trainer assistance', 'Locker access', 'Diet consultation'],
      isActive: true,
      discount: 20,
    };

    if (editPlan) {
      setPlans((prev) => prev.map((p) => (p.id === editPlan.id ? newP : p)));
    } else {
      setPlans((prev) => [newP, ...prev]);
    }
    setAddModal(false);
    Alert.alert('✓ Saved', 'Membership plan updated successfully!');
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Membership Plans</Text>
            <Text style={styles.headerSub}>{plans.length} Active Gym Packages</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {plans.map((p) => (
            <AnimatedPressable
              key={p.id}
              style={styles.planCard}
              onPress={() => {
                setEditPlan(p);
                setFName(p.name);
                setFDuration(p.duration.toString());
                setFPrice(p.price.toString());
                setAddModal(true);
              }}
            >
              <View style={styles.planHeaderRow}>
                <View>
                  <Text style={styles.planNameText}>{p.name}</Text>
                  <Text style={styles.planDurationText}>{p.duration} Months Validity</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{p.tier.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceVal}>₹{p.price.toLocaleString()}</Text>
                <Text style={styles.originalPrice}>₹{p.originalPrice.toLocaleString()}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{p.discount}% OFF</Text>
                </View>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {p.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Icon name="checkmark-circle" size={moderateScale(15)} color="#00C48C" />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </AnimatedPressable>
          ))}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── PLAN MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editPlan ? 'Edit Plan' : 'New Membership Plan'}</Text>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plan Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="e.g. 6 Month Platinum Pass"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration in Months *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fDuration}
                  onChangeText={setFDuration}
                  placeholder="e.g. 6"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fPrice}
                  onChangeText={setFPrice}
                  placeholder="e.g. 3999"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>SAVE PACKAGE</Text>
              </TouchableOpacity>
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
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  addBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  planNameText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  planDurationText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  tierBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  tierBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: hp(0.8),
  },
  priceVal: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#0F172A',
  },
  originalPrice: {
    fontSize: fontScale(14),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  discountText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#00C48C',
  },

  featuresList: {
    marginTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#F3F2FE',
    paddingTop: hp(1),
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: fontScale(12),
    color: '#64748B',
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
});
