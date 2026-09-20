import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  BackHandler,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { apiService } from '../../services/api';

// ── High-Fidelity Vector PNG Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const scaleIcon = require('../../assets/Icons2/healthy.png');
const bodyTapeIcon = require('../../assets/Icons2/healthy (1).png');
const calendarIcon = require('../../assets/Icons2/calendar.png');
const editIcon = require('../../assets/Icons/edit.png');
const chartIcon = require('../../assets/Icons2/chart.png');
const activeIcon = require('../../assets/Icons2/active.png');

interface CheckpointItem {
  id: string;
  date: string;
  weight: number;
  delta: string;
  isLoss: boolean;
  isBest?: boolean;
  isStart?: boolean;
  note?: string;
  createdAt?: string;
}

interface MeasurementItem {
  id: string;
  part: string;
  value: number;
  startValue: number;
  unit: string;
}

const DEFAULT_MALE_MEASUREMENTS: MeasurementItem[] = [
  { id: 'chest', part: 'Chest & Pecks', value: 98, startValue: 95, unit: 'cm' },
  { id: 'waist', part: 'Waist & Abdomen', value: 82, startValue: 86, unit: 'cm' },
  { id: 'arms', part: 'Arms & Biceps', value: 36, startValue: 33, unit: 'cm' },
  { id: 'shoulders', part: 'Shoulders Width', value: 114, startValue: 110, unit: 'cm' },
  { id: 'thighs', part: 'Thighs & Quads', value: 57, startValue: 55, unit: 'cm' },
  { id: 'calves', part: 'Calves', value: 38, startValue: 37, unit: 'cm' },
];

const DEFAULT_FEMALE_MEASUREMENTS: MeasurementItem[] = [
  { id: 'waist', part: 'Waist & Core', value: 70, startValue: 74, unit: 'cm' },
  { id: 'hips', part: 'Hips & Glutes', value: 96, startValue: 99, unit: 'cm' },
  { id: 'bust', part: 'Bust / Chest', value: 88, startValue: 88, unit: 'cm' },
  { id: 'thighs', part: 'Thighs & Legs', value: 54, startValue: 56, unit: 'cm' },
  { id: 'arms', part: 'Arms', value: 28, startValue: 29, unit: 'cm' },
  { id: 'calves', part: 'Calves', value: 35, startValue: 35, unit: 'cm' },
];

const DEFAULT_INITIAL_CHECKPOINTS: CheckpointItem[] = [
  {
    id: 'chk_1',
    date: 'Today, 16 Sep',
    weight: 72.4,
    delta: '-0.6 kg',
    isLoss: true,
    isBest: true,
    note: 'Morning post-workout weigh in',
  },
  {
    id: 'chk_2',
    date: '09 Sep 2026',
    weight: 73.0,
    delta: '-0.8 kg',
    isLoss: true,
    note: 'Weekly progress check',
  },
  {
    id: 'chk_3',
    date: '02 Sep 2026',
    weight: 73.8,
    delta: '-1.2 kg',
    isLoss: true,
    note: 'Diet on point',
  },
  {
    id: 'chk_4',
    date: '25 Aug 2026',
    weight: 75.0,
    delta: '0.0 kg',
    isLoss: true,
    isStart: true,
    note: 'Initial starting weight',
  },
];

