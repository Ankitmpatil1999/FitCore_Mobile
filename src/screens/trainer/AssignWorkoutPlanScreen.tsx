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
import {
  getMemberById,
  getWorkoutPlanByMember,
  updateWorkoutPlanForMember,
  Exercise,
  WorkoutDay,
} from '../../data/mockData';
import { apiService } from '../../services/api';

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
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AssignWorkoutPlanScreen({ route, navigation }: any) {
  const { memberId, memberName } = route.params || {};
  const client = getMemberById(memberId);
  const existingPlan = getWorkoutPlanByMember(memberId);

  const [days, setDays] = useState<WorkoutDay[]>(() => {
    if (existingPlan) {
      return JSON.parse(JSON.stringify(existingPlan.days));
    }
    return WEEKDAYS.map((d) => ({
      day: d,
      focus: d === 'Sunday' ? 'Rest Day' : 'General Fitness',
      exercises: [],
    }));
  });

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDayData = days[activeDayIndex];

  // Modal form states
  const [exerciseModal, setExerciseModal] = useState(false);
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState('Chest');
  const [exSets, setExSets] = useState('4');
  const [exReps, setExReps] = useState('12');
  const [exWeight, setExWeight] = useState('40 kg');

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

  const updateFocus = (text: string) => {
    const updated = [...days];
    updated[activeDayIndex].focus = text;
    setDays(updated);
  };

  const handleAddExercise = () => {
    if (!exName.trim()) {
      Alert.alert('Required', 'Exercise name is required.');
      return;
    }
    const updated = [...days];
    const newEx: Exercise = {
      id: `ex_${Date.now()}`,
      name: exName.trim(),
      muscleGroup: exMuscle.trim(),
      sets: parseInt(exSets, 10) || 4,
      reps: exReps.trim() || '12',
      weight: exWeight.trim() || '40 kg',
      restSeconds: 60,
      videoUrl: '',
      isDone: false,
    };
    updated[activeDayIndex].exercises.push(newEx);
    setDays(updated);
    setExName('');
    setExerciseModal(false);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...days];
    updated[activeDayIndex].exercises.splice(index, 1);
    setDays(updated);
  };

  const handleSavePlan = async () => {
    if (memberId) {
      updateWorkoutPlanForMember(memberId, days);
      try {
        await apiService.assignWorkoutPlan({
          memberId,
          trainerName: 'Assigned Trainer',
          title: `Custom Split for ${memberName || 'Member'}`,
          days,
        });
      } catch (e) {
        console.log('Error saving plan to server:', e);
      }
    }
    Alert.alert('✓ Plan Assigned', `Custom workout routine assigned to ${memberName || 'client'}!`);
    navigation.goBack();
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
            <Text style={styles.headerTitle}>Workout Builder</Text>
            <Text style={styles.headerSub}>Client: {memberName || client?.name || 'Arjun Mehta'}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSavePlan}
            activeOpacity={0.85}
          >
            <Icon name="checkmark" size={moderateScale(16)} color="#FFFFFF" />
            <Text style={styles.saveHeaderBtnText}>SAVE</Text>
          </TouchableOpacity>
        </View>

        {/* ── WEEKDAY SELECTOR ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysScroll}
          contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
        >
          {days.map((d, idx) => {
            const isSelected = activeDayIndex === idx;
            return (
              <TouchableOpacity
                key={d.day}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setActiveDayIndex(idx)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {d.day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── TARGET FOCUS INPUT CARD ── */}
          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>{currentDayData.day.toUpperCase()} TARGET MUSCLE</Text>
            <TextInput
              style={styles.focusInput}
              value={currentDayData.focus}
              onChangeText={updateFocus}
              placeholder="e.g. Chest & Triceps Hypertrophy"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* ── EXERCISES LIST ── */}
          <View style={styles.exerciseSectionHeader}>
            <Text style={styles.sectionTitle}>Exercises ({currentDayData.exercises.length})</Text>
            <TouchableOpacity
              style={styles.addExBtn}
              onPress={() => setExerciseModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="add" size={moderateScale(16)} color="#6C5CE7" />
              <Text style={styles.addExBtnText}>+ Add Movement</Text>
            </TouchableOpacity>
          </View>

          {currentDayData.exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="barbell-outline" size={moderateScale(38)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Movements Added</Text>
              <Text style={styles.emptySub}>Tap "+ Add Movement" to build {currentDayData.day}'s routine.</Text>
            </View>
          ) : (
            currentDayData.exercises.map((ex, idx) => (
              <View key={ex.id || idx} style={styles.exCard}>
                <View style={styles.exIndexBox}>
                  <Text style={styles.exIndexText}>{idx + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMeta}>
                    {ex.sets} Sets • {ex.reps} Reps • {ex.weight}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemoveExercise(idx)}
                  activeOpacity={0.7}
                  style={styles.trashBtn}
                >
                  <Icon name="trash-outline" size={moderateScale(18)} color="#FF4D6D" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── ADD EXERCISE MODAL ── */}
        <Modal visible={exerciseModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Movement</Text>
                <TouchableOpacity onPress={() => setExerciseModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={exName}
                  onChangeText={setExName}
                  placeholder="e.g. Incline Dumbbell Press"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exSets}
                    onChangeText={setExSets}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exReps}
                    onChangeText={setExReps}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Target Weight</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exWeight}
                    onChangeText={setExWeight}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddExercise}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>ADD TO ROUTINE</Text>
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
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  saveHeaderBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  daysScroll: {
    maxHeight: moderateScale(42),
    marginBottom: hp(1.5),
  },
  dayPill: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  dayPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayPillText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#64748B',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },

  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.5),
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  focusLabel: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
    marginBottom: 6,
  },
  focusInput: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 2,
  },

  exerciseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp(1.2),
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  addExBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  exIndexBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  exName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  exMeta: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  trashBtn: {
    padding: moderateScale(6),
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(2),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
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
  inputRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
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
