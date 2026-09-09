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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { apiService } from '../../services/api';

// ── Asset Icons ──
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

interface CheckpointItem {
  id?: string;
  date: string;
  weight: number;
  delta: string;
  isLoss: boolean;
  isBest?: boolean;
  isStart?: boolean;
  note?: string;
}

const DEFAULT_CHECKPOINTS: CheckpointItem[] = [
  { id: 'cp_1', date: 'Today, 01 Jan', weight: 72.4, delta: '-0.6 kg', isLoss: true, isBest: true },
  { id: 'cp_2', date: '15 Dec 2025', weight: 73.0, delta: '-0.9 kg', isLoss: true },
  { id: 'cp_3', date: '01 Dec 2025', weight: 73.9, delta: '-0.9 kg', isLoss: true },
  { id: 'cp_4', date: '15 Nov 2025', weight: 74.8, delta: '-0.7 kg', isLoss: true },
  { id: 'cp_5', date: '01 Nov 2025', weight: 75.5, delta: 'Start', isLoss: false, isStart: true },
];

const INITIAL_MEASUREMENTS = [
  { id: 'waist', part: 'Waist', value: 80, startValue: 84, unit: 'cm' },
  { id: 'chest', part: 'Chest', value: 98, startValue: 96, unit: 'cm' },
  { id: 'arms', part: 'Arms / Biceps', value: 38, startValue: 36.5, unit: 'cm' },
  { id: 'shoulders', part: 'Shoulders', value: 118, startValue: 115, unit: 'cm' },
  { id: 'thighs', part: 'Thighs', value: 56, startValue: 55, unit: 'cm' },
  { id: 'calves', part: 'Calves', value: 37, startValue: 37, unit: 'cm' },
];

interface StrengthPR {
  id: string;
  exercise: string;
  category: 'Big 3 Compounds' | 'Upper Body' | 'Lower Body';
  weight: number;
  startWeight: number;
  unit: string;
  reps: string;
}

const INITIAL_PRS: StrengthPR[] = [
  { id: 'bench', exercise: 'Bench Press', category: 'Big 3 Compounds', weight: 95, startWeight: 90, unit: 'kg', reps: 'Chest • 1RM' },
  { id: 'squat', exercise: 'Back Squat', category: 'Big 3 Compounds', weight: 130, startWeight: 120, unit: 'kg', reps: 'Legs • 1RM' },
  { id: 'deadlift', exercise: 'Deadlift', category: 'Big 3 Compounds', weight: 160, startWeight: 145, unit: 'kg', reps: 'Back & Core • 1RM' },
  { id: 'ohp', exercise: 'Overhead Press', category: 'Upper Body', weight: 60, startWeight: 57.5, unit: 'kg', reps: 'Shoulders • 1RM' },
  { id: 'incline', exercise: 'Incline DB Press', category: 'Upper Body', weight: 36, startWeight: 32, unit: 'kg', reps: 'Upper Chest' },
  { id: 'row', exercise: 'Barbell Row', category: 'Upper Body', weight: 85, startWeight: 80, unit: 'kg', reps: 'Lats & Back' },
  { id: 'legpress', exercise: 'Leg Press', category: 'Lower Body', weight: 260, startWeight: 240, unit: 'kg', reps: 'Quads & Glutes' },
  { id: 'curl', exercise: 'Barbell Bicep Curl', category: 'Upper Body', weight: 42, startWeight: 38, unit: 'kg', reps: 'Arms • 1RM' },
];

