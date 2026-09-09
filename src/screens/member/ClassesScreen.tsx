import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

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

interface GymClass {
  id: string;
  name: string;
  category: 'yoga' | 'hiit' | 'spin' | 'zumba' | 'strength';
  time: string;
  duration: string;
  trainer: string;
  capacity: number;
  booked: number;
  calories: string;
  intensity: 'Medium' | 'High' | 'Extreme';
  icon: string;
}

const CLASSES_DATA: GymClass[] = [
  {
    id: 'c1',
    name: 'Power Yoga & Core Alignment',
    category: 'yoga',
    time: '07:00 AM – 08:00 AM',
    duration: '60 min',
    trainer: 'Ananya Joshi',
    capacity: 25,
    booked: 18,
    calories: '320 kcal',
    intensity: 'Medium',
    icon: 'body-outline',
  },
  {
    id: 'c2',
    name: 'CrossFit WOD & Metabolic Burn',
    category: 'hiit',
    time: '08:30 AM – 09:30 AM',
    duration: '60 min',
    trainer: 'Vikram Rajput',
    capacity: 20,
    booked: 19,
    calories: '580 kcal',
    intensity: 'Extreme',
    icon: 'flame-outline',
  },
  {
    id: 'c3',
    name: 'Endurance Spin Cycle Sprint',
    category: 'spin',
    time: '06:00 PM – 06:45 PM',
    duration: '45 min',
    trainer: 'Rahul Sharma',
    capacity: 30,
    booked: 12,
    calories: '450 kcal',
    intensity: 'High',
    icon: 'bicycle-outline',
  },
  {
    id: 'c4',
    name: 'Zumba Fitness Cardio Party',
    category: 'zumba',
    time: '07:00 PM – 08:00 PM',
    duration: '60 min',
    trainer: 'Sneha Patel',
    capacity: 35,
    booked: 32,
    calories: '400 kcal',
    intensity: 'Medium',
    icon: 'musical-notes-outline',
  },
  {
    id: 'c5',
    name: 'Hypertrophy Strength Circuit',
    category: 'strength',
    time: '08:00 PM – 09:00 PM',
    duration: '60 min',
    trainer: 'Karan Mehra',
    capacity: 15,
    booked: 15,
    calories: '480 kcal',
    intensity: 'High',
    icon: 'barbell-outline',
  },
];

// Helper to generate real dynamic 7 days
function getDynamicWeekDays() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: i === 0 ? 'Today' : dayNames[d.getDay()],
      day: dayNames[d.getDay()],
      date: d.getDate().toString(),
      fullDate: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    });
  }
  return days;
}

