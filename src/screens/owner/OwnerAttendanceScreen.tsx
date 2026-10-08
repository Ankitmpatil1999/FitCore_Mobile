import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';
import AppIcon from '../../components/common/AppIcon';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AttendanceRecord {
  _id?: string;
  id?: string;
  memberId: string;
  memberName?: string;
  memberPhone?: string;
  avatar?: string;
  planName?: string;
  planPrice?: number;
  planDurationMonths?: number;
  planExpiryDate?: string;
  joinedDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  method?: string;
  durationFormatted?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  sessions?: any[];
  totalTimeFormatted?: string;
  date?: string;
  formattedDate?: string;
  slot?: 'MORNING' | 'EVENING';
}

function parseRecordDate(r: any): string {
  if (!r) return '';
  if (r.date && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date.trim())) {
    return r.date.trim();
  }
  const raw = r.date || r.checkInTime || r.checkIn || r.createdAt;
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${day}`;
    }
  } catch (e) {}
  return String(raw).slice(0, 10);
}

export default function OwnerAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { currentUser, currentGym } = useAppContext();
  const gymId = currentGym?.id || (currentUser as any)?.gymId || '6a934afd13a1b16c3767d90f';

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'inside' | 'outside'>('all');

  // Attendance & Turnstile State
  const [attendanceData, setAttendanceData] = useState<{
    stats: {
      totalUniqueMembers: number;
      totalVisits: number;
      stillInside: number;
      checkedOut: number;
    };
    records: AttendanceRecord[];
    memberRoster: AttendanceRecord[];
  }>({
    stats: {
      totalUniqueMembers: 0,
      totalVisits: 0,
      stillInside: 0,
      checkedOut: 0,
    },
    records: [],
    memberRoster: [],
  });

  const [allGymMembers, setAllGymMembers] = useState<any[]>([]);

  // Pagination states for Athletes Roster (10 per page)
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterItemsPerPage, setRosterItemsPerPage] = useState<number>(10);

  // Calendar Modal States
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'calendar' | 'profile'>('calendar');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any | null>(null);
  const [memberAttendanceHistory, setMemberAttendanceHistory] = useState<any[]>([]);
  const [loadingMemberHistory, setLoadingMemberHistory] = useState<boolean>(false);

  // Load Main Owner Attendance Data (Supports silent auto-syncing)
  const loadAttendance = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (isRefresh) setRefreshing(true);
      else if (!isSilent) setLoading(true);

      try {
        const [todayRes, membersRes, statsRes]: [any, any, any] = await Promise.all([
          apiService.getOwnerAttendanceToday(gymId).catch(() => ({ success: false, records: [] })),
          apiService.getOwnerMembers(gymId).catch(() => ({ success: false, data: [] })),
          apiService.getOwnerAttendanceStats(gymId).catch(() => ({ success: false, stats: null })),
        ]);

        const records = todayRes?.records || [];
        const roster = todayRes?.memberRoster || [];
        const stillInsideCount = records.filter(
          (r: any) => !r.checkOutTime || r.status === 'CHECKED_IN' || r.status === 'in_gym'
        ).length;
        const checkedOutCount = records.filter(
          (r: any) => r.checkOutTime || r.status === 'CHECKED_OUT' || r.status === 'completed'
        ).length;

        const stats = todayRes?.stats || statsRes?.stats || {
          totalUniqueMembers: roster.length || records.length || 0,
          totalVisits: records.length || 0,
          stillInside: stillInsideCount,
          checkedOut: checkedOutCount,
        };

        setAttendanceData({
          stats: {
            totalUniqueMembers: stats.totalUniqueMembers || roster.length || 0,
            totalVisits: stats.totalVisits || records.length || 0,
            stillInside: stats.stillInside ?? stillInsideCount,
            checkedOut: stats.checkedOut ?? checkedOutCount,
          },
          records,
          memberRoster: roster,
        });

        if (membersRes?.success && Array.isArray(membersRes.data)) {
          setAllGymMembers(membersRes.data);
        } else if (Array.isArray(membersRes)) {
          setAllGymMembers(membersRes);
        }
      } catch (err) {
        console.warn('Error loading owner attendance:', err);
      } finally {
        if (!isSilent) setLoading(false);
        setRefreshing(false);
      }
    },
    [gymId]
  );

  // Initial load and focus-based auto-refresh polling (updates automatically every 10s)
  useFocusEffect(
    useCallback(() => {
      loadAttendance(false, false);

      const autoRefreshInterval = setInterval(() => {
        loadAttendance(false, true); // silent background update without screen flash
      }, 10000);

      return () => clearInterval(autoRefreshInterval);
    }, [loadAttendance])
  );

  // Set of Checked In Identifiers
  const liveCheckedInSet = useMemo(() => {
    const set = new Set<string>();
    attendanceData.records.forEach((r) => {
      const isOpen = !r.checkOutTime || r.status === 'CHECKED_IN' || r.status === 'in_gym';
      if (isOpen) {
        if (r.memberId) set.add(String(r.memberId));
        if (r.memberPhone) set.add(String(r.memberPhone));
        if ((r as any).userId) set.add(String((r as any).userId));
        if ((r as any).phone) set.add(String((r as any).phone));
        if (r._id) set.add(String(r._id));
        if (r.id) set.add(String(r.id));
      }
    });
    return set;
  }, [attendanceData.records]);

  // Check if a member is currently inside gym
  const isMemberInside = useCallback(
    (m: any) => {
      if (!m) return false;
      const id = String(m.id || m._id || m.userId || m.memberId || '');
      const phone = String(m.phone || m.memberPhone || '');
      const rawId = String(m.userId || '');
      return (
        (id && liveCheckedInSet.has(id)) ||
        (phone && liveCheckedInSet.has(phone)) ||
        (rawId && liveCheckedInSet.has(rawId))
      );
    },
    [liveCheckedInSet]
  );

  // Find today's latest session log for a member
  const getMemberTodaySession = useCallback(
    (m: any) => {
      const mId = String(m.id || m._id || m.userId || m.memberId || '');
      const mPhone = String(m.phone || m.memberPhone || '');

      return (
        attendanceData.memberRoster.find(
          (r) =>
            (r.memberId && String(r.memberId) === mId) ||
            (r.memberPhone && String(r.memberPhone) === mPhone)
        ) ||
        attendanceData.records.find(
          (r) =>
            (r.memberId && String(r.memberId) === mId) ||
            (r.memberPhone && String(r.memberPhone) === mPhone)
        )
      );
    },
    [attendanceData]
  );

  // Format Time Helper
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {
      // ignore
    }
    return timeStr;
  };

  // Filtered Members List
  const filteredMembersList = useMemo(() => {
    let list = allGymMembers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.name || m.memberName || '').toLowerCase().includes(q) ||
          (m.phone || m.memberPhone || '').includes(q) ||
          (m.plan || m.planName || '').toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'inside') {
      list = list.filter((m) => isMemberInside(m));
    } else if (activeFilter === 'outside') {
      list = list.filter((m) => !isMemberInside(m));
    }

    return list;
  }, [allGymMembers, searchQuery, activeFilter, isMemberInside]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setRosterPage(1);
  }, [searchQuery, activeFilter]);

  // Pagination Slicing for Roster
  const totalRosterItems = filteredMembersList.length;
  const totalRosterPages = Math.max(1, Math.ceil(totalRosterItems / rosterItemsPerPage));
  const currentRosterPageClamped = Math.min(rosterPage, totalRosterPages);
  const rosterStartIndex = (currentRosterPageClamped - 1) * rosterItemsPerPage;
  const rosterEndIndex = Math.min(rosterStartIndex + rosterItemsPerPage, totalRosterItems);
  const paginatedRoster = useMemo(
    () => filteredMembersList.slice(rosterStartIndex, rosterEndIndex),
    [filteredMembersList, rosterStartIndex, rosterEndIndex]
  );

  // Handle Open Member Attendance Calendar Modal (Direct API Data)
  const handleOpenMemberCalendar = useCallback(
    async (member: any) => {
      setSelectedMember(member);
      setShowCalendarModal(true);
      setModalTab('calendar');
      setSelectedCalendarDay(null);
      setLoadingMemberHistory(true);

      const memId = String(member.id || member._id || member.userId || member.memberId || '');
      const memPhone = String(member.phone || member.memberPhone || '');

      let allRecords: any[] = [];

      // Include local records on member profile if existing
      if (Array.isArray(member.attendance) && member.attendance.length > 0) {
        allRecords.push(...member.attendance);
      }

      // Include today's live session if recorded
      const todayMatch = attendanceData.records.find(
        (r) =>
          (r.memberId && String(r.memberId) === memId) ||
          (r.memberPhone && String(r.memberPhone) === memPhone) ||
          ((r as any).userId && String((r as any).userId) === memId)
      );
      if (todayMatch) {
        allRecords.push(todayMatch);
      }

      try {
        const res: any = await apiService.getAttendanceHistory(memId, memPhone);
        const apiRecords = res?.data?.records || res?.records || [];
        if (Array.isArray(apiRecords) && apiRecords.length > 0) {
          allRecords = [...apiRecords, ...allRecords];
        }
      } catch (e) {
        console.warn('Error fetching member history from API:', e);
      }

      // De-duplicate records by parsed YYYY-MM-DD date + session
      const uniqueMap = new Map<string, any>();
      allRecords.forEach((r) => {
        const dStr = parseRecordDate(r);
        if (!dStr) return;
        const key = `${dStr}_${r.checkInTime || r.checkIn || r.slot || 'sess'}`;
        if (!uniqueMap.has(key)) {
          const inFormatted = r.checkInFormatted || r.checkIn || (r.checkInTime ? formatTime(r.checkInTime) : '--:--');
          const outFormatted = r.checkOutFormatted || r.checkOut || (r.checkOutTime ? formatTime(r.checkOutTime) : null);
          const isLive = !r.checkOutTime && !r.checkOut && !r.checkOutFormatted && (r.status === 'in_gym' || r.status === 'CHECKED_IN');

          uniqueMap.set(key, {
            ...r,
            date: dStr,
            checkInFormatted: inFormatted,
            checkOutFormatted: isLive ? 'Active In Gym' : outFormatted,
            isLive,
            durationMinutes: r.durationMinutes || (r.checkOutTime && r.checkInTime ? Math.max(1, Math.round((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000)) : 60),
            durationFormatted: r.durationFormatted || (r.durationMinutes ? `${r.durationMinutes}m` : '60m'),
            method: r.method || 'Turnstile QR',
          });
        }
      });

      const processedHistory = Array.from(uniqueMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      setMemberAttendanceHistory(processedHistory);
      setLoadingMemberHistory(false);
    },
    [attendanceData.records]
  );

  // Calendar Month Navigation Handlers
  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedCalendarDay(null);
  };

  // Compute Calendar Matrix for Selected Member (PRESENT, ABSENT, HOLIDAY)
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0 to 11
    const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0, Sun = 6

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const memberJoinDateStr = (
      selectedMember?.joinedDate ||
      selectedMember?.joinDate ||
      selectedMember?.startDate ||
      (selectedMember?.createdAt ? String(selectedMember.createdAt).slice(0, 10) : '') ||
      '2026-01-01'
    ).slice(0, 10);

    let presentCount = 0;
    let absentCount = 0;
    let holidayCount = 0;

    const daysList: any[] = [];

    // Pre-month empty slots
    for (let i = 0; i < offset; i++) {
      daysList.push({ isBlank: true, key: `blank_${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      const isSunday = dayDate.getDay() === 0;
      const isBeforeJoined = memberJoinDateStr ? dateStr < memberJoinDateStr : false;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      // Find attendance log for this date
      const matchingRecord = memberAttendanceHistory.find((r: any) => parseRecordDate(r) === dateStr);
      const isAttended = Boolean(matchingRecord);
      const isAbsent = !isBeforeJoined && isPast && !isAttended && !isSunday;

      if (isAttended) {
        presentCount++;
      } else if (isSunday) {
        holidayCount++;
      } else if (isAbsent) {
        absentCount++;
      }

      let status = 'future';
      if (isBeforeJoined) status = 'pre_join';
      else if (isToday) status = isAttended ? 'present_today' : 'today_pending';
      else if (isAttended) status = 'present';
      else if (isSunday) status = 'holiday';
      else if (isAbsent) status = 'absent';

      daysList.push({
        isBlank: false,
        key: dateStr,
        dayNum: d,
        dateStr,
        status,
        isAttended,
        isAbsent,
        isSunday,
        isBeforeJoined,
        isToday,
        isPast,
        isFuture,
        record: matchingRecord,
      });
    }

    return {
      monthName,
      daysList,
      presentCount,
      absentCount,
      holidayCount,
      year,
      month,
      todayStr,
      memberJoinDateStr,
    };
  }, [calendarMonth, selectedMember, memberAttendanceHistory]);

  // Generic Reusable Pagination Stepper Renderer: << < 1 2 3 4 5 > >>
  const renderPaginationBar = (
    currentPage: number,
    totalPages: number,
    startIndex: number,
    endIndex: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    pageSize: number,
    onPageSizeChange: (size: number) => void,
    labelSingular: string,
    labelPlural: string
  ) => {
    // Only show if more than 10 items and more than 1 page
    if (totalItems <= 10 || totalPages <= 1) return null;

    const getVisiblePages = () => {
      if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      const pages: (number | string)[] = [];
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <View style={styles.paginationCard}>
        {/* Controls Row: <<  <  1  2  3  4  5  >  >> */}
        <View style={styles.paginationControlsRow}>
          {/* << (First Page) */}
          <TouchableOpacity
            style={[styles.pageStepBtn, currentPage === 1 && styles.pageStepBtnDisabled]}
            onPress={() => onPageChange(1)}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageStepSymbol, currentPage === 1 && styles.pageStepSymbolDisabled]}>
              «
            </Text>
          </TouchableOpacity>

          {/* < (Previous Page) */}
          <TouchableOpacity
            style={[styles.pageStepBtn, currentPage === 1 && styles.pageStepBtnDisabled]}
            onPress={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageStepSymbol, currentPage === 1 && styles.pageStepSymbolDisabled]}>
              ‹
            </Text>
          </TouchableOpacity>

          {/* Numbered Page Chips 1, 2, 3, 4, 5 */}
          <View style={styles.pageChipsGroup}>
            {visiblePages.map((item, idx) => {
              if (item === '...') {
                return (
                  <View key={`ellipsis_${idx}`} style={styles.pageEllipsisWrap}>
                    <Text style={styles.pageEllipsisText}>•••</Text>
                  </View>
                );
              }

              const pageNum = Number(item);
              const isActive = pageNum === currentPage;
              return (
                <TouchableOpacity
                  key={`page_${pageNum}`}
                  style={[styles.pageNumberChip, isActive && styles.pageNumberChipActive]}
                  onPress={() => onPageChange(pageNum)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* > (Next Page) */}
          <TouchableOpacity
            style={[styles.pageStepBtn, currentPage === totalPages && styles.pageStepBtnDisabled]}
            onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageStepSymbol, currentPage === totalPages && styles.pageStepSymbolDisabled]}>
              ›
            </Text>
          </TouchableOpacity>

          {/* >> (Last Page) */}
          <TouchableOpacity
            style={[styles.pageStepBtn, currentPage === totalPages && styles.pageStepBtnDisabled]}
            onPress={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageStepSymbol, currentPage === totalPages && styles.pageStepSymbolDisabled]}>
              »
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Small Summary */}
        <Text style={styles.paginationSummaryText}>
          Showing <Text style={{ fontWeight: '800', color: '#0F172A' }}>{startIndex + 1}–{endIndex}</Text> of{' '}
          <Text style={{ fontWeight: '800', color: '#0F172A' }}>{totalItems}</Text> {totalItems === 1 ? labelSingular : labelPlural}
        </Text>
      </View>
    );
  };

  const totalMembers = allGymMembers.length || attendanceData.stats.totalUniqueMembers || 0;
  const currentlyInGym = attendanceData.stats.stillInside || 0;
  const outsideCount = Math.max(0, totalMembers - currentlyInGym);
  const todayCheckIns = attendanceData.stats.totalVisits || attendanceData.records.length || 0;
  const todayCheckOuts = attendanceData.stats.checkedOut || 0;
  const percentageInGym = totalMembers > 0 ? Math.round((currentlyInGym / totalMembers) * 100) : 0;
  const formattedTodayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <AppIcon name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Attendance</Text>

        <View style={styles.headerDateChip}>
          <AppIcon name="calendar" size={13} color="#6366F1" />
          <Text style={styles.headerDateText}>{formattedTodayDate}</Text>
          <AppIcon name="chevron-down" size={11} color="#64748B" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendance(true)}
            colors={['#4F46E5']}
          />
        }
      >
        {/* ── 1. TOP 4 METRIC CARDS (2x2 GRID) ── */}
        <View style={styles.metricsGrid}>
          {/* Row 1 */}
          <View style={styles.metricsRow}>
            {/* 1. Total Members */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <AppIcon name="members" size={18} color="#4F46E5" />
              </View>
              <View style={styles.metricContentCol}>
                <Text style={styles.metricTitle}>Total Members</Text>
                <Text style={styles.metricValue}>{totalMembers}</Text>
              </View>
            </View>

            {/* 2. Currently In Gym */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon name="dumbbell" size={18} color="#10B981" />
              </View>
              <View style={styles.metricContentCol}>
                <Text style={styles.metricTitle}>Currently In Gym</Text>
                <View style={styles.metricValueWithIndicator}>
                  <Text style={styles.metricValue}>{currentlyInGym}</Text>
                  <View style={[styles.statusMiniDot, { backgroundColor: '#10B981' }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.metricsRow}>
            {/* 3. Outside */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <AppIcon name="logout" size={18} color="#EA580C" />
              </View>
              <View style={styles.metricContentCol}>
                <Text style={styles.metricTitle}>Outside</Text>
                <View style={styles.metricValueWithIndicator}>
                  <Text style={styles.metricValue}>{outsideCount}</Text>
                  <View style={[styles.statusMiniDot, { backgroundColor: '#F97316' }]} />
                </View>
              </View>
            </View>

            {/* 4. Today Check-ins */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <AppIcon name="clock" size={18} color="#3B82F6" />
              </View>
              <View style={styles.metricContentCol}>
                <Text style={styles.metricTitle}>Today Check-ins</Text>
                <View style={styles.metricValueWithIndicator}>
                  <Text style={styles.metricValue}>{todayCheckIns}</Text>
                  <AppIcon name="chevron-forward" size={14} color="#94A3B8" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── 2. TODAY'S ATTENDANCE SUMMARY BANNER ── */}
        <View style={styles.attendanceBannerCard}>
          {/* Circular Ring Gauge */}
          <View style={styles.progressRingOuter}>
            <View style={styles.progressRingInner}>
              <Text style={styles.progressRingValue}>{percentageInGym}%</Text>
              <Text style={styles.progressRingLabel}>In Gym</Text>
            </View>
          </View>

          {/* Banner Info & Mini Stat Badges */}
          <View style={styles.bannerInfoCol}>
            <Text style={styles.bannerTitle}>Today's Attendance</Text>
            <Text style={styles.bannerSubtitle}>
              {currentlyInGym} of {totalMembers} members are currently in gym
            </Text>

            <View style={styles.bannerPillsRow}>
              {/* Check-ins Pill */}
              <View style={[styles.bannerMiniPill, { backgroundColor: '#ECFDF5' }]}>
                <View style={[styles.miniPillIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <AppIcon name="active" size={13} color="#059669" />
                </View>
                <View>
                  <Text style={styles.miniPillValue}>{todayCheckIns}</Text>
                  <Text style={styles.miniPillLabel}>Check-ins</Text>
                </View>
              </View>

              {/* Check-outs Pill */}
              <View style={[styles.bannerMiniPill, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.miniPillIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <AppIcon name="logout" size={13} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.miniPillValue}>{todayCheckOuts}</Text>
                  <Text style={styles.miniPillLabel}>Check-outs</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── 3. FILTER PILLS (ALL, IN GYM, OUTSIDE) ── */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              All Athletes ({totalMembers})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'inside' && styles.filterPillActive]}
            onPress={() => setActiveFilter('inside')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.filterText, activeFilter === 'inside' && styles.filterTextActive]}>
              In Gym ({currentlyInGym})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'outside' && styles.filterPillActive]}
            onPress={() => setActiveFilter('outside')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F97316' }]} />
            <Text style={[styles.filterText, activeFilter === 'outside' && styles.filterTextActive]}>
              Outside ({outsideCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. SEARCH BAR ── */}
        <View style={styles.searchBox}>
          <AppIcon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athlete by name, phone or plan..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="close" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── 5. CONTENT LIST: MAIN ATHLETES ROSTER ── */}
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Syncing Live Turnstile Telemetry...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.rosterHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Gym Athletes Attendance</Text>
              <Text style={styles.rosterCountBadge}>{totalRosterItems} Athletes</Text>
            </View>

            {totalRosterItems === 0 ? (
              <View style={styles.emptyState}>
                <AppIcon name="members" size={36} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Members Found</Text>
                <Text style={styles.emptySub}>
                  Add members to your gym or clear your search filter.
                </Text>
              </View>
            ) : (
              <>
                {paginatedRoster.map((member) => {
                  const memId = String(member.id || member._id || member.userId);
                  const isIn = isMemberInside(member);

                  return (
                    <View key={memId} style={styles.rosterCard}>
                      {/* Avatar */}
                      <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>
                          {(member.name || member.memberName || 'A').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={styles.memberMetaCol}>
                        <Text style={styles.memberNameText} numberOfLines={1}>
                          {member.name || member.memberName || 'Athlete'}
                        </Text>
                        <Text style={styles.memberPhoneText}>
                          {member.phone || member.memberPhone || 'No phone'}
                        </Text>
                      </View>

                      {/* Right Action Column (Badge + View Button) */}
                      <View style={styles.cardRightColumn}>
                        {isIn ? (
                          <View style={styles.inGymBadge}>
                            <View style={[styles.badgeDot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.inGymBadgeText}>IN GYM</Text>
                          </View>
                        ) : (
                          <View style={styles.outsideBadge}>
                            <View style={[styles.badgeDot, { backgroundColor: '#EA580C' }]} />
                            <Text style={styles.outsideBadgeText}>OUTSIDE</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.viewBtn}
                          onPress={() => handleOpenMemberCalendar(member)}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="view" size={14} color="#4F46E5" />
                          <Text style={styles.viewBtnText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Roster Pagination Controls */}
                {renderPaginationBar(
                  currentRosterPageClamped,
                  totalRosterPages,
                  rosterStartIndex,
                  rosterEndIndex,
                  totalRosterItems,
                  setRosterPage,
                  rosterItemsPerPage,
                  setRosterItemsPerPage,
                  'Athlete',
                  'Athletes'
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── 5. ATHLETE ATTENDANCE CALENDAR & PROFILE MODAL (CENTERED DIALOG) ── */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Attendance</Text>
                <Text style={styles.modalSubtitle}>Monthly attendance calendar & athlete profile</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCalendarModal(false)}
              >
                <AppIcon name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(2) }}
              >
                {/* Profile Header Strip */}
                <View style={styles.modalProfileRow}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {(selectedMember.memberName || selectedMember.name || 'M').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.modalAthleteName}>
                        {selectedMember.memberName || selectedMember.name || 'Athlete'}
                      </Text>
                      {isMemberInside(selectedMember) ? (
                        <View style={styles.modalInGymPill}>
                          <Text style={styles.modalInGymPillText}>● IN GYM</Text>
                        </View>
                      ) : (
                        <View style={styles.modalOutsidePill}>
                          <Text style={styles.modalOutsidePillText}>OUTSIDE</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaText}>
                        {selectedMember.memberPhone || selectedMember.phone || 'N/A'}
                      </Text>
                      <Text style={styles.modalMetaDot}>•</Text>
                      <Text style={styles.modalPlanHighlight}>
                        {selectedMember.planName || selectedMember.plan || 'Standard Pass'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Modal Tab Switcher (Calendar & Details) */}
                <View style={styles.modalTabRow}>
                  <TouchableOpacity
                    style={[styles.modalTabBtn, modalTab === 'calendar' && styles.modalTabBtnActive]}
                    onPress={() => setModalTab('calendar')}
                  >
                    <AppIcon name="calendar" size={14} color={modalTab === 'calendar' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.modalTabText, modalTab === 'calendar' && styles.modalTabTextActive]}>
                      Calendar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalTabBtn, modalTab === 'profile' && styles.modalTabBtnActive]}
                    onPress={() => setModalTab('profile')}
                  >
                    <AppIcon name="user" size={14} color={modalTab === 'profile' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.modalTabText, modalTab === 'profile' && styles.modalTabTextActive]}>
                      Details
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ════ TAB 1: CALENDAR VIEW ════ */}
                {modalTab === 'calendar' && (
                  <View style={styles.calendarCard}>
                    {/* Month Nav Header */}
                    <View style={styles.calendarMonthNavRow}>
                      <TouchableOpacity
                        style={styles.calendarMonthNavBtn}
                        onPress={handlePrevMonth}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="chevron-back" size={16} color="#4F46E5" />
                      </TouchableOpacity>

                      <Text style={styles.calendarMonthTitle}>{calendarData.monthName}</Text>

                      <TouchableOpacity
                        style={styles.calendarMonthNavBtn}
                        onPress={handleNextMonth}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="chevron-forward" size={16} color="#4F46E5" />
                      </TouchableOpacity>
                    </View>

                    {/* Monthly Summary Statistics Chips: PRESENT, ABSENT, HOLIDAY ONLY */}
                    <View style={styles.calendarStatsPillsRow}>
                      <View style={[styles.calendarStatPill, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
                        <View style={[styles.calendarStatDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.calendarStatText}>
                          Present: <Text style={{ color: '#059669', fontWeight: '900' }}>{calendarData.presentCount} Days</Text>
                        </Text>
                      </View>

                      <View style={[styles.calendarStatPill, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                        <View style={[styles.calendarStatDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.calendarStatText}>
                          Absent: <Text style={{ color: '#DC2626', fontWeight: '900' }}>{calendarData.absentCount} Days</Text>
                        </Text>
                      </View>

                      <View style={[styles.calendarStatPill, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}>
                        <View style={[styles.calendarStatDot, { backgroundColor: '#0284C7' }]} />
                        <Text style={styles.calendarStatText}>
                          Holiday: <Text style={{ color: '#0284C7', fontWeight: '900' }}>{calendarData.holidayCount} Days</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Weekdays Header: Mon Tue Wed Thu Fri Sat Sun */}
                    <View style={styles.calendarWeekDaysHeader}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <View key={day} style={styles.calendarWeekDayColHeader}>
                          <Text style={[styles.calendarWeekDayHeaderText, day === 'Sun' && { color: '#0284C7' }]}>
                            {day}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Calendar Days Matrix */}
                    {loadingMemberHistory ? (
                      <View style={styles.calendarLoadingBox}>
                        <ActivityIndicator size="small" color="#4F46E5" />
                        <Text style={styles.calendarLoadingText}>Syncing member calendar...</Text>
                      </View>
                    ) : (
                      <View style={styles.calendarDaysGrid}>
                        {calendarData.daysList.map((dayItem: any) => {
                          if (dayItem.isBlank) {
                            return <View key={dayItem.key} style={styles.calendarDayCell} />;
                          }

                          const isSelected = selectedCalendarDay?.dateStr === dayItem.dateStr;
                          const status = dayItem.status;

                          return (
                            <TouchableOpacity
                              key={dayItem.key}
                              style={styles.calendarDayCell}
                              onPress={() => setSelectedCalendarDay(dayItem)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.calendarDayPill,
                                  status === 'present' && styles.calendarDayPillPresent,
                                  status === 'present_today' && styles.calendarDayPillPresent,
                                  status === 'absent' && styles.calendarDayPillAbsent,
                                  status === 'holiday' && styles.calendarDayPillHoliday,
                                  status === 'today_pending' && styles.calendarDayPillToday,
                                  status === 'pre_join' && styles.calendarDayPillPreJoin,
                                  isSelected && styles.calendarDayPillSelected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.calendarDayNum,
                                    (status === 'present' || status === 'present_today') && styles.calendarDayNumPresent,
                                    status === 'absent' && styles.calendarDayNumAbsent,
                                    status === 'holiday' && styles.calendarDayNumHoliday,
                                    status === 'today_pending' && styles.calendarDayNumToday,
                                    status === 'pre_join' && styles.calendarDayNumPreJoin,
                                  ]}
                                >
                                  {dayItem.dayNum}
                                </Text>

                                {/* Micro Status Marker Dot */}
                                {(status === 'present' || status === 'present_today') && (
                                  <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#10B981' }]} />
                                )}
                                {status === 'absent' && (
                                  <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#EF4444' }]} />
                                )}
                                {status === 'holiday' && (
                                  <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#0284C7' }]} />
                                )}
                                {status === 'today_pending' && (
                                  <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#6366F1' }]} />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Calendar Legend */}
                    <View style={styles.calendarLegendRow}>
                      <View style={styles.calendarLegendItem}>
                        <View style={[styles.calendarLegendDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.calendarLegendText}>Present</Text>
                      </View>
                      <View style={styles.calendarLegendItem}>
                        <View style={[styles.calendarLegendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.calendarLegendText}>Absent</Text>
                      </View>
                      <View style={styles.calendarLegendItem}>
                        <View style={[styles.calendarLegendDot, { backgroundColor: '#0284C7' }]} />
                        <Text style={styles.calendarLegendText}>Holiday</Text>
                      </View>
                      <View style={styles.calendarLegendItem}>
                        <View style={[styles.calendarLegendDot, { backgroundColor: '#6366F1' }]} />
                        <Text style={styles.calendarLegendText}>Today</Text>
                      </View>
                    </View>

                    {/* Interactive Selected Day Details Card */}
                    {selectedCalendarDay && (
                      <View style={styles.selectedDayDetailCard}>
                        <View style={styles.selectedDayHeaderRow}>
                          <Text style={styles.selectedDayDateTitle}>
                            Selected: {selectedCalendarDay.dateStr}
                          </Text>
                          <View
                            style={[
                              styles.selectedDayBadge,
                              selectedCalendarDay.isAttended
                                ? styles.selectedDayBadgePresent
                                : selectedCalendarDay.status === 'holiday' || selectedCalendarDay.isSunday
                                ? styles.selectedDayBadgeHoliday
                                : styles.selectedDayBadgeAbsent,
                            ]}
                          >
                            <Text
                              style={[
                                styles.selectedDayBadgeText,
                                selectedCalendarDay.isAttended
                                  ? { color: '#059669' }
                                  : selectedCalendarDay.status === 'holiday' || selectedCalendarDay.isSunday
                                  ? { color: '#0284C7' }
                                  : { color: '#DC2626' },
                              ]}
                            >
                              {selectedCalendarDay.isAttended
                                ? 'PRESENT / ATTENDED'
                                : selectedCalendarDay.status === 'holiday' || selectedCalendarDay.isSunday
                                ? 'HOLIDAY / OFF'
                                : selectedCalendarDay.status === 'pre_join'
                                ? 'PRE-MEMBERSHIP'
                                : selectedCalendarDay.isToday
                                ? 'TODAY (PENDING)'
                                : 'ABSENT'}
                            </Text>
                          </View>
                        </View>

                        {selectedCalendarDay.isAttended && selectedCalendarDay.record ? (
                          <View style={styles.sessionDetailGrid}>
                            <View style={styles.sessionDetailItem}>
                              <Text style={styles.sessionDetailLabel}>CHECK-IN</Text>
                              <Text style={styles.sessionDetailVal}>
                                {selectedCalendarDay.record.checkInFormatted || formatTime(selectedCalendarDay.record.checkInTime || selectedCalendarDay.record.checkIn)}
                              </Text>
                            </View>

                            <View style={styles.sessionDetailItem}>
                              <Text style={styles.sessionDetailLabel}>CHECK-OUT</Text>
                              <Text style={[styles.sessionDetailVal, selectedCalendarDay.record.isLive && { color: '#059669' }]}>
                                {selectedCalendarDay.record.checkOutFormatted ||
                                  (selectedCalendarDay.record.checkOutTime
                                    ? formatTime(selectedCalendarDay.record.checkOutTime)
                                    : 'Active Live')}
                              </Text>
                            </View>

                            <View style={styles.sessionDetailItem}>
                              <Text style={styles.sessionDetailLabel}>DURATION</Text>
                              <Text style={[styles.sessionDetailVal, { color: '#4F46E5' }]}>
                                {selectedCalendarDay.record.durationFormatted ||
                                  (selectedCalendarDay.record.durationMinutes
                                    ? `${selectedCalendarDay.record.durationMinutes}m`
                                    : '60m')}
                              </Text>
                            </View>

                            <View style={styles.sessionDetailItem}>
                              <Text style={styles.sessionDetailLabel}>METHOD</Text>
                              <Text style={styles.sessionDetailVal}>
                                {selectedCalendarDay.record.method || 'Turnstile QR'}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.selectedDayEmptyText}>
                            {selectedCalendarDay.status === 'absent'
                              ? 'The athlete was absent on this day. No check-in was registered.'
                              : selectedCalendarDay.status === 'holiday' || selectedCalendarDay.isSunday
                              ? 'Sunday rest & muscle recovery day.'
                              : selectedCalendarDay.status === 'pre_join'
                              ? `Joined on ${calendarData.memberJoinDateStr}.`
                              : 'No check-in recorded for this date.'}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* ════ TAB 2: MEMBER PROFILE DETAILS ════ */}
                {modalTab === 'profile' && (
                  <View style={styles.profileDetailsContainer}>
                    <View style={styles.profileItemRow}>
                      <Text style={styles.profileItemLabel}>Full Name</Text>
                      <Text style={styles.profileItemValue}>{selectedMember.name || selectedMember.memberName || 'N/A'}</Text>
                    </View>

                    <View style={styles.profileItemRow}>
                      <Text style={styles.profileItemLabel}>Phone Number</Text>
                      <Text style={styles.profileItemValue}>{selectedMember.phone || selectedMember.memberPhone || 'N/A'}</Text>
                    </View>

                    <View style={styles.profileItemRow}>
                      <Text style={styles.profileItemLabel}>Membership Plan</Text>
                      <Text style={[styles.profileItemValue, { color: '#4F46E5', fontWeight: '800' }]}>
                        {selectedMember.plan || selectedMember.planName || 'Standard Pass'}
                      </Text>
                    </View>

                    <View style={styles.profileItemRow}>
                      <Text style={styles.profileItemLabel}>Joined Date</Text>
                      <Text style={styles.profileItemValue}>
                        {calendarData.memberJoinDateStr || 'Not Recorded'}
                      </Text>
                    </View>

                    <View style={styles.profileItemRow}>
                      <Text style={styles.profileItemLabel}>Turnstile Status</Text>
                      <Text style={[styles.profileItemValue, isMemberInside(selectedMember) ? { color: '#059669' } : { color: '#64748B' }]}>
                        {isMemberInside(selectedMember) ? 'Inside Gym Floor' : 'Outside Gym'}
                      </Text>
                    </View>

                    {/* Quick Call / WhatsApp Actions */}
                    {(selectedMember.memberPhone || selectedMember.phone) ? (
                      <View style={styles.modalActionRow}>
                        <TouchableOpacity
                          style={styles.contactBtn}
                          onPress={() => Linking.openURL(`tel:${selectedMember.memberPhone || selectedMember.phone}`)}
                        >
                          <AppIcon name="call" size={15} color="#4F46E5" />
                          <Text style={styles.contactBtnText}>Call Athlete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.contactBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                          onPress={() => Linking.openURL(`whatsapp://send?phone=${selectedMember.memberPhone || selectedMember.phone}`)}
                        >
                          <AppIcon name="whatsapp" size={15} color="#10B981" />
                          <Text style={[styles.contactBtnText, { color: '#059669' }]}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1.2),
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(5),
    gap: 5,
  },
  headerDateText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#334155',
  },
  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.4),
  },

  // ── 1. Top 4 Metrics 2x2 Grid ──
  metricsGrid: {
    gap: moderateScale(10),
    marginBottom: hp(1.4),
  },
  metricsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    gap: moderateScale(10),
  },
  metricIconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  metricValueWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },

  // ── 2. Today's Attendance Banner Card ──
  attendanceBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: moderateScale(14),
    marginBottom: hp(1.6),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    gap: moderateScale(12),
  },
  progressRingOuter: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    borderWidth: 8,
    borderColor: '#F1F5F9',
    borderTopColor: '#6366F1',
    borderRightColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingValue: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  progressRingLabel: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#64748B',
  },
  bannerInfoCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
    marginBottom: hp(0.8),
  },
  bannerPillsRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  bannerMiniPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(6),
    borderRadius: 10,
    gap: 6,
  },
  miniPillIconBox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPillValue: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#0F172A',
  },
  miniPillLabel: {
    fontSize: fontScale(8.5),
    fontWeight: '600',
    color: '#64748B',
  },

  // ── 3. Filter Pills ──
  filterRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(1.4),
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(7.5),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // ── 4. Search Bar ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: hp(0.8),
    marginBottom: hp(1.6),
    gap: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#0F172A',
    padding: 0,
  },

  // ── 5. Content List & Cards ──
  listContainer: {
    marginBottom: hp(2),
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  sectionHeaderTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  rosterCountBadge: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: 8,
  },
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: moderateScale(12),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  avatarBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  avatarText: {
    fontSize: fontScale(14.5),
    fontWeight: '900',
    color: '#4F46E5',
  },
  memberMetaCol: {
    flex: 1,
  },
  memberNameText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  memberPhoneText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  memberPlanText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 2,
  },
  cardRightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: moderateScale(44),
  },
  inGymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  inGymBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#059669',
  },
  outsideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  outsideBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#EA580C',
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(11),
    paddingVertical: moderateScale(5),
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 4,
  },
  viewBtnText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#4F46E5',
  },

  // ── Pagination Controls: << < 1 2 3 4 5 > >> ──
  paginationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginTop: hp(1.4),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  paginationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  pageStepBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageStepBtnDisabled: {
    opacity: 0.35,
    backgroundColor: '#F8FAFC',
  },
  pageStepSymbol: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#334155',
  },
  pageStepSymbolDisabled: {
    color: '#94A3B8',
  },
  pageChipsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    marginHorizontal: moderateScale(4),
  },
  pageNumberChip: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberChipActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  pageNumberText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#334155',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  pageEllipsisWrap: {
    paddingHorizontal: 2,
  },
  pageEllipsisText: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    letterSpacing: 1,
  },
  paginationSummaryText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: hp(0.8),
  },

  // ── Empty & Loading States ──
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
  },
  loadingText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: hp(1),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    paddingHorizontal: wp(6),
  },
  emptyTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: hp(1),
  },
  emptySub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // ── Modal Styles (Centered Dialog) ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(2),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(1.5),
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingTop: hp(1.2),
  },
  modalProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: moderateScale(10),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  modalAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  modalAvatarText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#4F46E5',
  },
  modalAthleteName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  modalInGymPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalInGymPillText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#059669',
  },
  modalOutsidePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalOutsidePillText: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#64748B',
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  modalMetaText: {
    fontSize: fontScale(11),
    color: '#64748B',
  },
  modalMetaDot: {
    fontSize: fontScale(10),
    color: '#CBD5E1',
  },
  modalPlanHighlight: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ── Modal Tab Row ──
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: hp(1.2),
    gap: 4,
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(6),
    borderRadius: 8,
    gap: 4,
  },
  modalTabBtnActive: {
    backgroundColor: '#0F172A',
  },
  modalTabText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
  },

  // ── Calendar Card & Matrix ──
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: moderateScale(12),
  },
  calendarMonthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  calendarMonthNavBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarStatsPillsRow: {
    flexDirection: 'row',
    gap: moderateScale(5),
    marginBottom: hp(1.2),
  },
  calendarStatPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(5),
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  calendarStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarStatText: {
    fontSize: fontScale(9.5),
    color: '#334155',
    fontWeight: '700',
  },

  calendarWeekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: hp(0.6),
  },
  calendarWeekDayColHeader: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  calendarWeekDayHeaderText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  calendarLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
    gap: 6,
  },
  calendarLoadingText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  calendarDayPill: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  calendarDayPillPresent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  calendarDayPillAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  calendarDayPillHoliday: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  calendarDayPillToday: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  calendarDayPillPreJoin: {
    backgroundColor: '#F8FAFC',
    opacity: 0.35,
  },
  calendarDayPillSelected: {
    borderWidth: 2,
    borderColor: '#4F46E5',
    transform: [{ scale: 1.05 }],
  },
  calendarDayNum: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
  },
  calendarDayNumPresent: {
    color: '#059669',
    fontWeight: '900',
  },
  calendarDayNumAbsent: {
    color: '#DC2626',
    fontWeight: '700',
  },
  calendarDayNumHoliday: {
    color: '#0284C7',
    fontWeight: '700',
  },
  calendarDayNumToday: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  calendarDayNumPreJoin: {
    color: '#94A3B8',
  },
  calendarStatusMicroDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  calendarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: hp(1.2),
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarLegendText: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Selected Day Detail Card ──
  selectedDayDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: moderateScale(10),
    marginTop: hp(1.4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  selectedDayDateTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedDayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  selectedDayBadgePresent: {
    backgroundColor: '#ECFDF5',
  },
  selectedDayBadgeAbsent: {
    backgroundColor: '#FEF2F2',
  },
  selectedDayBadgeHoliday: {
    backgroundColor: '#F0F9FF',
  },
  selectedDayBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
  },
  sessionDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sessionDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  sessionDetailLabel: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#94A3B8',
  },
  sessionDetailVal: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  selectedDayEmptyText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontStyle: 'italic',
  },

  // ── Profile Details Tab ──
  profileDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  profileItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileItemLabel: {
    fontSize: fontScale(11.5),
    color: '#64748B',
  },
  profileItemValue: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: hp(1.6),
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: moderateScale(10),
    borderRadius: 10,
    gap: 6,
  },
  contactBtnText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#4F46E5',
  },
});
