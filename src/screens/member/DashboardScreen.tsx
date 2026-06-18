import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import {
  getPlanById, getTrainerById, getWorkoutPlanByMember, getDaysRemaining,
  DIET_PLANS,
} from '../../data/mockData';

export default function DashboardScreen({ navigation }: any) {
  const { currentUser, currentMember, currentGym } = useAppContext();
  const plan = currentMember ? getPlanById(currentMember.planId) : undefined;
  const trainer = currentMember ? getTrainerById(currentMember.trainerId) : undefined;
  const workoutPlan = currentMember ? getWorkoutPlanByMember(currentMember.id) : undefined;
  const daysLeft = currentMember ? getDaysRemaining(currentMember.expiryDate) : 0;
  const diet = DIET_PLANS[0];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  const todayWorkout = workoutPlan?.days.find(d => d.day === today);

  const urgencyColor = daysLeft <= 7 ? '#EF4444' : daysLeft <= 30 ? '#F59E0B' : '#10B981';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      <View style={styles.root}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.memberName}>{currentUser?.name ?? 'Champion'} ⚡</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{currentUser?.avatar ?? 'CH'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* CHECK-IN CARD */}
          <View style={styles.checkInCard}>
            <View style={styles.checkInTop}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statusLabel}>Checked Out</Text>
              </View>
              <Text style={styles.gymName}>{currentGym?.name ?? 'FitCore Elite'}</Text>
            </View>
            <Text style={styles.checkInTip}>
              Tap below to show your QR pass at the gym entrance
            </Text>
            <TouchableOpacity
              style={styles.checkInBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Check-In')}
            >
              <Text style={styles.checkInBtnText}>🪪  Show Check-In QR Pass</Text>
            </TouchableOpacity>
          </View>

          {/* MEMBERSHIP CARD */}
          {currentMember && plan && (
            <View style={[styles.membershipCard, { borderLeftColor: urgencyColor }]}>
              <View style={styles.membershipTop}>
                <View>
                  <Text style={styles.membershipPlanName}>{plan.name}</Text>
                  <Text style={styles.membershipExpiry}>Expires {currentMember.expiryDate}</Text>
                </View>
                <View style={[styles.daysLeftBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
                  <Text style={[styles.daysLeftNum, { color: urgencyColor }]}>{daysLeft}</Text>
                  <Text style={[styles.daysLeftLabel, { color: urgencyColor }]}>days left</Text>
                </View>
              </View>
              <View style={styles.membershipProgress}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (daysLeft / 365) * 100)}%`, backgroundColor: urgencyColor }]} />
              </View>
            </View>
          )}

          {/* STATS GRID */}
          <Text style={styles.sectionTitle}>Your Fitness Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>5 Days</Text>
              <Text style={styles.statLabel}>Weekly Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statVal}>{plan?.name?.split(' ').slice(0, 2).join(' ') ?? 'Gold'}</Text>
              <Text style={styles.statLabel}>Active Plan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏋️‍♂️</Text>
              <Text style={styles.statVal} numberOfLines={1}>{trainer?.name?.split(' ')[0] ?? 'Coach'}</Text>
              <Text style={styles.statLabel}>Your Trainer</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statVal}>{daysLeft}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
          </View>

          {/* TODAY'S WORKOUT PREVIEW */}
          {todayWorkout && todayWorkout.exercises.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Today's Workout</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Workout')}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.workoutPreviewCard}>
                <Text style={styles.workoutFocus}>{todayWorkout.focus}</Text>
                {todayWorkout.exercises.slice(0, 3).map((ex, i) => (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseNum}>
                      <Text style={styles.exerciseNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMeta}>{ex.sets}×{ex.reps}</Text>
                  </View>
                ))}
                {todayWorkout.exercises.length > 3 && (
                  <Text style={styles.moreExercises}>+{todayWorkout.exercises.length - 3} more exercises</Text>
                )}
              </View>
            </>
          )}

          {/* TODAY'S DIET PREVIEW */}
          {diet && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Today's Diet</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Diet')}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dietPreviewCard}>
                <View style={styles.macroRow}>
                  <View style={styles.macroPill}>
                    <Text style={styles.macroVal}>{diet.totalCalories}</Text>
                    <Text style={styles.macroLabel}>Cal</Text>
                  </View>
                  <View style={[styles.macroPill, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.macroVal, { color: '#3B82F6' }]}>{diet.totalProtein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={[styles.macroPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.macroVal, { color: '#F59E0B' }]}>{diet.waterIntake}</Text>
                    <Text style={styles.macroLabel}>Glasses</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  {['breakfast', 'lunch', 'snack', 'dinner'].map(m => {
                    const meal = (diet.meals as any)[m];
                    const totalCal = meal.items.reduce((s: number, i: any) => s + i.calories, 0);
                    return (
                      <View key={m} style={styles.mealChip}>
                        <Text style={styles.mealIcon}>
                          {m === 'breakfast' ? '🌅' : m === 'lunch' ? '☀️' : m === 'snack' ? '🍎' : '🌙'}
                        </Text>
                        <Text style={styles.mealName}>{meal.name.split(' ')[0]}</Text>
                        <Text style={styles.mealCal}>{totalCal} cal</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* TRAINER CARD */}
          {trainer && (
            <>
              <Text style={styles.sectionTitle}>Your Trainer</Text>
              <View style={styles.trainerCard}>
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpec}>{trainer.specialization}</Text>
                  <Text style={styles.trainerTimings}>{trainer.timings}</Text>
                </View>
                <View style={[styles.availDot, { backgroundColor: trainer.available ? '#10B981' : '#F59E0B' }]} />
              </View>
            </>
          )}

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: '💪', label: 'Workout', tab: 'Workout' },
              { icon: '🥗', label: 'Diet', tab: 'Diet' },
              { icon: '🏢', label: 'My Gym', tab: 'My Gym' },
              { icon: '📈', label: 'Progress', tab: 'Progress' },
              { icon: '🛍️', label: 'Shop', tab: 'Shop' },
              { icon: '💬', label: 'Trainer', tab: 'Trainer Chat' },
            ].map(item => (
              <TouchableOpacity
                key={item.tab}
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.tab)}
              >
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0EA5E9',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  memberName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  checkInCard: {
    backgroundColor: '#0F172A', borderRadius: 20, padding: 20, marginBottom: 20,
  },
  checkInTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  gymName: { fontSize: 11, color: '#475569', fontWeight: '600' },
  checkInTip: { fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 },
  checkInBtn: {
    backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  checkInBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  membershipCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 20,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#E2E8F0',
  },
  membershipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  membershipPlanName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  membershipExpiry: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  daysLeftBadge: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  daysLeftNum: { fontSize: 24, fontWeight: '800' },
  daysLeftLabel: { fontSize: 10, fontWeight: '700' },
  membershipProgress: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 12, color: '#0EA5E9', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statVal: { fontSize: 15, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  workoutPreviewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  workoutFocus: { fontSize: 14, fontWeight: '800', color: '#0EA5E9', marginBottom: 12 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  exerciseNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  exerciseNumText: { fontSize: 11, fontWeight: '800', color: '#0EA5E9' },
  exerciseName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },
  exerciseMeta: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  moreExercises: { fontSize: 12, color: '#0EA5E9', fontWeight: '600', marginTop: 10, textAlign: 'center' },
  dietPreviewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  macroPill: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  macroLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 3 },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealChip: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  mealIcon: { fontSize: 18 },
  mealName: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  mealCal: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  trainerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  trainerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  trainerAvatarText: { fontSize: 16, fontWeight: '800', color: '#8B5CF6' },
  trainerName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  trainerSpec: { fontSize: 12, color: '#475569', marginTop: 2 },
  trainerTimings: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '30%', flex: 1, minWidth: '28%',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center' },
});
