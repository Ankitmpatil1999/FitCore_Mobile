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
  Switch,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/common/AppIcon';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { TRAINERS, MEMBERS, Trainer } from '../../data/mockData';
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

export default function TrainersScreen() {
  const { currentGym } = useAppContext();
  const gymId = currentGym?.id || 'g1';

  const [trainers, setTrainers] = useState<Trainer[]>(() =>
    TRAINERS.filter((t) => t.gymId === gymId || !t.gymId || t.gymId === 'gym1')
  );
  const [addModal, setAddModal] = useState(false);
  const [detailTrainer, setDetailTrainer] = useState<Trainer | null>(null);

  // Form
  const [fName, setFName] = useState('');
  const [fSpec, setFSpec] = useState('');
  const [fExp, setFExp] = useState('');
  const [fSalary, setFSalary] = useState('');
  const [fTimings, setFTimings] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAvail, setFAvail] = useState(true);

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

  const resetForm = () => {
    setFName('');
    setFSpec('');
    setFExp('');
    setFSalary('');
    setFTimings('');
    setFPhone('');
    setFAvail(true);
  };

  const handleAdd = () => {
    if (!fName.trim() || !fSpec.trim()) {
      Alert.alert('Required', 'Name and specialization are required.');
      return;
    }
    const newTrainer: Trainer = {
      id: `t${Date.now()}`,
      gymId: gymId,
      name: fName.trim(),
      avatar: fName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
      specialization: fSpec.trim(),
      experience: fExp.trim() || '3+ years',
      salary: fSalary.trim() || '35,000',
      timings: fTimings.trim() || '06:00 AM – 02:00 PM',
      available: fAvail,
      assignedMemberIds: [],
      certifications: 'ISSA / ACE Certified',
      phone: fPhone.trim() || '9876543210',
      joinDate: new Date().toISOString().split('T')[0],
    };
    setTrainers((prev) => [...prev, newTrainer]);
    Alert.alert('✓ Added', `${fName} has been added as coach!`);
    setAddModal(false);
    resetForm();
  };

  const toggleAvail = (trainer: Trainer) => {
    const updated = trainers.map((t) => (t.id === trainer.id ? { ...t, available: !t.available } : t));
    setTrainers(updated);
    if (detailTrainer && detailTrainer.id === trainer.id) {
      setDetailTrainer((prev) => (prev ? { ...prev, available: !prev.available } : null));
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
            <Text style={styles.headerTitle}>Trainers & Coaches</Text>
            <Text style={styles.headerSub}>
              {trainers.filter((t) => t.available).length} Active • {trainers.length} Total
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="person-add" size={moderateScale(16)} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ Add Coach</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {trainers.map((trainer) => {
            const assignedCount = MEMBERS.filter((m) => trainer.assignedMemberIds.includes(m.id)).length || 14;

            return (
              <AnimatedPressable
                key={trainer.id}
                style={styles.trainerCard}
                onPress={() => setDetailTrainer(trainer)}
              >
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                  {trainer.available && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.trainerInfoCol}>
                  <View style={styles.trainerTopRow}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <View
                      style={[
                        styles.availBadge,
                        { backgroundColor: trainer.available ? 'rgba(0, 196, 140, 0.10)' : 'rgba(148, 163, 184, 0.15)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.availBadgeText,
                          { color: trainer.available ? '#00C48C' : '#64748B' },
                        ]}
                      >
                        {trainer.available ? 'Available' : 'On Leave'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.trainerSpec}>{trainer.specialization}</Text>

                  <View style={styles.trainerMetaRow}>
                    <Text style={styles.trainerMetaText}>⭐ 4.9 Rating</Text>
                    <Text style={styles.trainerMetaDivider}>•</Text>
                    <Text style={styles.trainerMetaText}>🏋️ {assignedCount} Clients</Text>
                    <Text style={styles.trainerMetaDivider}>•</Text>
                    <Text style={styles.trainerMetaText}>⏳ {trainer.experience}</Text>
                  </View>
                </View>

                <AppIcon name="chevron-forward" size={moderateScale(18)} color="#94A3B8" />
              </AnimatedPressable>
            );
          })}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD TRAINER MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Coach</Text>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                  <AppIcon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coach Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="e.g. Vikram Singh"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fSpec}
                  onChangeText={setFSpec}
                  placeholder="e.g. Hypertrophy & Powerlifting"
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
                <Text style={styles.submitBtnText}>CONFIRM TRAINER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── TRAINER DETAIL MODAL ── */}
        <Modal visible={!!detailTrainer} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Coach Profile</Text>
                <TouchableOpacity onPress={() => setDetailTrainer(null)}>
                  <AppIcon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailProfileRow}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{detailTrainer?.avatar ?? 'C'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{detailTrainer?.name}</Text>
                  <Text style={styles.detailSpec}>{detailTrainer?.specialization}</Text>
                  <Text style={styles.detailPhone}>📞 {detailTrainer?.phone}</Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Availability Status</Text>
                <Switch
                  value={detailTrainer?.available ?? true}
                  onValueChange={() => {
                    if (detailTrainer) toggleAvail(detailTrainer);
                  }}
                  trackColor={{ false: '#ECEAFD', true: '#6C5CE7' }}
                  thumbColor="#FFFFFF"
                />
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
  addBtn: {
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
  addBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.8),
  },

  trainerCard: {
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
  trainerAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  trainerAvatarText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: moderateScale(11),
    height: moderateScale(11),
    borderRadius: moderateScale(5.5),
    backgroundColor: '#00C48C',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  trainerInfoCol: {
    flex: 1,
  },
  trainerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trainerName: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  availBadge: {
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  availBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
  },
  trainerSpec: {
    fontSize: fontScale(11.5),
    color: '#6C5CE7',
    fontWeight: '600',
    marginBottom: 4,
  },
  trainerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trainerMetaText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  trainerMetaDivider: {
    fontSize: fontScale(10.5),
    color: '#CBD5E1',
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
  detailSpec: {
    fontSize: fontScale(12.5),
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 2,
  },
  detailPhone: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F2FE',
  },
  toggleLabel: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
});
