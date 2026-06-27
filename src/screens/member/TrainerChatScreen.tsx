import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { getTrainerById } from '../../data/mockData';

interface Message {
  id: string;
  from: 'member' | 'trainer';
  text: string;
  time: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', from: 'trainer', text: 'Good morning! How did yesterday\'s chest workout go? Did you complete all sets?', time: '8:05 AM' },
  { id: '2', from: 'member', text: 'Good morning coach! Yes, completed all sets. The bench press felt great at 60kg!', time: '8:30 AM' },
  { id: '3', from: 'trainer', text: 'Excellent! Your strength is improving fast 💪 Today we\'re focusing on Back & Biceps. Make sure to warm up properly.', time: '8:35 AM' },
  { id: '4', from: 'member', text: 'Will do! Should I increase the deadlift weight today?', time: '8:40 AM' },
  { id: '5', from: 'trainer', text: 'Yes! Go for 85kg today. Focus on form — keep your back straight. See you at 6 AM! 🏋️', time: '8:45 AM' },
];

export default function TrainerChatScreen({ navigation }: any) {
  const { currentMember } = useAppContext();
  const trainer = currentMember ? getTrainerById(currentMember.trainerId) : undefined;
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: Date.now().toString(),
      from: 'member',
      text: input.trim(),
      time,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate trainer reply
    setTimeout(() => {
      const replies = [
        'Great question! Keep it up! 💪',
        'Focus on your form first, weight will follow.',
        'Make sure to stay hydrated before the workout.',
        'I\'ll adjust your plan accordingly!',
        'See you tomorrow at the gym! 🏋️',
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        from: 'trainer',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev2 => [...prev2, reply]);
    }, 1200);
  };

  const handleBookSession = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Required', 'Please enter a date and time.');
      return;
    }
    Alert.alert('Session Booked!', `PT Session booked with ${trainer?.name} on ${selectedDate} at ${selectedTime}.`);
    setBookingModal(false);
    setSelectedDate('');
    setSelectedTime('');
  };

  if (!trainer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No trainer assigned yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />
      <View style={styles.root}>

        {/* Chat header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={styles.trainerAvatar}>
              <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
            </View>
            <View style={styles.trainerInfo}>
              <Text style={styles.trainerName}>{trainer.name}</Text>
              <Text style={styles.trainerStatus}>
                {trainer.available ? '🟢 Available' : '🟡 Busy'} · {trainer.specialization}
              </Text>
            </View>
            <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingModal(true)} activeOpacity={0.85}>
              <Text style={styles.bookBtnText}>📅 Book PT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>Today</Text>
          </View>

          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.from === 'member' ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              {msg.from === 'trainer' && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>{trainer.avatar}</Text>
                </View>
              )}
              <View style={[
                styles.messageBubble,
                msg.from === 'member' ? styles.bubbleMember : styles.bubbleTrainer,
              ]}>
                <Text style={[styles.messageText, msg.from === 'member' && { color: '#FFFFFF' }]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, msg.from === 'member' && { color: 'rgba(255,255,255,0.7)' }]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBarContainer}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.msgInput}
              placeholder="Message your trainer..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.85}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Book PT session modal */}
        {bookingModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Book PT Session</Text>
              <Text style={styles.modalSubtitle}>with {trainer.name}</Text>

              <View style={styles.trainerCardModal}>
                <View style={styles.trainerAvatarModal}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.modalTrainerName}>{trainer.name}</Text>
                  <Text style={styles.modalTrainerSpec}>{trainer.specialization} · {trainer.experience}</Text>
                  <Text style={styles.modalTrainerTimings}>⏱ Available: {trainer.timings}</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Preferred Date</Text>
              <TextInput style={styles.input} placeholder="e.g. 2026-06-25" placeholderTextColor="#94A3B8" value={selectedDate} onChangeText={setSelectedDate} />

              <Text style={styles.inputLabel}>Preferred Time</Text>
              <View style={styles.timeOptions}>
                {['6:00 AM', '7:00 AM', '8:00 AM', '5:00 PM', '6:00 PM'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeChipText, selectedTime === t && { color: '#FFFFFF' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBookingModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleBookSession}>
                  <Text style={styles.submitBtnText}>Confirm Booking</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0EA5E9' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  chatHeader: { backgroundColor: '#0EA5E9' },
  chatHeaderContent: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
  trainerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  trainerAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  trainerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bookBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  bookBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  messagesScroll: {
    padding: 16, paddingBottom: 8,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: { fontSize: 11, color: '#94A3B8', fontWeight: '600', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  messageRow: { marginBottom: 12 },
  messageRowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowRight: { flexDirection: 'row-reverse', alignItems: 'flex-end' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 11, fontWeight: '800', color: '#8B5CF6' },
  messageBubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
  bubbleTrainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 4 },
  bubbleMember: { backgroundColor: '#0EA5E9', borderBottomRightRadius: 4 },
  messageText: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
  messageTime: { fontSize: 10, color: '#94A3B8', marginTop: 5, textAlign: 'right' },
  inputBarContainer: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  msgInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0F172A', maxHeight: 80 },
  sendBtn: { backgroundColor: '#0EA5E9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12 },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  trainerCardModal: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 16 },
  trainerAvatarModal: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  modalTrainerName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  modalTrainerSpec: { fontSize: 12, color: '#475569', marginTop: 2 },
  modalTrainerTimings: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  timeChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  timeChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  submitBtn: { flex: 1, backgroundColor: '#0EA5E9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