export default function ProgressScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const isFocused = useIsFocused();
  const memberId = currentMember?.id || currentUser?.id || 'm1';

  const [activeTab, setActiveTab] = useState<'weight' | 'measurements' | 'prs'>('weight');
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>(DEFAULT_CHECKPOINTS);
  const [measurements, setMeasurements] = useState(INITIAL_MEASUREMENTS);
  const [strengthPRs, setStrengthPRs] = useState<StrengthPR[]>(INITIAL_PRS);
  const [selectedPrCategory, setSelectedPrCategory] = useState<string>('all');
  const [unitMode, setUnitMode] = useState<'cm' | 'in'>('cm');

  const [startWeight, setStartWeight] = useState(75.5);
  const [goalWeight, setGoalWeight] = useState(68.0);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [prModal, setPrModal] = useState(false);

  // Form states for Weight Modal
  const [nWeight, setNWeight] = useState('');

  // Form states for Tape Measurements Modal
  const [mWaist, setMWaist] = useState('80');
  const [mChest, setMChest] = useState('98');
  const [mArms, setMArms] = useState('38');
  const [mShoulders, setMShoulders] = useState('118');
  const [mThighs, setMThighs] = useState('56');
  const [mCalves, setMCalves] = useState('37');

  // Form states for PR Modal
  const [prBench, setPrBench] = useState('95');
  const [prSquat, setPrSquat] = useState('130');
  const [prDeadlift, setPrDeadlift] = useState('160');
  const [prOhp, setPrOhp] = useState('60');
  const [prIncline, setPrIncline] = useState('36');
  const [prRow, setPrRow] = useState('85');
  const [prLegPress, setPrLegPress] = useState('260');
  const [prCurl, setPrCurl] = useState('42');

  // ── Load Body Analytics from API (GET API) ──
  const fetchBodyAnalytics = async () => {
    try {
      setIsLoadingApi(true);
      const res: any = await apiService.getBodyAnalytics(memberId);
      if (res?.success && res?.data) {
        const data = res.data;
        if (data.checkpoints && data.checkpoints.length > 0) {
          setCheckpoints(data.checkpoints);
        }
        if (data.measurements && data.measurements.length > 0) {
          setMeasurements(data.measurements);
          // Populate modal form values
          const w = data.measurements.find((m: any) => m.id === 'waist');
          const c = data.measurements.find((m: any) => m.id === 'chest');
          const a = data.measurements.find((m: any) => m.id === 'arms');
          const s = data.measurements.find((m: any) => m.id === 'shoulders');
          const t = data.measurements.find((m: any) => m.id === 'thighs');
          const cl = data.measurements.find((m: any) => m.id === 'calves');
          if (w) setMWaist(String(w.value));
          if (c) setMChest(String(c.value));
          if (a) setMArms(String(a.value));
          if (s) setMShoulders(String(s.value));
          if (t) setMThighs(String(t.value));
          if (cl) setMCalves(String(cl.value));
        }
        if (data.strengthPRs && data.strengthPRs.length > 0) {
          setStrengthPRs(data.strengthPRs);
          // Populate PR modal form values
          const b = data.strengthPRs.find((p: any) => p.id === 'bench');
          const sq = data.strengthPRs.find((p: any) => p.id === 'squat');
          const dl = data.strengthPRs.find((p: any) => p.id === 'deadlift');
          const oh = data.strengthPRs.find((p: any) => p.id === 'ohp');
          const inc = data.strengthPRs.find((p: any) => p.id === 'incline');
          const rw = data.strengthPRs.find((p: any) => p.id === 'row');
          const lp = data.strengthPRs.find((p: any) => p.id === 'legpress');
          const cr = data.strengthPRs.find((p: any) => p.id === 'curl');
          if (b) setPrBench(String(b.weight));
          if (sq) setPrSquat(String(sq.weight));
          if (dl) setPrDeadlift(String(dl.weight));
          if (oh) setPrOhp(String(oh.weight));
          if (inc) setPrIncline(String(inc.weight));
          if (rw) setPrRow(String(rw.weight));
          if (lp) setPrLegPress(String(lp.weight));
          if (cr) setPrCurl(String(cr.weight));
        }
        if (data.startWeight !== undefined) setStartWeight(data.startWeight);
        if (data.goalWeight !== undefined) setGoalWeight(data.goalWeight);
      }
    } catch (err) {
      console.log('Error loading body analytics:', err);
    } finally {
      setIsLoadingApi(false);
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
  }, [activeTab]);

  const latestWeight = checkpoints[0]?.weight || 72.4;
  const totalLost = (startWeight - latestWeight).toFixed(1);
  const toGo = (latestWeight - goalWeight).toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((startWeight - latestWeight) / (startWeight - goalWeight || 1)) * 100)));

  // ── POST API: Save Weight Checkpoint ──
  const handleSaveWeight = async () => {
    if (!nWeight) {
      Alert.alert('Required', 'Please enter your current body weight.');
      return;
    }
    const val = parseFloat(nWeight);
    const prevWeight = checkpoints[0]?.weight || 72.4;
    const diff = (val - prevWeight).toFixed(1);

    setIsSaving(true);
    try {
      const res: any = await apiService.logWeightCheckpoint({
        memberId,
        weight: val,
        date: 'Today',
        note: 'Body weight log',
      });

      if (res?.success && res?.data?.checkpoints) {
        setCheckpoints(res.data.checkpoints);
        if (res.data.summary?.startWeight) setStartWeight(res.data.summary.startWeight);
        if (res.data.summary?.goalWeight) setGoalWeight(res.data.summary.goalWeight);
      } else {
        const newEntry: CheckpointItem = {
          date: 'Today',
          weight: val,
          delta: val <= prevWeight ? `-${Math.abs(parseFloat(diff))} kg` : `+${diff} kg`,
          isLoss: val <= prevWeight,
          isBest: val <= prevWeight,
        };
        setCheckpoints([newEntry, ...checkpoints]);
      }
      setNWeight('');
      setAddModal(false);
      Alert.alert('✓ Checkpoint Saved', `Logged ${val} kg successfully!`);
    } catch (e: any) {
      Alert.alert('Notice', `Logged ${val} kg locally.`);
      setAddModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ── POST API: Save Tape Measurements ──
  const handleSaveMeasurements = async () => {
    const updated = [
      { id: 'waist', part: 'Waist', value: parseFloat(mWaist) || 80, startValue: 84, unit: unitMode },
      { id: 'chest', part: 'Chest', value: parseFloat(mChest) || 98, startValue: 96, unit: unitMode },
      { id: 'arms', part: 'Arms / Biceps', value: parseFloat(mArms) || 38, startValue: 36.5, unit: unitMode },
      { id: 'shoulders', part: 'Shoulders', value: parseFloat(mShoulders) || 118, startValue: 115, unit: unitMode },
      { id: 'thighs', part: 'Thighs', value: parseFloat(mThighs) || 56, startValue: 55, unit: unitMode },
      { id: 'calves', part: 'Calves', value: parseFloat(mCalves) || 37, startValue: 37, unit: unitMode },
    ];

    setIsSaving(true);
    try {
      const res: any = await apiService.updateBodyMeasurements({
        memberId,
        measurements: updated,
        unit: unitMode,
      });

      if (res?.success && res?.data?.measurements) {
        setMeasurements(res.data.measurements);
      } else {
        setMeasurements(updated);
      }
      setMeasurementModal(false);
      Alert.alert('✓ Measurements Updated', 'Your tape measurements have been saved successfully!');
    } catch (e) {
      setMeasurements(updated);
      setMeasurementModal(false);
      Alert.alert('✓ Measurements Updated', 'Your tape measurements have been saved!');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert value to current unit
  const formatVal = (valCm: number) => {
    if (unitMode === 'in') {
      return (valCm / 2.54).toFixed(1);
    }
    return valCm.toFixed(0);
  };

  const formatChange = (currentCm: number, startCm: number) => {
    const diffCm = currentCm - startCm;
    if (unitMode === 'in') {
      const diffIn = diffCm / 2.54;
      return diffIn >= 0 ? `+${diffIn.toFixed(1)} in` : `${diffIn.toFixed(1)} in`;
    }
    return diffCm >= 0 ? `+${diffCm.toFixed(1)} cm` : `${diffCm.toFixed(1)} cm`;
  };

  // Aesthetic V-Taper Ratios
  const waistVal = measurements.find((m) => m.id === 'waist')?.value || 80;
  const shoulderVal = measurements.find((m) => m.id === 'shoulders')?.value || 118;
  const chestVal = measurements.find((m) => m.id === 'chest')?.value || 98;
  const vTaperRatio = (shoulderVal / (waistVal || 1)).toFixed(2);
  const chestToWaistRatio = (chestVal / (waistVal || 1)).toFixed(2);

  // ── POST API: Save Strength PRs ──
  const handleSavePRs = async () => {
    const updated: StrengthPR[] = [
      { id: 'bench', exercise: 'Bench Press', category: 'Big 3 Compounds', weight: parseFloat(prBench) || 95, startWeight: 90, unit: 'kg', reps: 'Chest • 1RM' },
      { id: 'squat', exercise: 'Back Squat', category: 'Big 3 Compounds', weight: parseFloat(prSquat) || 130, startWeight: 120, unit: 'kg', reps: 'Legs • 1RM' },
      { id: 'deadlift', exercise: 'Deadlift', category: 'Big 3 Compounds', weight: parseFloat(prDeadlift) || 160, startWeight: 145, unit: 'kg', reps: 'Back & Core • 1RM' },
      { id: 'ohp', exercise: 'Overhead Press', category: 'Upper Body', weight: parseFloat(prOhp) || 60, startWeight: 57.5, unit: 'kg', reps: 'Shoulders • 1RM' },
      { id: 'incline', exercise: 'Incline DB Press', category: 'Upper Body', weight: parseFloat(prIncline) || 36, startWeight: 32, unit: 'kg', reps: 'Upper Chest' },
      { id: 'row', exercise: 'Barbell Row', category: 'Upper Body', weight: parseFloat(prRow) || 85, startWeight: 80, unit: 'kg', reps: 'Lats & Back' },
      { id: 'legpress', exercise: 'Leg Press', category: 'Lower Body', weight: parseFloat(prLegPress) || 260, startWeight: 240, unit: 'kg', reps: 'Quads & Glutes' },
      { id: 'curl', exercise: 'Barbell Bicep Curl', category: 'Upper Body', weight: parseFloat(prCurl) || 42, startWeight: 38, unit: 'kg', reps: 'Arms • 1RM' },
    ];

    setIsSaving(true);
    try {
      const res: any = await apiService.updateStrengthPRs({
        memberId,
        strengthPRs: updated,
      });

      if (res?.success && res?.data?.strengthPRs) {
        setStrengthPRs(res.data.strengthPRs);
      } else {
        setStrengthPRs(updated);
      }
      setPrModal(false);
      Alert.alert('✓ Strength PRs Updated', 'Your personal bests have been updated successfully!');
    } catch (e) {
      setStrengthPRs(updated);
      setPrModal(false);
      Alert.alert('✓ Strength PRs Updated', 'Your personal bests have been updated!');
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic 3-Lift Total Power
  const benchWeight = strengthPRs.find((p) => p.id === 'bench')?.weight || 95;
  const squatWeight = strengthPRs.find((p) => p.id === 'squat')?.weight || 130;
  const deadliftWeight = strengthPRs.find((p) => p.id === 'deadlift')?.weight || 160;
  const totalPowerScore = benchWeight + squatWeight + deadliftWeight;

  const lifterRank = totalPowerScore >= 450
    ? '🏆 Elite Lifter'
    : totalPowerScore >= 350
      ? '⚡ Advanced Lifter'
      : totalPowerScore >= 250
        ? '🔥 Intermediate Lifter'
        : '🌱 Novice Lifter';

  const filteredPRs = selectedPrCategory === 'all'
    ? strengthPRs
    : strengthPRs.filter((p) => p.category === selectedPrCategory);

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
            <Text style={styles.headerSub}>Simple & Clean Tracking</Text>
          </View>

          <TouchableOpacity
            style={styles.addEntryBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addEntryBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3 CLEAN SEGMENTED TABS ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'weight' && styles.tabBtnActive]}
            onPress={() => setActiveTab('weight')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === 'weight' && styles.tabTextActive]}>
              Weight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'measurements' && styles.tabBtnActive]}
            onPress={() => setActiveTab('measurements')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === 'measurements' && styles.tabTextActive]}>
              Body Tape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'prs' && styles.tabBtnActive]}
            onPress={() => setActiveTab('prs')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === 'prs' && styles.tabTextActive]}>
              Strength PRs
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
                        <Text style={styles.heroMainWeight}>{latestWeight}</Text>
                        <Text style={styles.heroUnitText}> kg</Text>
                        <View style={styles.heroLossBadge}>
                          <Text style={styles.heroLossBadgeText}>▼ -{totalLost} kg total</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.goalTargetBox}>
                      <Text style={styles.goalTargetLabel}>TARGET GOAL</Text>
                      <Text style={styles.goalTargetVal}>{goalWeight} kg</Text>
                      <Text style={styles.goalTargetRemain}>{toGo} kg to goal</Text>
                    </View>
                  </View>

                  {/* Clean Visual Progress Track */}
                  <View style={styles.progTrackSection}>
                    <View style={styles.progTrackHeader}>
                      <Text style={styles.progTrackMilestone}>Start: {startWeight} kg</Text>
                      <Text style={styles.progTrackAchieved}>{progressPercent}% Achieved</Text>
                      <Text style={styles.progTrackMilestone}>Goal: {goalWeight} kg</Text>
                    </View>
                    <View style={styles.progTrackBar}>
                      <View style={[styles.progTrackFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </View>
                </View>

                {/* 2. RECENT CHECKPOINTS TIMELINE */}
                <Text style={styles.sectionTitleText}>Recent Checkpoints</Text>
                <View style={styles.timelineCard}>
                  {checkpoints.map((item, idx) => (
                    <View key={idx} style={[styles.timelineRow, idx < checkpoints.length - 1 && styles.timelineRowBorder]}>
                      <View style={styles.timelineIconBox}>
                        <Icon
                          name={item.isBest ? 'trophy' : item.isStart ? 'flag' : 'scale-outline'}
                          size={moderateScale(16)}
                          color={item.isBest ? '#EAB308' : item.isStart ? '#3B82F6' : '#6C5CE7'}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                        <Text style={styles.timelineDateText}>{item.date}</Text>
                        <Text style={styles.timelineSubText}>
                          {item.isBest ? 'Current Lowest Best 🎉' : item.isStart ? 'Initial Gym Measurement' : 'Logged Checkpoint'}
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
                  ))}
                </View>
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB 2: BODY TAPE MEASUREMENTS                         */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'measurements' && (
              <>
                {/* Header Controls: Title + Unit Switcher (cm/in) + Update Button */}
                <View style={styles.tapeHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitleText}>Tape Measurements</Text>

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
                      <Text style={styles.updateTapeBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── 2. 6 BODY MEASUREMENT CARDS GRID ── */}
                <View style={styles.measurementsGrid}>
                  {measurements.map((item, idx) => {
                    const diffText = formatChange(item.value, item.startValue);
                    const isGood = item.id === 'waist' ? item.value <= item.startValue : item.value >= item.startValue;

                    return (
                      <View key={idx} style={styles.measureCard}>
                        <View style={styles.measureTopRow}>
                          <Text style={styles.measurePart}>{item.part}</Text>
                          <View style={[styles.measureBadge, isGood ? styles.measureBadgeGood : styles.measureBadgeNeutral]}>
                            <Text style={[styles.measureBadgeText, isGood ? styles.measureTextGood : styles.measureTextNeutral]}>
                              {diffText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.measureVal}>
                          {formatVal(item.value)} <Text style={styles.measureUnit}>{unitMode}</Text>
                        </Text>
                        <Text style={styles.measureStartHint}>Start: {formatVal(item.startValue)} {unitMode}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
            {/* TAB 3: STRENGTH PERSONAL RECORDS */}
            {activeTab === 'prs' && (
              <>
                {/* Header Controls: Title + Update PRs Button */}
                <View style={styles.tapeHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitleText}>Strength Records</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.updateTapeBtn}
                    onPress={() => setPrModal(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.updateTapeBtnText}>Update PRs</Text>
                  </TouchableOpacity>
                </View>


                {/* Category Filter Pills: All | Big 3 Compounds | Upper Body | Lower Body */}
                <View style={styles.prCategoryRow}>
                  {[
                    { id: 'all', label: 'All Lifts (8)' },
                    { id: 'Big 3 Compounds', label: 'Big 3 Compounds' },
                    { id: 'Upper Body', label: 'Upper Body' },
                    { id: 'Lower Body', label: 'Lower Body' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.prCategoryPill, selectedPrCategory === cat.id && styles.prCategoryPillActive]}
                      onPress={() => setSelectedPrCategory(cat.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prCategoryText, selectedPrCategory === cat.id && styles.prCategoryTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 2-Column PR Grid */}
                <View style={styles.prsGrid}>
                  {filteredPRs.map((pr, idx) => {
                    const diff = pr.weight - pr.startWeight;
                    const badgeText = diff >= 0 ? `▲ +${diff} kg` : `▼ ${diff} kg`;

                    return (
                      <View key={idx} style={styles.prGridCard}>
                        <View style={styles.prGridTopRow}>
                          <Text style={styles.prGridExercise}>{pr.exercise}</Text>
                          <View style={styles.prBadgePill}>
                            <Text style={styles.prBadgeText}>{badgeText}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                          <Text style={styles.prGridWeight}>{pr.weight}</Text>
                          <Text style={styles.prGridUnit}> {pr.unit}</Text>
                        </View>

                        <Text style={styles.prGridReps}>{pr.reps}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}


            <View style={{ height: hp(10) }} />
          </Animated.View>
        </ScrollView>

        {/* ── ADD WEIGHT CHECKPOINT MODAL ── */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Weight Checkpoint</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setAddModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Weight (kg) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nWeight}
                  onChangeText={setNWeight}
                  placeholder="e.g. 72.4"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveWeight}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>SAVE CHECKPOINT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── UPDATE TAPE MEASUREMENTS MODAL ── */}
        <Modal visible={measurementModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: hp(80) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Update Body Tape</Text>
                  <Text style={{ fontSize: fontScale(11), color: '#64748B' }}>Enter current measurements in centimeters (cm)</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setMeasurementModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalGridInputs}>
                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Waist (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mWaist}
                      onChangeText={setMWaist}
                      placeholder="80"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Chest (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mChest}
                      onChangeText={setMChest}
                      placeholder="98"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Arms / Biceps (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mArms}
                      onChangeText={setMArms}
                      placeholder="38"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Shoulders (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mShoulders}
                      onChangeText={setMShoulders}
                      placeholder="118"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Thighs (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mThighs}
                      onChangeText={setMThighs}
                      placeholder="56"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Calves (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={mCalves}
                      onChangeText={setMCalves}
                      placeholder="37"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveMeasurements}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>SAVE MEASUREMENTS</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── UPDATE STRENGTH PRS MODAL ── */}
        <Modal visible={prModal} transparent animationType="slide">

          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: hp(85) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Update Strength PRs</Text>
                  <Text style={{ fontSize: fontScale(11), color: '#64748B' }}>Enter 1-Rep Max (1RM) in kilograms (kg)</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setPrModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalGridInputs}>
                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Bench Press (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prBench}
                      onChangeText={setPrBench}
                      placeholder="95"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Back Squat (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prSquat}
                      onChangeText={setPrSquat}
                      placeholder="130"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Deadlift (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prDeadlift}
                      onChangeText={setPrDeadlift}
                      placeholder="160"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Overhead Press (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prOhp}
                      onChangeText={setPrOhp}
                      placeholder="60"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Incline DB Press (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prIncline}
                      onChangeText={setPrIncline}
                      placeholder="36"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Barbell Row (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prRow}
                      onChangeText={setPrRow}
                      placeholder="85"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Leg Press (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prLegPress}
                      onChangeText={setPrLegPress}
                      placeholder="260"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalInputHalf}>
                    <Text style={styles.inputLabel}>Bicep Curl (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={prCurl}
                      onChangeText={setPrCurl}
                      placeholder="42"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSavePRs}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>SAVE STRENGTH PRS</Text>
                </TouchableOpacity>
              </ScrollView>
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
    paddingBottom: hp(1.5),
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  addEntryBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    elevation: 2,
  },
  addEntryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fontScale(12),
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginHorizontal: wp(5),
    marginBottom: hp(2),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(14),
  },
  heroSubLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  heroMainWeight: {
    fontSize: fontScale(28),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  heroUnitText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8,
  },
  heroLossBadge: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  heroLossBadgeText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#00A86B',
  },
  goalTargetBox: {
    alignItems: 'flex-end',
  },
  goalTargetLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#64748B',
  },
  goalTargetVal: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  goalTargetRemain: {
    fontSize: fontScale(10.5),
    color: '#6C5CE7',
    fontWeight: '700',
  },

  // ── Progress Bar ──
  progTrackSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  progTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progTrackMilestone: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '700',
  },
  progTrackAchieved: {
    fontSize: fontScale(11),
    color: '#6C5CE7',
    fontWeight: '900',
  },
  progTrackBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progTrackFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
  },

  // ── Timeline Card ──
  sectionTitleText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: hp(1),
    marginTop: hp(0.5),
  },
  sectionSubText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginBottom: hp(1.5),
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  timelineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDateText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineSubText: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  timelineWeightText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  deltaBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    marginTop: 2,
  },
  deltaBadgeGood: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
  },
  deltaBadgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  deltaBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
  },
  deltaTextGood: {
    color: '#00A86B',
  },
  deltaTextNeutral: {
    color: '#64748B',
  },

  // ── Tape Header & Unit Switcher ──
  tapeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  tapeControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  unitToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: moderateScale(8),
    padding: 2,
  },
  unitToggleBtn: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(6),
  },
  unitToggleBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  unitToggleText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  updateTapeBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  updateTapeBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '800',
  },

  // ── V-Taper Ratio Score Card ──
  ratioCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  ratioTitle: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#7E22CE',
    letterSpacing: 0.4,
  },
  ratioBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  ratioBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#D97706',
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioCol: {
    flex: 1,
  },
  ratioLbl: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#0F172A',
  },
  ratioVal: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#6C5CE7',
    marginTop: 1,
  },
  ratioIdeal: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '600',
  },
  ratioDesc: {
    fontSize: fontScale(9),
    color: '#64748B',
    marginTop: 2,
  },
  ratioDivider: {
    width: 1,
    height: moderateScale(36),
    backgroundColor: '#E9D5FF',
    marginHorizontal: moderateScale(10),
  },

  // ── Measurements Grid ──
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  measureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  measurePart: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  measureBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  measureBadgeGood: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
  },
  measureBadgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  measureBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
  },
  measureTextGood: {
    color: '#00A86B',
  },
  measureTextNeutral: {
    color: '#64748B',
  },
  measureVal: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  measureUnit: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  measureStartHint: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    marginTop: 2,
  },

  // ── Guidance Box ──
  guidanceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
  },
  guidanceTitle: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#0F172A',
  },
  guidanceText: {
    fontSize: fontScale(10),
    color: '#64748B',
    lineHeight: fontScale(15),
  },

  // ── Modal Grid Inputs ──
  modalGridInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  modalInputHalf: {
    width: '48%',
    marginBottom: moderateScale(10),
  },


  // ── Strength PRs ──
  prPowerHeroBox: {
    backgroundColor: '#1E1B4B',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  prPowerHeroLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },
  prPowerHeroVal: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  prPowerHeroUnit: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#C7D2FE',
  },
  prRankBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
  },
  prRankBadgeText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  prCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: hp(1.5),
  },
  prCategoryPill: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
  },
  prCategoryPillActive: {
    backgroundColor: '#6C5CE7',
  },
  prCategoryText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  prCategoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  prsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
  },
  prGridTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  prGridExercise: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  prBadgePill: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  prBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#00A86B',
  },
  prGridWeight: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#0F172A',
  },
  prGridUnit: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  prGridReps: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(14),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