export default function ClassesScreen({ navigation }: any) {
  const { currentMember, currentUser, currentGym } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState(0);
  const [bookedClass, setBookedClass] = useState<GymClass | null>(null);
  const [liveClasses, setLiveClasses] = useState<any[]>(CLASSES_DATA);
  const [loading, setLoading] = useState(false);
  const weekDays = useRef(getDynamicWeekDays()).current;

  // ── Fetch Live Classes ──
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const gymId = currentGym?.id;
      const memberId = currentMember?.id || currentUser?.id;
      const res = await apiService.getClasses(gymId, memberId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setLiveClasses(res.data);
      }
    } catch (e) {
      console.log('Using default classes list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [currentGym?.id, currentMember?.id]);

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

  const handleBookSlot = async (gymClass: any) => {
    setBookedClass(gymClass);
    try {
      const memberId = currentMember?.id || currentUser?.id;
      const gymId = currentGym?.id || gymClass.gymId;
      if (memberId && gymClass.id && !gymClass.id.startsWith('c')) {
        await apiService.bookClass(gymClass.id, memberId, gymId);
        fetchClasses();
      }
    } catch (err) {
      console.log('Class booking local fallback');
    }
  };

  const categories = [
    { id: 'all', label: '⚡ All Classes' },
    { id: 'yoga', label: '🧘 Yoga & Core' },
    { id: 'hiit', label: '🔥 CrossFit / HIIT' },
    { id: 'spin', label: '🚴 Spin Cycle' },
    { id: 'zumba', label: '💃 Zumba' },
    { id: 'strength', label: '💪 Strength' },
  ];

  const filteredClasses = selectedCategory === 'all'
    ? liveClasses
    : liveClasses.filter((c: any) => c.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
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
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Group Classes</Text>
            <Text style={styles.headerSub}>Book & Reserve Your Slot</Text>
          </View>
          <View style={{ width: moderateScale(38) }} />
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ── WEEK DAYS SELECTOR ── */}
          <View style={{ marginBottom: hp(1.2) }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
            >
              {weekDays.map((d, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayCard, selectedDay === idx && styles.dayCardActive]}
                  onPress={() => setSelectedDay(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayLabel, selectedDay === idx && styles.dayLabelActive]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.dayDate, selectedDay === idx && styles.dayDateActive]}>
                    {d.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── CATEGORY PILLS ── */}
          <View style={{ marginBottom: hp(1.2) }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    selectedCategory === cat.id && styles.catPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedCategory === cat.id && styles.catPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── CLASSES LIST ── */}
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {filteredClasses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="calendar-outline" size={moderateScale(48)} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Classes Available</Text>
                <Text style={styles.emptySub}>Try selecting a different category or day.</Text>
              </View>
            ) : (
              filteredClasses.map((item) => {
                const seatsLeft = item.capacity - item.booked;
                const isFull = seatsLeft === 0;

                const intensityColor =
                  item.intensity === 'Extreme'
                    ? '#EF4444'
                    : item.intensity === 'High'
                    ? '#EA580C'
                    : '#10B981';

                const intensityBg =
                  item.intensity === 'Extreme'
                    ? 'rgba(239, 68, 68, 0.10)'
                    : item.intensity === 'High'
                    ? 'rgba(234, 88, 12, 0.10)'
                    : 'rgba(16, 185, 129, 0.10)';

                return (
                  <View key={item.id} style={styles.classCard}>
                    {/* Top Row: Icon + Title/Coach + Intensity */}
                    <View style={styles.classTopRow}>
                      <View style={styles.classIconBg}>
                        <Icon name={item.icon as any} size={moderateScale(22)} color="#6C5CE7" />
                      </View>
                      <View style={{ flex: 1, paddingRight: moderateScale(6) }}>
                        <Text style={styles.className} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.classTrainer}>
                          👤 Coach {item.trainer}
                        </Text>
                      </View>
                      <View style={[styles.intensityBadge, { backgroundColor: intensityBg }]}>
                        <Text style={[styles.intensityText, { color: intensityColor }]}>
                          {item.intensity.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Responsive Meta Pills Row */}
                    <View style={styles.metaPillsRow}>
                      <View style={styles.metaPill}>
                        <Icon name="time-outline" size={moderateScale(13)} color="#6C5CE7" />
                        <Text style={styles.metaPillText}>{item.time}</Text>
                      </View>

                      <View style={[styles.metaPill, { backgroundColor: 'rgba(56, 189, 248, 0.10)' }]}>
                        <Icon name="hourglass-outline" size={moderateScale(13)} color="#0284C7" />
                        <Text style={[styles.metaPillText, { color: '#0284C7' }]}>{item.duration}</Text>
                      </View>

                      <View style={[styles.metaPill, { backgroundColor: 'rgba(255, 107, 107, 0.10)' }]}>
                        <Icon name="flame" size={moderateScale(13)} color="#E11D48" />
                        <Text style={[styles.metaPillText, { color: '#E11D48' }]}>{item.calories}</Text>
                      </View>
                    </View>

                    {/* Capacity Progress Bar */}
                    <View style={styles.capacityContainer}>
                      <View style={styles.capacityHeaderRow}>
                        <Text style={styles.capacityLabel}>Session Capacity</Text>
                        <Text style={[styles.capacityValueText, { color: isFull ? '#EF4444' : '#00A86B' }]}>
                          {isFull ? 'Fully Booked' : `${seatsLeft} spots remaining`}
                        </Text>
                      </View>
                      <View style={styles.capacityTrack}>
                        <View
                          style={[
                            styles.capacityFill,
                            {
                              width: `${(item.booked / item.capacity) * 100}%`,
                              backgroundColor: isFull ? '#EF4444' : '#00A86B',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Reserve Spot Button */}
                    <AnimatedPressable
                      style={[styles.bookBtn, isFull && styles.bookBtnDisabled]}
                      onPress={() => !isFull && handleBookSlot(item)}
                    >
                      <Icon
                        name={isFull ? 'close-circle-outline' : 'calendar-outline'}
                        size={moderateScale(16)}
                        color="#FFFFFF"
                      />
                      <Text style={styles.bookBtnText}>
                        {isFull ? 'CLASS FULL' : 'RESERVE SPOT'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                );
              })
            )}

            <View style={{ height: hp(6) }} />
          </ScrollView>
        </Animated.View>

        {/* ── BOOKING CONFIRMATION MODAL ── */}
        <Modal visible={!!bookedClass} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalSuccessIcon}>
                <Icon name="checkmark-circle" size={moderateScale(48)} color="#00C48C" />
              </View>
              <Text style={styles.modalTitle}>Slot Reserved! 🎉</Text>
              <Text style={styles.modalSub}>
                Your group workout pass is confirmed for:
              </Text>
              <View style={styles.modalDetailsCard}>
                <Text style={styles.modalClassName}>{bookedClass?.name}</Text>
                <Text style={styles.modalClassTime}>
                  📅 {weekDays[selectedDay]?.fullDate || 'Today'} • {bookedClass?.time}
                </Text>
                <Text style={styles.modalCoach}>
                  👤 Coach: {bookedClass?.trainer}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setBookedClass(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>DONE</Text>
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
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
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
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },

  dayCard: {
    width: moderateScale(54),
    height: moderateScale(60),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayDate: {
    fontSize: fontScale(15.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  dayDateActive: {
    color: '#FFFFFF',
  },

  catPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  catPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  catPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  classTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginBottom: hp(1.2),
  },
  classIconBg: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(13),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  className: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: fontScale(19),
  },
  classTrainer: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  intensityBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(7),
    alignSelf: 'flex-start',
  },
  intensityText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: hp(1.4),
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(7),
  },
  metaPillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  capacityContainer: {
    marginBottom: hp(1.5),
  },
  capacityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  capacityLabel: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
  },
  capacityValueText: {
    fontSize: fontScale(11),
    fontWeight: '700',
  },
  capacityTrack: {
    height: moderateScale(5.5),
    backgroundColor: '#F3F2FE',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: moderateScale(3),
  },

  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(44),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  bookBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
    gap: moderateScale(8),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalSuccessIcon: {
    marginBottom: hp(1),
  },
  modalTitle: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: hp(0.5),
  },
  modalSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  modalDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    gap: 4,
  },
  modalClassName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalClassTime: {
    fontSize: fontScale(12),
    color: '#6C5CE7',
    fontWeight: '700',
    marginTop: 2,
  },
  modalCoach: {
    fontSize: fontScale(12),
    color: '#64748B',
    fontWeight: '500',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
