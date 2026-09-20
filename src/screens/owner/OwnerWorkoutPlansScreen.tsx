import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  targetMuscle: string;
  restSec: number;
}

interface DayPlan {
  day: string;
  dayName: string;
  focus: string;
  durationMin: number;
  calories: number;
  exercises: ExerciseItem[];
}

const DEFAULT_DAYS: DayPlan[] = [
  {
    day: 'Monday',
    dayName: 'Monday: Chest & Triceps',
    focus: 'Chest & Triceps',
    durationMin: 45,
    calories: 320,
    exercises: [
      { id: 'm-1', name: 'Barbell Flat Bench Press', sets: 4, reps: '10-12', weight: 'Bar + 20kg', targetMuscle: 'Chest Overall', restSec: 75 },
      { id: 'm-2', name: 'Incline Dumbbell Press', sets: 3, reps: '12', weight: '16 kg', targetMuscle: 'Upper Chest', restSec: 60 },
      { id: 'm-3', name: 'Dumbbell Fly / Cable Fly', sets: 3, reps: '15', weight: '12 kg', targetMuscle: 'Inner Chest', restSec: 45 },
      { id: 'm-4', name: 'Tricep Rope Pushdowns', sets: 4, reps: '12', weight: '20 kg', targetMuscle: 'Triceps Lateral', restSec: 45 },
      { id: 'm-5', name: 'Overhead Dumbbell Extension', sets: 3, reps: '12', weight: '14 kg', targetMuscle: 'Triceps Long Head', restSec: 60 },
    ]
  },
  {
    day: 'Tuesday',
    dayName: 'Tuesday: Back & Biceps',
    focus: 'Back & Biceps',
    durationMin: 45,
    calories: 340,
    exercises: [
      { id: 't-1', name: 'Lat Pulldowns (Wide Grip)', sets: 4, reps: '10-12', weight: '45 kg', targetMuscle: 'Lats Width', restSec: 75 },
      { id: 't-2', name: 'Seated Cable Rows', sets: 4, reps: '12', weight: '40 kg', targetMuscle: 'Mid-Back Thickness', restSec: 60 },
      { id: 't-3', name: 'Conventional Deadlift', sets: 3, reps: '8-10', weight: '60 kg', targetMuscle: 'Lower & Upper Back', restSec: 90 },
      { id: 't-4', name: 'Standing Barbell Curls', sets: 4, reps: '12', weight: '20 kg', targetMuscle: 'Biceps Peak', restSec: 60 },
      { id: 't-5', name: 'Dumbbell Hammer Curls', sets: 3, reps: '15', weight: '12 kg', targetMuscle: 'Brachialis & Forearms', restSec: 45 },
    ]
  },
  {
    day: 'Wednesday',
    dayName: 'Wednesday: Legs & Calves',
    focus: 'Legs & Calves',
    durationMin: 50,
    calories: 400,
    exercises: [
      { id: 'w-1', name: 'Barbell Back Squats', sets: 4, reps: '10-12', weight: '60 kg', targetMuscle: 'Quads & Glutes', restSec: 90 },
      { id: 'w-2', name: 'Leg Press Machine', sets: 4, reps: '12-15', weight: '120 kg', targetMuscle: 'Quads Power', restSec: 75 },
      { id: 'w-3', name: 'Lying Leg Curls', sets: 3, reps: '15', weight: '35 kg', targetMuscle: 'Hamstrings', restSec: 60 },
      { id: 'w-4', name: 'Walking Dumbbell Lunges', sets: 3, reps: '20 steps', weight: '10 kg dbs', targetMuscle: 'Quads & Glutes', restSec: 60 },
      { id: 'w-5', name: 'Standing Calf Raises', sets: 4, reps: '20', weight: '50 kg', targetMuscle: 'Calves', restSec: 45 },
    ]
  },
  {
    day: 'Thursday',
    dayName: 'Thursday: Shoulders & Abs',
    focus: 'Shoulders & Abs',
    durationMin: 45,
    calories: 310,
    exercises: [
      { id: 'th-1', name: 'Overhead Dumbbell Shoulder Press', sets: 4, reps: '10-12', weight: '16 kg dbs', targetMuscle: 'Deltoids Power', restSec: 75 },
      { id: 'th-2', name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', weight: '8 kg dbs', targetMuscle: 'Side Deltoids', restSec: 45 },
      { id: 'th-3', name: 'Rear Delt Fly / Face Pulls', sets: 3, reps: '15', weight: '15 kg', targetMuscle: 'Rear Delts', restSec: 45 },
      { id: 'th-4', name: 'Hanging Leg Raises', sets: 3, reps: '15-20', weight: 'Bodyweight', targetMuscle: 'Lower Abs', restSec: 45 },
      { id: 'th-5', name: 'Plank Hold', sets: 3, reps: '60 sec', weight: 'Bodyweight', targetMuscle: 'Core Stability', restSec: 45 },
    ]
  },
  {
    day: 'Friday',
    dayName: 'Friday: Arms & Functional',
    focus: 'Arms & Functional',
    durationMin: 45,
    calories: 330,
    exercises: [
      { id: 'f-1', name: 'Preacher Bench Bicep Curls', sets: 3, reps: '12', weight: '20 kg', targetMuscle: 'Biceps Short Head', restSec: 60 },
      { id: 'f-2', name: 'Skull Crushers (EZ-Bar)', sets: 3, reps: '12', weight: '20 kg', targetMuscle: 'Triceps Medial', restSec: 60 },
      { id: 'f-3', name: 'Incline Dumbbell Curls', sets: 3, reps: '12', weight: '12 kg', targetMuscle: 'Biceps Long Head', restSec: 45 },
      { id: 'f-4', name: 'Bench Dips', sets: 3, reps: '15', weight: 'Bodyweight', targetMuscle: 'Triceps', restSec: 45 },
      { id: 'f-5', name: 'Kettlebell Swings', sets: 3, reps: '20', weight: '16 kg', targetMuscle: 'Full Body Conditioning', restSec: 45 },
    ]
  },
  {
    day: 'Saturday',
    dayName: 'Saturday: Cardio & Functional',
    focus: 'Cardio & Conditioning',
    durationMin: 35,
    calories: 300,
    exercises: [
      { id: 's-1', name: 'Treadmill Incline Running', sets: 1, reps: '15 mins', weight: 'Speed 8-10', targetMuscle: 'Cardiovascular', restSec: 0 },
      { id: 's-2', name: 'Stationary Cycling', sets: 1, reps: '15 mins', weight: 'Moderate', targetMuscle: 'Cardio Engine', restSec: 0 },
      { id: 's-3', name: 'Battle Ropes', sets: 4, reps: '30 sec', weight: 'Standard', targetMuscle: 'Upper Body Power', restSec: 45 },
      { id: 's-4', name: 'Burpees', sets: 3, reps: '15', weight: 'Bodyweight', targetMuscle: 'Full Body Burn', restSec: 60 },
    ]
  },
  {
    day: 'Sunday',
    dayName: 'Sunday: Rest & Mobility Recovery',
    focus: 'Rest & Mobility',
    durationMin: 25,
    calories: 120,
    exercises: [
      { id: 'su-1', name: 'Full Body Foam Rolling', sets: 1, reps: '10 mins', weight: 'Bodyweight', targetMuscle: 'Fascial Release', restSec: 30 },
      { id: 'su-2', name: 'Hip & Hamstring Mobility Stretch', sets: 3, reps: '60 sec', weight: 'Bodyweight', targetMuscle: 'Mobility', restSec: 30 },
      { id: 'su-3', name: 'Deep Breathing & CNS Recovery', sets: 1, reps: '5 mins', weight: 'Mindfulness', targetMuscle: 'CNS Recovery', restSec: 0 },
    ]
  }
];

export default function OwnerWorkoutPlansScreen({ navigation }: any) {
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || currentUser?.gymId || '6a934afd13a1b16c3767d90f';

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [planTitle, setPlanTitle] = useState<string>('FitCore Master Gym Split');
  const [planDesc, setPlanDesc] = useState<string>('Official 7-Day Gym Split auto-assigned to all general members.');
  const [days, setDays] = useState<DayPlan[]>(DEFAULT_DAYS);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Exercise Modal State
  const [showExerciseModal, setShowExerciseModal] = useState<boolean>(false);
  const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
  const [exName, setExName] = useState<string>('');
  const [exSets, setExSets] = useState<string>('3');
  const [exReps, setExReps] = useState<string>('12');
  const [exWeight, setExWeight] = useState<string>('15 kg');
  const [exTargetMuscle, setExTargetMuscle] = useState<string>('General');
  const [exRestSec, setExRestSec] = useState<string>('60');

  const loadMasterPlan = async () => {
    try {
      setLoading(true);
      const res: any = await apiService.getOwnerMasterWorkoutPlan(gymId);
      if (res?.success && res?.data) {
        if (res.data.title) setPlanTitle(res.data.title);
        if (res.data.description) setPlanDesc(res.data.description);
        if (res.data.days && Array.isArray(res.data.days)) {
          setDays(res.data.days);
        }
      }
    } catch (err) {
      console.log('Error loading master workout plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterPlan();
  }, [gymId]);

  const currentDay = days[selectedDayIdx] || days[0];

  const handleOpenAddExercise = () => {
    setEditingExIdx(null);
    setExName('');
    setExSets('3');
    setExReps('12');
    setExWeight('15 kg');
    setExTargetMuscle(currentDay.focus || 'General');
    setExRestSec('60');
    setShowExerciseModal(true);
  };

  const handleOpenEditExercise = (ex: ExerciseItem, index: number) => {
    setEditingExIdx(index);
    setExName(ex.name);
    setExSets(String(ex.sets || 3));
    setExReps(String(ex.reps || '12'));
    setExWeight(String(ex.weight || '15 kg'));
    setExTargetMuscle(ex.targetMuscle || 'General');
    setExRestSec(String(ex.restSec || 60));
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    if (!exName.trim()) {
      Alert.alert('Required', 'Please enter exercise name.');
      return;
    }

    const newEx: ExerciseItem = {
      id: editingExIdx !== null ? currentDay.exercises[editingExIdx].id : `ex_${Date.now()}`,
      name: exName.trim(),
      sets: Number(exSets) || 3,
      reps: exReps.trim() || '12',
      weight: exWeight.trim() || 'Bodyweight',
      targetMuscle: exTargetMuscle.trim() || currentDay.focus,
      restSec: Number(exRestSec) || 60,
    };

    const updatedDays = [...days];
    const currentExercises = [...updatedDays[selectedDayIdx].exercises];

    if (editingExIdx !== null) {
      currentExercises[editingExIdx] = newEx;
    } else {
      currentExercises.push(newEx);
    }

    updatedDays[selectedDayIdx].exercises = currentExercises;
    setDays(updatedDays);
    setShowExerciseModal(false);
  };

  const handleDeleteExercise = (index: number) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedDays = [...days];
          const currentExercises = [...updatedDays[selectedDayIdx].exercises];
          currentExercises.splice(index, 1);
          updatedDays[selectedDayIdx].exercises = currentExercises;
          setDays(updatedDays);
        },
      },
    ]);
  };

  const handlePublishMasterPlan = async () => {
    try {
      setSaving(true);
      const payload = {
        gymId,
        title: planTitle.trim() || 'FitCore Master Gym Split',
        description: planDesc.trim(),
        days,
      };

      const res: any = await apiService.saveOwnerMasterWorkoutPlan(payload);
      if (res?.success) {
        Alert.alert(
          '✅ Master Split Published!',
          'This 7-Day workout plan is now active and auto-assigned to all general members in your gym.'
        );
      } else {
        Alert.alert('Notice', res?.message || 'Master split updated.');
      }
    } catch (err: any) {
      console.log('Error publishing master plan:', err);
      Alert.alert('Error', err?.message || 'Could not save master plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={moderateScale(20)} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
          <Text style={styles.headerTitle}>Gym Master Split</Text>
          <Text style={styles.headerSubtitle}>Tier 1: Global Gym Workout Plan</Text>
        </View>
        <View style={styles.masterBadge}>
          <Text style={styles.masterBadgeText}>OWNER</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading Gym Master Plan...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Info Banner ── */}
          <View style={styles.infoCard}>
            <View style={styles.infoTopRow}>
              <Icon name="shield-checkmark" size={moderateScale(18)} color="#6C5CE7" />
              <Text style={styles.infoCardTitle}>Official Gym Master Schedule</Text>
            </View>
            <Text style={styles.infoCardDesc}>
              This 7-Day Split is served to all regular members. Trainers can override this for their personal clients, and members can also create their own self-training custom splits.
            </Text>
          </View>

          {/* ── Plan Title & Focus ── */}
          <View style={styles.titleCard}>
            <Text style={styles.inputLabel}>MASTER PLAN TITLE</Text>
            <TextInput
              style={styles.textInput}
              value={planTitle}
              onChangeText={setPlanTitle}
              placeholder="e.g. FitCore Hypertrophy Master Split"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* ── 7-Day Day Selector Strip ── */}
          <View style={styles.daysStripContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysStrip}>
              {days.map((d, idx) => {
                const isSelected = selectedDayIdx === idx;
                return (
                  <TouchableOpacity
                    key={d.day}
                    style={[styles.dayTabPill, isSelected && styles.dayTabPillActive]}
                    onPress={() => setSelectedDayIdx(idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayTabDayText, isSelected && styles.dayTabDayTextActive]}>
                      {d.day.substring(0, 3)}
                    </Text>
                    <Text style={[styles.dayTabFocusText, isSelected && styles.dayTabFocusTextActive]} numberOfLines={1}>
                      {d.focus || 'Rest'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Selected Day Overview Card ── */}
          <View style={styles.dayOverviewCard}>
            <View style={styles.dayOverviewHeader}>
              <View>
                <Text style={styles.dayOverviewDayName}>{currentDay.day}</Text>
                <Text style={styles.dayOverviewFocus}>{currentDay.focus}</Text>
              </View>
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={handleOpenAddExercise}
                activeOpacity={0.8}
              >
                <Icon name="add-circle" size={moderateScale(16)} color="#FFFFFF" />
                <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Exercises List */}
            {currentDay.exercises.length === 0 ? (
              <View style={styles.emptyExercisesBox}>
                <Icon name="barbell-outline" size={moderateScale(32)} color="#CBD5E1" />
                <Text style={styles.emptyExercisesText}>No exercises added for {currentDay.day}</Text>
                <TouchableOpacity onPress={handleOpenAddExercise} style={styles.addFirstBtn}>
                  <Text style={styles.addFirstBtnText}>+ Add First Exercise</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {currentDay.exercises.map((ex, exIdx) => (
                  <View key={ex.id || String(exIdx)} style={styles.exerciseCard}>
                    <View style={styles.exNumberBox}>
                      <Text style={styles.exNumberText}>{exIdx + 1}</Text>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: moderateScale(10) }}>
                      <Text style={styles.exNameText}>{ex.name}</Text>
                      <View style={styles.exMetaRow}>
                        <Text style={styles.exMetaPill}>{ex.sets} Sets</Text>
                        <Text style={styles.exMetaDot}>•</Text>
                        <Text style={styles.exMetaPill}>{ex.reps} Reps</Text>
                        <Text style={styles.exMetaDot}>•</Text>
                        <Text style={styles.exMetaPill}>{ex.weight}</Text>
                      </View>
                    </View>

                    <View style={styles.exActionsRow}>
                      <TouchableOpacity
                        style={styles.exActionIconBtn}
                        onPress={() => handleOpenEditExercise(ex, exIdx)}
                        activeOpacity={0.7}
                      >
                        <Icon name="pencil" size={moderateScale(15)} color="#6C5CE7" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.exActionIconBtn, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => handleDeleteExercise(exIdx)}
                        activeOpacity={0.7}
                      >
                        <Icon name="trash-outline" size={moderateScale(15)} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Master Publish Button ── */}
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublishMasterPlan}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.publishBtnRow}>
                <Icon name="cloud-upload" size={moderateScale(18)} color="#FFFFFF" />
                <Text style={styles.publishBtnText}>Publish Master Split to All Members</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Add/Edit Exercise Modal ── */}
      <Modal visible={showExerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExIdx !== null ? 'Edit Exercise' : `Add Exercise for ${currentDay.day}`}
              </Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Icon name="close-circle" size={moderateScale(24)} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>EXERCISE NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={exName}
                onChangeText={setExName}
                placeholder="e.g. Incline Dumbbell Press"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>SETS</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exSets}
                    onChangeText={setExSets}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>REPS</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exReps}
                    onChangeText={setExReps}
                    placeholder="10-12"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>WEIGHT / INTENSITY</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exWeight}
                    onChangeText={setExWeight}
                    placeholder="e.g. 20 kg / Bodyweight"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>REST (SEC)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exRestSec}
                    onChangeText={setExRestSec}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>TARGET MUSCLE FOCUS</Text>
              <TextInput
                style={styles.modalInput}
                value={exTargetMuscle}
                onChangeText={setExTargetMuscle}
                placeholder="e.g. Upper Chest / Long Head"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveExercise}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveBtnText}>
                  {editingExIdx !== null ? 'Update Exercise' : 'Add to Day Schedule'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  masterBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  masterBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  scroll: {
    padding: moderateScale(16),
    paddingBottom: hp(5),
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(15),
  },
  loadingText: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  infoCardDesc: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    lineHeight: fontScale(16),
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  inputLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(9),
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  daysStripContainer: {
    marginBottom: hp(1.8),
  },
  daysStrip: {
    gap: moderateScale(8),
    paddingVertical: 2,
  },
  dayTabPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
    minWidth: moderateScale(68),
  },
  dayTabPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayTabDayText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  dayTabDayTextActive: {
    color: '#FFFFFF',
  },
  dayTabFocusText: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  dayTabFocusTextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dayOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(2),
    borderWidth: 1.2,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dayOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: moderateScale(12),
  },
  dayOverviewDayName: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  dayOverviewFocus: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 2,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    gap: 4,
  },
  addExerciseBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyExercisesBox: {
    alignItems: 'center',
    paddingVertical: moderateScale(25),
  },
  emptyExercisesText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
  },
  addFirstBtn: {
    marginTop: 10,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  addFirstBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  exercisesList: {
    gap: moderateScale(10),
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  exNumberBox: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumberText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  exNameText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  exMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  exMetaPill: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  exMetaDot: {
    color: '#CBD5E1',
    fontWeight: '900',
  },
  exActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exActionIconBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  publishBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtnText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(12),
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalSaveBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    marginTop: moderateScale(8),
    marginBottom: hp(2),
  },
  modalSaveBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
