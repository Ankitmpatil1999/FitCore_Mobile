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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { getMemberById } from '../../data/mockData';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

interface Message {
  id: string;
  from: 'member' | 'trainer';
  text: string;
  time: string;
}

import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';

export default function TrainerChatScreen({ route, navigation }: any) {
  const { currentTrainer } = useAppContext();
  const { memberId = 'm1', memberName = 'Arjun Mehta' } = route.params || {};
  const client = getMemberById(memberId);
  const trainerId = String(currentTrainer?.id || client?.trainerId || 't1');

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const [isMemberOnline, setIsMemberOnline] = useState(false);

  // ── 1. Fetch live chat and presence from Backend API ──
  const fetchMessages = async () => {
    try {
      const res: any = await apiService.getTrainerChatMessages(memberId);
      if (res?.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
      await apiService.markTrainerChatAsRead(memberId, undefined, 'trainer');

      // Heartbeat Trainer Presence
      await apiService.sendPresenceHeartbeat(trainerId, 'trainer', true);

      // Check Member presence
      const presRes: any = await apiService.getUserPresence(memberId);
      if (presRes?.success) {
        setIsMemberOnline(!!presRes.isOnline);
      }
    } catch (e) {
      console.log('Error fetching messages on trainer side:', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      apiService.getTrainerChatMessages(memberId).then((res: any) => {
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
      apiService.getUserPresence(memberId).then((p: any) => {
        if (p?.success) {
          setIsMemberOnline(!!p.isOnline);
        }
      }).catch(() => {});
    }, 3500);

    return () => {
      clearInterval(interval);
      apiService.sendPresenceHeartbeat(trainerId, 'trainer', false).catch(() => {});
    };
  }, [memberId, trainerId]);

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
    if (!input.trim()) return;
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
        memberId,
        from: 'trainer',
        text: content,
        senderName: 'Coach',
      });
    } catch (e) {
      console.log('Error sending message from trainer:', e);
    }
  };

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

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{memberName || client?.name || 'Arjun Mehta'}</Text>
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
          </View>

          <TouchableOpacity style={styles.callBtn} activeOpacity={0.7}>
            <Icon name="call" size={moderateScale(18)} color="#6C5CE7" />
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
                Start chatting with {memberName || client?.name || 'Athlete'}. Guide workouts, diet, and form checks directly in real-time.
              </Text>

              <Text style={styles.quickPromptsTitle}>QUICK GUIDANCE TEMPLATES</Text>
              <View style={styles.promptChipsRow}>
                {[
                  "💪 How did today's workout feel?",
                  "🥗 Remember to hit your protein goal!",
                  "🏋️ Ready for our 1-on-1 PT session?",
                  "💧 Keep your hydration at 3.5L+ today.",
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
});
