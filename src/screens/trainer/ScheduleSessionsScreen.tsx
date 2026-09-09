import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
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
import {
  getPTBookingsForTrainer,
  getMembersByTrainer,
  addPTBooking,
  PTSession,
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

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const TIME_SLOTS = ['06:00 AM', '08:00 AM', '10:00 AM', '05:00 PM', '06:30 PM', '07:30 PM'];

export default function ScheduleSessionsScreen({ route, navigation }: any) {
  const { currentTrainer } = useAppContext();
  const trainerId = currentTrainer?.id || 't1';
  const assignedClients = getMembersByTrainer(trainerId);

  const [bookings, setBookings] = useState<PTSession[]>(() => getPTBookingsForTrainer(trainerId));
  const [scheduleModal, setScheduleModal] = useState(false);

  // Form states
  const [clientName, setClientName] = useState(assignedClients[0]?.name || 'Arjun Mehta');
  const [selectedTime, setSelectedTime] = useState('06:00 AM');
  const [focus, setFocus] = useState('Legs Day Form Correction');

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

  const handleBookSession = () => {
    const newBooking: PTSession = {
      id: `pt_${Date.now()}`,
      trainerId: trainerId,
      memberId: 'm1',
      memberName: clientName,
      date: new Date().toISOString().split('T')[0],
      time: selectedTime,
      focus: focus,
      status: 'scheduled',
    };
    addPTBooking(newBooking);
    setBookings(getPTBookingsForTrainer(trainerId));
    Alert.alert('✓ Session Booked', `1-on-1 PT Session scheduled with ${clientName} at ${selectedTime}!`);
    setScheduleModal(false);
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
            <Text style={styles.headerTitle}>1-on-1 PT Schedule</Text>
            <Text style={styles.headerSub}>Personal Training Bookings</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setScheduleModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {bookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="calendar-outline" size={moderateScale(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Sessions Scheduled</Text>
              <Text style={styles.emptySub}>Tap the + button to book a personal training slot.</Text>
            </View>
          ) : (
            bookings.map((session) => (
              <AnimatedPressable key={session.id} style={styles.sessionCard}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeVal}>{session.time.split(' ')[0]}</Text>
                  <Text style={styles.timeAmPm}>{session.time.split(' ')[1]}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionClient}>{session.memberName}</Text>
                  <Text style={styles.sessionFocus}>{session.focus}</Text>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>✓ CONFIRMED SLOT</Text>
                  </View>
                </View>
              </AnimatedPressable>
            ))
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── SCHEDULE MODAL ── */}
        <Modal visible={scheduleModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book 1-on-1 PT Slot</Text>
                <TouchableOpacity onPress={() => setScheduleModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Client Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="e.g. Arjun Mehta"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Session Focus</Text>
                <TextInput
                  style={styles.modalInput}
                  value={focus}
                  onChangeText={setFocus}
                  placeholder="e.g. Deadlift Technique"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <Text style={styles.inputLabel}>Select Time Slot</Text>
              <View style={styles.slotGrid}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.slotPill, selectedTime === t && styles.slotPillActive]}
                    onPress={() => setSelectedTime(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.slotPillText, selectedTime === t && styles.slotPillTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleBookSession}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>CONFIRM BOOKING</Text>
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

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.2),
    gap: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  timeBox: {
    backgroundColor: '#F3F2FE',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  timeVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  timeAmPm: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  sessionClient: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionFocus: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    marginBottom: 4,
  },
  confirmedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  confirmedBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#00C48C',
  },

  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  slotPill: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  slotPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  slotPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  slotPillTextActive: {
    color: '#FFFFFF',
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
});
