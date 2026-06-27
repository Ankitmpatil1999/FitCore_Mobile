import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { PROGRESS_DATA, ProgressEntry } from '../../data/mockData';

const METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', icon: '⚖️', color: '#8B5CF6' },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', icon: '📊', color: '#EF4444' },
  { key: 'bmi', label: 'BMI', unit: '', icon: '🧬', color: '#F59E0B' },
  { key: 'chest', label: 'Chest', unit: 'cm', icon: '📏', color: '#3B82F6' },
  { key: 'waist', label: 'Waist', unit: 'cm', icon: '📏', color: '#10B981' },
  { key: 'arms', label: 'Arms', unit: 'cm', icon: '💪', color: '#EC4899' },
  { key: 'legs', label: 'Legs', unit: 'cm', icon: '🦵', color: '#0EA5E9' },
] as const;

export default function ProgressScreen() {
  const { currentMember } = useAppContext();
  const [progressData, setProgressData] = useState<ProgressEntry[]>(PROGRESS_DATA);
  const [addModal, setAddModal] = useState(false);

  // New entry form
  const [nWeight, setNWeight] = useState('');
  const [nBodyFat, setNBodyFat] = useState('');
  const [nChest, setNChest] = useState('');
  const [nWaist, setNWaist] = useState('');
  const [nArms, setNArms] = useState('');
  const [nLegs, setNLegs] = useState('');

  const latest = progressData[progressData.length - 1];
  const prev = progressData[progressData.length - 2];

  const getTrend = (key: keyof ProgressEntry) => {
    if (!latest || !prev) return null;
    const diff = (latest[key] as number) - (prev[key] as number);
    if (diff === 0) return null;
    return { diff: Math.abs(diff).toFixed(1), direction: diff > 0 ? '↑' : '↓', isGood: key === 'weight' || key === 'bodyFat' || key === 'bmi' || key === 'waist' ? diff < 0 : diff > 0 };
  };

  const handleSave = () => {
    if (!nWeight) { Alert.alert('Required', 'Weight is required'); return; }
    const bmi = currentMember
      ? parseFloat((parseFloat(nWeight) / ((currentMember.height / 100) ** 2)).toFixed(1))
      : 0;

    const newEntry: ProgressEntry = {
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(nWeight) || latest.weight,
      bodyFat: parseFloat(nBodyFat) || latest.bodyFat,
      bmi,
      chest: parseFloat(nChest) || latest.chest,
      waist: parseFloat(nWaist) || latest.waist,
      arms: parseFloat(nArms) || latest.arms,
      legs: parseFloat(nLegs) || latest.legs,
    };

    setProgressData(prev2 => [...prev2, newEntry]);
    Alert.alert('Saved!', 'Progress entry recorded.');
    setAddModal(false);
    setNWeight(''); setNBodyFat(''); setNChest(''); setNWaist(''); setNArms(''); setNLegs('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Body Tracking</Text>
              <Text style={styles.headerTitle}>Progress 📈</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Log Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Weight chart (simplified bar visualization) */}
          <Text style={styles.sectionTitle}>Weight Journey 📉</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {progressData.map((entry, i) => {
                const minW = Math.min(...progressData.map(e => e.weight));
                const maxW = Math.max(...progressData.map(e => e.weight));
                const range = maxW - minW || 1;
                const heightPct = 30 + ((entry.weight - minW) / range) * 70;
                const isLatest = i === progressData.length - 1;
                return (
                  <View key={entry.date} style={styles.barCol}>
                    <Text style={styles.barVal}>{entry.weight}</Text>
                    <View style={[styles.bar, { height: heightPct, backgroundColor: isLatest ? '#8B5CF6' : '#C4B5FD' }]} />
                    <Text style={styles.barLabel}>{entry.date.slice(5)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weightChange}>
              {progressData.length >= 2 && (
                <Text style={styles.weightChangeText}>
                  {((progressData[progressData.length - 1].weight - progressData[0].weight) < 0 ? '📉 Lost ' : '📈 Gained ')}
                  {Math.abs(progressData[progressData.length - 1].weight - progressData[0].weight).toFixed(1)} kg
                  {' since start'}
                </Text>
              )}
            </View>
          </View>

          {/* Current metrics */}
          <Text style={styles.sectionTitle}>Current Measurements</Text>
          <View style={styles.metricsGrid}>
            {METRICS.map(metric => {
              const trend = getTrend(metric.key as keyof ProgressEntry);
              const value = latest ? (latest[metric.key as keyof ProgressEntry] as number) : 0;
              return (
                <View key={metric.key} style={[styles.metricCard, { borderLeftColor: metric.color, borderLeftWidth: 3 }]}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <Text style={[styles.metricVal, { color: metric.color }]}>
                    {value}{metric.unit}
                  </Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  {trend && (
                    <Text style={[styles.metricTrend, { color: trend.isGood ? '#10B981' : '#EF4444' }]}>
                      {trend.direction} {trend.diff}{metric.unit}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Progress history */}
          <Text style={styles.sectionTitle}>History</Text>
          <View style={styles.historyCard}>
            {[...progressData].reverse().map((entry, i) => (
              <View key={entry.date}>
                <View style={styles.historyRow}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    {i === 0 && <View style={styles.latestBadge}><Text style={styles.latestText}>Latest</Text></View>}
                  </View>
                  <View style={styles.historyMeasures}>
                    <Text style={styles.historyMeasure}>⚖️ {entry.weight}kg</Text>
                    <Text style={styles.historyMeasure}>📊 {entry.bodyFat}% BF</Text>
                    <Text style={styles.historyMeasure}>📏 {entry.waist}cm waist</Text>
                  </View>
                </View>
                {i < progressData.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* Before/After photos */}
          <Text style={styles.sectionTitle}>Progress Photos 📸</Text>
          <View style={styles.photosCard}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>Before Photo</Text>
              <TouchableOpacity style={styles.addPhotoBtn}>
                <Text style={styles.addPhotoBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📸</Text>
              <Text style={styles.photoPlaceholderText}>Current Photo</Text>
              <TouchableOpacity style={styles.addPhotoBtn}>
                <Text style={styles.addPhotoBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* LOG ENTRY MODAL */}
        {addModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Log Today's Progress</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Weight (kg) *', val: nWeight, set: setNWeight, ph: `e.g. ${latest?.weight ?? 78}` },
                  { label: 'Body Fat (%)', val: nBodyFat, set: setNBodyFat, ph: `e.g. ${latest?.bodyFat ?? 20}` },
                  { label: 'Chest (cm)', val: nChest, set: setNChest, ph: `e.g. ${latest?.chest ?? 100}` },
                  { label: 'Waist (cm)', val: nWaist, set: setNWaist, ph: `e.g. ${latest?.waist ?? 82}` },
                  { label: 'Arms (cm)', val: nArms, set: setNArms, ph: `e.g. ${latest?.arms ?? 38}` },
                  { label: 'Legs (cm)', val: nLegs, set: setNLegs, ph: `e.g. ${latest?.legs ?? 62}` },
                ].map(f => (
                  <View key={f.label}>
                    <Text style={styles.inputLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={f.ph}
                      placeholderTextColor="#94A3B8"
                      value={f.val}
                      onChangeText={f.set}
                      keyboardType="numeric"
                    />
                  </View>
                ))}
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                    <Text style={styles.submitBtnText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8B5CF6' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#8B5CF6' },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: {
    padding: 20, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingTop: 20 },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 9, fontWeight: '700', color: '#8B5CF6', marginBottom: 4 },
  bar: { width: 16, borderRadius: 4, minHeight: 8 },
  barLabel: { fontSize: 8, color: '#94A3B8', marginTop: 6, fontWeight: '600' },
  weightChange: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  weightChangeText: { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  metricIcon: { fontSize: 22 },
  metricVal: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  metricTrend: { fontSize: 11, fontWeight: '700' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  historyDate: { alignItems: 'center', minWidth: 50 },
  historyDateText: { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  latestBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  latestText: { fontSize: 9, fontWeight: '700', color: '#8B5CF6' },
  historyMeasures: { flex: 1, gap: 4 },
  historyMeasure: { fontSize: 12, fontWeight: '600', color: '#475569' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  photosCard: { flexDirection: 'row', gap: 12 },
  photoPlaceholder: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  photoPlaceholderIcon: { fontSize: 36 },
  photoPlaceholderText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  addPhotoBtn: { backgroundColor: '#EDE9FE', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addPhotoBtnText: { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  submitBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
