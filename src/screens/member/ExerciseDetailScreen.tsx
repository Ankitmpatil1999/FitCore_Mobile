import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import apiService from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Native PNG Assets ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const clockImg = require('../../assets/Icons2/clock.png');

interface SetRecord {
  setNum: number;
  prevWeight: string;
  prevReps: string;
  weight: string;
  reps: string;
  completed: boolean;
}

export default function ExerciseDetailScreen({ route, navigation }: any) {
  const initialExercise = route?.params?.exercise || {};
  const exerciseId = initialExercise.id || initialExercise._id || initialExercise.slug || 'push-up';

  const [loading, setLoading] = useState(false);
  const [exercise, setExercise] = useState<any>({
    name: initialExercise.name || 'Push-Up',
    category: initialExercise.muscleGroup || initialExercise.category || 'Chest',
    primaryMuscle: initialExercise.primaryMuscle || initialExercise.muscleGroup || 'Chest',
    secondaryMuscles: initialExercise.secondaryMuscles || ['Triceps', 'Shoulders', 'Core'],
    equipment: Array.isArray(initialExercise.equipment) ? initialExercise.equipment : [initialExercise.equipment || 'Bodyweight'],
    exerciseType: initialExercise.exerciseType || 'Strength',
    movementPattern: initialExercise.movementPattern || 'Horizontal Push',
    instructions: initialExercise.instructions || [
      'Start in a high plank position with hands shoulder-width apart.',
      'Engage your core, glutes, and keep spine locked straight.',
      'Lower chest towards floor until elbows form a 90-degree angle.',
      'Press firmly through palms to return to full lockout.',
    ],
    benefits: initialExercise.benefits || [
      'Builds upper body pushing power and muscular endurance',
      'Develops core anti-extension stability',
    ],
    safetyTips: initialExercise.safetyTips || [
      'Keep elbows at 45-degree angle to torso; avoid 90-degree flaring.',
      'Do not allow lower back to sag.',
    ],
    commonMistakes: initialExercise.commonMistakes || [
      'Sagging hips below shoulder height',
      'Half reps without touching full depth',
    ],
    beginnerSets: initialExercise.beginnerSets || 3,
    beginnerReps: initialExercise.beginnerReps || '8-10',
    beginnerRestSec: initialExercise.beginnerRestSec || 60,
    intermediateSets: initialExercise.intermediateSets || 4,
    intermediateReps: initialExercise.intermediateReps || '12-15',
    intermediateRestSec: initialExercise.intermediateRestSec || 60,
    advancedSets: initialExercise.advancedSets || 5,
    advancedReps: initialExercise.advancedReps || '20+',
    advancedRestSec: initialExercise.advancedRestSec || 45,
    caloriesBurned: initialExercise.caloriesBurned || 60,
  });

  // Selected level prescription
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  // Rest Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Set Performance Tracker Rows
  const [sets, setSets] = useState<SetRecord[]>([]);

  // Fetch full live exercise data from API
  useEffect(() => {
    async function fetchExerciseData() {
      setLoading(true);
      try {
        const res: any = await apiService.getExerciseById(exerciseId);
        if (res.success && res.data) {
          setExercise((prev: any) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.log('Error loading exercise detail from backend:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchExerciseData();
  }, [exerciseId]);

  // Re-generate tracker rows when selectedLevel changes
  useEffect(() => {
    const numSets = selectedLevel === 'beginner'
      ? exercise.beginnerSets
      : selectedLevel === 'intermediate'
        ? exercise.intermediateSets
        : exercise.advancedSets;

    const repTarget = selectedLevel === 'beginner'
      ? exercise.beginnerReps
      : selectedLevel === 'intermediate'
        ? exercise.intermediateReps
        : exercise.advancedReps;

    const rest = selectedLevel === 'beginner'
      ? exercise.beginnerRestSec
      : selectedLevel === 'intermediate'
        ? exercise.intermediateRestSec
        : exercise.advancedRestSec;

    setTimeLeft(rest || 60);

    const generatedSets: SetRecord[] = [];
    for (let i = 1; i <= numSets; i++) {
      generatedSets.push({
        setNum: i,
        prevWeight: i <= 2 ? '30 kg' : '35 kg',
        prevReps: String(repTarget),
        weight: i <= 2 ? '30' : '35',
        reps: String(repTarget).split('-')[0] || '10',
        completed: i === 1,
      });
    }
    setSets(generatedSets);
  }, [selectedLevel, exercise]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      Alert.alert('⏰ Rest Time Over!', 'Get ready for your next set!');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  const toggleSetComplete = (index: number) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], completed: !next[index].completed };
      return next;
    });

    if (!sets[index].completed) {
      const rest = selectedLevel === 'beginner'
        ? exercise.beginnerRestSec
        : selectedLevel === 'intermediate'
          ? exercise.intermediateRestSec
          : exercise.advancedRestSec;
      setTimeLeft(rest || 60);
      setTimerRunning(true);
    }
  };

  const updateSetWeight = (index: number, val: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], weight: val };
      return next;
    });
  };

  const updateSetReps = (index: number, val: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], reps: val };
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
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
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
            <Text style={styles.headerSub}>{exercise.category || exercise.primaryMuscle} • Master Library</Text>
          </View>
          {loading && <ActivityIndicator size="small" color="#6C5CE7" />}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── 1. HERO BANNER CARD ── */}
          <View style={styles.exerciseBannerCard}>
            <View style={styles.bannerIconBox}>
              <Image source={dumbbellIcon} style={styles.bannerIcon} resizeMode="contain" />
            </View>

            <View style={styles.bannerDetails}>
              <Text style={styles.bannerName}>{exercise.name}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{(exercise.category || exercise.primaryMuscle).toUpperCase()}</Text>
                </View>
                <View style={[styles.tagBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.tagText, { color: '#6C5CE7' }]}>{exercise.movementPattern || 'Compound'}</Text>
                </View>
                <View style={[styles.tagBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.tagText, { color: '#D97706' }]}>🔥 {exercise.caloriesBurned || 70} kcal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 2. EXPERIENCE LEVEL SELECTOR ── */}
          <View style={styles.levelSelectorBox}>
            <Text style={styles.levelSelectorLabel}>EXPERIENCE LEVEL PRESCRIPTION</Text>
            <View style={styles.levelPillsRow}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
                const isActive = selectedLevel === lvl;
                const label = lvl === 'beginner' ? '🟢 Beginner' : lvl === 'intermediate' ? '🟡 Intermediate' : '🔴 Advanced';
                const setsCount = lvl === 'beginner' ? exercise.beginnerSets : lvl === 'intermediate' ? exercise.intermediateSets : exercise.advancedSets;
                const repsCount = lvl === 'beginner' ? exercise.beginnerReps : lvl === 'intermediate' ? exercise.intermediateReps : exercise.advancedReps;

                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelPill, isActive && styles.levelPillActive]}
                    onPress={() => setSelectedLevel(lvl)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.levelPillText, isActive && styles.levelPillTextActive]}>{label}</Text>
                    <Text style={[styles.levelPillSub, isActive && styles.levelPillSubActive]}>
                      {setsCount} sets × {repsCount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── REST TIMER WIDGET (IF ACTIVE) ── */}
          {timerRunning && (
            <View style={styles.restTimerCard}>
              <View style={styles.timerLeft}>
                <Image source={clockImg} style={styles.timerIcon} resizeMode="contain" />
                <View>
                  <Text style={styles.timerLabel}>Rest Timer Running</Text>
                  <Text style={styles.timerValue}>{timeLeft}s remaining</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.skipTimerBtn}
                onPress={() => setTimerRunning(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.skipTimerText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 3. EQUIPMENT & SECONDARY MUSCLES ── */}
          <View style={styles.specCard}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Equipment</Text>
              <Text style={styles.specValue}>
                {Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment || 'None'}
              </Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Secondary Muscles</Text>
              <Text style={styles.specValue}>
                {Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles.join(', ') : 'Core'}
              </Text>
            </View>
          </View>

          {/* ── 4. SET PERFORMANCE TRACKER ── */}
          <Text style={styles.sectionTitle}>Live Set Performance Tracker</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { width: 36 }]}>SET</Text>
              <Text style={[styles.tableColHeader, { flex: 1.1 }]}>PREVIOUS</Text>
              <Text style={[styles.tableColHeader, { flex: 1 }]}>WEIGHT (kg)</Text>
              <Text style={[styles.tableColHeader, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.tableColHeader, { width: 36, textAlign: 'center' }]}>✓</Text>
            </View>

            {sets.map((s, idx) => (
              <View
                key={s.setNum}
                style={[
                  styles.tableRow,
                  s.completed && styles.tableRowCompleted,
                  idx < sets.length - 1 && styles.tableRowBorder,
                ]}
              >
                <View style={styles.setNumBox}>
                  <Text style={styles.setNumText}>{s.setNum}</Text>
                </View>

                <View style={{ flex: 1.1 }}>
                  <Text style={styles.previousText}>{s.prevWeight} × {s.prevReps}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={s.weight}
                    onChangeText={(val) => updateSetWeight(idx, val)}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={s.reps}
                    onChangeText={(val) => updateSetReps(idx, val)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.checkButton, s.completed && styles.checkButtonActive]}
                  onPress={() => toggleSetComplete(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.checkTickText, s.completed && styles.checkTickTextActive]}>
                    {s.completed ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ── 5. FORM & PROPER TECHNIQUE INSTRUCTIONS ── */}
          <Text style={styles.sectionTitle}>Form & Step-by-Step Technique</Text>
          <View style={styles.instructionsCard}>
            {exercise.instructions && exercise.instructions.map((inst: string, idx: number) => (
              <View key={idx} style={styles.instructionRow}>
                <View style={styles.instructionIndex}>
                  <Text style={styles.instructionIndexText}>{idx + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{inst}</Text>
              </View>
            ))}
          </View>

          {/* ── 6. BENEFITS & SAFETY TIPS ── */}
          {exercise.benefits && exercise.benefits.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Key Muscle Benefits</Text>
              <View style={styles.bulletCard}>
                {exercise.benefits.map((b: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Icon name="checkmark-circle" size={moderateScale(16)} color="#00C48C" />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {exercise.safetyTips && exercise.safetyTips.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Safety & Injury Prevention</Text>
              <View style={[styles.bulletCard, { borderColor: '#FED7AA' }]}>
                {exercise.safetyTips.map((tip: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Icon name="shield-checkmark" size={moderateScale(16)} color="#F59E0B" />
                    <Text style={styles.bulletText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Common Mistakes to Avoid</Text>
              <View style={[styles.bulletCard, { borderColor: '#FECACA' }]}>
                {exercise.commonMistakes.map((mis: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Icon name="close-circle" size={moderateScale(16)} color="#EF4444" />
                    <Text style={styles.bulletText}>{mis}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── START SESSION CTA BUTTON ── */}
          <TouchableOpacity
            style={styles.activeWorkoutBtn}
            onPress={() => navigation.navigate('ActiveWorkout', { exercise, title: exercise.name })}
            activeOpacity={0.85}
          >
            <Text style={styles.activeWorkoutBtnText}>START LIVE WORKOUT ▶</Text>
          </TouchableOpacity>

          <View style={{ height: hp(6) }} />
        </ScrollView>
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
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },

  // Banner
  exerciseBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  bannerIconBox: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(14),
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  bannerIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
    tintColor: '#6C5CE7',
  },
  bannerDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  bannerName: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  tagText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#00A86B',
  },

  // Level Selector
  levelSelectorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  levelSelectorLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: moderateScale(8),
    letterSpacing: 0.4,
  },
  levelPillsRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  levelPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  levelPillText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#334155',
  },
  levelPillTextActive: {
    color: '#FFFFFF',
  },
  levelPillSub: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  levelPillSubActive: {
    color: '#E0E7FF',
  },

  // Timer
  restTimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  timerIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#00A86B',
  },
  timerLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#065F46',
  },
  timerValue: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#047857',
  },
  skipTimerBtn: {
    backgroundColor: '#00A86B',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  skipTimerText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Spec
  specCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 3,
  },
  specDivider: {
    width: 1,
    backgroundColor: '#ECEAFD',
    marginHorizontal: moderateScale(12),
  },

  // Table
  sectionTitle: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: hp(1),
    marginTop: hp(0.5),
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(12),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: moderateScale(6),
  },
  tableColHeader: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  tableRowCompleted: {
    opacity: 0.6,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  setNumBox: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#334155',
  },
  previousText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 4,
  },
  tableInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(6),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(6),
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 4,
    textAlign: 'center',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  checkButtonActive: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  checkTickText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: 'transparent',
  },
  checkTickTextActive: {
    color: '#FFFFFF',
  },

  // Instructions
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    gap: moderateScale(10),
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(10),
  },
  instructionIndex: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  instructionIndexText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  instructionText: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#334155',
    lineHeight: fontScale(17),
    fontWeight: '500',
  },

  // Bullets
  bulletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: moderateScale(8),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  bulletText: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#334155',
    fontWeight: '600',
  },

  // CTA
  activeWorkoutBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    marginTop: hp(1),
    elevation: 3,
  },
  activeWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(14),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
