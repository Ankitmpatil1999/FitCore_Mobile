import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Native High-Fidelity Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const calendarIcon = require('../../assets/Icons2/calendar.png');
const clockIcon = require('../../assets/Icons2/clock.png');
const chartIcon = require('../../assets/Icons2/chart.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const kcalIcon = require('../../assets/Icons/kcal.png');
const stopwatchIcon = require('../../assets/Icons/stopwatch.png');
const thunderIcon = require('../../assets/Icons/thunder-bolt.png');
const activeIcon = require('../../assets/Icons2/active.png');
const gymIcon = require('../../assets/Icons2/gym.png');
const activeNotifImg = require('../../assets/Icons2/active.png');

// ── Session Time & Slot Aggregator (Morning < 13:00 | Evening >= 13:00) ──
function parseTimeToMins(timeStr: any): number {
  if (!timeStr) return 0;
  if (timeStr instanceof Date) {
    return timeStr.getHours() * 60 + timeStr.getMinutes();
  }
  const str = String(timeStr).trim();
  if (str.includes('T') || str.includes('Z')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  }
  const match12 = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let hrs = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const p = match12[3].toUpperCase();
    if (p === 'PM' && hrs < 12) hrs += 12;
    if (p === 'AM' && hrs === 12) hrs = 0;
    return hrs * 60 + mins;
  }
  const match24 = str.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return 0;
}

function formatMinsTo12Hr(totalMins: number): string {
  const h24 = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function processAndGroupRecords(rawRecords: any[]): {
  groupedRecords: any[];
  totalVisits: number;
  thisMonthVisits: number;
  totalHoursSpent: string;
  avgTimePerSession: string;
} {
  if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
    return {
      groupedRecords: [],
      totalVisits: 0,
      thisMonthVisits: 0,
      totalHoursSpent: '0.0 hrs',
      avgTimePerSession: '0m',
    };
  }

  const slotMap = new Map<string, any>();
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  rawRecords.forEach((rec, idx) => {
    let dateKey = rec.date || '';
    if (!dateKey && rec.checkInTime) {
      const d = new Date(rec.checkInTime);
      if (!isNaN(d.getTime())) {
        dateKey = d.toISOString().split('T')[0];
      }
    }
    if (!dateKey) dateKey = `day_${idx}`;

    const checkInMins = parseTimeToMins(rec.checkInFormatted || rec.checkInTime || rec.checkIn);
    const checkOutMins = parseTimeToMins(rec.checkOutFormatted || rec.checkOutTime || rec.checkOut);

    // Morning is before 1:00 PM (13:00 / 780 mins), Evening is 1:00 PM onwards
    const slot: 'MORNING' | 'EVENING' = checkInMins < 780 ? 'MORNING' : 'EVENING';
    const slotKey = `${dateKey}_${slot}`;

    const isLive = rec.status === 'in_gym' || rec.status === 'CHECKED_IN' || (!rec.checkOutTime && !rec.checkOut && !rec.checkOutFormatted);

    // Duration in minutes
    let dur = typeof rec.durationMinutes === 'number' && rec.durationMinutes > 0 ? rec.durationMinutes : 0;
    if (dur === 0 && checkOutMins > checkInMins) {
      dur = checkOutMins - checkInMins;
    }

    const cal = typeof rec.caloriesBurned === 'number' && rec.caloriesBurned > 0 ? rec.caloriesBurned : Math.round(dur * 6.2);

    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        id: rec.id || rec._id || slotKey,
        date: dateKey,
        formattedDate: rec.formattedDate || dateKey,
        slot,
        slotLabel: slot === 'MORNING' ? 'Morning Session' : 'Evening Session',
        earliestInMins: checkInMins,
        latestOutMins: checkOutMins,
        earliestInStr: rec.checkInFormatted || rec.checkIn || (checkInMins > 0 ? formatMinsTo12Hr(checkInMins) : '--:--'),
        latestOutStr: isLive ? 'Active Live' : rec.checkOutFormatted || rec.checkOut || (checkOutMins > 0 ? formatMinsTo12Hr(checkOutMins) : '--:--'),
        totalDurationMinutes: dur,
        totalCaloriesBurned: cal,
        hasLive: isLive,
        sessionsCombinedCount: rec.sessionsCombinedCount || 1,
        method: rec.method || 'qr_code',
      });
    } else {
      const existing = slotMap.get(slotKey);
      existing.sessionsCombinedCount += (rec.sessionsCombinedCount || 1);
      if (checkInMins > 0 && (existing.earliestInMins === 0 || checkInMins < existing.earliestInMins)) {
        existing.earliestInMins = checkInMins;
        existing.earliestInStr = rec.checkInFormatted || rec.checkIn || formatMinsTo12Hr(checkInMins);
      }
      if (checkOutMins > 0 && checkOutMins > existing.latestOutMins) {
        existing.latestOutMins = checkOutMins;
        existing.latestOutStr = rec.checkOutFormatted || rec.checkOut || formatMinsTo12Hr(checkOutMins);
      }
      if (isLive) {
        existing.hasLive = true;
        existing.latestOutStr = 'Active Live';
      }
      existing.totalDurationMinutes += dur;
      existing.totalCaloriesBurned += cal;
    }
  });

  let totalMinsAll = 0;
  let thisMonthCount = 0;

  const groupedRecords = Array.from(slotMap.values())
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (diff !== 0) return diff;
      return b.slot === 'EVENING' ? 1 : -1;
    })
    .map((session) => {
      let formattedDate = session.formattedDate;
      try {
        if (session.date && session.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dObj = new Date(session.date + 'T00:00:00');
          if (!isNaN(dObj.getTime())) {
            formattedDate = dObj.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
          }
        }
      } catch (e) {}

      let durationFormatted = '0m';
      if (session.hasLive) {
        const hrs = Math.floor(session.totalDurationMinutes / 60);
        const m = session.totalDurationMinutes % 60;
        durationFormatted = hrs > 0 ? `${hrs}h ${m}m (Live)` : `${m}m (Live)`;
      } else {
        const hrs = Math.floor(session.totalDurationMinutes / 60);
        const m = session.totalDurationMinutes % 60;
        durationFormatted = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
      }

      totalMinsAll += session.totalDurationMinutes;

      if (session.date && session.date.startsWith(currentMonthPrefix)) {
        thisMonthCount++;
      }

      return {
        id: session.id,
        date: session.date,
        formattedDate,
        slot: session.slot,
        slotLabel: session.slotLabel,
        checkInFormatted: session.earliestInStr,
        checkOutFormatted: session.latestOutStr,
        durationMinutes: session.totalDurationMinutes,
        durationFormatted,
        caloriesBurned: session.totalCaloriesBurned,
        status: session.hasLive ? 'in_gym' : 'completed',
        sessionsCombinedCount: session.sessionsCombinedCount,
        method: session.method,
      };
    });

  const totalVisits = groupedRecords.length;
  const totalHrs = (totalMinsAll / 60).toFixed(1);
  const avgMins = totalVisits > 0 ? Math.round(totalMinsAll / totalVisits) : 0;
  const avgHrs = Math.floor(avgMins / 60);
  const avgRemainMins = avgMins % 60;
  const avgTimePerSession = avgHrs > 0 ? `${avgHrs}h ${avgRemainMins}m` : `${avgMins}m`;

  return {
    groupedRecords,
    totalVisits,
    thisMonthVisits: thisMonthCount,
    totalHoursSpent: `${totalHrs} hrs`,
    avgTimePerSession,
  };
}

