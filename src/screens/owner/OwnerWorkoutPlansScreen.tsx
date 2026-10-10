import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Asset Icons ──
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const editIcon = require('../../assets/Icons/edit.png');
const clockImg = require('../../assets/Icons2/clock.png');
const healthyIcon = require('../../assets/Icons2/healthy.png');
const chestIcon = require('../../assets/muscle_icons/chest.png');
const backIcon = require('../../assets/muscle_icons/back.png');
const legsIcon = require('../../assets/muscle_icons/legs.png');
const shouldersIcon = require('../../assets/muscle_icons/shoulders.png');
const bicepsIcon = require('../../assets/muscle_icons/biceps.png');

// ── Default 7-Day Master Schedule ──
export const INITIAL_WORKOUT_SCHEDULE = [
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

export const PRESET_ROUTINE_OPTIONS = [
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

export default function OwnerWorkoutPlansScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentGym, currentUser } = useAppContext();
  const gymId = currentGym?.id || (currentGym as any)?._id || (currentUser as any)?.gymId || (currentUser as any)?.gym_id || '';

  const [schedule, setSchedule] = useState<any[]>(INITIAL_WORKOUT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDropdownDay, setOpenDropdownDay] = useState<number | null>(null);
  const [customTextInputs, setCustomTextInputs] = useState<{ [key: number]: string }>({});
  const [showOtherInput, setShowOtherInput] = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Entrance Animation
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

  const loadMasterPlan = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiService.getOwnerMasterWorkoutPlan(gymId);
      if (res?.success && res?.data?.days && Array.isArray(res.data.days)) {
        const updated = INITIAL_WORKOUT_SCHEDULE.map((item) => {
          const match = res.data.days.find(
            (d: any) =>
              d?.day?.toLowerCase() === item.day.toLowerCase() ||
              d?.dayName?.toLowerCase()?.includes(item.day.toLowerCase())
          );
          if (match?.focus || match?.title || match?.dayName) {
            const rawTitle = match.focus || match.title || match.dayName;
            const cleanedTitle = cleanWorkoutTitle(rawTitle);
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
        setIsPublished(Boolean(res.isCustomized));
      } else {
        setIsPublished(false);
      }
    } catch (err: any) {
      console.log('Error loading master plan:', err);
      setError(err?.message || 'Failed to load gym master plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterPlan();
  }, [gymId]);

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

    // Multi-select toggle
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
      newIcon = null;
      newBg = '#F1F5F9';
      newTint = '#64748B';
      newType = 'bed';
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
  };

  const handleApplyCustomText = (dayIdx: number) => {
    const rawVal = customTextInputs[dayIdx];
    if (rawVal !== undefined && rawVal.trim().length > 0) {
      const updated = [...schedule];
      updated[dayIdx] = {
        ...updated[dayIdx],
        title: rawVal.trim(),
        iconBg: '#F3E8FF',
        iconTint: '#7C3AED',
        iconType: 'muscle_triceps',
        customIcon: dumbbellIcon,
      };
      setSchedule(updated);
    }
    setOpenDropdownDay(null);
  };

  const handlePublishMasterSplit = async () => {
    try {
      setSaving(true);
      const daysPayload = schedule.map((item, idx) => ({
        day: item.day,
        dayName: `${item.day}: ${item.title}`,
        focus: item.title,
        durationMin: item.title.toLowerCase().includes('rest') ? 20 : 45,
        calories: item.title.toLowerCase().includes('rest') ? 100 : 350,
      }));

      const payload = {
        gymId,
        title: 'FitCore Master Gym Split (Official)',
        description: 'Official 7-Day Gym Split published to all active members.',
        days: daysPayload,
      };

      const res: any = await apiService.saveOwnerMasterWorkoutPlan(payload);
      if (res?.success) {
        setIsPublished(true);
        setIsEditing(false);
        setOpenDropdownDay(null);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Publish Error', res?.message || 'Could not save master split.');
      }
    } catch (err: any) {
      console.log('Error publishing master split:', err);
      Alert.alert('Error', err?.message || 'Could not save master split.');
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
    if (item?.iconType === 'clock') source = clockImg;
    else if (item?.iconType === 'healthy') source = healthyIcon;

    return <Image source={source} style={[styles.dayIconImg, { tintColor: item?.iconTint || '#6C5CE7' }]} resizeMode="contain" />;
  };

  const activeDaysCount = schedule.filter(
    (s) => !s.title.toLowerCase().includes('rest') && !s.title.toLowerCase().includes('recovery')
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.root}>
        {/* Ambient Glows */}
        <View style={styles.ambientGlowTop} pointerEvents="none" />
        <View style={styles.ambientGlowRight} pointerEvents="none" />

        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={moderateScale(18)} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>Master Workout</Text>
            <Text style={styles.headerSubtitle}>Official Gym Master Timetable</Text>
          </View>

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
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>Loading Gym Master Timetable...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load Master Plan</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMasterPlan} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + hp(4) }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* ── TOP HERO BANNER: 6 DAYS MASTER SPLIT ── */}
              <View style={styles.heroBannerCard}>
                <View style={styles.heroLeftGroup}>
                  <View style={styles.heroIconCircle}>
                    <Image source={dumbbellIcon} style={styles.heroDumbbellImg} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(6), marginBottom: moderateScale(2) }}>
                      <Text style={styles.heroPlanTitle}>{activeDaysCount} Days Master Split</Text>
                      <View
                        style={[
                          styles.publishedStatusBadge,
                          isPublished ? styles.publishedBadgeActive : styles.publishedBadgeDraft,
                        ]}
                      >
                        <Text
                          style={[
                            styles.publishedStatusText,
                            isPublished ? styles.publishedTextActive : styles.publishedTextDraft,
                          ]}
                        >
                          {isPublished ? '✓ Published Master Split' : 'Default Template — Unpublished'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.heroPlanSubtitle}>
                      {isPublished
                        ? 'Live schedule assigned to all enrolled members'
                        : 'Unpublished starter split (members see read-only default until published)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroRightBadge}>
                  <Text style={styles.heroRightBadgeText}>OWNER</Text>
                </View>
              </View>

              {/* ── UNPUBLISHED TEMPLATE NOTICE BANNER ── */}
              {!isPublished && !isEditing && (
                <View style={styles.templateNoticeBanner}>
                  <View style={{ flex: 1, paddingRight: moderateScale(8) }}>
                    <View style={styles.templateNoticeBadgeRow}>
                      <View style={styles.templateNoticeDot} />
                      <Text style={styles.templateNoticeBadgeTitle}>Default Starter Template (Unpublished)</Text>
                    </View>
                    <Text style={styles.templateNoticeSubtitle}>
                      This master timetable has not been published yet. Tap "Edit" to customize and publish the official schedule for members.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editPromptBtn}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.editPromptBtnText}>Edit Split</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── EDIT MODE INSTRUCTION BANNER ── */}
              {isEditing && (
                <View style={styles.editingInstructionBanner}>
                  <View style={styles.editingDot} />
                  <Text style={styles.editingInstructionText}>
                    Editing Mode: Tap any day to select routines or type custom workout splits.
                  </Text>
                </View>
              )}

              {/* ── WEEKLY WORKOUT TIMETABLE (MONDAY TO SUNDAY) ── */}
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

                        {/* Dropdown Chevron in Edit Mode */}
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
                                      {opt.icon ? (
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
                                      ) : opt.type === 'flame' ? (
                                        <Icon name="flame" size={moderateScale(15)} color={opt.tint} />
                                      ) : opt.type === 'heart' ? (
                                        <Icon name="heart" size={moderateScale(15)} color={opt.tint} />
                                      ) : (
                                        <Icon name="moon" size={moderateScale(15)} color={opt.tint} />
                                      )}
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
                              <Text style={styles.customTypeLabel}>Type custom workout split:</Text>
                              <View style={styles.customInputRow}>
                                <TextInput
                                  style={styles.customTextInput}
                                  placeholder="e.g. Chest + Shoulder + Abs"
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

              {/* ── PUBLISH BUTTON ── */}
              {isEditing && (
                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={handlePublishMasterSplit}
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
              )}

              <View style={{ height: hp(2) }} />
            </Animated.View>
          </ScrollView>
        )}

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
              <Text style={styles.successModalTitle}>Master Split Published!</Text>
              <Text style={styles.successModalMessage}>
                The weekly workout timetable has been synchronized and assigned to all general members in your gym.
              </Text>
              <TouchableOpacity
                style={styles.successModalBtn}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.successModalBtnText}>Awesome, Done</Text>
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
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp(10),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#6C5CE7',
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
    fontSize: fontScale(16.5),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
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
  heroRightBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  heroRightBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 0.5,
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
    width: moderateScale(28),
    height: moderateScale(28),
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
  },
  dropdownItemTextSelected: {
    fontWeight: '900',
    color: '#6C5CE7',
  },
  dropdownCheckbox: {
    width: moderateScale(18),
    height: moderateScale(18),
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
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '900',
    marginTop: -1,
  },

  // Custom Type Box
  customTypeContainer: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customTypeLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: moderateScale(4),
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    fontSize: fontScale(12),
    color: '#0F172A',
    fontWeight: '600',
  },
  applyCustomBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
  },
  applyCustomBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '800',
  },

  // Publish Master Button
  publishBtn: {
    backgroundColor: '#6C5CE7',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: hp(0.5),
  },
  publishBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13.5),
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  // Success Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  successIconCircle: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  successCheckmark: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: '#16A34A',
  },
  successModalTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(17),
    marginBottom: moderateScale(18),
  },
  successModalBtn: {
    backgroundColor: '#6C5CE7',
    width: '100%',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '900',
  },

  // Error Card
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderRadius: moderateScale(16),
    padding: moderateScale(18),
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginVertical: hp(2),
  },
  errorTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: fontScale(12),
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '700',
  },

  // Published / Draft Badges
  publishedStatusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
  },
  publishedBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  publishedBadgeDraft: {
    backgroundColor: '#FEF3C7',
  },
  publishedStatusText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
  },
  publishedTextActive: {
    color: '#15803D',
  },
  publishedTextDraft: {
    color: '#B45309',
  },

  // Template Notice Banner
  templateNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginBottom: hp(1.6),
  },
  templateNoticeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(3),
  },
  templateNoticeDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#D97706',
    marginRight: moderateScale(6),
  },
  templateNoticeBadgeTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#92400E',
  },
  templateNoticeSubtitle: {
    fontSize: fontScale(11),
    color: '#B45309',
    lineHeight: fontScale(15),
  },
  editPromptBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  editPromptBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '800',
  },
});
