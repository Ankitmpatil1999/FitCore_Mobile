import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const clockImg = require('../../assets/Icons2/clock.png');
const kcalIconImg = require('../../assets/Icons/kcal.png');

export default function ActiveWorkoutScreen({ route, navigation }: any) {
  const { title } = route?.params || {};
  const [secondsElapsed, setSecondsElapsed] = useState(145);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({ 0: 2, 1: 0, 2: 0 });
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const workoutList = [
    { name: 'Lat Pulldown', targetSets: 4, targetReps: '12 reps', weight: '40 kg', muscle: 'Back' },
    { name: 'Seated Cable Row', targetSets: 4, targetReps: '12 reps', weight: '45 kg', muscle: 'Back' },
    { name: 'Deadlift', targetSets: 4, targetReps: '10 reps', weight: '70 kg', muscle: 'Back/Glutes' },
    { name: 'Bicep Barbell Curl', targetSets: 3, targetReps: '12 reps', weight: '20 kg', muscle: 'Biceps' },
    { name: 'Hammer Curls', targetSets: 3, targetReps: '15 reps', weight: '12.5 kg', muscle: 'Biceps' },
  ];

  // Live Timer
  useEffect(() => {
    let timer: any = null;
    if (!isPaused) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPaused]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const caloriesBurned = Math.round((secondsElapsed / 60) * 7.5);
  const currentEx = workoutList[currentExIndex];
  const nextEx = currentExIndex < workoutList.length - 1 ? workoutList[currentExIndex + 1] : null;
  const currentExSetsDone = completedSets[currentExIndex] || 0;

  const handleCompleteSet = () => {
    if (currentExSetsDone < currentEx.targetSets) {
      setCompletedSets((prev) => ({
        ...prev,
        [currentExIndex]: (prev[currentExIndex] || 0) + 1,
      }));
    } else {
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentExIndex < workoutList.length - 1) {
      setCurrentExIndex((prev) => prev + 1);
    } else {
      setShowFinishModal(true);
    }
  };

  const handleFinishWorkout = () => {
    setShowFinishModal(false);
    navigation.goBack();
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowExitModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.sessionStatusBadge}>
              <View style={styles.sessionStatusDot} />
              <Text style={styles.headerSessionTag}>LIVE SESSION</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Back & Biceps'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.pauseBtn, isPaused && styles.pauseBtnActive]}
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pauseBtnText, isPaused && styles.pauseBtnTextActive]}>
              {isPaused ? '▶' : '⏸'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── LIVE HUD METRICS ── */}
          <View style={styles.hudCard}>
            <View style={styles.hudCol}>
              <View style={styles.hudIconBox}>
                <Image source={clockImg} style={styles.hudIcon} resizeMode="contain" />
              </View>
              <Text style={styles.hudValText}>{formatTime(secondsElapsed)}</Text>
              <Text style={styles.hudLblText}>Time Elapsed</Text>
            </View>

            <View style={styles.hudDivider} />

            <View style={styles.hudCol}>
              <View style={[styles.hudIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.10)' }]}>
                <Image source={kcalIconImg} style={[styles.hudIcon, { tintColor: '#EF4444' }]} resizeMode="contain" />
              </View>
              <Text style={styles.hudValText}>{caloriesBurned} <Text style={{ fontSize: fontScale(11) }}>kcal</Text></Text>
              <Text style={styles.hudLblText}>Burned</Text>
            </View>

            <View style={styles.hudDivider} />

            <View style={styles.hudCol}>
              <View style={[styles.hudIconBox, { backgroundColor: 'rgba(0, 196, 140, 0.10)' }]}>
                <Image source={dumbbellIcon} style={[styles.hudIcon, { tintColor: '#00A86B' }]} resizeMode="contain" />
              </View>
              <Text style={styles.hudValText}>
                {currentExIndex + 1}/{workoutList.length}
              </Text>
              <Text style={styles.hudLblText}>Movement</Text>
            </View>
          </View>

          {/* ── CURRENT EXERCISE HERO ── */}
          <View style={styles.exerciseCard}>
            <View style={styles.exCardHeader}>
              <View>
                <Text style={styles.exCardCategory}>{currentEx.muscle.toUpperCase()} FOCUS</Text>
                <Text style={styles.exCardName}>{currentEx.name}</Text>
              </View>
              <View style={styles.weightBadge}>
                <Text style={styles.weightBadgeText}>{currentEx.weight}</Text>
              </View>
            </View>

            {/* Set Progression */}
            <Text style={styles.setRowTitle}>Sets Target ({currentEx.targetSets} Sets)</Text>
            <View style={styles.setCirclesRow}>
              {Array.from({ length: currentEx.targetSets }).map((_, i) => {
                const isSetDone = i < currentExSetsDone;
                const isCurrentSet = i === currentExSetsDone;
                return (
                  <View
                    key={i}
                    style={[
                      styles.setCircle,
                      isSetDone && styles.setCircleDone,
                      isCurrentSet && styles.setCircleCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.setCircleText,
                        (isSetDone || isCurrentSet) && styles.setCircleTextLight,
                      ]}
                    >
                      {isSetDone ? '✓' : i + 1}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Log Set CTA */}
            <TouchableOpacity
              style={styles.logSetBtn}
              onPress={handleCompleteSet}
              activeOpacity={0.85}
            >
              <Text style={styles.logSetBtnText}>
                {currentExSetsDone < currentEx.targetSets
                  ? `LOG SET ${currentExSetsDone + 1} (${currentEx.targetReps}) ✓`
                  : 'NEXT EXERCISE →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── UP NEXT PREVIEW ── */}
          {nextEx && (
            <View style={styles.upNextCard}>
              <Text style={styles.upNextLabel}>UP NEXT</Text>
              <Text style={styles.upNextTitle}>{nextEx.name}</Text>
              <Text style={styles.upNextMeta}>
                {nextEx.targetSets} Sets • {nextEx.targetReps} • {nextEx.weight}
              </Text>
            </View>
          )}

          {/* ── FINISH SESSION BUTTON ── */}
          <TouchableOpacity
            style={styles.finishEarlyBtn}
            onPress={() => setShowFinishModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.finishEarlyBtnText}>FINISH WORKOUT SESSION</Text>
          </TouchableOpacity>

          <View style={{ height: hp(6) }} />
        </ScrollView>

        {/* ── 1. CUSTOM CLEAN EXIT CONFIRMATION MODAL ── */}
        <Modal visible={showExitModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.exitIconCircle}>
                <Text style={{ fontSize: fontScale(32) }}>⏸️</Text>
              </View>

              <Text style={styles.modalTitle}>Exit Workout Session?</Text>
              <Text style={styles.modalSub}>
                Your active timer and logged sets for this session will be paused.
              </Text>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.resumePrimaryBtn}
                onPress={() => setShowExitModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.resumePrimaryBtnText}>RESUME WORKOUT ▶</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitSecondaryBtn}
                onPress={handleConfirmExit}
                activeOpacity={0.75}
              >
                <Text style={styles.exitSecondaryBtnText}>Exit & Save Progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── 2. FINISH CELEBRATION MODAL ── */}
        <Modal visible={showFinishModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.trophyIconBox}>
                <Text style={{ fontSize: fontScale(36) }}>🏆</Text>
              </View>

              <Text style={styles.modalTitle}>Workout Completed!</Text>
              <Text style={styles.modalSub}>Incredible effort on today's session!</Text>

              <View style={styles.modalStatsRow}>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>{formatTime(secondsElapsed)}</Text>
                  <Text style={styles.modalStatLbl}>Duration</Text>
                </View>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>{caloriesBurned} kcal</Text>
                  <Text style={styles.modalStatLbl}>Calories</Text>
                </View>
                <View style={styles.modalStatCol}>
                  <Text style={styles.modalStatVal}>+{currentExIndex + 1 * 25} XP</Text>
                  <Text style={styles.modalStatLbl}>Points</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveWorkoutBtn}
                onPress={handleFinishWorkout}
                activeOpacity={0.85}
              >
                <Text style={styles.saveWorkoutBtnText}>SAVE TO HISTORY</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  closeBtn: {
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
  closeBtnText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  sessionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    marginBottom: 2,
  },
  sessionStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  headerSessionTag: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  pauseBtn: {
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
  pauseBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  pauseBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  pauseBtnTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // HUD
  hudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  hudCol: {
    flex: 1,
    alignItems: 'center',
  },
  hudIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hudIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    tintColor: '#6C5CE7',
  },
  hudValText: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  hudLblText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  hudDivider: {
    width: 1,
    height: moderateScale(30),
    backgroundColor: '#F1F5F9',
  },

  // Exercise card
  exerciseCard: {
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
  exCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.4),
  },
  exCardCategory: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  exCardName: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  weightBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  weightBadgeText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#334155',
  },
  setRowTitle: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: moderateScale(8),
  },
  setCirclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  setCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCircleDone: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  setCircleCurrent: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  setCircleText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#64748B',
  },
  setCircleTextLight: {
    color: '#FFFFFF',
  },
  logSetBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  logSetBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Up next
  upNextCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  upNextLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  upNextTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  upNextMeta: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },

  // Finish Early
  finishEarlyBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  finishEarlyBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },

  // Modal
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
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  exitIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  trophyIconBox: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  modalTitle: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    marginBottom: hp(2.2),
    textAlign: 'center',
    lineHeight: fontScale(18),
  },
  resumePrimaryBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    marginBottom: moderateScale(10),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  resumePrimaryBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  exitSecondaryBtn: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exitSecondaryBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#64748B',
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    width: '100%',
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalStatLbl: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },
  saveWorkoutBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
  },
  saveWorkoutBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
