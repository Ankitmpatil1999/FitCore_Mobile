import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { Colors } from '../../theme';
import { getWorkoutPlanByMember, WorkoutDay, Exercise } from '../../data/mockData';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WorkoutScreen() {
  const { currentMember } = useAppContext();
  const workoutPlan = currentMember ? getWorkoutPlanByMember(currentMember.id) : undefined;

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set());

  const selectedDayData: WorkoutDay | undefined = workoutPlan?.days.find(d => d.day === selectedDay);

  const toggleDone = (exId: string) => {
    setDoneExercises(prev => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const completedCount = selectedDayData?.exercises.filter(e => doneExercises.has(e.id)).length ?? 0;
  const totalCount = selectedDayData?.exercises.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>{workoutPlan?.name ?? 'Your Workout Plan'}</Text>
              <Text style={styles.headerTitle}>Workout 💪</Text>
            </View>
            {totalCount > 0 && (
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>{completedCount}/{totalCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Day selector */}
        <View style={styles.daySelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorScroll} contentContainerStyle={styles.daySelectorContent}>
            {DAYS_OF_WEEK.map(day => {
              const dayData = workoutPlan?.days.find(d => d.day === day);
              const isRest = !dayData || dayData.exercises.length === 0;
              const isToday = day === todayName;
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                    isToday && !isSelected && styles.dayChipToday,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayShort, isSelected ? { color: '#000000' } : { color: Colors.textPrimary }]}>
                    {day.slice(0, 3)}
                  </Text>
                  <Text style={[styles.dayFocus, isSelected ? { color: 'rgba(0,0,0,0.6)' } : { color: Colors.textSecondary }]} numberOfLines={1}>
                    {isRest ? 'Rest' : (dayData?.focus.split(' ').slice(0, 1).join('') ?? '')}
                  </Text>
                  {isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: '#000000' }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {!workoutPlan ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyTitle}>No workout plan assigned yet</Text>
              <Text style={styles.emptySubtitle}>Ask your trainer to assign a plan</Text>
            </View>
          ) : selectedDayData && selectedDayData.exercises.length === 0 ? (
            <View style={styles.restCard}>
              <Text style={{ fontSize: 64 }}>😴</Text>
              <Text style={styles.restTitle}>{selectedDayData.focus}</Text>
              <Text style={styles.restSubtitle}>Take it easy today. Your muscles are growing!</Text>
              <View style={styles.restTip}>
                <Text style={styles.restTipText}>💡 Pro tip: Get 8 hours of sleep and drink plenty of water</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Focus + progress */}
              <View style={styles.focusCard}>
                <View style={styles.focusLeft}>
                  <Text style={styles.focusLabel}>Today's Focus</Text>
                  <Text style={styles.focusName}>{selectedDayData?.focus ?? selectedDay}</Text>
                </View>
                {totalCount > 0 && (
                  <View style={styles.ringProgress}>
                    <Text style={styles.ringVal}>{Math.round((completedCount / totalCount) * 100)}%</Text>
                    <Text style={styles.ringLabel}>Done</Text>
                  </View>
                )}
              </View>

              {/* Exercise list */}
              {selectedDayData?.exercises.map((ex, i) => {
                const isDone = doneExercises.has(ex.id);
                return (
                  <View key={ex.id} style={[styles.exerciseCard, isDone && styles.exerciseCardDone]}>
                    <View style={styles.exerciseTop}>
                      <View style={[styles.exNum, { backgroundColor: isDone ? Colors.successBg : 'rgba(255,255,255,0.05)' }]}>
                        <Text style={[styles.exNumText, { color: isDone ? Colors.success : Colors.textSecondary }]}>
                          {isDone ? '✓' : i + 1}
                        </Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exName}>{ex.name}</Text>
                        <View style={styles.musclePill}>
                          <Text style={styles.muscleText}>{ex.muscleGroup}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.doneBtn, isDone && styles.doneBtnActive]}
                        onPress={() => toggleDone(ex.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.doneBtnText, isDone && { color: '#FFFFFF' }]}>
                          {isDone ? '✓ Done' : 'Mark Done'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.exStats}>
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.sets}</Text>
                        <Text style={styles.exStatLabel}>Sets</Text>
                      </View>
                      <View style={styles.exStatDivider} />
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.reps}</Text>
                        <Text style={styles.exStatLabel}>Reps</Text>
                      </View>
                      <View style={styles.exStatDivider} />
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.weight}</Text>
                        <Text style={styles.exStatLabel}>Weight</Text>
                      </View>
                      <View style={styles.exStatDivider} />
                      <TouchableOpacity
                        style={styles.restBtn}
                        onPress={() => Alert.alert('Rest Timer', `${ex.restSeconds}s rest — use your phone timer`)}
                      >
                        <Text style={styles.restBtnText}>⏱ {ex.restSeconds}s</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Completion banner */}
              {completedCount === totalCount && totalCount > 0 && (
                <View style={styles.completionBanner}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                  <Text style={styles.completionTitle}>Workout Complete!</Text>
                  <Text style={styles.completionSub}>Amazing work! You crushed {totalCount} exercises today.</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgSurface },
  root: { flex: 1, backgroundColor: Colors.bgBase },
  header: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  progressBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  progressBadgeText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  daySelectorContainer: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  daySelectorScroll: {
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  daySelectorContent: {
    paddingVertical: 12, paddingHorizontal: 16,
  },
  dayChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, backgroundColor: Colors.bgCard, minWidth: 64, borderWidth: 1, borderColor: Colors.border },
  dayChipSelected: { backgroundColor: Colors.accentCyan, borderColor: Colors.accentCyan },
  dayChipToday: { backgroundColor: Colors.cyanBg, borderWidth: 1, borderColor: Colors.accentCyan },
  dayShort: { fontSize: 13, fontWeight: '800' },
  dayFocus: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accentCyan, marginTop: 4 },
  scroll: {
    padding: 20, paddingBottom: 80,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  restCard: { backgroundColor: Colors.bgCard, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 10 },
  restTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  restSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  restTip: { backgroundColor: Colors.successBg, borderRadius: 12, padding: 14, marginTop: 8 },
  restTipText: { fontSize: 13, color: Colors.success, fontWeight: '600', textAlign: 'center' },
  focusCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.accentCyan, borderWidth: 1, borderColor: Colors.border },
  focusLeft: {},
  focusLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  focusName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  ringProgress: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.accentCyan },
  ringVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  ringLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  exerciseCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  exerciseCardDone: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  exNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontSize: 13, fontWeight: '800' },
  exerciseInfo: { flex: 1 },
  exName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  musclePill: { backgroundColor: Colors.cyanBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  muscleText: { fontSize: 10, fontWeight: '700', color: Colors.accentCyan },
  doneBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.border },
  doneBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  doneBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  exStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 10 },
  exStat: { flex: 1, alignItems: 'center' },
  exStatVal: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  exStatLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  exStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  restBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  restBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accentViolet },
  completionBanner: { backgroundColor: Colors.successBg, borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: Colors.success },
  completionTitle: { fontSize: 22, fontWeight: '800', color: Colors.success },
  completionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
});
