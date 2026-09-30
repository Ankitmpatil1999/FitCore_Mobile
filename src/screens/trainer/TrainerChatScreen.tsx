import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Easing,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

interface Message {
  id: string;
  from: 'member' | 'trainer';
  text: string;
  time: string;
}

export default function TrainerChatScreen({ route, navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = String(currentTrainer?.id || currentUser?.id || 't1');
  const gymId = currentGym?.id || currentTrainer?.gymId;

  // Current chat target — can be passed via nav params or selected from picker
  const [activeMemberId, setActiveMemberId] = useState<string>(route.params?.memberId || '');
  const [activeMemberName, setActiveMemberName] = useState<string>(route.params?.memberName || 'Select Client');

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isMemberOnline, setIsMemberOnline] = useState(false);

  // Client picker state
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Fetch assigned clients for picker
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const res: any = await apiService.getOwnerMembers(gymId, {
        trainerId,
        trainerName: currentTrainer?.name || currentUser?.name,
        trainerPhone: currentUser?.phone,
      });
      if (res?.success && Array.isArray(res.data)) {
        setAssignedClients(res.data);
        // Auto-select first client if none passed
        if (!activeMemberId && res.data.length > 0) {
          const first = res.data[0];
          setActiveMemberId(first._id || first.id);
          setActiveMemberName(first.name || 'Client');
        }
      }
    } catch (e) {
      console.log('Error loading clients for chat picker:', e);
    } finally {
      setLoadingClients(false);
    }
  };

  // ── 1. Fetch live chat and presence from Backend API ──
  const fetchMessages = async () => {
    if (!activeMemberId) return;
    try {
      const res: any = await apiService.getTrainerChatMessages(activeMemberId);
      if (res?.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
      await apiService.markTrainerChatAsRead(activeMemberId, undefined, 'trainer');

      // Heartbeat Trainer Presence
      await apiService.sendPresenceHeartbeat(trainerId, 'trainer', true);

      // Check Member presence
      const presRes: any = await apiService.getUserPresence(activeMemberId);
      if (presRes?.success) {
        setIsMemberOnline(!!presRes.isOnline);
      }
    } catch (e) {
      console.log('Error fetching messages on trainer side:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [trainerId, gymId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchMessages();
    const interval = setInterval(() => {
      if (!activeMemberId) return;
      apiService.getTrainerChatMessages(activeMemberId).then((res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          setMessages((prev) => {
            if (res.data.length !== prev.length || JSON.stringify(res.data) !== JSON.stringify(prev)) {
              return res.data;
            }
            return prev;
          });
        }
      }).catch(() => {});

      apiService.sendPresenceHeartbeat(trainerId, 'trainer', true).catch(() => {});
      apiService.getUserPresence(activeMemberId).then((p: any) => {
        if (p?.success) setIsMemberOnline(!!p.isOnline);
      }).catch(() => {});
    }, 3500);

    return () => {
      clearInterval(interval);
      apiService.sendPresenceHeartbeat(trainerId, 'trainer', false).catch(() => {});
    };
  }, [activeMemberId, trainerId]);

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

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeMemberId) return;
    const content = input.trim();
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const localMsgId = `temp_${Date.now()}`;
    const newMsg: Message = {
      id: localMsgId,
      from: 'trainer',
      text: content,
      time,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    try {
      await apiService.sendTrainerChatMessage({
        memberId: activeMemberId,
        from: 'trainer',
        text: content,
        senderName: currentTrainer?.name || currentUser?.name || 'Coach',
      });
    } catch (e) {
      console.log('Error sending message from trainer:', e);
    }
  };

  const filteredClients = assignedClients.filter(c =>
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').includes(clientSearch)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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

          {/* Tapping header name opens client picker */}
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => setClientPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.headerName}>{activeMemberName}</Text>
              <Icon name="chevron-down" size={moderateScale(14)} color="#6C5CE7" />
            </View>
            <View style={styles.onlineRow}>
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isMemberOnline ? '#10B981' : '#94A3B8' },
                ]}
              />
              <Text
                style={[
                  styles.onlineText,
                  { color: isMemberOnline ? '#10B981' : '#64748B' },
                ]}
              >
                {isMemberOnline ? 'Online • Athlete' : 'Offline • Athlete'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callBtn} activeOpacity={0.7}>
            <Icon name="people" size={moderateScale(18)} color="#6C5CE7" />
          </TouchableOpacity>
        </View>

        {/* ── MESSAGES FEED ── */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Icon name="chatbubbles-outline" size={moderateScale(32)} color="#6C5CE7" />
              </View>
              <Text style={styles.emptyTitle}>Direct Athlete Chat</Text>
              <Text style={styles.emptySub}>
                Start chatting with {activeMemberName || 'Athlete'}. Guide workouts, diet, and form checks directly in real-time.
              </Text>

              <Text style={styles.quickPromptsTitle}>QUICK GUIDANCE TEMPLATES</Text>
              <View style={styles.promptChipsRow}>
                {[
                  "How did today's workout feel?",
                  "Remember to hit your protein goal today!",
                  "Ready for our 1-on-1 PT session?",
                  "Keep your hydration at 3.5L+ today.",
                ].map((txt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptChip}
                    onPress={() => setInput(txt)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.promptChipText}>{txt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => {
              const isTrainer = msg.from === 'trainer';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgWrapper,
                    isTrainer ? styles.msgWrapperTrainer : styles.msgWrapperMember,
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      isTrainer ? styles.bubbleTrainer : styles.bubbleMember,
                    ]}
                  >
                    <Text style={[styles.msgText, isTrainer && styles.msgTextTrainer]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.msgTime, isTrainer && styles.msgTimeTrainer]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ── INPUT BAR ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Send guidance to client..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim()}
              activeOpacity={0.85}
            >
              <Icon name="send" size={moderateScale(18)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        {/* ── CLIENT PICKER MODAL ── */}
        <Modal
          visible={clientPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setClientPickerVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
            activeOpacity={1}
            onPress={() => setClientPickerVisible(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Switch Client Chat</Text>
              <TouchableOpacity onPress={() => setClientPickerVisible(false)}>
                <Icon name="close" size={moderateScale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Search client name or phone..."
              placeholderTextColor="#94A3B8"
              value={clientSearch}
              onChangeText={setClientSearch}
            />
            {loadingClients ? (
              <ActivityIndicator color="#6C5CE7" style={{ margin: 20 }} />
            ) : (
              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const cId = item._id || item.id;
                  const isActive = cId === activeMemberId;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                      onPress={() => {
                        setActiveMemberId(cId);
                        setActiveMemberName(item.name || 'Client');
                        setClientPickerVisible(false);
                        setClientSearch('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.pickerAvatar, isActive && { borderColor: '#6C5CE7', backgroundColor: '#F3F2FE' }]}>
                        <Text style={[styles.pickerAvatarText, isActive && { color: '#6C5CE7' }]}>
                          {(item.name || 'C').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemName, isActive && { color: '#6C5CE7' }]}>{item.name || 'Client'}</Text>
                        <Text style={styles.pickerItemPhone}>{item.phone || ''}</Text>
                      </View>
                      {isActive && <Icon name="checkmark-circle" size={moderateScale(18)} color="#6C5CE7" />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={(
                  <Text style={{ textAlign: 'center', color: '#94A3B8', padding: 20, fontSize: fontScale(13) }}>No clients found</Text>
                )}
              />
            )}
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

  // ── Ambient Glows ──
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
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
    gap: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#00C48C',
  },
  onlineText: {
    fontSize: fontScale(11),
    color: '#00C48C',
    fontWeight: '600',
  },
  callBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesScroll: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  msgWrapper: {
    marginVertical: moderateScale(6),
  },
  msgWrapperTrainer: {
    alignItems: 'flex-end',
  },
  msgWrapperMember: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: moderateScale(12),
    borderRadius: moderateScale(16),
  },
  bubbleTrainer: {
    backgroundColor: '#6C5CE7',
    borderBottomRightRadius: moderateScale(4),
  },
  bubbleMember: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  msgText: {
    fontSize: fontScale(13.5),
    color: '#0F172A',
    lineHeight: fontScale(19),
  },
  msgTextTrainer: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeTrainer: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
    gap: moderateScale(10),
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    maxHeight: moderateScale(90),
  },
  sendBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
  },
  emptyIconBg: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#ECEAFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(18),
    marginBottom: hp(3),
  },
  quickPromptsTitle: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.8,
    marginBottom: moderateScale(10),
    alignSelf: 'flex-start',
  },
  promptChipsRow: {
    width: '100%',
    gap: moderateScale(8),
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  promptChipText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#0F172A',
  },

  // Client Picker Modal
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: wp(5),
    paddingTop: moderateScale(16),
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  pickerTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerSearch: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    fontSize: fontScale(13),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: moderateScale(12),
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2FE',
  },
  pickerItemActive: {
    backgroundColor: '#F8F7FF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(8),
  },
  pickerAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  pickerAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#64748B',
  },
  pickerItemName: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerItemPhone: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 1,
  },
});