export default function AttendanceHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentMember, currentUser, currentGym } = useAppContext();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);

  const [weekOverview, setWeekOverview] = useState<any>({
    daysAttended: 0,
    targetDays: 6,
    days: [],
  });

  const [summary, setSummary] = useState<any>({
    totalVisits: 0,
    thisMonthVisits: 0,
    totalHoursSpent: '0.0 hrs',
    avgTimePerSession: '0m',
  });

  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Screen Entrance Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const memberJoinDateStr = (
    currentMember?.joinDate ||
    (currentMember as any)?.joinedDate ||
    currentMember?.startDate ||
    ((currentMember as any)?.createdAt ? String((currentMember as any).createdAt).slice(0, 10) : '') ||
    '2026-09-25'
  ).slice(0, 10);

  const todayDateObj = new Date();
  const todayStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  const fetchAttendance = useCallback(async () => {
    try {
      const memberId = String(currentMember?.userId || currentMember?.id || currentUser?.id || (currentUser as any)?._id || '');
      const memberPhone = String(currentMember?.phone || currentUser?.phone || '');

      if (!memberId && !memberPhone) return;

      // Load instant local cached attendance if available
      const cacheKey = `@fitcore_attendance_${memberId || memberPhone}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.groupedRecords?.length) {
            setAttendanceRecords(parsed.groupedRecords);
            if (parsed.weekOverview) setWeekOverview(parsed.weekOverview);
            if (parsed.summary) setSummary(parsed.summary);
            setIsCheckedIn(Boolean(parsed.isCheckedIn));
          }
        }
      } catch (ce) {}

      const res: any = await apiService.getAttendanceHistory(memberId, memberPhone);
      let rawRecords = res?.data?.records || [];
      let attData = res?.data || {};

      // Group raw records into distinct Date + Slot sessions directly from API
      const { groupedRecords, totalVisits, thisMonthVisits, totalHoursSpent, avgTimePerSession } = processAndGroupRecords(rawRecords);

      setAttendanceRecords(groupedRecords);
      if (attData?.weekOverview) {
        const enrichedDays = (attData.weekOverview.days || []).map((d: any) => ({
          ...d,
          isBeforeJoined: Boolean(memberJoinDateStr && d.date && d.date < memberJoinDateStr),
        }));
        setWeekOverview({
          ...attData.weekOverview,
          days: enrichedDays,
        });
      } else {
        setWeekOverview({
          daysAttended: groupedRecords.length,
          targetDays: 6,
          days: [],
        });
      }

      const updatedSummary = {
        totalVisits: totalVisits ?? attData?.totalVisits ?? 0,
        thisMonthVisits: thisMonthVisits ?? attData?.thisMonthVisits ?? 0,
        totalHoursSpent: totalHoursSpent ?? attData?.totalHoursSpent ?? '0.0 hrs',
        avgTimePerSession: avgTimePerSession ?? attData?.avgTimePerSession ?? '0m',
      };
      setSummary(updatedSummary);
      const liveCheckedIn = Boolean(attData?.todaySession?.isCheckedIn);
      setIsCheckedIn(liveCheckedIn);

      // Cache latest attendance
      AsyncStorage.setItem(cacheKey, JSON.stringify({
        groupedRecords,
        weekOverview: attData?.weekOverview || { daysAttended: 0, targetDays: 6, days: [] },
        summary: updatedSummary,
        isCheckedIn: liveCheckedIn,
      })).catch(() => {});
    } catch (e) {
      console.log('Error fetching attendance history:', e);
    }
  }, [currentMember, currentUser]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilter: 'all' | 'week' | 'month') => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSelectedCalendarDay(null);
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedCalendarDay(null);
  };

  // Build Interactive Monthly Calendar Data
  const getCalendarMonthData = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0 to 11
    const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0, Sun = 6

    let presentCount = 0;
    let absentCount = 0;
    let totalMonthMinutes = 0;

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

      const matchingRecord = attendanceRecords.find((r) => r.date === dateStr);
      const isAttended = Boolean(matchingRecord);
      const isAbsent = !isBeforeJoined && isPast && !isAttended && !isSunday;

      if (isAttended) {
        presentCount++;
        totalMonthMinutes += (matchingRecord.durationMinutes || 0);
      }
      if (isAbsent) {
        absentCount++;
      }

      let status = 'future';
      if (isBeforeJoined) status = 'pre_join';
      else if (isToday) status = isAttended ? 'present_today' : 'today_pending';
      else if (isAttended) status = 'present';
      else if (isAbsent) status = 'absent';
      else if (isSunday) status = 'rest';

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

    const monthHours = (totalMonthMinutes / 60).toFixed(1);

    return {
      monthName,
      daysList,
      presentCount,
      absentCount,
      totalMonthMinutes,
      monthHours,
      year,
      month,
    };
  };

  const calendarData = getCalendarMonthData();

  // Filter records based on selected tab
  const getFilteredRecords = () => {
    if (filter === 'week') {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return attendanceRecords.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d >= oneWeekAgo && d <= now;
      });
    }
    return attendanceRecords;
  };

  const filteredRecords = getFilteredRecords();
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const weekPercent = Math.min(
    100,
    Math.round(((weekOverview?.daysAttended || 0) / (weekOverview?.targetDays || 6)) * 100)
  );

  const renderSessionCard = (rec: any, idx: number) => {
    if (!rec) return null;
    const isLive = rec.status === 'in_gym';
    return (
      <View key={rec.id || idx} style={styles.sessionCard}>
        {/* Header Row */}
        <View style={styles.sessionCardTopRow}>
          <View style={styles.sessionDateGroup}>
            <View style={styles.sessionCalendarBadge}>
              <Image source={calendarIcon} style={styles.sessionCalendarImg} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.sessionDateTitle}>
                {rec.formattedDate || rec.date}
              </Text>
              <View style={styles.slotBadgeRow}>
                <Text style={[styles.slotBadgeText, rec.slot === 'MORNING' ? styles.morningSlotText : styles.eveningSlotText]}>
                  {rec.slot === 'MORNING' ? 'Morning Session' : 'Evening Session'}
                </Text>
                {rec.sessionsCombinedCount > 1 && (
                  <Text style={styles.combinedCountText}>
                    • {rec.sessionsCombinedCount} check-ins
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.sessionStatusPill, isLive ? styles.sessionPillLive : styles.sessionPillDone]}>
            <View style={[styles.sessionDot, { backgroundColor: isLive ? '#6C5CE7' : '#00C48C' }]} />
            <Text style={[styles.sessionStatusText, isLive ? { color: '#6C5CE7' } : { color: '#00C48C' }]}>
              {isLive ? 'IN GYM NOW' : 'COMPLETED'}
            </Text>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.sessionMetricsStrip}>
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelGroup}>
              <Image source={clockIcon} style={styles.metricIconSmall} resizeMode="contain" />
              <Text style={styles.metricLabelText}>CHECK IN</Text>
            </View>
            <Text style={styles.metricValueText}>
              {rec.checkInFormatted || rec.checkIn || '--:--'}
            </Text>
          </View>

          <View style={styles.metricDividerLine} />

          <View style={styles.metricColumn}>
            <View style={styles.metricLabelGroup}>
              <Image source={stopwatchIcon} style={styles.metricIconSmall} resizeMode="contain" />
              <Text style={styles.metricLabelText}>CHECK OUT</Text>
            </View>
            <Text style={[styles.metricValueText, isLive && { color: '#6C5CE7', fontWeight: '800' }]}>
              {isLive ? 'Active Live' : rec.checkOutFormatted || rec.checkOut || '--:--'}
            </Text>
          </View>

          <View style={styles.metricDividerLine} />

          <View style={styles.metricColumn}>
            <View style={styles.metricLabelGroup}>
              <Image source={dumbbellIcon} style={styles.metricIconSmall} resizeMode="contain" />
              <Text style={styles.metricLabelText}>DURATION</Text>
            </View>
            <Text style={[styles.metricValueText, { color: '#6C5CE7', fontWeight: '800' }]}>
              {rec.durationFormatted || `${rec.durationMinutes || 0}m`}
            </Text>
          </View>

          <View style={styles.metricDividerLine} />

          <View style={styles.metricColumn}>
            <View style={styles.metricLabelGroup}>
              <Image source={kcalIcon} style={styles.metricIconSmall} resizeMode="contain" />
              <Text style={styles.metricLabelText}>BURNED</Text>
            </View>
            <Text style={styles.metricValueText}>
              {rec.caloriesBurned ? `${rec.caloriesBurned} kcal` : '--'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaginationFooter = () => {
    const pagePercent = Math.min(100, Math.round((currentPage / totalPages) * 100));

    // Calculate smart sliding window for page chips (works for 1 to 100+ pages)
    const getVisiblePages = () => {
      if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      const pages: (number | string)[] = [];
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <View style={styles.paginationStepperCard}>
        {/* ── Main Stepper & Quick Jump Row ── */}
        <View style={styles.stepperMainRow}>
          {/* Quick First Page Jump Button */}
          {totalPages > 2 && (
            <TouchableOpacity
              style={[styles.stepperFastJumpBtn, currentPage === 1 && styles.stepperFastJumpBtnDisabled]}
              onPress={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepperFastJumpText, currentPage === 1 && styles.stepperFastJumpTextDisabled]}>
                « First
              </Text>
            </TouchableOpacity>
          )}

          {/* Previous Page Circular Button */}
          <TouchableOpacity
            style={[styles.stepperCircleBtn, currentPage === 1 && styles.stepperCircleBtnDisabled]}
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={[styles.stepperArrowIcon, currentPage === 1 && styles.stepperArrowIconDisabled]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Center Page & Status Display */}
          <View style={styles.stepperCenterInfo}>
            <View style={styles.stepperTagRow}>
              <View style={styles.stepperPulseDot} />
              <Text style={styles.stepperSuperText}>PAGE {currentPage} OF {totalPages}</Text>
            </View>
            <Text style={styles.stepperCountText}>
              Showing <Text style={styles.stepperCountBold}>{startIndex + 1}–{endIndex}</Text> of <Text style={styles.stepperCountBold}>{totalItems}</Text> Sessions
            </Text>
          </View>

          {/* Next Page Circular Button */}
          <TouchableOpacity
            style={[
              styles.stepperCircleBtn,
              styles.stepperCircleBtnNext,
              currentPage === totalPages && styles.stepperCircleBtnDisabled,
            ]}
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={[
                styles.stepperArrowIcon,
                styles.stepperArrowIconRotated,
                currentPage === totalPages ? styles.stepperArrowIconDisabled : styles.stepperArrowIconNextActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Quick Last Page Jump Button */}
          {totalPages > 2 && (
            <TouchableOpacity
              style={[styles.stepperFastJumpBtn, styles.stepperFastJumpBtnLast, currentPage === totalPages && styles.stepperFastJumpBtnDisabled]}
              onPress={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepperFastJumpText, styles.stepperFastJumpTextLast, currentPage === totalPages && styles.stepperFastJumpTextDisabled]}>
                Last »
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Visual Page Progress Track ── */}
        <View style={styles.stepperProgressTrack}>
          <View style={[styles.stepperProgressFill, { width: `${pagePercent}%` }]} />
        </View>

        {/* ── Bottom Per-Page Selector & Direct Page Number Jump Pills ── */}
        <View style={styles.stepperBottomRow}>
          <View style={styles.stepperPageSizeGroup}>
            <Text style={styles.stepperPageSizeLabel}>Show:</Text>
            {[5, 10, 20].map((size) => {
              const isSelected = itemsPerPage === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[styles.pageSizePill, isSelected && styles.pageSizePillActive]}
                  onPress={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageSizePillText, isSelected && styles.pageSizePillTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Smart Page Chips (1 ... 5 6 7 ... 20) */}
          {totalPages > 1 && (
            <View style={styles.stepperDirectJumpRow}>
              {visiblePages.map((item, idx) => {
                if (item === '...') {
                  const isLeftEllipsis = idx < visiblePages.indexOf(currentPage);
                  return (
                    <TouchableOpacity
                      key={`ellipsis_${idx}`}
                      style={styles.stepperEllipsisBtn}
                      onPress={() => {
                        if (isLeftEllipsis) {
                          setCurrentPage((p) => Math.max(1, p - 5));
                        } else {
                          setCurrentPage((p) => Math.min(totalPages, p + 5));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperEllipsisText}>•••</Text>
                    </TouchableOpacity>
                  );
                }

                const pageNum = Number(item);
                const isCurrent = pageNum === currentPage;
                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[styles.stepperJumpChip, isCurrent && styles.stepperJumpChipActive]}
                    onPress={() => setCurrentPage(pageNum)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepperJumpChipText, isCurrent && styles.stepperJumpChipTextActive]}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />

      {/* ── 1. AMBIENT BACKGROUND GLOW (MATCHING DASHBOARD) ── */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowRight} />

      {/* ── 2. TOP NAV HEADER (CLEAN LIGHT FITCORE BRANDING) ── */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Image source={leftArrowIcon} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitleText}>Attendance History</Text>
        </View>

        <View style={[styles.statusBadgePill, isCheckedIn ? styles.statusBadgeIn : styles.statusBadgeOut]}>
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: isCheckedIn ? '#10B981' : '#94A3B8',
                transform: isCheckedIn ? [{ scale: pulseAnim }] : [{ scale: 1 }],
              },
            ]}
          />
          <Text style={[styles.statusBadgeText, { color: isCheckedIn ? '#059669' : '#64748B' }]}>
            {isCheckedIn ? 'IN GYM' : 'OUT'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C5CE7']} tintColor="#6C5CE7" />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── FILTER SEGMENTED CONTROLS ── */}
          <View style={styles.filterSection}>
       
            <View style={styles.filterTabsWrapper}>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                onPress={() => handleFilterChange('all')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                  All Time ({attendanceRecords.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, filter === 'week' && styles.filterTabActive]}
                onPress={() => handleFilterChange('week')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, filter === 'week' && styles.filterTabTextActive]}>
                  This Week ({weekOverview?.daysAttended || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, filter === 'month' && styles.filterTabActive]}
                onPress={() => handleFilterChange('month')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, filter === 'month' && styles.filterTabTextActive]}>
                  Monthly Calendar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════
              TAB 1: ALL TIME VIEW (STAT ISLANDS + ALL LOGS)
             ══════════════════════════════════════════════════ */}
          {filter === 'all' && (
            <View>
              {/* 4 STAT ISLANDS */}
              <View style={styles.statsGrid}>
                {/* Total Visits */}
                <View style={[styles.statCard, { borderColor: '#ECEAFD' }]}>
                  <View style={styles.statTopRow}>
                    <Text style={styles.statCardValue}>
                      {summary.totalVisits || attendanceRecords.length || 0}{' '}
                      <Text style={styles.statCardUnit}>Days</Text>
                    </Text>
                    <View style={[styles.statIconBadge, { backgroundColor: '#F3F2FE' }]}>
                      <Image source={chartIcon} style={[styles.statIconImg, { tintColor: '#6C5CE7' }]} resizeMode="contain" />
                    </View>
                  </View>
                  <Text style={[styles.statCardCode, { color: '#6C5CE7' }]}>TOTAL VISITS</Text>
                  <Text style={styles.statCardSubtitle}>All-Time Lifetime</Text>
                </View>

                {/* This Month */}
                <View style={[styles.statCard, { borderColor: '#E6FBF5' }]}>
                  <View style={styles.statTopRow}>
                    <Text style={styles.statCardValue}>
                      {summary.thisMonthVisits || 0}{' '}
                      <Text style={styles.statCardUnit}>Days</Text>
                    </Text>
                    <View style={[styles.statIconBadge, { backgroundColor: '#E6FBF5' }]}>
                      <Image source={calendarIcon} style={[styles.statIconImg, { tintColor: '#00C48C' }]} resizeMode="contain" />
                    </View>
                  </View>
                  <Text style={[styles.statCardCode, { color: '#00C48C' }]}>THIS MONTH</Text>
                  <Text style={styles.statCardSubtitle}>Active Billing Cycle</Text>
                </View>

                {/* Total Time Trained */}
                <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
                  <View style={styles.statTopRow}>
                    <Text style={styles.statCardValue}>
                      {summary.totalHoursSpent || '0.0 hrs'}
                    </Text>
                    <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Image source={stopwatchIcon} style={[styles.statIconImg, { tintColor: '#F59E0B' }]} resizeMode="contain" />
                    </View>
                  </View>
                  <Text style={[styles.statCardCode, { color: '#F59E0B' }]}>TIME TRAINED</Text>
                  <Text style={styles.statCardSubtitle}>Total Gym Hours</Text>
                </View>

                {/* Avg Session Duration */}
                <View style={[styles.statCard, { borderColor: '#FDF2F8' }]}>
                  <View style={styles.statTopRow}>
                    <Text style={styles.statCardValue}>
                      {summary.avgTimePerSession || '0m'}
                    </Text>
                    <View style={[styles.statIconBadge, { backgroundColor: '#FDF2F8' }]}>
                      <Image source={clockIcon} style={[styles.statIconImg, { tintColor: '#EC4899' }]} resizeMode="contain" />
                    </View>
                  </View>
                  <Text style={[styles.statCardCode, { color: '#EC4899' }]}>AVG SESSION</Text>
                  <Text style={styles.statCardSubtitle}>Per Check-In</Text>
                </View>
              </View>

              {/* SECTION HEADING */}
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionSectionTitle}>All Time Session History</Text>
                <Text style={styles.sessionCountBadge}>{totalItems} Sessions</Text>
              </View>

              {/* TIMELINE LIST */}
              {totalItems === 0 ? (
                <View style={styles.emptyCardBox}>
                  <View style={styles.emptyCircle}>
                    <Image source={calendarIcon} style={styles.emptyIconImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.emptyTitleText}>No Attendance Sessions Found</Text>
                  <Text style={styles.emptySubText}>
                    Check in at the gym turnstile or tap Check In on the dashboard to log your sessions!
                  </Text>
                </View>
              ) : (
                paginatedRecords.map((rec: any, idx: number) => renderSessionCard(rec, idx))
              )}

              {/* PAGINATION CONTROLLER FOOTER */}
              {totalItems > 0 && renderPaginationFooter()}
            </View>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 2: THIS WEEK VIEW (WEEK STREAK + 7-DAY STRIP)
             ══════════════════════════════════════════════════ */}
          {filter === 'week' && (
            <View>
              {/* 7-DAY WEEKLY STREAK & GOAL CARD */}
              <View style={styles.weekStreakCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
                    <View style={styles.sparkleIconBox}>
                      <Image source={thunderIcon} style={styles.sparkleIcon} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={styles.cardSuperTitle}>WEEKLY TARGET</Text>
                      <Text style={styles.cardMainTitle}>Weekly Consistency</Text>
                    </View>
                  </View>
                  <View style={styles.weekPercentBadge}>
                    <Text style={styles.weekPercentText}>{weekPercent}%</Text>
                  </View>
                </View>

                {/* 7-DAY MON TO SUN STRIP */}
                <View style={styles.weekDaysStrip}>
                  {weekOverview?.days?.map((d: any) => {
                    const isDone = Boolean(d.attended || d.done);
                    const isToday = d.isToday || d.date === todayStr;
                    const isBeforeJoined = Boolean(memberJoinDateStr && d.date && d.date < memberJoinDateStr);
                    const isMissed = !isBeforeJoined && d.isPast && !isDone && d.day !== 'Sun';
                    return (
                      <View
                        key={d.day}
                        style={[
                          styles.weekDayCol,
                          isToday && styles.weekDayColToday,
                          isDone && styles.weekDayColCompleted,
                          isMissed && styles.weekDayColMissed,
                          isBeforeJoined && styles.weekDayColPreJoin,
                        ]}
                      >
                        <Text style={[styles.weekDayText, isToday && styles.weekDayTextToday, isDone && styles.weekDayTextCompleted, isBeforeJoined && styles.weekDayTextPreJoin]}>
                          {d.day}
                        </Text>
                        <View
                          style={[
                            styles.weekDayStatusCircle,
                            isDone && styles.weekDayStatusCircleDone,
                            isToday && !isDone && styles.weekDayStatusCircleToday,
                            isMissed && styles.weekDayStatusCircleMissed,
                            isBeforeJoined && styles.weekDayStatusCirclePreJoin,
                          ]}
                        >
                          {isDone ? (
                            <Text style={styles.doneCheckmark}>✓</Text>
                          ) : isMissed ? (
                            <Text style={styles.missedCross}>✕</Text>
                          ) : isBeforeJoined ? (
                            <Text style={{ fontSize: fontScale(11), color: '#94A3B8', fontWeight: '800' }}>-</Text>
                          ) : isToday ? (
                            <View style={[styles.statusDotPlaceholder, { backgroundColor: '#6C5CE7' }]} />
                          ) : (
                            <View style={styles.statusDotPlaceholder} />
                          )}
                        </View>
                        <Text style={[styles.weekFocusText, isDone && styles.weekFocusTextDone, isToday && styles.weekFocusTextToday, isBeforeJoined && styles.weekFocusTextPreJoin]} numberOfLines={1}>
                          {isDone ? `${d.durationMinutes || 0}m` : isBeforeJoined ? '-' : isToday ? 'Today' : d.day === 'Sun' ? 'Rest' : isMissed ? 'Absent' : 'Pending'}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* PROGRESS BAR & STAT METRICS */}
                <View style={styles.weekProgressBox}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabelLeft}>
                      Goal: <Text style={styles.progressBold}>{weekOverview?.daysAttended || 0} of {weekOverview?.targetDays || 6} Days</Text>
                    </Text>
                    <Text style={styles.progressLabelRight}>
                      {weekOverview?.weeklyTimeFormatted || '0.0 hrs'} trained
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${weekPercent}%` }]} />
                  </View>
                </View>
              </View>

              {/* THIS WEEK SESSION TIMELINE LIST */}
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionSectionTitle}>This Week's Session Logs</Text>
                <Text style={styles.sessionCountBadge}>{filteredRecords.length} Sessions</Text>
              </View>

              {filteredRecords.length === 0 ? (
                <View style={styles.emptyCardBox}>
                  <View style={styles.emptyCircle}>
                    <Image source={calendarIcon} style={styles.emptyIconImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.emptyTitleText}>No Sessions This Week</Text>
                  <Text style={styles.emptySubText}>
                    Check in today to start your weekly workout streak!
                  </Text>
                </View>
              ) : (
                filteredRecords.map((rec: any, idx: number) => renderSessionCard(rec, idx))
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 3: MONTHLY CALENDAR VIEW (PRESENT / ABSENT)
             ══════════════════════════════════════════════════ */}
          {filter === 'month' && (
            <View>
              {/* MONTHLY CALENDAR CARD */}
              <View style={styles.calendarCard}>
                {/* Month Navigation Header */}
                <View style={styles.calendarMonthNavRow}>
                  <TouchableOpacity
                    style={styles.calendarMonthNavBtn}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.calendarMonthNavText}>‹</Text>
                  </TouchableOpacity>

                  <Text style={styles.calendarMonthTitle}>{calendarData.monthName}</Text>

                  <TouchableOpacity
                    style={styles.calendarMonthNavBtn}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.calendarMonthNavText}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Monthly Summary Stats Island */}
                <View style={styles.calendarStatsPillsRow}>
                  <View style={styles.calendarStatPill}>
                    <View style={[styles.calendarStatDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.calendarStatText}>
                      Present: <Text style={{ color: '#059669', fontWeight: '900' }}>{calendarData.presentCount} Days</Text>
                    </Text>
                  </View>

                  <View style={styles.calendarStatPill}>
                    <View style={[styles.calendarStatDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.calendarStatText}>
                      Absent: <Text style={{ color: '#DC2626', fontWeight: '900' }}>{calendarData.absentCount} Days</Text>
                    </Text>
                  </View>

                  <View style={styles.calendarStatPill}>
                    <View style={[styles.calendarStatDot, { backgroundColor: '#6C5CE7' }]} />
                    <Text style={styles.calendarStatText}>
                      Time: <Text style={{ color: '#6C5CE7', fontWeight: '900' }}>{calendarData.monthHours} hrs</Text>
                    </Text>
                  </View>
                </View>

                {/* Weekdays Row: Mon Tue Wed Thu Fri Sat Sun */}
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
                            status === 'rest' && styles.calendarDayPillRest,
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
                              status === 'rest' && styles.calendarDayNumRest,
                              status === 'today_pending' && styles.calendarDayNumToday,
                              status === 'pre_join' && styles.calendarDayNumPreJoin,
                            ]}
                          >
                            {dayItem.dayNum}
                          </Text>

                          {/* Micro Status Marker */}
                          {(status === 'present' || status === 'present_today') && (
                            <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#10B981' }]} />
                          )}
                          {status === 'absent' && (
                            <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#EF4444' }]} />
                          )}
                          {status === 'today_pending' && (
                            <View style={[styles.calendarStatusMicroDot, { backgroundColor: '#6C5CE7' }]} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

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
                    <View style={[styles.calendarLegendDot, { backgroundColor: '#6C5CE7' }]} />
                    <Text style={styles.calendarLegendText}>Today</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendDot, { backgroundColor: '#0284C7' }]} />
                    <Text style={styles.calendarLegendText}>Sunday Rest</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendDot, { backgroundColor: '#CBD5E1' }]} />
                    <Text style={styles.calendarLegendText}>Not Joined</Text>
                  </View>
                </View>
              </View>

              {/* INTERACTIVE SELECTED DAY CARD */}
              {selectedCalendarDay && (
                <View style={{ marginBottom: hp(2) }}>
                  <View style={styles.sessionHeaderRow}>
                    <Text style={styles.sessionSectionTitle}>Selected Date: {selectedCalendarDay.dateStr}</Text>
                  </View>

                  {selectedCalendarDay.isAttended ? (
                    renderSessionCard(selectedCalendarDay.record, 0)
                  ) : (
                    <View style={styles.emptyCardBox}>
                      <View
                        style={[
                          styles.emptyCircle,
                          selectedCalendarDay.status === 'absent'
                            ? { backgroundColor: '#FEE2E2' }
                            : selectedCalendarDay.status === 'rest'
                            ? { backgroundColor: '#E0F2FE' }
                            : selectedCalendarDay.status === 'pre_join'
                            ? { backgroundColor: '#F1F5F9' }
                            : { backgroundColor: '#F3F2FE' },
                        ]}
                      >
                        <Image
                          source={
                            selectedCalendarDay.status === 'absent'
                              ? clockIcon
                              : selectedCalendarDay.status === 'rest'
                              ? activeIcon
                              : selectedCalendarDay.status === 'pre_join'
                              ? calendarIcon
                              : dumbbellIcon
                          }
                          style={[
                            styles.emptyIconImg,
                            selectedCalendarDay.status === 'absent'
                              ? { tintColor: '#EF4444' }
                              : selectedCalendarDay.status === 'rest'
                              ? { tintColor: '#0284C7' }
                              : selectedCalendarDay.status === 'pre_join'
                              ? { tintColor: '#94A3B8' }
                              : { tintColor: '#6C5CE7' },
                          ]}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.emptyTitleText}>
                        {selectedCalendarDay.status === 'absent'
                          ? 'Absent (No Check-In)'
                          : selectedCalendarDay.status === 'rest'
                          ? 'Sunday Rest & Recovery Day'
                          : selectedCalendarDay.status === 'pre_join'
                          ? `Pre-Membership Period`
                          : selectedCalendarDay.isToday
                          ? 'Today (Pending Check-In)'
                          : 'Upcoming Gym Day'}
                      </Text>
                      <Text style={styles.emptySubText}>
                        {selectedCalendarDay.status === 'absent'
                          ? 'You were absent on this day. Consistency is the key to progress!'
                          : selectedCalendarDay.status === 'rest'
                          ? 'Sundays are designated for muscle recovery and relaxation.'
                          : selectedCalendarDay.status === 'pre_join'
                          ? `You officially joined on ${memberJoinDateStr}. Records before this date are not counted.`
                          : 'Log in at the turnstile or tap Check In to register your session!'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FD',
  },
  // ── Ambient Background Glow ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(25),
    left: -wp(15),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: '#E8E5FD',
    opacity: 0.6,
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(25),
    right: -wp(25),
    width: wp(70),
    height: wp(70),
    borderRadius: wp(35),
    backgroundColor: '#F0EEFF',
    opacity: 0.5,
  },

  // ── Light Top Navigation ──
  topNav: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    minHeight: hp(6),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 2,
  },
  backIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    tintColor: '#6C5CE7',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitleText: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    zIndex: 2,
  },
  statusBadgeIn: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  statusBadgeOut: {
    borderColor: '#ECEAFD',
    backgroundColor: '#FFFFFF',
  },
  statusDot: {
    width: moderateScale(6.5),
    height: moderateScale(6.5),
    borderRadius: moderateScale(3.5),
  },
  statusBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ── Scroll Content ──
  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1),
  },

  // ── 3. Member Hero Card ──
  heroMemberCard: {
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
    shadowRadius: 12,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
  },
  gymLogoCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogoImg: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#6C5CE7',
  },
  activePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  activeDot: {
    width: moderateScale(5.5),
    height: moderateScale(5.5),
    borderRadius: moderateScale(3),
    backgroundColor: '#00C48C',
  },
  activePillText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#00C48C',
  },
  heroGymTitle: {
    fontSize: fontScale(15.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  memberAvatarBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  memberAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  heroCardDivider: {
    height: 1,
    backgroundColor: '#F3F2FE',
    marginVertical: hp(1.2),
  },
  heroCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMemberName: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  heroMemberId: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  liveSyncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  liveSyncIcon: {
    width: moderateScale(11),
    height: moderateScale(11),
    tintColor: '#6C5CE7',
  },
  liveSyncText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // ── 4. Streak Card ──
  weekStreakCard: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  sparkleIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(11),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#6C5CE7',
  },
  cardSuperTitle: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
  },
  cardMainTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  weekPercentBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  weekPercentText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  weekDaysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.6),
  },
  weekDayCol: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(0.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    width: '13.2%',
  },
  weekDayColToday: {
    backgroundColor: '#F3F2FE',
    borderColor: '#C4B5FD',
  },
  weekDayColCompleted: {
    backgroundColor: '#E6FBF5',
    borderColor: '#A7F3D0',
  },
  weekDayColMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  weekDayColPreJoin: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },
  weekDayText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: hp(0.5),
  },
  weekDayTextToday: {
    color: '#6C5CE7',
  },
  weekDayTextCompleted: {
    color: '#00C48C',
  },
  weekDayTextPreJoin: {
    color: '#94A3B8',
  },
  weekDayStatusCircle: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.5),
  },
  weekDayStatusCircleDone: {
    backgroundColor: '#00C48C',
  },
  weekDayStatusCircleToday: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  weekDayStatusCircleMissed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  weekDayStatusCirclePreJoin: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneCheckmark: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '900',
  },
  missedCross: {
    color: '#EF4444',
    fontSize: fontScale(10.5),
    fontWeight: '800',
  },
  statusDotPlaceholder: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
    backgroundColor: '#94A3B8',
  },
  weekFocusText: {
    fontSize: fontScale(8.5),
    fontWeight: '600',
    color: '#64748B',
  },
  weekFocusTextDone: {
    color: '#00C48C',
    fontWeight: '700',
  },
  weekFocusTextToday: {
    color: '#6C5CE7',
    fontWeight: '700',
  },
  weekFocusTextPreJoin: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  weekProgressBox: {
    marginTop: hp(0.4),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(0.6),
  },
  progressLabelLeft: {
    fontSize: fontScale(11),
    color: '#334155',
    fontWeight: '500',
  },
  progressBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  progressLabelRight: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  progressBarTrack: {
    height: moderateScale(6),
    backgroundColor: '#F3F2FE',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(3),
  },

  // ── 5. Stats Islands ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hp(1.4),
    marginBottom: hp(2.2),
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1.2,
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  statIconBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconImg: {
    width: moderateScale(14),
    height: moderateScale(14),
  },
  statCardValue: {
    fontSize: fontScale(18.5),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statCardUnit: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  statCardCode: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statCardSubtitle: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '500',
  },

  // ── 6. Filter Tabs ──
  filterSection: {
    marginBottom: hp(1.4),
  },
  filterHeaderGroup: {
    marginBottom: hp(1),
  },
  sectionHeadingText: {
    fontSize: fontScale(15.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubHeadingText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  filterTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(13),
    padding: 3,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  filterTab: {
    flex: 1,
    paddingVertical: hp(0.85),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  filterTabActive: {
    backgroundColor: '#6C5CE7',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },


  // ── 8. Session Cards ──
  emptyCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginVertical: hp(2),
  },
  emptyCircle: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.4),
  },
  emptyIconImg: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: '#6C5CE7',
  },
  emptyTitleText: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(0.4),
  },
  emptySubText: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: hp(1.3),
  },
  sessionCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: hp(1.1),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2FE',
  },
  sessionDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  sessionCalendarBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCalendarImg: {
    width: moderateScale(16),
    height: moderateScale(16),
    tintColor: '#6C5CE7',
  },
  sessionDateTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  slotBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  slotBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  morningSlotText: {
    color: '#D97706',
  },
  eveningSlotText: {
    color: '#6C5CE7',
  },
  combinedCountText: {
    fontSize: fontScale(9.5),
    color: '#94A3B8',
    fontWeight: '500',
  },
  sessionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(7),
  },
  sessionPillDone: {
    backgroundColor: '#E6FBF5',
  },
  sessionPillLive: {
    backgroundColor: '#F3F2FE',
  },
  sessionDot: {
    width: moderateScale(5.5),
    height: moderateScale(5.5),
    borderRadius: moderateScale(3),
  },
  sessionStatusText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionMetricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(1.1),
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    marginBottom: 2,
  },
  metricIconSmall: {
    width: moderateScale(9),
    height: moderateScale(9),
    tintColor: '#94A3B8',
  },
  metricLabelText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  metricValueText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#1E293B',
  },
  metricDividerLine: {
    width: 1,
    height: hp(2.5),
    backgroundColor: '#F3F2FE',
  },

  // ── 9. Minimalist Circular Stepper Pagination ──
  paginationStepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1.8),
    marginTop: hp(1),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  stepperMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
  },
  stepperCircleBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  stepperCircleBtnNext: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepperCircleBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.45,
  },
  stepperArrowIcon: {
    width: moderateScale(15),
    height: moderateScale(15),
    tintColor: '#6C5CE7',
  },
  stepperArrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  stepperArrowIconNextActive: {
    tintColor: '#FFFFFF',
  },
  stepperArrowIconDisabled: {
    tintColor: '#94A3B8',
  },
  stepperCenterInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: moderateScale(8),
  },
  stepperTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: 3,
  },
  stepperPulseDot: {
    width: moderateScale(6.5),
    height: moderateScale(6.5),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#6C5CE7',
  },
  stepperSuperText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  stepperCountText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '500',
  },
  stepperCountBold: {
    color: '#1E293B',
    fontWeight: '800',
  },
  stepperProgressTrack: {
    height: moderateScale(5),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: hp(1.4),
  },
  stepperProgressFill: {
    height: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(3),
  },
  stepperBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  stepperPageSizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
  },
  stepperPageSizeLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#64748B',
    marginRight: 2,
  },
  pageSizePill: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  pageSizePillActive: {
    backgroundColor: '#F3F2FE',
    borderColor: '#C4B5FD',
  },
  pageSizePillText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  pageSizePillTextActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  stepperDirectJumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  stepperFastJumpBtn: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    backgroundColor: '#F3F2FE',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperFastJumpBtnLast: {
    backgroundColor: '#F3F2FE',
  },
  stepperFastJumpBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.45,
  },
  stepperFastJumpText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  stepperFastJumpTextLast: {
    color: '#6C5CE7',
  },
  stepperFastJumpTextDisabled: {
    color: '#94A3B8',
  },
  stepperEllipsisBtn: {
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperEllipsisText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  stepperJumpChip: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  stepperJumpChipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  stepperJumpChipText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  stepperJumpChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // ── Session Section Headers ──
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
  },
  sessionSectionTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionCountBadge: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },

  // ── Monthly Calendar View Styles ──
  calendarCard: {
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
  calendarMonthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  calendarMonthNavBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthNavText: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  calendarMonthTitle: {
    fontSize: fontScale(15.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  calendarStatsPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFD',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  calendarStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
  },
  calendarStatDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  calendarStatText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#334155',
  },
  calendarWeekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: hp(0.8),
  },
  calendarWeekDayColHeader: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  calendarWeekDayHeaderText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#94A3B8',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  calendarDayPill: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  calendarDayPillSelected: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  calendarDayPillPresent: {
    backgroundColor: '#E6FBF5',
    borderColor: '#A7F3D0',
  },
  calendarDayPillAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  calendarDayPillRest: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  calendarDayPillToday: {
    backgroundColor: '#F3F2FE',
    borderColor: '#6C5CE7',
    borderWidth: 1.5,
  },
  calendarDayPillPreJoin: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.45,
  },
  calendarDayNum: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#334155',
  },
  calendarDayNumPresent: {
    color: '#059669',
    fontWeight: '900',
  },
  calendarDayNumAbsent: {
    color: '#EF4444',
    fontWeight: '900',
  },
  calendarDayNumRest: {
    color: '#0284C7',
    fontWeight: '800',
  },
  calendarDayNumToday: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  calendarDayNumPreJoin: {
    color: '#94A3B8',
  },
  calendarStatusMicroDot: {
    position: 'absolute',
    bottom: 3,
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
  },
  calendarLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(10),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: hp(0.5),
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarLegendDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
  },
  calendarLegendText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#64748B',
  },
});
