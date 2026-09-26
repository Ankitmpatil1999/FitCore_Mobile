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
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { apiService } from '../../services/api';

// ── Native High-Fidelity Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const barbellIcon = require('../../assets/Icons2/barbell.png');
const kettlebellIcon = require('../../assets/Icons2/kettlebell.png');
const clockImg = require('../../assets/Icons2/clock.png');
const chartIcon = require('../../assets/Icons2/chart.png');
const healthyIcon = require('../../assets/Icons2/healthy.png');
const editIcon = require('../../assets/Icons/edit.png');

// ── Exact Muscle Anatomy Icons ──
const chestIcon = require('../../assets/muscle_icons/chest.png');
const backIcon = require('../../assets/muscle_icons/back.png');
const legsIcon = require('../../assets/muscle_icons/legs.png');
const shouldersIcon = require('../../assets/muscle_icons/shoulders.png');
const bicepsIcon = require('../../assets/muscle_icons/biceps.png');

// ── Default Weekly Schedule ──
const INITIAL_WORKOUT_SCHEDULE = [
  {
    day: 'Monday',
    title: 'Chest',
    iconBg: '#FEE2E2',
    iconTint: '#EF4444',
    iconType: 'muscle_chest',
    customIcon: chestIcon,
  },
  {
    day: 'Tuesday',
    title: 'Back',
    iconBg: '#DBEAFE',
    iconTint: '#3B82F6',
    iconType: 'muscle_back',
    customIcon: backIcon,
  },
  {
    day: 'Wednesday',
    title: 'Biceps',
    iconBg: '#FFEDD5',
    iconTint: '#EA580C',
    iconType: 'muscle_biceps',
    customIcon: bicepsIcon,
  },
  {
    day: 'Thursday',
    title: 'Shoulder',
    iconBg: '#FEF3C7',
    iconTint: '#F59E0B',
    iconType: 'muscle_shoulders',
    customIcon: shouldersIcon,
  },
  {
    day: 'Friday',
    title: 'Triceps',
    iconBg: '#F3E8FF',
    iconTint: '#9333EA',
    iconType: 'muscle_triceps',
    customIcon: dumbbellIcon,
  },
  {
    day: 'Saturday',
    title: 'Legs',
    iconBg: '#DCFCE7',
    iconTint: '#10B981',
    iconType: 'muscle_legs',
    customIcon: legsIcon,
  },
  {
    day: 'Sunday',
    title: 'Rest & Recovery',
    iconBg: '#E0F2FE',
    iconTint: '#0284C7',
    iconType: 'clock',
    customIcon: clockImg,
  },
];

const PRESET_ROUTINE_OPTIONS = [
  { id: 'chest', title: 'Chest', icon: chestIcon, bg: '#FEE2E2', tint: '#EF4444', type: 'muscle_chest' },
  { id: 'back', title: 'Back', icon: backIcon, bg: '#DBEAFE', tint: '#3B82F6', type: 'muscle_back' },
  { id: 'biceps', title: 'Biceps', icon: bicepsIcon, bg: '#FFEDD5', tint: '#EA580C', type: 'muscle_biceps' },
  { id: 'triceps', title: 'Triceps', icon: dumbbellIcon, bg: '#F3E8FF', tint: '#9333EA', type: 'dumbbell' },
  { id: 'shoulders', title: 'Shoulders', icon: shouldersIcon, bg: '#FEF3C7', tint: '#F59E0B', type: 'muscle_shoulders' },
  { id: 'legs', title: 'Legs', icon: legsIcon, bg: '#DCFCE7', tint: '#10B981', type: 'muscle_legs' },
  { id: 'abs', title: 'Abs & Core', icon: healthyIcon, bg: '#EDE9FE', tint: '#7C3AED', type: 'clock' },
  { id: 'cardio', title: 'Cardio', icon: healthyIcon, bg: '#E0F2FE', tint: '#0284C7', type: 'clock' },
  { id: 'rest', title: 'Rest & Recovery', icon: clockImg, bg: '#F1F5F9', tint: '#64748B', type: 'clock' },
  { id: 'other', title: 'Other (Custom)', icon: editIcon, bg: '#F8FAFC', tint: '#6B7280', type: 'custom' },
];

