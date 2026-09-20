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
  KeyboardAvoidingView,
  Platform,
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
const calendarIcon = require('../../assets/Icons2/calendar.png');
const chartIcon = require('../../assets/Icons2/chart.png');
const healthyIcon = require('../../assets/Icons2/healthy.png');
const editIcon = require('../../assets/Icons/edit.png');

// ── Exact Muscle Anatomy Icons (Extracted directly from Reference) ──
const chestIcon = require('../../assets/muscle_icons/chest.png');
const backIcon = require('../../assets/muscle_icons/back.png');
const legsIcon = require('../../assets/muscle_icons/legs.png');
const shouldersIcon = require('../../assets/muscle_icons/shoulders.png');
const chestBackIcon = require('../../assets/muscle_icons/chest_back.png');
const bicepsIcon = require('../../assets/muscle_icons/biceps.png');

// ── Default Weekly Schedule (Standard Clean Single Muscle Split) ──
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
    iconType: 'muscle_chest_back',
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
  { title: 'Chest', icon: chestIcon, bg: '#FEE2E2', tint: '#EF4444', type: 'muscle_chest' },
  { title: 'Back', icon: backIcon, bg: '#DBEAFE', tint: '#3B82F6', type: 'muscle_back' },
  { title: 'Biceps', icon: bicepsIcon, bg: '#FFEDD5', tint: '#EA580C', type: 'muscle_biceps' },
  { title: 'Shoulder', icon: shouldersIcon, bg: '#FEF3C7', tint: '#F59E0B', type: 'muscle_shoulders' },
  { title: 'Triceps', icon: dumbbellIcon, bg: '#F3E8FF', tint: '#9333EA', type: 'dumbbell' },
  { title: 'Legs', icon: legsIcon, bg: '#DCFCE7', tint: '#10B981', type: 'muscle_legs' },
  { title: 'Cardio & Abs', icon: healthyIcon, bg: '#E0F2FE', tint: '#0284C7', type: 'clock' },
  { title: 'Rest & Recovery', icon: clockImg, bg: '#E0F2FE', tint: '#0284C7', type: 'clock' },
  { title: 'Other', icon: editIcon, bg: '#F3F4F6', tint: '#6B7280', type: 'custom' },
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

  // ── Helper to strip any emoji, &, +, and secondary muscles to ensure pure single muscle format ──
  const cleanWorkoutTitle = (rawText: string) => {
    if (!rawText) return 'Rest & Recovery';
    // 1. Remove all unicode emojis and extra symbols
    let cleaned = rawText
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/^[\s\-•–—]+/, '')
      .trim();

    // 2. If title contains '&' or '+', isolate the primary single muscle part unless it's Rest & Recovery
    if (cleaned.toLowerCase().includes('rest') || cleaned.toLowerCase().includes('recovery')) {
      return 'Rest & Recovery';
    }

    // Split by '&' or '+' or '/' and pick the main muscle
    if (cleaned.includes('&')) {
      cleaned = cleaned.split('&')[0].trim();
    } else if (cleaned.includes('+')) {
      cleaned = cleaned.split('+')[0].trim();
    } else if (cleaned.includes('/')) {
      cleaned = cleaned.split('/')[0].trim();
    }

    return cleaned || rawText;
  };

  // ── Fetch Live Plan ──
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
              const preset = PRESET_ROUTINE_OPTIONS.find(
                (p) => p.title.toLowerCase() === cleanedTitle.toLowerCase()
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
    if (isEditing) {
      // If currently editing and user taps Done/Cancel without saving
      setIsEditing(false);
      setOpenDropdownDay(null);
    } else {
      setIsEditing(true);
      setOpenDropdownDay(null);
    }
  };

  const handleToggleDayDropdown = (idx: number) => {
    if (!isEditing) return; // STRICT RULE: Cards cannot be modified or expanded unless Edit Plan is clicked
    setOpenDropdownDay((prev) => (prev === idx ? null : idx));
  };

  const handleSelectDayPreset = (dayIdx: number, presetObj: any) => {
    if (presetObj.type === 'custom') {
      setShowOtherInput((prev) => ({ ...prev, [dayIdx]: true }));
      return;
    }
    setShowOtherInput((prev) => ({ ...prev, [dayIdx]: false }));
    const updated = [...schedule];
    updated[dayIdx] = {
      ...updated[dayIdx],
      title: presetObj.title,
      iconBg: presetObj.bg,
      iconTint: presetObj.tint,
      iconType: presetObj.type,
      customIcon: presetObj.icon,
    };
    setSchedule(updated);
    setOpenDropdownDay(null); // Close dropdown after selection
  };

  const handleCustomTextChange = (dayIdx: number, text: string) => {
    setCustomTextInputs((prev) => ({ ...prev, [dayIdx]: text }));
    const updated = [...schedule];
    // Find if text matches any preset
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
          style={[styles.dayIconImg, isMuscle ? { width: moderateScale(28), height: moderateScale(28) } : { tintColor: item.iconTint }]}
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
    <SafeAreaView style={styles.safeArea}>
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

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>Weekly Workout Plan</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Stay Consistent, Stay Fit</Text>
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
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + hp(4) }]}
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

            {/* ── EDIT MODE BANNER (Shown only when Edit Plan is clicked) ── */}
            {isEditing && (
              <View style={styles.editingInstructionBanner}>
                <View style={styles.editingDot} />
                <Text style={styles.editingInstructionText}>
                  Editing Mode: Tap any day's dropdown to choose workout or type custom routine.
                </Text>
              </View>
            )}

            {/* ── SCHOOL TIMETABLE WEEKLY WORKOUT SCHEDULE (MONDAY TO SUNDAY) ── */}
            <View style={styles.timetableContainer}>
              <View style={styles.timetableHeaderRow}>
                <Text style={styles.timetableColDay}>DAY</Text>
                <Text style={styles.timetableColSeparator}>-</Text>
                <Text style={styles.timetableColRoutine}>WORKOUT ROUTINE</Text>
                {isEditing && <Text style={styles.timetableColAction}>EDIT</Text>}
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
                        <Text style={styles.timetableDayName}>{item.day}</Text>
                      </View>

                      {/* Middle Separator: Dash */}
                      <Text style={styles.timetableDash}>-</Text>

                      {/* Right Clean Workout Routine (No extra icons) */}
                      <View style={styles.timetableRoutineGroup}>
                        <Text style={[styles.timetableRoutineName, isOpen && styles.timetableRoutineNameActive]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>

                      {/* Dropdown Chevron (Visible only when in Edit Mode) */}
                      {isEditing && (
                        <View style={[styles.timetableDropdownBtn, isOpen && styles.timetableDropdownBtnOpen]}>
                          <Text style={[styles.timetableDropdownChevron, isOpen && { color: '#FFFFFF' }]}>
                            {isOpen ? '▲' : '▼'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* ── DROPDOWN LIST CONTAINER (MATCHING REFERENCE DESIGN) ── */}
                    {isOpen && (
                      <View style={styles.dropdownListWrapper}>
                        <View style={styles.dropdownHeaderSub}>
                          <Text style={styles.dropdownSelectLabel}>Select Routine for {item.day}</Text>
                        </View>

                        {/* List Options */}
                        <View style={styles.dropdownOptionsContainer}>
                          {PRESET_ROUTINE_OPTIONS.map((opt) => {
                            const isSelected = item.title.toLowerCase() === opt.title.toLowerCase() || (opt.title === 'Other' && isOtherOpen);
                            return (
                              <TouchableOpacity
                                key={opt.title}
                                style={[styles.dropdownItemRow, isSelected && styles.dropdownItemRowSelected]}
                                onPress={() => handleSelectDayPreset(idx, opt)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.dropdownItemLeft}>
                                  <View style={[styles.dropdownItemIconCircle, { backgroundColor: opt.bg }]}>
                                    <Image
                                      source={opt.icon}
                                      style={[
                                        styles.dropdownItemIconImg,
                                        opt.type?.startsWith('muscle_') ? { width: moderateScale(20), height: moderateScale(20) } : { tintColor: opt.tint }
                                      ]}
                                      resizeMode="contain"
                                    />
                                  </View>
                                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                                    {opt.title}
                                  </Text>
                                </View>

                                {isSelected && (
                                  <Text style={styles.dropdownCheckmark}>✓</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Custom Input Box if user clicked "Other" or wants to type custom */}
                        {isOtherOpen && (
                          <View style={styles.customTypeContainer}>
                            <Text style={styles.customTypeLabel}>Type your custom workout:</Text>
                            <View style={styles.customInputRow}>
                              <TextInput
                                style={styles.customTextInput}
                                placeholder="e.g. Legs + Shoulders, Yoga, Swimming..."
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

            {/* ── SAVE BUTTON (Visible when in Edit Mode) ── */}
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

        {/* ── LUXURY CUSTOM SUCCESS POPUP MODAL ── */}
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
    paddingHorizontal: wp(4.5),
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
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: wp(3),
  },
  headerTitle: {
    fontSize: fontScale(17.5),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fontScale(11.5),
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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

  // ── Scroll Content ──
  scroll: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
  },

  // ── 6 Days Workout Plan Hero Banner ──
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
  },
  heroIconCircle: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(15),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDumbbellImg: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: '#6C5CE7',
  },
  heroPlanTitle: {
    fontSize: fontScale(14.5),
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
    paddingLeft: moderateScale(8),
  },
  chartMiniIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#6C5CE7',
    marginBottom: 2,
  },
  keepGoingText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },

  // ── Day Cards List ──
  dayCardsList: {
    gap: hp(1.2),
    marginBottom: hp(1.8),
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dayIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(14),
  },
  dayIconImg: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  dayInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  workoutTitleText: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  // ── Bottom Motivation Banner ──
  motivationBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  motivationLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
  },
  trophyIconCircle: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIconImg: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#6C5CE7',
  },
  motivationTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  motivationSubtitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },

  editPlanTopBtnActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  editPlanTopTextActive: {
    color: '#FFFFFF',
  },

  // ── Editing Mode Instructions Banner ──
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

  // ── School Timetable Container ──
  timetableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(16),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: moderateScale(10),
  },
  timetableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    marginBottom: moderateScale(4),
  },
  timetableColDay: {
    width: wp(30),
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: 0.8,
  },
  timetableColSeparator: {
    width: wp(6),
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#94A3B8',
    textAlign: 'center',
  },
  timetableColRoutine: {
    flex: 1,
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  timetableColAction: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
    paddingRight: moderateScale(4),
    letterSpacing: 0.6,
  },

  // ── Timetable Row Card ──
  timetableRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 1.2,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timetableRowCardOpen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6C5CE7',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  timetableRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(11),
  },
  timetableDayGroup: {
    width: wp(30),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  timetableIconBadge: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  timetableDayName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  timetableDash: {
    width: wp(6),
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  timetableRoutineGroup: {
    flex: 1,
    paddingRight: moderateScale(6),
  },
  timetableRoutineName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
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
    fontSize: fontScale(9),
    fontWeight: '900',
    color: '#64748B',
  },

  // ── Dropdown List Container (Matching Reference Image) ──
  dropdownListWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
  },
  dropdownHeaderSub: {
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  dropdownSelectLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownOptionsContainer: {
    gap: moderateScale(4),
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#F3F2FE',
    borderColor: '#C4B5FD',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
  },
  dropdownItemIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconImg: {
    width: moderateScale(16),
    height: moderateScale(16),
  },
  dropdownItemText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#334155',
  },
  dropdownItemTextSelected: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  dropdownCheckmark: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#6C5CE7',
    marginRight: moderateScale(4),
  },

  // ── Custom Type Option ──
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
    fontWeight: '600',
  },
  applyCustomBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCustomBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(11.5),
    fontWeight: '800',
  },

  timetableRowMainOpen: {
    backgroundColor: '#F8FAFC',
  },
  timetableRoutineNameActive: {
    color: '#6C5CE7',
  },

  // ── Save Plan CTA Button ──
  savePlanBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    marginBottom: hp(1.8),
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  savePlanBtnText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Luxury Success Popup Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  successModalCard: {
    width: '100%',
    maxWidth: moderateScale(340),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(22),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  successIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  successCheckmark: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#16A34A',
  },
  successModalTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: moderateScale(8),
    letterSpacing: -0.3,
  },
  successModalMessage: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18),
    marginBottom: moderateScale(20),
    paddingHorizontal: moderateScale(6),
  },
  successModalBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  successModalBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13.5),
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
