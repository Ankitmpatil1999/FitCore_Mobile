import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

export default function TrainerAttendanceScreen({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Coach Kunal';
  const gymName = currentGym?.name || 'FitCore Gym';

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState('0%');
  const [dbJoinDate, setDbJoinDate] = useState<string | null>(null);
  const [attHistoryRecords, setAttHistoryRecords] = useState<any[]>([]);
  const [attSummary, setAttSummary] = useState<any>({
    totalDaysPresent: 0,
    totalLeaves: 0,
    totalHoursWorked: '0.0 hrs',
    attendanceRate: '0%',
  });
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

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
  }, []);

  // ── Load Attendance Data from DB ──
  const loadData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const histRes: any = await apiService.getTrainerAttendanceHistory(trainerId, selectedMonth);
      if (histRes?.success && histRes.data) {
        if (histRes.data.joinDate) {
          setDbJoinDate(histRes.data.joinDate);
        }
        if (histRes.data.summary) {
          setAttSummary(histRes.data.summary);
          if (histRes.data.summary.attendanceRate) {
            setAttendanceRate(histRes.data.summary.attendanceRate);
          }
        }
        if (Array.isArray(histRes.data.records)) {
          setAttHistoryRecords(histRes.data.records);
        }
      }
    } catch (e) {
      console.log('Error loading trainer attendance history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [trainerId, selectedMonth]);

  // ── Month Switcher Functions (Timezone-safe pure integer math) ──
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let newYear = y;
    let newMonth = m - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let newYear = y;
    let newMonth = m + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const joinDate = dbJoinDate || attSummary?.joinDate || currentTrainer?.joinDate || currentUser?.joinDate || '2026-09-16';

  const formattedJoinDate = (() => {
    try {
      const parts = joinDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return joinDate;
    } catch {
      return joinDate;
    }
  })();

  const [selYear, selMonth] = selectedMonth.split('-').map(Number);
  const monthDateObj = new Date(selYear, selMonth - 1, 1);
  const displayMonthName = monthDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const totalDaysInMonth = new Date(selYear, selMonth, 0).getDate();
  const firstDayOfWeek = new Date(selYear, selMonth - 1, 1).getDay();
  const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
  const todayDateNum = isCurrentMonth ? new Date().getDate() : -1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
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
          <View style={styles.headerCenterBox}>
            <Text style={styles.headerTitle}>Attendance</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {gymName} • {trainerName}
            </Text>
          </View>
          <View style={{ width: moderateScale(38), alignItems: 'center', justifyContent: 'center' }}>
            {loading && !refreshing && (
              <ActivityIndicator size="small" color="#6366F1" />
            )}
          </View>
        </View>

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
          {/* ── 4 SUMMARY STATS CARDS (VALUE ON TOP, TEXT BELOW) ── */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.22)', backgroundColor: '#F0FDF4' }]}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIconBg, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="checkmark-circle" size={moderateScale(15)} color="#10B981" />
                </View>
                <Text style={[styles.statCardVal, { color: '#047857' }]}>{attSummary?.totalDaysPresent ?? 0} Days</Text>
              </View>
              <Text style={styles.statCardLabel}>Present</Text>
            </View>

            <View style={[styles.statCard, { borderColor: 'rgba(99, 102, 241, 0.22)', backgroundColor: '#EEF2FF' }]}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIconBg, { backgroundColor: '#E0E7FF' }]}>
                  <Icon name="time" size={moderateScale(15)} color="#6366F1" />
                </View>
                <Text style={[styles.statCardVal, { color: '#4338CA' }]}>{attSummary?.totalHoursWorked || '0.0 hrs'}</Text>
              </View>
              <Text style={styles.statCardLabel}>Working Hours</Text>
            </View>

            <View style={[styles.statCard, { borderColor: 'rgba(244, 63, 94, 0.22)', backgroundColor: '#FFF1F2' }]}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIconBg, { backgroundColor: '#FFE4E6' }]}>
                  <Icon name="alert-circle" size={moderateScale(15)} color="#F43F5E" />
                </View>
                <Text style={[styles.statCardVal, { color: '#BE123C' }]}>{attSummary?.totalLeaves ?? 0} Days</Text>
              </View>
              <Text style={styles.statCardLabel}>Leaves</Text>
            </View>

            <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.22)', backgroundColor: '#FEF3C7' }]}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIconBg, { backgroundColor: '#FEF08A' }]}>
                  <Icon name="analytics" size={moderateScale(15)} color="#D97706" />
                </View>
                <Text style={[styles.statCardVal, { color: '#B45309' }]}>{attendanceRate}</Text>
              </View>
              <Text style={styles.statCardLabel}>Attendance %</Text>
            </View>
          </View>

          {/* ── INTERACTIVE MONTHLY CALENDAR GRID WITH INLINE MONTH SWITCHER ── */}
          <View style={styles.calendarCard}>
            
            {/* Coach Join Date Banner */}
            <View style={styles.joinDateBanner}>
              <View style={styles.joinDateLeft}>
                <Icon name="ribbon" size={moderateScale(14)} color="#6366F1" />
                <Text style={styles.joinDateBannerText}>
                  Joined Gym: <Text style={{ fontWeight: '800', color: '#4338CA' }}>{formattedJoinDate}</Text>
                </Text>
              </View>
              {selectedMonth !== joinDate.slice(0, 7) && (
                <TouchableOpacity
                  style={styles.jumpToJoinBtn}
                  onPress={() => setSelectedMonth(joinDate.slice(0, 7))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.jumpToJoinBtnText}>View Join Month</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity
                style={styles.calMonthArrowBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chevron-back" size={moderateScale(16)} color="#4338CA" />
              </TouchableOpacity>
              
              <View style={styles.calMonthTitleBox}>
                <Icon name="calendar" size={moderateScale(16)} color="#6C5CE7" />
                <Text style={styles.calendarTitle}>{displayMonthName}</Text>
              </View>

              <TouchableOpacity
                style={styles.calMonthArrowBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="chevron-forward" size={moderateScale(16)} color="#4338CA" />
              </TouchableOpacity>
            </View>

            {/* Weekday labels */}
            <View style={styles.weekDaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <View key={idx} style={styles.weekDayHeaderBox}>
                  <Text style={styles.weekDayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Day cells matrix */}
            <View style={styles.daysMatrixGrid}>
              {(() => {
                const cells = [];
                const todayDateStr = new Date().toISOString().split('T')[0];

                for (let i = 0; i < firstDayOfWeek; i++) {
                  cells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
                }

                for (let d = 1; d <= totalDaysInMonth; d++) {
                  const dayDateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayOfWeek = new Date(selYear, selMonth - 1, d).getDay();
                  const matched = attHistoryRecords.find((r) => r.date === dayDateStr);

                  const isJoinedDay = dayDateStr === joinDate;
                  const isTodayCell = dayDateStr === todayDateStr;

                  let cellStatus = 'normal';

                  if (dayDateStr > todayDateStr) {
                    // Future date (upcoming or next month)
                    cellStatus = 'future';
                  } else if (dayDateStr < joinDate) {
                    // Before trainer joined gym
                    cellStatus = 'not_joined';
                  } else if (matched) {
                    // Real record from database
                    if (matched.status === 'present') cellStatus = 'present';
                    else if (matched.status === 'half_day') cellStatus = 'half_day';
                    else if (matched.status === 'leave' || matched.status === 'absent') cellStatus = 'leave';
                    else cellStatus = 'present';
                  } else if (dayDateStr === todayDateStr) {
                    // Today
                    cellStatus = 'today';
                  } else if (dayOfWeek === 0) {
                    // Sunday / weekly off
                    cellStatus = 'rest';
                  } else {
                    // Regular past date (active in gym from join date to today)
                    cellStatus = 'normal';
                  }

                  let bgCol = '#FFFFFF';
                  let borderCol = '#F1F5F9';
                  let textCol = '#334155';

                  if (cellStatus === 'not_joined') {
                    bgCol = '#F8FAFC';
                    borderCol = '#E2E8F0';
                    textCol = '#CBD5E1';
                  } else if (cellStatus === 'present') {
                    bgCol = '#ECFDF5';
                    borderCol = '#A7F3D0';
                    textCol = '#059669';
                  } else if (cellStatus === 'half_day') {
                    bgCol = '#FEF3C7';
                    borderCol = '#FDE68A';
                    textCol = '#D97706';
                  } else if (cellStatus === 'leave') {
                    bgCol = '#FFF1F2';
                    borderCol = '#FECDD3';
                    textCol = '#E11D48';
                  } else if (cellStatus === 'rest') {
                    bgCol = '#F8FAFC';
                    borderCol = '#E2E8F0';
                    textCol = '#64748B';
                  } else if (cellStatus === 'future') {
                    bgCol = '#FFFFFF';
                    borderCol = '#F8FAFC';
                    textCol = '#CBD5E1';
                  } else if (cellStatus === 'today') {
                    bgCol = '#F5F3FF';
                    borderCol = '#DDD6FE';
                    textCol = '#6D28D9';
                  }

                  cells.push(
                    <View key={`day-${d}`} style={styles.dayCell}>
                      <View
                        style={[
                          styles.dayCellInner,
                          {
                            backgroundColor: isJoinedDay ? '#EEF2FF' : bgCol,
                            borderColor: isJoinedDay ? '#6366F1' : borderCol,
                          },
                          isTodayCell && styles.todayActiveRing,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayCellNum,
                            {
                              color: isJoinedDay ? '#4F46E5' : textCol,
                              fontWeight: isJoinedDay ? '900' : '800',
                            },
                          ]}
                        >
                          {cellStatus === 'not_joined' ? '—' : d}
                        </Text>
                        {isJoinedDay && (
                          <View style={styles.joinTagMini}>
                            <Text style={styles.joinTagMiniText}>JOIN</Text>
                          </View>
                        )}
                        {!isJoinedDay && cellStatus === 'present' && <View style={[styles.dayDot, { backgroundColor: '#059669' }]} />}
                        {!isJoinedDay && cellStatus === 'half_day' && <View style={[styles.dayDot, { backgroundColor: '#D97706' }]} />}
                        {!isJoinedDay && cellStatus === 'leave' && <View style={[styles.dayDot, { backgroundColor: '#E11D48' }]} />}
                      </View>
                    </View>
                  );
                }
                return cells;
              })()}
            </View>

            {/* Legend Indicators */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                <Text style={styles.legendText}>Half Day</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E11D48' }]} />
                <Text style={styles.legendText}>Leave</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.legendText}>Rest Day</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.legendText}>Joined Day</Text>
              </View>
            </View>
          </View>

        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(1.4),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(8),
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  headerJoinBadge: {
    fontSize: fontScale(10),
    color: '#4F46E5',
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    marginTop: moderateScale(3),
    textAlign: 'center',
    alignSelf: 'center',
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },

  // ── Summary Stats ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  statCard: {
    width: (wp(90) - moderateScale(8)) / 2,
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  statIconBg: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardVal: {
    fontSize: fontScale(14.5),
    fontWeight: '900',
    textAlign: 'center',
  },
  statCardLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  statCardSub: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },

  // ── Calendar Matrix ──
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1.2,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  joinDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(7),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  joinDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    flex: 1,
  },
  joinDateBannerText: {
    fontSize: fontScale(11),
    color: '#475569',
    fontWeight: '600',
  },
  jumpToJoinBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  jumpToJoinBtnText: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calMonthArrowBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  calMonthTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  calendarTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(6),
  },
  weekDayHeaderBox: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  weekDayHeaderText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysMatrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: moderateScale(36),
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: moderateScale(36),
    padding: moderateScale(1.5),
  },
  dayCellInner: {
    flex: 1,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayActiveRing: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  dayCellNum: {
    fontSize: fontScale(11),
    fontWeight: '800',
  },
  dayDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    marginTop: 1,
  },
  joinTagMini: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
  },
  joinTagMiniText: {
    fontSize: fontScale(6.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(10),
    marginTop: hp(1.2),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  legendText: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
  },
});
