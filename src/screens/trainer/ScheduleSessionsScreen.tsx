import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

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
      toValue: 0.97,
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

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

const FOCUS_OPTIONS = [
  'Legs Day Form Correction',
  'Chest & Triceps Push Split',
  'Back & Biceps Pull Split',
  'Shoulders & Traps Power',
  'Core & Abs Conditioning',
  'Full Body Conditioning',
  'Cardio & HIIT Stamina',
  'Deadlift & Heavy Strength',
  'Squats & Lower Body Power',
  'Personal Assessment & Mobility',
  'Weight Loss & Calorie Burn',
];

export default function ScheduleSessionsScreen({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Trainer';
  const trainerPhone = currentTrainer?.phone || currentUser?.phone || '';
  const gymId = currentGym?.id || currentTrainer?.gymId || 'gym_default';

  // Live state
  const [sessions, setSessions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters: 'all' | 'today' | 'scheduled' | 'completed'
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'scheduled' | 'completed'>('all');

  // Booking Modal State
  const [scheduleModal, setScheduleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Custom Time Dropdown State (Hrs, Mins, AM/PM)
  const [selectedHour, setSelectedHour] = useState('06');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [hourPickerOpen, setHourPickerOpen] = useState(false);
  const [minutePickerOpen, setMinutePickerOpen] = useState(false);

  // Focus Multi-Select State
  const [selectedFocusList, setSelectedFocusList] = useState<string[]>(['Legs Day Form Correction']);
  const [focusPickerOpen, setFocusPickerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Toggle multiple focus targets
  const toggleFocusOption = (f: string) => {
    if (selectedFocusList.includes(f)) {
      setSelectedFocusList(selectedFocusList.filter((item) => item !== f));
    } else {
      setSelectedFocusList([...selectedFocusList, f]);
    }
  };

  // Detail / Action Modal
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Entrance Animation
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
  }, []);

  // ── Fetch PT Sessions and Assigned Gym Members from Live MongoDB ──
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch PT Sessions
      const res = await apiService.getPTSessions({
        gymId: gymId,
        trainerId: trainerId,
        trainerPhone: trainerPhone,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        setSessions([]);
      }

      // 2. Fetch specifically ASSIGNED members for this trainer
      try {
        const memRes: any = await apiService.getOwnerMembers(gymId, {
          trainerId: trainerId,
          trainerName: trainerName,
          trainerPhone: trainerPhone,
        });

        let rawList: any[] = [];
        if (memRes && Array.isArray(memRes)) {
          rawList = memRes;
        } else if (memRes && Array.isArray(memRes.data)) {
          rawList = memRes.data;
        } else if (memRes && Array.isArray(memRes.members)) {
          rawList = memRes.members;
        }

        const tId = String(trainerId).toLowerCase();
        const tPhone = String(trainerPhone).replace(/\D/g, '');
        const tName = String(trainerName).toLowerCase().trim();

        const assignedList = rawList.filter((m: any) => {
          const mTrainerId = String(m.assignedTrainerId || m.trainerId || '').toLowerCase();
          const mTrainerPhone = String(m.assignedTrainerPhone || '').replace(/\D/g, '');
          const mTrainerName = String(m.assignedTrainerName || m.trainerName || '').toLowerCase().trim();

          return (
            (mTrainerId && mTrainerId === tId) ||
            (tPhone && mTrainerPhone === tPhone) ||
            (tName && (mTrainerName.includes(tName) || tName.includes(mTrainerName)))
          );
        });

        if (assignedList.length > 0) {
          setMembers(assignedList);
        } else {
          setMembers(rawList);
        }
      } catch (err) {
        console.log('Member list fetch note:', err);
      }
    } catch (e) {
      console.log('Error loading PT Sessions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gymId, trainerId, trainerName, trainerPhone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Book / Schedule Assigned Member ──
  const handleBookSession = async () => {
    if (!selectedMember) {
      Alert.alert('Select Member', 'Please select an assigned member from the dropdown.');
      return;
    }

    if (selectedFocusList.length === 0) {
      Alert.alert('Select Focus', 'Please select at least one session focus target from the dropdown.');
      return;
    }

    const finalClientName = selectedMember.name;
    const finalClientPhone = selectedMember.phone || '';
    const finalMemberId = selectedMember.id || selectedMember._id || '';
    const finalFocus = selectedFocusList.join(' • ');
    const finalTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

    setSubmitting(true);
    try {
      const payload = {
        gymId: gymId,
        trainerId: trainerId,
        trainerName: trainerName,
        trainerPhone: trainerPhone,
        memberId: finalMemberId,
        memberName: finalClientName,
        memberPhone: finalClientPhone,
        date: selectedDate,
        time: finalTime,
        focus: finalFocus,
        notes: notes.trim(),
      };

      const res = await apiService.createPTSession(payload);
      if (res && res.success) {
        Alert.alert('✓ Schedule Added', `Session scheduled with ${finalClientName} at ${finalTime}!`);
        setScheduleModal(false);
        // Reset inputs
        setSelectedMember(null);
        setSelectedFocusList(['Legs Day Form Correction']);
        setNotes('');
        loadData();
      } else {
        Alert.alert('Error', res?.error || res?.message || 'Failed to schedule session.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update Session Status (Complete / Cancel) ──
  const handleUpdateStatus = async (sessionId: string, newStatus: 'completed' | 'cancelled' | 'scheduled') => {
    try {
      const res = await apiService.updatePTSessionStatus(sessionId, { status: newStatus });
      if (res && res.success) {
        setActionModalVisible(false);
        setSelectedSession(null);
        loadData();
      } else {
        Alert.alert('Error', res?.error || 'Failed to update session.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update session.');
    }
  };

  // ── Delete Session ──
  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to remove this PT booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiService.deletePTSession(sessionId);
              if (res && res.success) {
                setActionModalVisible(false);
                setSelectedSession(null);
                loadData();
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete session.');
            }
          },
        },
      ]
    );
  };

  // ── Filtered Sessions ──
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 'today') return s.date === todayStr;
    if (activeFilter === 'scheduled') return s.status === 'scheduled';
    if (activeFilter === 'completed') return s.status === 'completed';
    return true;
  });

  const todayCount = sessions.filter((s) => s.date === todayStr).length;
  const scheduledCount = sessions.filter((s) => s.status === 'scheduled').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Daily Schedule</Text>
            <Text style={styles.headerSub}>{currentGym?.name || 'FitCore Gym'} • {trainerName}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setScheduleModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={moderateScale(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: 'rgba(108, 92, 231, 0.2)', backgroundColor: '#EEF2FF' }]}>
            <View style={styles.statIconRow}>
              <Icon name="calendar" size={moderateScale(14)} color="#6366F1" />
              <Text style={[styles.statVal, { color: '#4338CA' }]}>{todayCount}</Text>
            </View>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          <View style={[styles.statBox, { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: '#F0FDF4' }]}>
            <View style={styles.statIconRow}>
              <Icon name="time" size={moderateScale(14)} color="#10B981" />
              <Text style={[styles.statVal, { color: '#047857' }]}>{scheduledCount}</Text>
            </View>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={[styles.statBox, { borderColor: 'rgba(245, 158, 11, 0.2)', backgroundColor: '#FEF3C7' }]}>
            <View style={styles.statIconRow}>
              <Icon name="checkmark-done-circle" size={moderateScale(14)} color="#D97706" />
              <Text style={[styles.statVal, { color: '#B45309' }]}>{completedCount}</Text>
            </View>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── FILTER PILLS ── */}
        <View style={styles.filterPillsRow}>
          {[
            { key: 'all', label: `All (${sessions.length})` },
            { key: 'today', label: `Today (${todayCount})` },
            { key: 'scheduled', label: `Upcoming (${scheduledCount})` },
            { key: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterPill, activeFilter === tab.key && styles.filterPillActive]}
              onPress={() => setActiveFilter(tab.key as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, activeFilter === tab.key && styles.filterPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SESSIONS LIST ── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {loading && !refreshing ? (
            <View style={{ paddingVertical: hp(6), alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={{ marginTop: 12, fontSize: fontScale(13), color: '#64748B', fontWeight: '600' }}>
                Loading live PT sessions...
              </Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Icon name="calendar-outline" size={moderateScale(36)} color="#6366F1" />
              </View>
              <Text style={styles.emptyTitle}>No Sessions Found</Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'today'
                  ? 'No sessions scheduled for today.'
                  : 'Tap the button below to add a member to your daily schedule.'}
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => setScheduleModal(true)}
                activeOpacity={0.85}
              >
                <Icon name="add-circle" size={moderateScale(16)} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.bookNowBtnText}>Add Member to Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredSessions.map((session) => {
              const isToday = session.date === todayStr;
              const isCompleted = session.status === 'completed';
              const isCancelled = session.status === 'cancelled';

              let statusColor = '#00C48C';
              let statusBg = 'rgba(0, 196, 140, 0.10)';
              let statusText = 'CONFIRMED SLOT';

              if (isCompleted) {
                statusColor = '#6366F1';
                statusBg = '#EEF2FF';
                statusText = 'COMPLETED';
              } else if (isCancelled) {
                statusColor = '#EF4444';
                statusBg = '#FEE2E2';
                statusText = 'CANCELLED';
              }

              return (
                <AnimatedPressable
                  key={session.id || session._id}
                  style={styles.sessionCard}
                  onPress={() => {
                    setSelectedSession(session);
                    setActionModalVisible(true);
                  }}
                >
                  <View style={styles.timeBox}>
                    <Text style={styles.timeVal}>{session.time?.split(' ')[0] || '06:00'}</Text>
                    <Text style={styles.timeAmPm}>{session.time?.split(' ')[1] || 'AM'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.sessionClient} numberOfLines={1}>
                        {session.memberName}
                      </Text>
                      {isToday && (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillText}>TODAY</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.sessionFocus} numberOfLines={1}>
                      {session.focus || 'Personal Training'}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <View style={[styles.confirmedBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.confirmedBadgeText, { color: statusColor }]}>
                          {statusText}
                        </Text>
                      </View>
                      <Text style={styles.sessionDateText}>{session.date}</Text>
                    </View>
                  </View>

                  <Icon name="chevron-forward" size={moderateScale(18)} color="#94A3B8" />
                </AnimatedPressable>
              );
            })
          )}

          <View style={{ height: hp(10) }} />
        </ScrollView>

        {/* ── SCHEDULE / BOOKING MODAL ── */}
        <Modal visible={scheduleModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="calendar" size={moderateScale(20)} color="#6366F1" />
                  <Text style={styles.modalTitle}>Add Member to Schedule</Text>
                </View>
                <TouchableOpacity onPress={() => setScheduleModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(65) }}>
                {/* 1. Assigned Member Dropdown */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Select Assigned Member *</Text>
                    <View style={styles.assignedBadge}>
                      <Icon name="people" size={moderateScale(12)} color="#6366F1" />
                      <Text style={styles.assignedBadgeText}>{members.length} Assigned</Text>
                    </View>
                  </View>

                  {/* Dropdown Trigger Box */}
                  <TouchableOpacity
                    style={[styles.pickerSelectorBtn, selectedMember && styles.pickerSelectorBtnActive]}
                    onPress={() => setMemberPickerOpen(!memberPickerOpen)}
                    activeOpacity={0.8}
                  >
                    {selectedMember ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={styles.memberAvatarCircle}>
                          <Text style={styles.memberAvatarText}>
                            {selectedMember.name?.charAt(0)?.toUpperCase() || 'M'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectedMemberNameText} numberOfLines={1}>{selectedMember.name}</Text>
                          <Text style={styles.selectedMemberSubText} numberOfLines={1}>{selectedMember.phone || 'Assigned Member'}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Icon name="person-circle-outline" size={moderateScale(20)} color="#6366F1" />
                        <Text style={styles.pickerSelectorPlaceholder}>
                          {members.length > 0 ? `Choose from ${members.length} assigned members` : 'No assigned members found'}
                        </Text>
                      </View>
                    )}

                    <Icon
                      name={memberPickerOpen ? 'chevron-up' : 'chevron-down'}
                      size={moderateScale(18)}
                      color="#6366F1"
                    />
                  </TouchableOpacity>

                  {/* Dropdown List */}
                  {memberPickerOpen && (
                    <View style={styles.memberDropdown}>
                      {members.length > 4 && (
                        <View style={styles.dropdownSearchBox}>
                          <Icon name="search" size={moderateScale(14)} color="#94A3B8" />
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search assigned member..."
                            placeholderTextColor="#94A3B8"
                            value={memberSearch}
                            onChangeText={setMemberSearch}
                          />
                          {memberSearch ? (
                            <TouchableOpacity onPress={() => setMemberSearch('')}>
                              <Icon name="close-circle" size={moderateScale(14)} color="#94A3B8" />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      )}

                      <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                        {members
                          .filter((m) => {
                            if (!memberSearch) return true;
                            const q = memberSearch.toLowerCase();
                            return (
                              (m.name || '').toLowerCase().includes(q) ||
                              (m.phone || '').includes(q)
                            );
                          })
                          .map((m: any) => {
                            const isChosen = selectedMember?.id === (m.id || m._id) || selectedMember?._id === (m.id || m._id);
                            return (
                              <TouchableOpacity
                                key={m.id || m._id}
                                style={[
                                  styles.memberDropdownItem,
                                  isChosen && styles.memberDropdownItemActive,
                                ]}
                                onPress={() => {
                                  setSelectedMember(m);
                                  setMemberPickerOpen(false);
                                  setMemberSearch('');
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.dropdownItemLeft}>
                                  <View style={[styles.itemAvatar, isChosen && { backgroundColor: '#6366F1' }]}>
                                    <Text style={[styles.itemAvatarText, isChosen && { color: '#FFFFFF' }]}>
                                      {m.name?.charAt(0)?.toUpperCase() || 'M'}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.memberDropdownName, isChosen && { color: '#4338CA' }]} numberOfLines={1}>
                                      {m.name}
                                    </Text>
                                    <Text style={styles.memberDropdownPhone} numberOfLines={1}>
                                      {m.phone || 'Athlete'} {m.plan ? `• ${m.plan}` : ''}
                                    </Text>
                                  </View>
                                </View>

                                {isChosen ? (
                                  <Icon name="checkmark-circle" size={moderateScale(18)} color="#6366F1" />
                                ) : (
                                  <Icon name="radio-button-off" size={moderateScale(16)} color="#CBD5E1" />
                                )}
                              </TouchableOpacity>
                            );
                          })}

                        {members.length === 0 && (
                          <View style={{ padding: 16, alignItems: 'center' }}>
                            <Icon name="alert-circle-outline" size={moderateScale(24)} color="#94A3B8" />
                            <Text style={{ fontSize: fontScale(12), color: '#64748B', marginTop: 4, textAlign: 'center' }}>
                              No members assigned to you by Gym Admin.
                            </Text>
                            <Text style={{ fontSize: fontScale(11), color: '#94A3B8', marginTop: 2, textAlign: 'center' }}>
                              Ask owner to assign members to you.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* 2. Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Session Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* 3. Session Focus Area (Multi-Select Dropdown) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Session Focus *</Text>
                    <View style={styles.assignedBadge}>
                      <Icon name="barbell" size={moderateScale(12)} color="#6366F1" />
                      <Text style={styles.assignedBadgeText}>{selectedFocusList.length} Selected</Text>
                    </View>
                  </View>

                  {/* Dropdown Trigger Box */}
                  <TouchableOpacity
                    style={[styles.pickerSelectorBtn, selectedFocusList.length > 0 && styles.pickerSelectorBtnActive]}
                    onPress={() => setFocusPickerOpen(!focusPickerOpen)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      {selectedFocusList.length > 0 ? (
                        <Text style={styles.selectedMemberNameText} numberOfLines={1}>
                          {selectedFocusList.join(' • ')}
                        </Text>
                      ) : (
                        <Text style={styles.pickerSelectorPlaceholder}>
                          Select focus areas (Multi-select)
                        </Text>
                      )}
                    </View>
                    <Icon
                      name={focusPickerOpen ? 'chevron-up' : 'chevron-down'}
                      size={moderateScale(18)}
                      color="#6366F1"
                    />
                  </TouchableOpacity>

                  {/* Selected Tags Horizontal Strip */}
                  {selectedFocusList.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 8 }}
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {selectedFocusList.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.selectedFocusTag}
                          onPress={() => toggleFocusOption(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.selectedFocusTagText}>{item}</Text>
                          <Icon name="close-circle" size={moderateScale(14)} color="#6366F1" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {/* Dropdown Multi-Select List */}
                  {focusPickerOpen && (
                    <View style={styles.memberDropdown}>
                      <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                        {FOCUS_OPTIONS.map((f) => {
                          const isSelected = selectedFocusList.includes(f);
                          return (
                            <TouchableOpacity
                              key={f}
                              style={[
                                styles.memberDropdownItem,
                                isSelected && styles.memberDropdownItemActive,
                              ]}
                              onPress={() => toggleFocusOption(f)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.dropdownItemLeft}>
                                <View style={[styles.focusIconCircle, isSelected && { backgroundColor: '#6366F1' }]}>
                                  <Icon
                                    name={isSelected ? 'barbell' : 'barbell-outline'}
                                    size={moderateScale(14)}
                                    color={isSelected ? '#FFFFFF' : '#64748B'}
                                  />
                                </View>
                                <Text style={[styles.memberDropdownName, isSelected && { color: '#4338CA', fontWeight: '800' }]}>
                                  {f}
                                </Text>
                              </View>

                              <Icon
                                name={isSelected ? 'checkbox' : 'square-outline'}
                                size={moderateScale(20)}
                                color={isSelected ? '#6366F1' : '#CBD5E1'}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* 4. Custom Time Picker (Hrs, Mins, AM/PM Dropdown) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Session Time *</Text>
                    <View style={styles.timePreviewBadge}>
                      <Icon name="time" size={moderateScale(12)} color="#6366F1" />
                      <Text style={styles.timePreviewBadgeText}>
                        {selectedHour} : {selectedMinute} {selectedPeriod}
                      </Text>
                    </View>
                  </View>

                  {/* 3 Selectors Row: Hours, Minutes, AM/PM */}
                  <View style={styles.timeSelectorsRow}>
                    {/* 1. Hours Dropdown */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeSubLabel}>Hours</Text>
                      <TouchableOpacity
                        style={[styles.timeBoxBtn, hourPickerOpen && styles.timeBoxBtnActive]}
                        onPress={() => {
                          setHourPickerOpen(!hourPickerOpen);
                          setMinutePickerOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.timeBoxValText}>{selectedHour} Hr</Text>
                        <Icon name={hourPickerOpen ? 'chevron-up' : 'chevron-down'} size={moderateScale(14)} color="#6366F1" />
                      </TouchableOpacity>

                      {hourPickerOpen && (
                        <View style={styles.timeDropdownCard}>
                          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                            {HOURS.map((hr) => {
                              const isSel = selectedHour === hr;
                              return (
                                <TouchableOpacity
                                  key={hr}
                                  style={[styles.timeDropdownItem, isSel && styles.timeDropdownItemActive]}
                                  onPress={() => {
                                    setSelectedHour(hr);
                                    setHourPickerOpen(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.timeDropdownItemText, isSel && styles.timeDropdownItemTextActive]}>
                                    {hr}
                                  </Text>
                                  {isSel && <Icon name="checkmark" size={moderateScale(14)} color="#6366F1" />}
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* 2. Minutes Dropdown */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeSubLabel}>Minutes</Text>
                      <TouchableOpacity
                        style={[styles.timeBoxBtn, minutePickerOpen && styles.timeBoxBtnActive]}
                        onPress={() => {
                          setMinutePickerOpen(!minutePickerOpen);
                          setHourPickerOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.timeBoxValText}>{selectedMinute} Min</Text>
                        <Icon name={minutePickerOpen ? 'chevron-up' : 'chevron-down'} size={moderateScale(14)} color="#6366F1" />
                      </TouchableOpacity>

                      {minutePickerOpen && (
                        <View style={styles.timeDropdownCard}>
                          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                            {MINUTES.map((min) => {
                              const isSel = selectedMinute === min;
                              return (
                                <TouchableOpacity
                                  key={min}
                                  style={[styles.timeDropdownItem, isSel && styles.timeDropdownItemActive]}
                                  onPress={() => {
                                    setSelectedMinute(min);
                                    setMinutePickerOpen(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.timeDropdownItemText, isSel && styles.timeDropdownItemTextActive]}>
                                    {min}
                                  </Text>
                                  {isSel && <Icon name="checkmark" size={moderateScale(14)} color="#6366F1" />}
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* 3. AM / PM Segmented Toggle */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeSubLabel}>AM / PM</Text>
                      <View style={styles.ampmSegmentRow}>
                        {PERIODS.map((p) => {
                          const isSel = selectedPeriod === p;
                          return (
                            <TouchableOpacity
                              key={p}
                              style={[styles.ampmPill, isSel && styles.ampmPillActive]}
                              onPress={() => setSelectedPeriod(p)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.ampmPillText, isSel && styles.ampmPillTextActive]}>
                                {p}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                {/* 5. Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Special Notes (Optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { height: moderateScale(70), textAlignVertical: 'top', paddingTop: 8 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. Focus on warm-up & knee safety..."
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleBookSession}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="checkmark-circle" size={moderateScale(18)} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>ADD TO SCHEDULE</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── ACTION / DETAIL MODAL ── */}
        <Modal visible={actionModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <View>
                  <Text style={styles.actionMemberName}>{selectedSession?.memberName}</Text>
                  <Text style={styles.actionSessionDate}>
                    {selectedSession?.date} • {selectedSession?.time}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                  <Icon name="close-circle" size={moderateScale(24)} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.actionDetailsBox}>
                <View style={styles.actionDetailRow}>
                  <Icon name="barbell-outline" size={moderateScale(16)} color="#6366F1" />
                  <Text style={styles.actionDetailText}>
                    Focus: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedSession?.focus}</Text>
                  </Text>
                </View>
                {selectedSession?.notes ? (
                  <View style={styles.actionDetailRow}>
                    <Icon name="document-text-outline" size={moderateScale(16)} color="#64748B" />
                    <Text style={styles.actionDetailText}>Notes: {selectedSession.notes}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.actionButtonsCol}>
                {selectedSession?.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleUpdateStatus(selectedSession?.id || selectedSession?._id, 'completed')}
                  >
                    <Icon name="checkmark-circle" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {selectedSession?.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => handleUpdateStatus(selectedSession?.id || selectedSession?._id, 'cancelled')}
                  >
                    <Icon name="close-circle" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Mark as Cancelled</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }]}
                  onPress={() => handleDeleteSession(selectedSession?.id || selectedSession?._id)}
                >
                  <Icon name="trash-outline" size={moderateScale(18)} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete Booking</Text>
                </TouchableOpacity>
              </View>
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
    fontSize: fontScale(18),
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
  addBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingHorizontal: wp(5),
    marginBottom: hp(1.2),
  },
  statBox: {
    flex: 1,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: fontScale(15),
    fontWeight: '900',
  },
  statLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: moderateScale(6),
    marginBottom: hp(1.2),
  },
  filterPill: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  timeBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    minWidth: moderateScale(54),
  },
  timeVal: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#4338CA',
  },
  timeAmPm: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6366F1',
  },
  sessionClient: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionFocus: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  todayPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  todayPillText: {
    fontSize: fontScale(8.5),
    fontWeight: '900',
    color: '#6366F1',
  },
  confirmedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  confirmedBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
  },
  sessionDateText: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(30),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(3),
  },
  emptyIconCircle: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    marginTop: 16,
  },
  bookNowBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: hp(1.5),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  assignedBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6366F1',
  },
  pickerSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    minHeight: moderateScale(48),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerSelectorBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
  },
  pickerSelectorPlaceholder: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    fontWeight: '600',
  },
  memberAvatarCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  selectedMemberNameText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedMemberSubText: {
    fontSize: fontScale(10.5),
    color: '#6366F1',
    fontWeight: '600',
  },
  memberDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 6,
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#0F172A',
    padding: 0,
  },
  memberDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberDropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6366F1',
  },
  memberDropdownName: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  memberDropdownPhone: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    fontSize: fontScale(13),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedFocusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectedFocusTagText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#4338CA',
  },
  focusIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  timePreviewBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6366F1',
  },
  timeSelectorsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    alignItems: 'flex-start',
  },
  timeSubLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  timeBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    height: moderateScale(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeBoxBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
  },
  timeBoxValText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  timeDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  timeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeDropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  timeDropdownItemText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  timeDropdownItemTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
  ampmSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
    height: moderateScale(44),
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ampmPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(9),
  },
  ampmPillActive: {
    backgroundColor: '#6366F1',
  },
  ampmPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#64748B',
  },
  ampmPillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Action modal
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  actionMemberName: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  actionSessionDate: {
    fontSize: fontScale(12),
    color: '#6366F1',
    fontWeight: '700',
    marginTop: 2,
  },
  actionDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hp(2),
    gap: 8,
  },
  actionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionDetailText: {
    fontSize: fontScale(12.5),
    color: '#475569',
  },
  actionButtonsCol: {
    gap: moderateScale(8),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(11),
  },
  actionBtnText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
