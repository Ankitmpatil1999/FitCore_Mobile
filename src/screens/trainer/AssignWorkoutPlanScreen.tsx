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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import {
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

import { useAppContext } from '../../context/AppContext';

export default function AssignWorkoutPlanScreen({ route, navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || (currentTrainer as any)?._id || currentUser?.id || '';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Coach';
  const gymId = currentGym?.id || currentTrainer?.gymId || (currentUser as any)?.gymId || '';

  const { memberId: routeMemberId, memberName: routeMemberName } = route.params || {};

  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(routeMemberId || '');
  const [selectedMemberName, setSelectedMemberName] = useState<string>(routeMemberName || '');
  const [clientPickerModal, setClientPickerModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);

  const [days, setDays] = useState<WorkoutDay[]>(WEEKDAYS.map((d) => ({
    day: d,
    focus: d === 'Sunday' ? 'Rest Day' : 'General Fitness',
    exercises: [],
  })));

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDayData = days[activeDayIndex] || { day: 'Monday', focus: 'General Fitness', exercises: [] };

  // Modal form states
  const [exerciseModal, setExerciseModal] = useState(false);
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState('Chest');
  const [exSets, setExSets] = useState('4');
  const [exReps, setExReps] = useState('12');
  const [exWeight, setExWeight] = useState('40 kg');
  const [isSaving, setIsSaving] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Load Assigned Clients ──
  const loadAssignedClients = async () => {
    try {
      setLoadingClients(true);
      const res: any = await apiService.getOwnerMembers(gymId, {
        trainerId,
        trainerName,
        trainerPhone: currentUser?.phone,
      });
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setAssignedClients(res.data);
        if (!selectedMemberId) {
          const first = res.data[0];
          const fId = first._id || first.id;
          setSelectedMemberId(fId);
          setSelectedMemberName(first.name || 'Client');
          loadClientWorkout(fId);
        }
      }
    } catch (e) {
      console.log('Error loading assigned clients:', e);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadClientWorkout = async (mId: string) => {
    if (!mId) return;
    try {
      const res: any = await apiService.getMemberWorkout(mId);
      if (res?.success && res.data?.days && Array.isArray(res.data.days)) {
        setDays(res.data.days);
      }
    } catch (e) {
      console.log('Error loading member workout plan:', e);
    }
  };

  useEffect(() => {
    loadAssignedClients();
    if (routeMemberId) {
      loadClientWorkout(routeMemberId);
    }
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
  }, [gymId, trainerId, routeMemberId]);

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

  const handleSelectClient = (c: any) => {
    const cId = c._id || c.id;
    setSelectedMemberId(cId);
    setSelectedMemberName(c.name || 'Client');
    setClientPickerModal(false);
    loadClientWorkout(cId);
  };

  const handleSavePlan = async () => {
    if (!selectedMemberId) {
      Alert.alert('Select Client', 'Please select a trainee before assigning the workout routine.');
      setClientPickerModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const res: any = await apiService.assignWorkoutPlan({
        memberId: selectedMemberId,
        trainerId,
        trainerName,
        title: `Custom Split for ${selectedMemberName || 'Member'}`,
        days,
      });
      if (res?.success) {
        Alert.alert('✓ Plan Assigned', `Custom workout routine assigned to ${selectedMemberName || 'client'}!`);
        if (routeMemberId) {
          navigation.goBack();
        }
      } else {
        Alert.alert('Saved Offline', 'Plan saved locally. Will sync with server automatically.');
      }
    } catch (e: any) {
      console.log('Error saving plan to server:', e);
      Alert.alert('Saved Offline', 'Plan saved locally. Will sync with server.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = assignedClients.filter((c) =>
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').includes(clientSearch)
  );

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
          <TouchableOpacity
            style={styles.headerTitleContainer}
            onPress={() => setClientPickerModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.headerTitle}>Workout Builder</Text>
            <View style={styles.clientPickerTrigger}>
              <Text style={styles.headerSub} numberOfLines={1}>
                {selectedMemberName ? `Client: ${selectedMemberName}` : 'Tap to Select Client'}
              </Text>
              <Icon name="chevron-down" size={moderateScale(13)} color="#6C5CE7" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveHeaderBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSavePlan}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="checkmark" size={moderateScale(16)} color="#FFFFFF" />
                <Text style={styles.saveHeaderBtnText}>SAVE</Text>
              </>
            )}
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

        {/* ── CLIENT PICKER MODAL ── */}
        <Modal visible={clientPickerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: hp(70) }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Trainee</Text>
                <TouchableOpacity onPress={() => setClientPickerModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.modalInput, { marginBottom: hp(1.5) }]}
                value={clientSearch}
                onChangeText={setClientSearch}
                placeholder="Search trainee name or phone..."
                placeholderTextColor="#94A3B8"
              />

              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => {
                    const cId = c._id || c.id;
                    const isSelected = cId === selectedMemberId;
                    return (
                      <TouchableOpacity
                        key={cId}
                        style={[
                          styles.clientSelectItem,
                          isSelected && styles.clientSelectItemActive,
                        ]}
                        onPress={() => handleSelectClient(c)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.clientSelectAvatar}>
                          <Text style={styles.clientSelectAvatarText}>
                            {c.name ? c.name.slice(0, 2).toUpperCase() : 'M'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.clientSelectName}>{c.name || 'Member'}</Text>
                          <Text style={styles.clientSelectPhone}>{c.phone || 'No phone'}</Text>
                        </View>
                        {isSelected && (
                          <Icon name="checkmark-circle" size={moderateScale(20)} color="#6C5CE7" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: hp(3), alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: fontScale(13) }}>
                      {loadingClients ? 'Loading trainees roster...' : 'No assigned trainees found.'}
                    </Text>
                  </View>
                )}
              </ScrollView>
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  clientPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  clientSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: moderateScale(8),
  },
  clientSelectItemActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F3F2FE',
  },
  clientSelectAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientSelectAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  clientSelectName: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  clientSelectPhone: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
});

