import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { getAttendanceByMember, AttendanceRecord } from '../../data/mockData';

export default function CheckInScreen() {
  const { currentMember, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'qr' | 'history'>('qr');

  const attendance = currentMember
    ? getAttendanceByMember(currentMember.id)
    : [];

  const totalHoursThisMonth = attendance.reduce((sum, a) => {
    if (!a.duration) return sum;
    const parts = a.duration.match(/(\d+)h\s*(\d+)?m?/);
    if (!parts) return sum;
    return sum + parseInt(parts[1], 10) * 60 + (parseInt(parts[2] ?? '0', 10));
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      <View style={styles.root}>

        <View style={styles.header}>
          <Text style={styles.headerSub}>Gym Access</Text>
          <Text style={styles.headerTitle}>Check-In 🪪</Text>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'qr' && styles.tabActive]}
            onPress={() => setActiveTab('qr')}
          >
            <Text style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive]}>QR Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Attendance History</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {activeTab === 'qr' ? (
            <>
              {/* QR Card */}
              <View style={styles.qrCard}>
                <Text style={styles.qrCardLabel}>Your Digital Entry Pass</Text>

                {/* QR Code placeholder */}
                <View style={styles.qrBox}>
                  <View style={styles.qrInner}>
                    {/* Simulated QR grid */}
                    {Array.from({ length: 7 }).map((_, row) => (
                      <View key={row} style={styles.qrRow}>
                        {Array.from({ length: 7 }).map((__, col) => {
                          const isCorner =
                            (row < 2 && col < 2) ||
                            (row < 2 && col > 4) ||
                            (row > 4 && col < 2);
                          const isDark = isCorner || ((row + col) % 3 === 0 && Math.random() > 0.3);
                          return (
                            <View
                              key={col}
                              style={[styles.qrCell, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                  <Text style={styles.qrMemberId}>
                    ID: {currentMember?.id?.toUpperCase() ?? 'M000001'}
                  </Text>
                </View>

                <Text style={styles.memberNameQR}>{currentUser?.name ?? 'Champion'}</Text>
                <Text style={styles.gymNameQR}>{currentMember ? `Member of FitCore Elite` : 'FitCore Member'}</Text>

                {/* NFC option */}
                <View style={styles.nfcRow}>
                  <View style={styles.methodChip}>
                    <Text style={styles.methodChipIcon}>📱</Text>
                    <Text style={styles.methodChipText}>QR Code</Text>
                    <View style={styles.activeDot} />
                  </View>
                  <View style={styles.methodChip}>
                    <Text style={styles.methodChipIcon}>📡</Text>
                    <Text style={styles.methodChipText}>NFC Tap</Text>
                  </View>
                </View>
              </View>

              {/* Today's status */}
              <Text style={styles.sectionTitle}>Today's Session</Text>
              {todayAttendance.length > 0 ? (
                <View style={styles.todayCard}>
                  {todayAttendance.map(a => (
                    <View key={a.id} style={styles.sessionRow}>
                      <View style={styles.sessionTimeBox}>
                        <Text style={styles.sessionTime}>{a.checkIn}</Text>
                        <Text style={styles.sessionLabel}>Check-In</Text>
                      </View>
                      <View style={styles.sessionArrow}>
                        <Text style={{ color: '#94A3B8', fontSize: 20 }}>→</Text>
                      </View>
                      <View style={styles.sessionTimeBox}>
                        <Text style={styles.sessionTime}>{a.checkOut ?? '—'}</Text>
                        <Text style={styles.sessionLabel}>{a.checkOut ? 'Check-Out' : 'In Gym'}</Text>
                      </View>
                      <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{a.duration ?? 'Active'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noSession}>
                  <Text style={styles.noSessionIcon}>🏃</Text>
                  <Text style={styles.noSessionText}>Not checked in today yet</Text>
                  <Text style={styles.noSessionSub}>Show your QR pass at the gym entrance</Text>
                </View>
              )}

              {/* Monthly summary */}
              <Text style={styles.sectionTitle}>Monthly Summary</Text>
              <View style={styles.monthlyGrid}>
                <View style={styles.monthlyCard}>
                  <Text style={styles.monthlyVal}>{attendance.length}</Text>
                  <Text style={styles.monthlyLabel}>Days Visited</Text>
                </View>
                <View style={styles.monthlyCard}>
                  <Text style={styles.monthlyVal}>{Math.floor(totalHoursThisMonth / 60)}h {totalHoursThisMonth % 60}m</Text>
                  <Text style={styles.monthlyLabel}>Total Time</Text>
                </View>
                <View style={styles.monthlyCard}>
                  <Text style={styles.monthlyVal}>{Math.round(totalHoursThisMonth / attendance.length || 0)}m</Text>
                  <Text style={styles.monthlyLabel}>Avg Session</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Attendance history */}
              <Text style={styles.sectionTitle}>
                Attendance Log · {attendance.length} sessions
              </Text>
              {attendance.length === 0 ? (
                <View style={styles.noSession}>
                  <Text style={styles.noSessionIcon}>📅</Text>
                  <Text style={styles.noSessionText}>No attendance records yet</Text>
                </View>
              ) : (
                <View style={styles.historyCard}>
                  {attendance.map((a, i) => (
                    <View key={a.id}>
                      <View style={styles.historyRow}>
                        <View style={styles.historyDateBox}>
                          <Text style={styles.historyDay}>
                            {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric' })}
                          </Text>
                          <Text style={styles.historyMonth}>
                            {new Date(a.date).toLocaleDateString('en-IN', { month: 'short' })}
                          </Text>
                        </View>
                        <View style={styles.historyTimes}>
                          <View style={styles.historyTimeRow}>
                            <Text style={styles.historyTimeIcon}>🟢</Text>
                            <Text style={styles.historyTimeText}>In: {a.checkIn}</Text>
                          </View>
                          {a.checkOut && (
                            <View style={styles.historyTimeRow}>
                              <Text style={styles.historyTimeIcon}>🔴</Text>
                              <Text style={styles.historyTimeText}>Out: {a.checkOut}</Text>
                            </View>
                          )}
                        </View>
                        {a.duration && (
                          <View style={styles.historyDuration}>
                            <Text style={styles.historyDurationVal}>{a.duration}</Text>
                          </View>
                        )}
                      </View>
                      {i < attendance.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0EA5E9', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0EA5E9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#0EA5E9', fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 40 },
  qrCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 28 },
  qrCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' },
  qrBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  qrInner: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  qrRow: { flexDirection: 'row' },
  qrCell: { width: 22, height: 22, margin: 1, borderRadius: 2 },
  qrMemberId: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 10, letterSpacing: 1 },
  memberNameQR: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  gymNameQR: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  nfcRow: { flexDirection: 'row', gap: 12 },
  methodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  methodChipIcon: { fontSize: 14 },
  methodChipText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  todayCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionTimeBox: { alignItems: 'center' },
  sessionTime: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sessionLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  sessionArrow: { flex: 1, alignItems: 'center' },
  durationPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  durationText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  noSession: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 40, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  noSessionIcon: { fontSize: 48, marginBottom: 12 },
  noSessionText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  noSessionSub: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  monthlyGrid: { flexDirection: 'row', gap: 12 },
  monthlyCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  monthlyVal: { fontSize: 18, fontWeight: '800', color: '#0EA5E9' },
  monthlyLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  historyDateBox: { width: 40, alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 8 },
  historyDay: { fontSize: 18, fontWeight: '800', color: '#0EA5E9' },
  historyMonth: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  historyTimes: { flex: 1, gap: 5 },
  historyTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTimeIcon: { fontSize: 10 },
  historyTimeText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  historyDuration: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  historyDurationVal: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
