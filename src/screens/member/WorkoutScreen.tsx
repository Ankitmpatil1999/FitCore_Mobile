import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { getWorkoutPlanByMember, WorkoutDay, Exercise } from '../../data/mockData';
import { apiService } from '../../services/api';

// ── Asset Icons (Native PNGs) ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const clockImg = require('../../assets/Icons2/clock.png');
const kcalIconImg = require('../../assets/Icons/kcal.png');
const kettlebellImg = require('../../assets/Icons2/kettlebell.png');

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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const [liveWorkoutPlan, setLiveWorkoutPlan] = useState<any>(null);
  const [isTrainerAssigned, setIsTrainerAssigned] = useState(false);
  const [trainerName, setTrainerName] = useState('');

  const fallbackWorkoutPlan = currentMember ? getWorkoutPlanByMember(currentMember.id) : undefined;
  const workoutPlan = liveWorkoutPlan?.data || liveWorkoutPlan || fallbackWorkoutPlan;

  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const todayName = dayIndex === 0 ? 'Sunday' : DAYS_OF_WEEK[dayIndex - 1];
  const [selectedDay, setSelectedDay] = useState(todayName || 'Monday');
  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set(['m_e1']));
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch Live Workout Plan ──
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const memberId = currentMember?.id || currentUser?.id;
        const res: any = await apiService.getMemberWorkout(memberId);
        if (res.success && res.data) {
          setLiveWorkoutPlan(res.data);
          setIsTrainerAssigned(!!res.isTrainerAssigned || res.data?.isTrainerAssigned || false);
          setTrainerName(res.trainerName || res.data?.trainerName || 'Coach');
        }
      } catch (err) {
        console.log('Using cached workout routine');
      }
    };
    fetchPlan();
  }, [currentMember?.id, currentUser?.id]);

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

  const selectedDayData: any = workoutPlan?.days?.find(
    (d: any) =>
      d?.day?.toLowerCase() === selectedDay.toLowerCase() ||
      d?.dayName?.toLowerCase().startsWith(selectedDay.toLowerCase())
  );

  const toggleDone = (exId: string) => {
    setDoneExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const exercisesList: any[] = selectedDayData?.exercises || [];
  const completedCount = exercisesList.filter((e: any, idx: number) => {
    const id = String(e?.id || e?._id || e?.name || idx);
    return doneExercises.has(id);
  }).length;
  const totalCount = exercisesList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const estimatedCalories = totalCount * 65;
  const estimatedDuration = totalCount > 0 ? `${totalCount * 8} mins` : 'Rest';

  const filteredExercises = exercisesList.filter((ex: any) =>
    searchQuery
      ? (ex?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex?.muscleGroup || ex?.targetMuscle || ex?.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

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

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Workout Routine</Text>
            <View style={[styles.planStatusBadge, isTrainerAssigned && styles.planStatusBadgePro]}>
              <View style={[styles.planStatusDot, isTrainerAssigned && styles.planStatusDotPro]} />
              <Text style={[styles.planStatusText, isTrainerAssigned && styles.planStatusTextPro]}>
                {isTrainerAssigned ? `PRO • By ${trainerName}` : (workoutPlan?.title || 'Standard Plan')}
              </Text>
            </View>
          </View>

          {totalCount > 0 ? (
            <TouchableOpacity
              style={styles.startHeaderBtn}
              onPress={() =>
                navigation.navigate('ActiveWorkout', {
                  workoutId: 'w1',
                  title: selectedDayData?.focus ?? 'Workout Session',
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.startHeaderBtnText}>START ▶</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: moderateScale(38) }} />
          )}
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <Text style={{ fontSize: fontScale(13), marginRight: 6 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises (e.g. Bench, Squat)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── 7-DAY WEEKDAY SELECTOR ── */}
            <View style={styles.daysStrip}>
              {DAYS_OF_WEEK.map((day, idx) => {
                const isSelected = selectedDay === day;
                const isToday = todayName === day;
                const dayWorkout = workoutPlan?.days?.find(
                  (d: any) =>
                    d?.day?.toLowerCase() === day.toLowerCase() ||
                    d?.dayName?.toLowerCase() === day.toLowerCase() ||
                    d?.dayName?.toLowerCase()?.startsWith(day.toLowerCase())
                );
                const isRest = !dayWorkout || !dayWorkout.exercises || dayWorkout.exercises.length === 0;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillActive,
                      isToday && !isSelected && styles.dayPillToday,
                    ]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayShortText, isSelected && styles.dayShortTextActive]} numberOfLines={1}>
                      {DAY_SHORT[idx]}
                    </Text>

                    <Text style={[styles.dayFocusShort, isSelected && styles.dayFocusShortActive]} numberOfLines={1}>
                      {isRest ? 'Rest' : (dayWorkout?.focus ? dayWorkout.focus.split(' ')[0] : 'Lift')}
                    </Text>

                    {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── ROUTINE HERO CARD ── */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1, paddingRight: moderateScale(10) }}>
                  <View style={styles.focusTag}>
                    <Text style={styles.focusTagText}>
                      ⚡ {(selectedDay || 'TODAY').toUpperCase()} PROTOCOL
                    </Text>
                  </View>
                  <Text style={styles.dayFocusTitle}>
                    {selectedDayData?.focus || 'Rest & Recovery Day'}
                  </Text>
                </View>

                {totalCount > 0 && (
                  <View style={styles.progressCircleBox}>
                    <Text style={styles.progressCircleText}>{progressPercent}%</Text>
                    <Text style={styles.progressCircleSub}>{completedCount}/{totalCount} Done</Text>
                  </View>
                )}
              </View>

              {totalCount > 0 ? (
                <>
                  {/* Progress track */}
                  <View style={styles.heroProgressTrack}>
                    <View style={[styles.heroProgressFill, { width: `${progressPercent}%` }]} />
                  </View>

                  {/* 3-Column Island Stats */}
                  <View style={styles.statIslandContainer}>
                    <View style={styles.statIslandCol}>
                      <View style={styles.statIconValRow}>
                        <Image source={dumbbellIcon} style={styles.statIcon} resizeMode="contain" />
                        <Text style={styles.statIslandVal}>{totalCount}</Text>
                      </View>
                      <Text style={styles.statIslandLbl}>Exercises</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statIslandCol}>
                      <View style={styles.statIconValRow}>
                        <Image source={clockImg} style={styles.statIcon} resizeMode="contain" />
                        <Text style={styles.statIslandVal}>{estimatedDuration}</Text>
                      </View>
                      <Text style={styles.statIslandLbl}>Est. Time</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statIslandCol}>
                      <View style={styles.statIconValRow}>
                        <Image source={kcalIconImg} style={styles.statIcon} resizeMode="contain" />
                        <Text style={styles.statIslandVal}>~{estimatedCalories}</Text>
                      </View>
                      <Text style={styles.statIslandLbl}>Kcal Burn</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.restDayHeroNote}>
                  <Text style={styles.restDayHeroTitle}>🌱 Muscle Growth Phase</Text>
                  <Text style={styles.restDayHeroSub}>
                    Muscles repair and grow stronger during rest. Ensure you drink 3+ Liters of water and consume your protein target today.
                  </Text>
                </View>
              )}
            </View>

            {/* ── EXERCISE LIST ── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {totalCount > 0 ? `Today's Exercises (${filteredExercises.length})` : 'Recovery Recommendations'}
                </Text>
                {totalCount > 0 && (
                  <Text style={styles.sectionSub}>Tap checkmark to record set completion</Text>
                )}
              </View>
            </View>

            {totalCount === 0 ? (
              <View style={styles.emptyRestCard}>
                <View style={styles.restIconCircle}>
                  <Text style={{ fontSize: moderateScale(28) }}>🛌</Text>
                </View>
                <Text style={styles.emptyRestTitle}>Active Recovery & Rest</Text>
                <Text style={styles.emptyRestSub}>
                  No heavy lifting scheduled today. Light walking, stretching, and 8 hours of quality sleep are recommended by your coach.
                </Text>
              </View>
            ) : (
              filteredExercises.map((ex: any, idx: number) => {
                const exId = String(ex?.id || ex?._id || ex?.name || idx);
                const isDone = doneExercises.has(exId);
                const muscleLabel = String(ex?.muscleGroup || ex?.targetMuscle || ex?.category || 'FULL BODY').toUpperCase();
                const setsLabel = ex?.sets ? `${ex.sets} Sets` : '3 Sets';
                const repsLabel = ex?.reps ? `${ex.reps} Reps` : '10-12 Reps';
                const weightLabel = ex?.weight ? `${ex.weight}` : '30 kg';

                return (
                  <AnimatedPressable
                    key={exId}
                    style={[styles.exerciseCard, isDone && styles.exerciseCardDone]}
                    onPress={() => navigation.navigate('ExerciseDetail', { exercise: ex })}
                  >
                    {/* Checkbox */}
                    <TouchableOpacity
                      style={[styles.checkCircle, isDone && styles.checkCircleActive]}
                      onPress={() => toggleDone(exId)}
                      activeOpacity={0.7}
                    >
                      {isDone && <Text style={styles.checkTickText}>✓</Text>}
                    </TouchableOpacity>

                    {/* Exercise Info */}
                    <View style={{ flex: 1 }}>
                      <View style={styles.exHeaderRow}>
                        <View style={styles.muscleBadge}>
                          <Text style={styles.muscleBadgeText}>{muscleLabel}</Text>
                        </View>
                        <Text style={styles.restTimeText}>⏱️ {ex?.restSeconds || 60}s Rest</Text>
                      </View>

                      <Text style={[styles.exName, isDone && styles.exNameDone]}>
                        {ex?.name || 'Exercise'}
                      </Text>

                      {/* Sets, Reps & Weight Pills */}
                      <View style={styles.exMetaRow}>
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>{setsLabel}</Text>
                        </View>
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>{repsLabel}</Text>
                        </View>
                        <View style={[styles.metaPill, { backgroundColor: '#EEF2FF' }]}>
                          <Text style={[styles.metaPillText, { color: '#6C5CE7' }]}>{weightLabel}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Chevron Arrow */}
                    <Text style={styles.chevronArrow}>›</Text>
                  </AnimatedPressable>
                );
              })
            )}

            <View style={{ height: hp(6) }} />
          </Animated.View>
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

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(108, 92, 231, 0.05)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(30),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(0, 196, 140, 0.04)',
  },

  // ── Header ──
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  planStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  planStatusBadgePro: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  planStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6C5CE7',
    marginRight: 5,
  },
  planStatusDotPro: {
    backgroundColor: '#A855F7',
  },
  planStatusText: {
    fontSize: fontScale(10.5),
    color: '#6C5CE7',
    fontWeight: '700',
  },
  planStatusTextPro: {
    color: '#7E22CE',
    fontWeight: '800',
  },
  startHeaderBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startHeaderBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // ── Search Bar ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(5),
    marginBottom: hp(1.4),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(12.5),
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── 7-Day Strip ──
  daysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.8),
  },
  dayPill: {
    flex: 1,
    paddingVertical: moderateScale(6),
    marginHorizontal: 2,
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayPillToday: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F5F3FF',
  },
  dayShortText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#64748B',
  },
  dayShortTextActive: {
    color: '#FFFFFF',
  },
  dayFocusShort: {
    fontSize: fontScale(8.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  dayFocusShortActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C5CE7',
    marginTop: 3,
  },
  todayDotActive: {
    backgroundColor: '#FFFFFF',
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.4),
  },
  focusTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    marginBottom: 4,
  },
  focusTagText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  dayFocusTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  progressCircleBox: {
    backgroundColor: 'rgba(0, 196, 140, 0.08)',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 196, 140, 0.20)',
  },
  progressCircleText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#00A86B',
  },
  progressCircleSub: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: hp(1.6),
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#00C48C',
    borderRadius: 3,
  },
  statIslandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  statIslandCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: '#6C5CE7',
  },
  statIslandVal: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  statIslandLbl: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: moderateScale(26),
    backgroundColor: '#E2E8F0',
  },

  // ── Rest Day Hero Note ──
  restDayHeroNote: {
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  restDayHeroTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 4,
  },
  restDayHeroSub: {
    fontSize: fontScale(11.5),
    color: '#6B21A8',
    lineHeight: fontScale(16),
  },

  // ── Exercise List Section ──
  sectionHeaderRow: {
    marginBottom: hp(1.2),
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  emptyRestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  restIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  emptyRestTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyRestSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(17),
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  exerciseCardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  checkTickText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '900',
  },
  exHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  muscleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  muscleBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.3,
  },
  restTimeText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  exName: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  exNameDone: {
    color: '#64748B',
  },
  exMetaRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  metaPillText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#475569',
  },
  chevronArrow: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#CBD5E1',
    marginLeft: 4,
  },
});