export default function WorkoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentMember, currentUser } = useAppContext();
  const memberId = String(currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1');

  const [schedule, setSchedule] = useState<any[]>(INITIAL_WORKOUT_SCHEDULE);
  const [isEditing, setIsEditing] = useState(false);
  const [openDropdownDay, setOpenDropdownDay] = useState<number | null>(null);
  const [customTextInputs, setCustomTextInputs] = useState<{ [key: number]: string }>({});
  const [showOtherInput, setShowOtherInput] = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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
  }, []);

  const cleanWorkoutTitle = (rawText: string) => {
    if (!rawText) return 'Rest & Recovery';
    const cleaned = rawText
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/^[\s\-•–—]+/, '')
      .trim();

    if (cleaned.toLowerCase().includes('rest') || cleaned.toLowerCase().includes('recovery')) {
      return 'Rest & Recovery';
    }

    return cleaned || rawText;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res: any = await apiService.getMemberWorkout(memberId);
        if (res?.success && res?.data?.days && Array.isArray(res.data.days)) {
          const updated = INITIAL_WORKOUT_SCHEDULE.map((item) => {
            const match = res.data.days.find(
              (d: any) =>
                d?.day?.toLowerCase() === item.day.toLowerCase() ||
                d?.dayName?.toLowerCase() === item.day.toLowerCase()
            );
            if (match?.focus) {
              const cleanedTitle = cleanWorkoutTitle(match.focus);
              const firstPart = cleanedTitle.split(/[+&,/]/)[0].trim().toLowerCase();
              const preset = PRESET_ROUTINE_OPTIONS.find(
                (p) => p.title.toLowerCase() === firstPart || p.id === firstPart
              );
              return {
                ...item,
                title: cleanedTitle,
                iconBg: preset?.bg || item.iconBg,
                iconTint: preset?.tint || item.iconTint,
                iconType: preset?.type || item.iconType,
                customIcon: preset?.icon || item.customIcon,
              };
            }
            return item;
          });
          setSchedule(updated);
        }
      } catch (err) {
        console.log('Using cached workout routine');
      }
    };
    fetchPlan();
  }, [memberId]);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setOpenDropdownDay(null);
  };

  const handleToggleDayDropdown = (idx: number) => {
    if (!isEditing) return;
    setOpenDropdownDay((prev) => (prev === idx ? null : idx));
  };

  const isOptionSelected = (itemTitle: string, opt: any, isOtherOpen: boolean) => {
    if (opt.type === 'custom') return !!isOtherOpen;
    if (!itemTitle) return false;
    const lowerTitle = itemTitle.toLowerCase();
    const optTitleLower = opt.title.toLowerCase();

    if (opt.id === 'rest' || optTitleLower.includes('rest')) {
      return lowerTitle.includes('rest') || lowerTitle.includes('recovery');
    }

    if (lowerTitle.includes('rest') || lowerTitle.includes('recovery')) {
      return false;
    }

    const parts = lowerTitle.split(/[+&,/]/).map((p) => p.trim());
    return (
      parts.includes(optTitleLower) ||
      parts.some((p) => p === optTitleLower || p.startsWith(optTitleLower) || optTitleLower.startsWith(p))
    );
  };

  const handleToggleDayPreset = (dayIdx: number, opt: any) => {
    if (opt.type === 'custom') {
      setShowOtherInput((prev) => ({ ...prev, [dayIdx]: !prev[dayIdx] }));
      return;
    }

    const currentItem = schedule[dayIdx];
    const currentTitle = currentItem?.title || '';

    // If Rest & Recovery is clicked
    if (opt.title.toLowerCase().includes('rest') || opt.id === 'rest') {
      setShowOtherInput((prev) => ({ ...prev, [dayIdx]: false }));
      const updated = [...schedule];
      updated[dayIdx] = {
        ...updated[dayIdx],
        title: 'Rest & Recovery',
        iconBg: opt.bg,
        iconTint: opt.tint,
        iconType: opt.type,
        customIcon: opt.icon,
      };
      setSchedule(updated);
      return;
    }

    // If current was Rest & Recovery or empty, switch directly to this option
    if (currentTitle.toLowerCase().includes('rest') || currentTitle.toLowerCase().includes('recovery') || !currentTitle) {
      setShowOtherInput((prev) => ({ ...prev, [dayIdx]: false }));
      const updated = [...schedule];
      updated[dayIdx] = {
        ...updated[dayIdx],
        title: opt.title,
        iconBg: opt.bg,
        iconTint: opt.tint,
        iconType: opt.type,
        customIcon: opt.icon,
      };
      setSchedule(updated);
      return;
    }

    // Current has muscle group(s) -> toggle selection
    let parts = currentTitle
      .split(/[+&,/]/)
      .map((p: string) => p.trim())
      .filter(Boolean);

    const existsIndex = parts.findIndex((p: string) => p.toLowerCase() === opt.title.toLowerCase());

    if (existsIndex >= 0) {
      parts.splice(existsIndex, 1);
    } else {
      parts.push(opt.title);
    }

    let newTitle = parts.join(' + ');
    let newIcon = opt.icon;
    let newBg = opt.bg;
    let newTint = opt.tint;
    let newType = opt.type;

    if (!newTitle) {
      newTitle = 'Rest & Recovery';
      newIcon = clockImg;
      newBg = '#F1F5F9';
      newTint = '#64748B';
      newType = 'clock';
    } else {
      const firstPreset = PRESET_ROUTINE_OPTIONS.find(
        (p) => p.title.toLowerCase() === parts[0].toLowerCase()
      );
      if (firstPreset) {
        newIcon = firstPreset.icon;
        newBg = firstPreset.bg;
        newTint = firstPreset.tint;
        newType = firstPreset.type;
      }
    }

    setShowOtherInput((prev) => ({ ...prev, [dayIdx]: false }));
    const updated = [...schedule];
    updated[dayIdx] = {
      ...updated[dayIdx],
      title: newTitle,
      iconBg: newBg,
      iconTint: newTint,
      iconType: newType,
      customIcon: newIcon,
    };
    setSchedule(updated);
  };

  const handleCustomTextChange = (dayIdx: number, text: string) => {
    setCustomTextInputs((prev) => ({ ...prev, [dayIdx]: text }));
    const updated = [...schedule];
    const match = PRESET_ROUTINE_OPTIONS.find((p) => p.title.toLowerCase() === text.trim().toLowerCase());
    updated[dayIdx] = {
      ...updated[dayIdx],
      title: text || 'Rest & Recovery',
      iconBg: match?.bg || '#F3F4F6',
      iconTint: match?.tint || '#6C5CE7',
      iconType: match?.type || 'dumbbell',
      customIcon: match?.icon || dumbbellIcon,
    };
    setSchedule(updated);
  };

  const handleApplyCustomText = (dayIdx: number) => {
    setOpenDropdownDay(null);
  };

  const handleSaveRoutine = async () => {
    try {
      setSaving(true);
      const daysPayload = schedule.map((item) => ({
        day: item.day,
        focus: item.title,
        exercises: item.title.toLowerCase().includes('rest') ? [] : [{ name: item.title, sets: 4, reps: '10-12' }],
      }));

      await apiService.saveMemberCustomWorkout({
        memberId,
        title: 'My Custom Weekly Workout Split',
        days: daysPayload,
      });

      setShowSuccessModal(true);
      setIsEditing(false);
      setOpenDropdownDay(null);
    } catch (err: any) {
      Alert.alert('Error', 'Could not save routine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderIcon = (item: any) => {
    if (item?.customIcon) {
      const isMuscle = item.iconType?.startsWith('muscle_');
      return (
        <Image
          source={item.customIcon}
          style={[
            styles.dayIconImg,
            isMuscle ? { width: moderateScale(24), height: moderateScale(24) } : { tintColor: item.iconTint },
          ]}
          resizeMode="contain"
        />
      );
    }

    let source = dumbbellIcon;
    if (item?.iconType === 'barbell') source = barbellIcon;
    else if (item?.iconType === 'kettlebell') source = kettlebellIcon;
    else if (item?.iconType === 'clock') source = clockImg;

    return <Image source={source} style={[styles.dayIconImg, { tintColor: item?.iconTint || '#6C5CE7' }]} resizeMode="contain" />;
  };

  const activeDaysCount = schedule.filter((s) => !s.title.toLowerCase().includes('rest')).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#6C5CE7' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle} numberOfLines={1}>Workouts</Text>
          </View>

          {/* Edit Plan / Done Toggle Button */}
          <TouchableOpacity
            style={[styles.editPlanTopBtn, isEditing && styles.editPlanTopBtnActive]}
            onPress={handleToggleEdit}
            activeOpacity={0.8}
          >
            <Image
              source={editIcon}
              style={[styles.editIconTop, isEditing && { tintColor: '#FFFFFF' }]}
              resizeMode="contain"
            />
            <Text style={[styles.editPlanTopText, isEditing && styles.editPlanTopTextActive]}>
              {isEditing ? 'Done' : 'Edit Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + hp(3) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── TOP HERO BANNER: 6 DAYS WORKOUT PLAN ── */}
            <View style={styles.heroBannerCard}>
              <View style={styles.heroLeftGroup}>
                <View style={styles.heroIconCircle}>
                  <Image source={dumbbellIcon} style={styles.heroDumbbellImg} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroPlanTitle}>{activeDaysCount} Days Workout Plan</Text>
                  <Text style={styles.heroPlanSubtitle}>A Healthier You, A Stronger Tomorrow</Text>
                </View>
              </View>

              <View style={styles.heroRightStatus}>
                <Image source={chartIcon} style={styles.chartMiniIcon} resizeMode="contain" />
                <Text style={styles.keepGoingText}>Keep Going</Text>
              </View>
            </View>

            {/* ── EDIT MODE BANNER ── */}
            {isEditing && (
              <View style={styles.editingInstructionBanner}>
                <View style={styles.editingDot} />
                <Text style={styles.editingInstructionText}>
                  Editing Mode: Tap any day's card to select routine or type custom focus.
                </Text>
              </View>
            )}

            {/* ── WEEKLY WORKOUT TIMETABLE ── */}
            <View style={styles.timetableContainer}>
              <View style={styles.timetableHeaderRow}>
                <View style={styles.timetableColDayWrap}>
                  <Text style={styles.timetableColDay}>DAY</Text>
                </View>
                <Text style={styles.timetableColSeparator}>-</Text>
                <View style={styles.timetableColRoutineWrap}>
                  <Text style={styles.timetableColRoutine}>WORKOUT ROUTINE</Text>
                </View>
                {isEditing && (
                  <View style={styles.timetableColActionWrap}>
                    <Text style={styles.timetableColAction}>EDIT</Text>
                  </View>
                )}
              </View>

              {schedule.map((item, idx) => {
                const isOpen = isEditing && openDropdownDay === idx;
                const isOtherOpen = showOtherInput[idx];

                return (
                  <View key={item.day} style={[styles.timetableRowCard, isOpen && styles.timetableRowCardOpen]}>
                    <TouchableOpacity
                      style={[styles.timetableRowMain, isOpen && styles.timetableRowMainOpen]}
                      onPress={() => handleToggleDayDropdown(idx)}
                      disabled={!isEditing}
                      activeOpacity={isEditing ? 0.75 : 1}
                    >
                      {/* Left Day Group: Icon + Monday */}
                      <View style={styles.timetableDayGroup}>
                        <View style={[styles.timetableIconBadge, { backgroundColor: item.iconBg }]}>
                          {renderIcon(item)}
                        </View>
                        <Text style={styles.timetableDayName} numberOfLines={1}>
                          {item.day}
                        </Text>
                      </View>

                      {/* Middle Separator: Dash */}
                      <Text style={styles.timetableDash}>-</Text>

                      {/* Right Workout Routine */}
                      <View style={styles.timetableRoutineGroup}>
                        <Text
                          style={[styles.timetableRoutineName, isOpen && styles.timetableRoutineNameActive]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </View>

                      {/* Dropdown Chevron (Visible only in Edit Mode) */}
                      {isEditing && (
                        <View style={[styles.timetableDropdownBtn, isOpen && styles.timetableDropdownBtnOpen]}>
                          <Text style={[styles.timetableDropdownChevron, isOpen && { color: '#FFFFFF' }]}>
                            {isOpen ? '▲' : '▼'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* ── DROPDOWN LIST CONTAINER ── */}
                    {isOpen && (
                      <View style={styles.dropdownListWrapper}>
                        <View style={styles.dropdownHeaderSub}>
                          <View style={styles.dropdownHeaderLeft}>
                            <Text style={styles.dropdownSelectLabel}>Select Routine for {item.day}</Text>
                            <Text style={styles.dropdownMultiHint}>Tap multiple to combine (e.g. Chest + Triceps)</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.dropdownDoneBtn}
                            onPress={() => setOpenDropdownDay(null)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownDoneBtnText}>Done</Text>
                          </TouchableOpacity>
                        </View>

                        {/* List Options */}
                        <View style={styles.dropdownOptionsContainer}>
                          {PRESET_ROUTINE_OPTIONS.map((opt) => {
                            const isSelected = isOptionSelected(item.title, opt, isOtherOpen);
                            return (
                              <TouchableOpacity
                                key={opt.id || opt.title}
                                style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                                onPress={() => handleToggleDayPreset(idx, opt)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.dropdownItemLeft}>
                                  <View style={[styles.dropdownItemIconCircle, { backgroundColor: opt.bg }]}>
                                    <Image
                                      source={opt.icon}
                                      style={[
                                        styles.dropdownItemIconImg,
                                        opt.type?.startsWith('muscle_')
                                          ? { width: moderateScale(18), height: moderateScale(18) }
                                          : { tintColor: opt.tint },
                                      ]}
                                      resizeMode="contain"
                                    />
                                  </View>
                                  <Text
                                    style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}
                                    numberOfLines={1}
                                  >
                                    {opt.title}
                                  </Text>
                                </View>

                                {/* Luxury Checkbox */}
                                <View style={[styles.dropdownCheckbox, isSelected && styles.dropdownCheckboxActive]}>
                                  {isSelected && <Text style={styles.dropdownCheckmarkText}>✓</Text>}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Custom Input Box if user clicked "Other" */}
                        {isOtherOpen && (
                          <View style={styles.customTypeContainer}>
                            <Text style={styles.customTypeLabel}>Type your custom workout:</Text>
                            <View style={styles.customInputRow}>
                              <TextInput
                                style={styles.customTextInput}
                                placeholder="e.g. Legs + Shoulders, Yoga, Cardio..."
                                placeholderTextColor="#94A3B8"
                                value={customTextInputs[idx] !== undefined ? customTextInputs[idx] : item.title}
                                onChangeText={(text) => handleCustomTextChange(idx, text)}
                                returnKeyType="done"
                              />
                              <TouchableOpacity
                                style={styles.applyCustomBtn}
                                onPress={() => handleApplyCustomText(idx)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.applyCustomBtnText}>Set</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ── SAVE BUTTON (Visible in Edit Mode) ── */}
            {isEditing && (
              <TouchableOpacity
                style={styles.savePlanBtn}
                onPress={handleSaveRoutine}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.savePlanBtnText}>Save Timetable Changes</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={{ height: hp(2) }} />
          </Animated.View>
        </ScrollView>

        {/* ── SUCCESS MODAL ── */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.successModalCard}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>
              <Text style={styles.successModalTitle}>Plan Saved Successfully!</Text>
              <Text style={styles.successModalMessage}>
                Your weekly workout timetable has been synchronized with your personal profile.
              </Text>
              <TouchableOpacity
                style={styles.successModalBtn}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.successModalBtnText}>Awesome, Let's Train</Text>
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

  // Ambient Glows
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

  // Header
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.8),
    paddingBottom: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
    minHeight: hp(6),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  editPlanTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    zIndex: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  editPlanTopBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  editIconTop: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: '#6C5CE7',
  },
  editPlanTopText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  editPlanTopTextActive: {
    color: '#FFFFFF',
  },

  // Scroll Content
  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.4),
  },

  // Hero Banner
  heroBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
    paddingRight: moderateScale(6),
  },
  heroIconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDumbbellImg: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#6C5CE7',
  },
  heroPlanTitle: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  heroPlanSubtitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  heroRightStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: moderateScale(6),
  },
  chartMiniIcon: {
    width: moderateScale(17),
    height: moderateScale(17),
    tintColor: '#6C5CE7',
    marginBottom: 2,
  },
  keepGoingText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // Editing Instruction Banner
  editingInstructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    marginBottom: hp(1.4),
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  editingDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#6C5CE7',
    marginRight: moderateScale(8),
  },
  editingInstructionText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#5B21B6',
    flex: 1,
  },

  // Timetable Container
  timetableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: moderateScale(8),
  },
  timetableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    marginBottom: moderateScale(2),
  },
  timetableColDayWrap: {
    width: moderateScale(108),
  },
  timetableColDay: {
    fontSize: fontScale(10.5),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: 0.8,
  },
  timetableColSeparator: {
    width: moderateScale(16),
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#94A3B8',
    textAlign: 'center',
  },
  timetableColRoutineWrap: {
    flex: 1,
    paddingLeft: moderateScale(6),
  },
  timetableColRoutine: {
    fontSize: fontScale(10.5),
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  timetableColActionWrap: {
    width: moderateScale(36),
    alignItems: 'center',
  },
  timetableColAction: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.6,
  },

  // Timetable Row Card
  timetableRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  timetableRowCardOpen: {
    borderColor: '#6C5CE7',
    backgroundColor: '#FAFAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timetableRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(9),
  },
  timetableRowMainOpen: {
    backgroundColor: '#F8F7FF',
  },
  timetableDayGroup: {
    width: moderateScale(108),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  timetableIconBadge: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconImg: {
    width: moderateScale(18),
    height: moderateScale(18),
  },
  timetableDayName: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  timetableDash: {
    width: moderateScale(16),
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  timetableRoutineGroup: {
    flex: 1,
    paddingLeft: moderateScale(6),
    paddingRight: moderateScale(4),
  },
  timetableRoutineName: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  timetableRoutineNameActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  timetableDropdownBtn: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timetableDropdownBtnOpen: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  timetableDropdownChevron: {
    fontSize: fontScale(8.5),
    fontWeight: '900',
    color: '#64748B',
  },

  // Dropdown List
  dropdownListWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
  },
  dropdownHeaderSub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(4),
    marginBottom: moderateScale(6),
  },
  dropdownHeaderLeft: {
    flex: 1,
    paddingRight: moderateScale(8),
  },
  dropdownSelectLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '900',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownMultiHint: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  dropdownDoneBtn: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  dropdownDoneBtnText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  dropdownOptionsContainer: {
    gap: moderateScale(4),
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
  },
  dropdownItemIconCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconImg: {
    width: moderateScale(15),
    height: moderateScale(15),
  },
  dropdownItemText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  dropdownCheckbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dropdownCheckboxActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dropdownCheckmarkText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: fontScale(13),
  },

  // Custom Input
  customTypeContainer: {
    marginTop: moderateScale(8),
    padding: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customTypeLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: moderateScale(4),
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    fontSize: fontScale(12),
    color: '#0F172A',
  },
  applyCustomBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  applyCustomBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Save Routine Button
  savePlanBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: hp(2),
  },
  savePlanBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Success Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  successModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(22),
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  successIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  successCheckmark: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: '#10B981',
  },
  successModalTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: hp(0.8),
  },
  successModalMessage: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18),
    marginBottom: hp(2.5),
  },
  successModalBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