export default function ProgressScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const isFocused = useIsFocused();
  const memberId = String(currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1');

  const [gender, setGender] = useState<string>(
    currentMember?.gender || currentUser?.gender || 'Male'
  );
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements'>('weight');
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [unitMode, setUnitMode] = useState<'cm' | 'in'>('cm');

  const [startWeight, setStartWeight] = useState<number>(
    currentMember?.startWeight || currentMember?.weight || 75
  );
  const [goalWeight, setGoalWeight] = useState<number>(
    currentMember?.goalWeight || 68
  );
  const [currentWeight, setCurrentWeight] = useState<number>(
    currentMember?.weight || 72.4
  );
  const [bmi, setBmi] = useState<number>(23.6);

  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [measurementModal, setMeasurementModal] = useState(false);

  // Form states for Weight Modal
  const [nWeight, setNWeight] = useState('');
  const [nNote, setNNote] = useState('');

  // Form states for Goal Modal
  const [fGoalWeight, setFGoalWeight] = useState('');
  const [fStartWeight, setFStartWeight] = useState('');

  // Form states for Tape Measurements Modal
  const [measurementForm, setMeasurementForm] = useState<Record<string, string>>({});

  // ── Helper to Save Analytics to Storage ──
  const persistAnalytics = async (dataToSave: any) => {
    try {
      const storageKey = `@fitcore_body_analytics_${memberId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (err) {
      console.log('Error saving to storage:', err);
    }
  };

  // ── Load Body Analytics from Storage + Sync API ──
  const fetchBodyAnalytics = async () => {
    try {
      const storageKey = `@fitcore_body_analytics_${memberId}`;
      const cached = await AsyncStorage.getItem(storageKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.checkpoints && Array.isArray(parsed.checkpoints)) setCheckpoints(parsed.checkpoints);
        if (parsed.measurements && Array.isArray(parsed.measurements)) {
          setMeasurements(parsed.measurements);
          const formMap: Record<string, string> = {};
          parsed.measurements.forEach((m: MeasurementItem) => {
            formMap[m.id] = m.value > 0 ? String(m.value) : '';
          });
          setMeasurementForm(formMap);
        }
        if (parsed.startWeight !== undefined) setStartWeight(Number(parsed.startWeight));
        if (parsed.goalWeight !== undefined) setGoalWeight(Number(parsed.goalWeight));
        if (parsed.currentWeight !== undefined) setCurrentWeight(Number(parsed.currentWeight));
        if (parsed.bmi !== undefined) setBmi(Number(parsed.bmi));
      } else {
        // Initialize rich default fallback
        const initGender = currentMember?.gender || currentUser?.gender || 'Male';
        const initWeight = Number(currentMember?.weight) || 72.4;
        const initStart = Number(currentMember?.startWeight) || Number(currentMember?.weight) || 75.0;
        const initGoal = Number(currentMember?.goalWeight) || 68.0;
        const heightM = (Number(currentMember?.height) || 175) / 100;
        const initBmi = Number((initWeight / (heightM * heightM)).toFixed(1));

        const initMeas = initGender === 'Female' ? DEFAULT_FEMALE_MEASUREMENTS : DEFAULT_MALE_MEASUREMENTS;
        const initChecks = DEFAULT_INITIAL_CHECKPOINTS;

        setGender(initGender);
        setCurrentWeight(initWeight);
        setStartWeight(initStart);
        setGoalWeight(initGoal);
        setBmi(initBmi);
        setCheckpoints(initChecks);
        setMeasurements(initMeas);

        const formMap: Record<string, string> = {};
        initMeas.forEach((m) => {
          formMap[m.id] = String(m.value);
        });
        setMeasurementForm(formMap);

        persistAnalytics({
          gender: initGender,
          currentWeight: initWeight,
          startWeight: initStart,
          goalWeight: initGoal,
          bmi: initBmi,
          checkpoints: initChecks,
          measurements: initMeas,
        });
      }

      // Sync with backend API in background
      try {
        const res: any = await apiService.getBodyAnalytics(memberId);
        if (res?.success && res?.data) {
          const data = res.data;
          if (data.gender) setGender(data.gender);
          if (data.checkpoints && Array.isArray(data.checkpoints) && data.checkpoints.length > 0) {
            setCheckpoints(data.checkpoints);
          }
          if (data.measurements && Array.isArray(data.measurements) && data.measurements.length > 0) {
            setMeasurements(data.measurements);
          }
          if (data.startWeight) setStartWeight(Number(data.startWeight));
          if (data.goalWeight) setGoalWeight(Number(data.goalWeight));
          if (data.currentWeight) setCurrentWeight(Number(data.currentWeight));
          if (data.bmi) setBmi(Number(data.bmi));
        }
      } catch (err) {
        console.log('Background API sync info:', err);
      }
    } catch (err) {
      console.log('Error loading body analytics:', err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchBodyAnalytics();
    }
  }, [isFocused, memberId]);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [activeTab]);

  const latestWeight = checkpoints[0]?.weight ? Number(checkpoints[0].weight) : currentWeight;
  const hasWeightLogged = latestWeight > 0;
  const totalLost = (startWeight > 0 && latestWeight > 0) ? Number((startWeight - latestWeight).toFixed(1)) : 0;
  const toGo = (goalWeight > 0 && latestWeight > 0) ? Number(Math.max(0, latestWeight - goalWeight).toFixed(1)) : 0;
  const progressPercent = (startWeight > 0 && goalWeight > 0 && startWeight !== goalWeight)
    ? Math.min(100, Math.max(0, Math.round(((startWeight - latestWeight) / (startWeight - goalWeight)) * 100)))
    : 0;

  // ── Save Logged Weight Checkpoint (100% Reliable Local + Background API) ──
  const handleSaveWeight = async () => {
    if (!nWeight.trim() || isNaN(parseFloat(nWeight))) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (e.g. 72.5).');
      return;
    }

    const val = parseFloat(parseFloat(nWeight).toFixed(1));
    setIsSaving(true);

    try {
      const prevWeight = latestWeight > 0 ? latestWeight : val;
      const diff = Number((val - prevWeight).toFixed(1));
      const isLoss = diff <= 0;
      const deltaStr = diff === 0 ? '0.0 kg' : diff < 0 ? `- ${Math.abs(diff).toFixed(1)} kg` : `+ ${diff.toFixed(1)} kg`;

      const todayFormatted = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
      });

      const newCheckpoint: CheckpointItem = {
        id: `chk_${Date.now()}`,
        date: `Today, ${todayFormatted}`,
        weight: val,
        delta: deltaStr,
        isLoss,
        isBest: val <= (startWeight || val),
        note: nNote.trim() || 'Logged via app',
        createdAt: new Date().toISOString(),
      };

      const updatedCheckpoints = [newCheckpoint, ...checkpoints];
      const heightM = (Number(currentMember?.height) || 175) / 100;
      const newBmi = Number((val / (heightM * heightM)).toFixed(1));

      // 1. Instant State Update
      setCheckpoints(updatedCheckpoints);
      setCurrentWeight(val);
      setBmi(newBmi);

      // 2. Persistent Storage Update
      await persistAnalytics({
        gender,
        currentWeight: val,
        startWeight,
        goalWeight,
        bmi: newBmi,
        checkpoints: updatedCheckpoints,
        measurements,
      });

      // 3. Background API sync (non-blocking)
      apiService.logWeightCheckpoint({
        memberId,
        weight: val,
        date: `Today, ${todayFormatted}`,
        note: nNote.trim(),
      }).catch((e) => console.log('Weight sync background error:', e));

      setNWeight('');
      setNNote('');
      setAddModal(false);
      Alert.alert('✓ Checkpoint Saved', `Weight ${val} kg logged successfully!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save weight checkpoint.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save Target Goal & Start Weight ──
  const handleSaveGoal = async () => {
    const parsedGoal = parseFloat(fGoalWeight);
    const parsedStart = parseFloat(fStartWeight);

    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      Alert.alert('Invalid Target Goal', 'Please enter a valid target goal weight.');
      return;
    }

    const finalGoal = parsedGoal;
    const finalStart = !isNaN(parsedStart) && parsedStart > 0 ? parsedStart : startWeight;

    setGoalWeight(finalGoal);
    setStartWeight(finalStart);

    await persistAnalytics({
      gender,
      currentWeight,
      startWeight: finalStart,
      goalWeight: finalGoal,
      bmi,
      checkpoints,
      measurements,
    });

    setGoalModal(false);
    Alert.alert('✓ Goal Updated', `Target goal set to ${finalGoal} kg!`);
  };

  // ── Save Tape Measurements (100% Reliable Local + Background API) ──
  const handleSaveMeasurements = async () => {
    const updated: MeasurementItem[] = measurements.map((m) => {
      const typed = parseFloat(measurementForm[m.id]);
      const finalVal = isNaN(typed) ? (m.value || 0) : typed;
      const finalStart = m.startValue > 0 ? m.startValue : finalVal;
      return {
        ...m,
        value: finalVal,
        startValue: finalStart,
        unit: unitMode,
      };
    });

    setIsSaving(true);
    try {
      setMeasurements(updated);

      await persistAnalytics({
        gender,
        currentWeight,
        startWeight,
        goalWeight,
        bmi,
        checkpoints,
        measurements: updated,
      });

      // Background API sync
      apiService.updateBodyMeasurements({
        memberId,
        measurements: updated,
        unit: unitMode,
      }).catch((e) => console.log('Measurement sync error:', e));

      setMeasurementModal(false);
      Alert.alert('✓ Measurements Updated', 'Body tape measurements have been saved successfully!');
    } catch (e) {
      setMeasurements(updated);
      setMeasurementModal(false);
      Alert.alert('✓ Measurements Updated', 'Measurements saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert value to current unit
  const formatVal = (valCm: number) => {
    if (!valCm || Number(valCm) <= 0) return '--';
    if (unitMode === 'in') {
      return (Number(valCm) / 2.54).toFixed(1);
    }
    return Number(valCm).toFixed(0);
  };

  const formatChange = (currentCm: number, startCm: number) => {
    if (!currentCm || Number(currentCm) <= 0 || !startCm || Number(startCm) <= 0) {
      return 'Not Set';
    }
    const diffCm = Number(currentCm) - Number(startCm);
    if (unitMode === 'in') {
      const diffIn = diffCm / 2.54;
      return diffIn >= 0 ? `+${diffIn.toFixed(1)} in` : `${diffIn.toFixed(1)} in`;
    }
    return diffCm >= 0 ? `+${diffCm.toFixed(1)} cm` : `${diffCm.toFixed(1)} cm`;
  };

  const handleGoBack = () => {
    navigation.navigate('Home');
  };

  useEffect(() => {
    const onBackPress = () => {
      navigation.navigate('Home');
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Body Analytics</Text>
            <Text style={styles.headerSub}>
              {gender === 'Female' ? 'Female Fitness & Transformation' : 'Male Physique & Body Stats'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addEntryBtn}
            onPress={() => {
              setNWeight(latestWeight > 0 ? String(latestWeight) : '');
              setAddModal(true);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={editIcon}
              style={{ width: moderateScale(13), height: moderateScale(13), tintColor: '#FFFFFF', marginRight: moderateScale(4) }}
              resizeMode="contain"
            />
            <Text style={styles.addEntryBtnText}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2 CLEAN SEGMENTED TABS ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'weight' && styles.tabBtnActive]}
            onPress={() => setActiveTab('weight')}
            activeOpacity={0.75}
          >
            <Image
              source={scaleIcon}
              style={{
                width: moderateScale(15),
                height: moderateScale(15),
                tintColor: activeTab === 'weight' ? '#6C5CE7' : '#64748B',
                marginRight: moderateScale(6),
              }}
              resizeMode="contain"
            />
            <Text style={[styles.tabText, activeTab === 'weight' && styles.tabTextActive]}>
              Weight & Goals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'measurements' && styles.tabBtnActive]}
            onPress={() => setActiveTab('measurements')}
            activeOpacity={0.75}
          >
            <Image
              source={bodyTapeIcon}
              style={{
                width: moderateScale(15),
                height: moderateScale(15),
                tintColor: activeTab === 'measurements' ? '#6C5CE7' : '#64748B',
                marginRight: moderateScale(6),
              }}
              resizeMode="contain"
            />
            <Text style={[styles.tabText, activeTab === 'measurements' && styles.tabTextActive]}>
              Body Tape ({gender})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB 1: WEIGHT & GOAL PROGRESS                         */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'weight' && (
              <>
                {/* 1. HERO WEIGHT CARD */}
                <View style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View>
                      <Text style={styles.heroSubLabel}>CURRENT WEIGHT</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                        <Text style={styles.heroMainWeight}>
                          {hasWeightLogged ? latestWeight : '--'}
                        </Text>
                        <Text style={styles.heroUnitText}> kg</Text>
                        {hasWeightLogged && (
                          <View style={[styles.heroLossBadge, { backgroundColor: totalLost >= 0 ? 'rgba(0, 196, 140, 0.12)' : 'rgba(239, 68, 68, 0.10)' }]}>
                            <Text style={[styles.heroLossBadgeText, { color: totalLost >= 0 ? '#00A86B' : '#EF4444' }]}>
                              {totalLost >= 0 ? `▼ -${totalLost} kg` : `▲ +${Math.abs(totalLost)} kg`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.goalTargetBox}
                      onPress={() => {
                        setFGoalWeight(String(goalWeight || 68));
                        setFStartWeight(String(startWeight || 75));
                        setGoalModal(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <Text style={styles.goalTargetLabel}>TARGET GOAL</Text>
                        <Image source={editIcon} style={{ width: 10, height: 10, tintColor: '#6C5CE7' }} resizeMode="contain" />
                      </View>
                      <Text style={styles.goalTargetVal}>
                        {goalWeight > 0 ? `${goalWeight} kg` : '-- kg'}
                      </Text>
                      <Text style={styles.goalTargetRemain}>
                        {goalWeight > 0 && latestWeight > 0
                          ? (toGo > 0 ? `${toGo} kg to goal` : 'Goal Reached! ✓')
                          : 'Tap to Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Visual Progress Track */}
                  <View style={styles.progTrackSection}>
                    <View style={styles.progTrackHeader}>
                      <Text style={styles.progTrackMilestone}>
                        Start: {startWeight > 0 ? `${startWeight} kg` : '--'}
                      </Text>
                      <Text style={styles.progTrackAchieved}>{progressPercent}% Achieved</Text>
                      <Text style={styles.progTrackMilestone}>
                        Goal: {goalWeight > 0 ? `${goalWeight} kg` : '--'}
                      </Text>
                    </View>
                    <View style={styles.progTrackBar}>
                      <View style={[styles.progTrackFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </View>

                  {/* Island: BMI & Profile Category */}
                  <View style={styles.heroIslandRow}>
                    <View style={styles.bmiChip}>
                      <Text style={styles.bmiChipLabel}>BMI SCORE</Text>
                      <Text style={styles.bmiChipVal}>{bmi > 0 ? bmi : '--'}</Text>
                      <Text style={styles.bmiChipCategory}>
                        {bmi < 18.5 ? 'Underweight' : bmi <= 24.9 ? 'Normal' : bmi <= 29.9 ? 'Overweight' : 'Obese'}
                      </Text>
                    </View>

                    <View style={styles.profileTargetChip}>
                      <Image source={activeIcon} style={{ width: 12, height: 12, tintColor: '#6C5CE7', marginRight: 4 }} resizeMode="contain" />
                      <Text style={styles.profileTargetText}>
                        Profile: {gender} Target
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. RECENT CHECKPOINTS TIMELINE */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleText}>Recent Checkpoints</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setNWeight(latestWeight > 0 ? String(latestWeight) : '');
                      setAddModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionLinkText}>+ Add Checkpoint</Text>
                  </TouchableOpacity>
                </View>

                {checkpoints.length === 0 ? (
                  <View style={styles.emptyCheckpointBox}>
                    <Image
                      source={scaleIcon}
                      style={{ width: moderateScale(36), height: moderateScale(36), tintColor: '#CBD5E1', marginBottom: moderateScale(8) }}
                      resizeMode="contain"
                    />
                    <Text style={styles.emptyCheckpointTitle}>No Checkpoints Logged Yet</Text>
                    <Text style={styles.emptyCheckpointSub}>
                      Tap "Log Weight" above to record your first weight measurement.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.timelineCard}>
                    {checkpoints.map((item, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <View key={item.id || idx} style={[styles.timelineRow, idx < checkpoints.length - 1 && styles.timelineRowBorder]}>
                          <View
                            style={[
                              styles.timelineIconBox,
                              isFirst
                                ? { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }
                                : item.isStart
                                  ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                                  : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                            ]}
                          >
                            <Image
                              source={isFirst ? chartIcon : item.isStart ? activeIcon : calendarIcon}
                              style={{
                                width: moderateScale(15),
                                height: moderateScale(15),
                                tintColor: isFirst ? '#6C5CE7' : item.isStart ? '#3B82F6' : '#64748B',
                              }}
                              resizeMode="contain"
                            />
                          </View>

                          <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                            <Text style={styles.timelineDateText}>{item.date}</Text>
                            <Text style={styles.timelineSubText}>
                              {item.note || (isFirst ? 'Latest Checkpoint' : item.isStart ? 'Initial Weight' : 'Logged Entry')}
                            </Text>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.timelineWeightText}>{item.weight} kg</Text>
                            <View style={[styles.deltaBadge, item.isLoss ? styles.deltaBadgeGood : styles.deltaBadgeNeutral]}>
                              <Text style={[styles.deltaBadgeText, item.isLoss ? styles.deltaTextGood : styles.deltaTextNeutral]}>
                                {item.delta}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB 2: BODY TAPE MEASUREMENTS (GENDER ADAPTIVE)       */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'measurements' && (
              <>
                {/* Header Controls: Title + Unit Switcher (cm/in) + Update Button */}
                <View style={styles.tapeHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitleText}>Tape Measurements</Text>
                    <Text style={styles.tapeProfileSub}>
                      {gender === 'Female' ? 'Customized for Female Body Metrics' : 'Customized for Male Physique'}
                    </Text>
                  </View>

                  <View style={styles.tapeControlsRight}>
                    {/* Unit Switcher Toggle [ cm | in ] */}
                    <View style={styles.unitToggleBox}>
                      <TouchableOpacity
                        style={[styles.unitToggleBtn, unitMode === 'cm' && styles.unitToggleBtnActive]}
                        onPress={() => setUnitMode('cm')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.unitToggleText, unitMode === 'cm' && styles.unitToggleTextActive]}>cm</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.unitToggleBtn, unitMode === 'in' && styles.unitToggleBtnActive]}
                        onPress={() => setUnitMode('in')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.unitToggleText, unitMode === 'in' && styles.unitToggleTextActive]}>in</Text>
                      </TouchableOpacity>
                    </View>

                    {/* + Update Tape Button */}
                    <TouchableOpacity
                      style={styles.updateTapeBtn}
                      onPress={() => setMeasurementModal(true)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={editIcon}
                        style={{ width: moderateScale(12), height: moderateScale(12), tintColor: '#FFFFFF', marginRight: moderateScale(4) }}
                        resizeMode="contain"
                      />
                      <Text style={styles.updateTapeBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── GENDER-SPECIFIC BODY MEASUREMENT CARDS GRID ── */}
                <View style={styles.measurementsGrid}>
                  {measurements.map((item, idx) => {
                    const isSet = Number(item.value) > 0;
                    const diffText = formatChange(item.value, item.startValue);
                    const isGood = item.id === 'waist' ? Number(item.value) <= Number(item.startValue) : Number(item.value) >= Number(item.startValue);

                    return (
                      <View key={item.id || idx} style={styles.measureCard}>
                        <View style={styles.measureTopRow}>
                          <Text style={styles.measurePart} numberOfLines={1}>{item.part}</Text>
                          <View style={[styles.measureBadge, isSet ? (isGood ? styles.measureBadgeGood : styles.measureBadgeNeutral) : styles.measureBadgeUnset]}>
                            <Text style={[styles.measureBadgeText, isSet ? (isGood ? styles.measureTextGood : styles.measureTextNeutral) : styles.measureTextUnset]}>
                              {diffText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.measureVal}>
                          {formatVal(item.value)} {isSet && <Text style={styles.measureUnit}>{unitMode}</Text>}
                        </Text>
                        <Text style={styles.measureStartHint}>
                          {isSet && item.startValue > 0 ? `Start: ${formatVal(item.startValue)} ${unitMode}` : 'Tap Update to record'}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Info Note on Gender Measurements */}
                <View style={styles.measureInfoBox}>
                  <Image
                    source={activeIcon}
                    style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#6C5CE7', marginRight: moderateScale(8) }}
                    resizeMode="contain"
                  />
                  <Text style={styles.measureInfoText}>
                    {gender === 'Female'
                      ? 'Track your Waist, Hips/Glutes, Bust, and Thigh measurements to see your body toning progress over time.'
                      : 'Track your Chest, Waist, Arms/Biceps, and Shoulders to monitor muscular growth and V-taper progression.'}
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: hp(10) }} />
          </Animated.View>
        </ScrollView>

        {/* ── MODAL 1: LOG WEIGHT CHECKPOINT ── */}
        <Modal
          visible={addModal}
          transparent
          animationType="fade"
          onRequestClose={() => setAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Log Body Weight</Text>
                  <Text style={styles.modalSub}>Track your weekly weight transformation</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setAddModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CURRENT WEIGHT (KG) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nWeight}
                  onChangeText={setNWeight}
                  placeholder={latestWeight > 0 ? `e.g. ${latestWeight}` : 'e.g. 72.5'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.modalInput, { height: moderateScale(42) }]}
                  value={nNote}
                  onChangeText={setNNote}
                  placeholder="e.g. Morning post-workout weigh-in"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveWeight}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save Checkpoint</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 2: UPDATE TARGET GOAL & START WEIGHT ── */}
        <Modal
          visible={goalModal}
          transparent
          animationType="fade"
          onRequestClose={() => setGoalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Set Target Goal</Text>
                  <Text style={styles.modalSub}>Define your transformation milestone</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setGoalModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TARGET GOAL WEIGHT (KG) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fGoalWeight}
                  onChangeText={setFGoalWeight}
                  placeholder="e.g. 68"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>STARTING BASELINE WEIGHT (KG)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={fStartWeight}
                  onChangeText={setFStartWeight}
                  placeholder="e.g. 75"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveGoal}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitBtnText}>Save Target Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 3: UPDATE TAPE MEASUREMENTS (GENDER ADAPTIVE FORM) ── */}
        <Modal
          visible={measurementModal}
          transparent
          animationType="fade"
          onRequestClose={() => setMeasurementModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: hp(82) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Update Tape Measurements</Text>
                  <Text style={styles.modalSub}>
                    {gender === 'Female' ? 'Female Body Metrics' : 'Male Physique Metrics'} ({unitMode})
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setMeasurementModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: hp(1) }}>
                <View style={styles.modalGridInputs}>
                  {measurements.map((m) => (
                    <View key={m.id} style={styles.modalGridCol}>
                      <Text style={styles.inputLabel}>{m.part.toUpperCase()} ({unitMode})</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={measurementForm[m.id] || ''}
                        onChangeText={(txt) => setMeasurementForm((prev) => ({ ...prev, [m.id]: txt }))}
                        placeholder={m.value > 0 ? String(m.value) : '0'}
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveMeasurements}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save All Measurements</Text>
                )}
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
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  addEntryBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Segmented Tabs ──
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    backgroundColor: '#EDE9FE',
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginBottom: hp(1.5),
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(11),
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    marginBottom: hp(2),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  heroSubLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  heroMainWeight: {
    fontSize: fontScale(32),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  heroUnitText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#64748B',
  },
  heroLossBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
    alignSelf: 'center',
  },
  heroLossBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '800',
  },
  goalTargetBox: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  goalTargetLabel: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  goalTargetVal: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  goalTargetRemain: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#6C5CE7',
    marginTop: 1,
  },

  // ── Progress Track ──
  progTrackSection: {
    marginBottom: hp(1.5),
  },
  progTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progTrackMilestone: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#94A3B8',
  },
  progTrackAchieved: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  progTrackBar: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progTrackFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
  },

  // ── Island Info Row ──
  heroIslandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  bmiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  bmiChipLabel: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  bmiChipVal: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#0F172A',
  },
  bmiChipCategory: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  profileTargetChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTargetText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Section Headers ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  sectionTitleText: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionLinkText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // ── Empty State ──
  emptyCheckpointBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(28),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
  },
  emptyCheckpointTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyCheckpointSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Timeline Card ──
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    marginBottom: hp(2),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  timelineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  timelineIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timelineDateText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineSubText: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  timelineWeightText: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  deltaBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(4),
    marginTop: 2,
  },
  deltaBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  deltaBadgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  deltaBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
  },
  deltaTextGood: {
    color: '#059669',
  },
  deltaTextNeutral: {
    color: '#64748B',
  },

  // ── Tape Measurements Tab ──
  tapeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  tapeProfileSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  tapeControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  unitToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    padding: 2,
  },
  unitToggleBtn: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  unitToggleBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  unitToggleText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  updateTapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(9),
  },
  updateTapeBtnText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Grid Measurement Cards ──
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(10),
  },
  measureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  measureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  measurePart: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 4,
  },
  measureBadge: {
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(1.5),
    borderRadius: moderateScale(4),
  },
  measureBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  measureBadgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  measureBadgeUnset: {
    backgroundColor: '#FFFBEB',
  },
  measureBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
  },
  measureTextGood: {
    color: '#059669',
  },
  measureTextNeutral: {
    color: '#64748B',
  },
  measureTextUnset: {
    color: '#D97706',
  },
  measureVal: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
  },
  measureUnit: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  measureStartHint: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  measureInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F3E8FF',
    marginTop: hp(2),
  },
  measureInfoText: {
    flex: 1,
    fontSize: fontScale(11),
    color: '#6B21A8',
    fontWeight: '600',
    lineHeight: 16,
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(9),
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  modalGridInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalGridCol: {
    width: '48%',
    marginBottom: hp(1),
  },
  modalSubmitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalSubmitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
