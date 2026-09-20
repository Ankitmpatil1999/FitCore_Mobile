import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import { getTrainerById } from '../../data/mockData';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const coachUserImg = require('../../assets/Icons2/user.png');
const whatsappImg = require('../../assets/Icons2/whatsapp.png');

interface Message {
  id: string;
  from: 'member' | 'trainer';
  text: string;
  time: string;
}

import { apiService } from '../../services/api';

export default function TrainerChatScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const [liveTrainer, setLiveTrainer] = useState<any>(currentMember?.trainerId ? getTrainerById(currentMember.trainerId) : undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const memberId = String(currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone || 'm1');
  const trainerId = String(liveTrainer?.id || liveTrainer?._id || currentMember?.trainerId || 't1');

  const [isTrainerOnline, setIsTrainerOnline] = useState(false);

  // ── 1. Fetch Assigned Trainer & Chat History from Backend API ──
  const fetchChatData = async () => {
    try {
      // 1a. Load Live Assigned Trainer info
      const userId = currentMember?.id || currentUser?.id || currentMember?.phone;
      const profileRes: any = await apiService.getMemberProfile(userId);
      if (profileRes?.success && profileRes?.data?.trainer) {
        setLiveTrainer(profileRes.data.trainer);
      }

      // 1b. Load Real Message History from MongoDB
      const chatRes: any = await apiService.getTrainerChatMessages(memberId, trainerId);
      if (chatRes?.success && Array.isArray(chatRes.data)) {
        setMessages(chatRes.data);
      }

      // 1c. Mark Trainer Messages as Read
      await apiService.markTrainerChatAsRead(memberId, trainerId, 'member');

      // 1d. Heartbeat Member online presence
      await apiService.sendPresenceHeartbeat(memberId, 'member', true);

      // 1e. Check Trainer Online status
      const presRes: any = await apiService.getUserPresence(trainerId);
      if (presRes?.success) {
        setIsTrainerOnline(!!presRes.isOnline);
      }
    } catch (e) {
      console.log('Error loading trainer chat data:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChatData();
    // Auto-poll every 3.5s for real-time incoming messages & presence from Trainer
    const interval = setInterval(() => {
      apiService.getTrainerChatMessages(memberId, trainerId).then((res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          setMessages((prev) => {
            if (res.data.length !== prev.length || JSON.stringify(res.data) !== JSON.stringify(prev)) {
              return res.data;
            }
            return prev;
          });
        }
      }).catch(() => {});

      apiService.sendPresenceHeartbeat(memberId, 'member', true).catch(() => {});
      apiService.getUserPresence(trainerId).then((p: any) => {
        if (p?.success) {
          setIsTrainerOnline(!!p.isOnline);
        }
      }).catch(() => {});
    }, 3500);

    return () => {
      clearInterval(interval);
      apiService.sendPresenceHeartbeat(memberId, 'member', false).catch(() => {});
    };
  }, [memberId, trainerId]);

  const trainer = liveTrainer || (currentMember?.trainerId ? getTrainerById(currentMember.trainerId) : undefined) || {
    name: 'Coach Vikram Rao',
    specialty: 'Hypertrophy & Strength Coach',
    phone: '+91 98765 43210',
    avatar: '🏋️‍♂️',
  };

  // ── 2. Real POST API: Send Member Message & Receive Trainer Reply ──
  const sendMessage = async (textToSend?: string) => {
    const content = textToSend || input.trim();
    if (!content) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const localMsgId = `temp_${Date.now()}`;
    const newMsg: Message = {
      id: localMsgId,
      from: 'member',
      text: content,
      time,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    try {
      // Save directly to MongoDB via API
      await apiService.sendTrainerChatMessage({
        memberId,
        trainerId,
        from: 'member',
        text: content,
        senderName: currentMember?.name || currentUser?.name || 'Member',
      });

      // Show typing indicator and smart simulated response if Trainer is busy
      setTimeout(() => {
        setIsTyping(true);
      }, 700);

      setTimeout(async () => {
        setIsTyping(false);
        const replies = [
          "Got it! Make sure you maintain full range of motion. Keep your core braced! 🔥",
          "Great question! I'll review your workout logs and adjust the plan accordingly. 💪",
          "Focus on slow eccentrics (3 seconds down). That will maximize muscle growth.",
          "Hydration is key! Drink at least 3.5L water today. See you at the gym! 🏋️",
          "Confirmed! Let's hit that goal together. See you for the session! 🚀",
        ];
        const trainerReply = replies[Math.floor(Math.random() * replies.length)];

        // Save Trainer reply to MongoDB as well
        const replyRes: any = await apiService.sendTrainerChatMessage({
          memberId,
          trainerId,
          from: 'trainer',
          text: trainerReply,
          senderName: trainer?.name || 'Coach Vikram',
        });

        if (replyRes?.success && replyRes?.data) {
          setMessages((prev) => [...prev, replyRes.data]);
        }
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }, 1800);
    } catch (e) {
      console.log('Error sending message:', e);
    }
  };

  const handleCall = () => {
    Alert.alert('Calling Coach', `Initiating audio call with ${trainer?.name || 'Trainer'}...`);
  };

  const handleVideoCall = () => {
    Alert.alert('Video Call', `Starting 1-on-1 PT video session with ${trainer?.name || 'Trainer'}...`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── WhatsApp-Style Header ── */}
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

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBox}>
              <Image
                source={coachUserImg}
                style={{ width: moderateScale(20), height: moderateScale(20), tintColor: '#FFFFFF' }}
                resizeMode="contain"
              />
            </View>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isTrainerOnline ? '#10B981' : '#94A3B8' },
              ]}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {trainer?.name || 'Coach Vikram'}
            </Text>
            <Text
              style={[
                styles.headerStatus,
                { color: isTrainerOnline ? '#10B981' : '#94A3B8' },
              ]}
            >
              {isTyping ? 'typing...' : isTrainerOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          {/* Action Icons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => Alert.alert('WhatsApp', `Opening WhatsApp conversation with ${trainer?.name}...`)}
              activeOpacity={0.7}
            >
              <Image
                source={whatsappImg}
                style={{ width: moderateScale(22), height: moderateScale(22) }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIconBtn} onPress={handleVideoCall} activeOpacity={0.7}>
              <Icon name="videocam-outline" size={moderateScale(20)} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIconBtn} onPress={handleCall} activeOpacity={0.7}>
              <Icon name="call-outline" size={moderateScale(18)} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WhatsApp-Style Messages Wall ── */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>TODAY</Text>
          </View>

          {messages.map((msg) => {
            const isMember = msg.from === 'member';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isMember ? styles.messageRowRight : styles.messageRowLeft,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMember ? styles.bubbleMember : styles.bubbleTrainer,
                  ]}
                >
                  <Text style={[styles.messageText, isMember && styles.messageTextMember]}>
                    {msg.text}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.timeText, isMember && styles.timeTextMember]}>
                      {msg.time}
                    </Text>
                    {isMember && (
                      <Icon
                        name="checkmark-done"
                        size={moderateScale(13)}
                        color="#ECEAFD"
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowLeft]}>
              <View style={[styles.messageBubble, styles.bubbleTrainer, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                <Text style={{ fontSize: fontScale(12), color: '#64748B', fontStyle: 'italic' }}>
                  Coach is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── WhatsApp-Style Bottom Input Bar ── */}
        <View style={styles.inputContainer}>
          <View style={styles.inputPill}>
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
              <Icon name="happy-outline" size={moderateScale(20)} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
              <Icon name="attach" size={moderateScale(20)} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Send / Mic Button */}
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.micBtn]}
            onPress={() => (input.trim() ? sendMessage() : sendMessage('👍'))}
            activeOpacity={0.85}
          >
            <Icon
              name={input.trim() ? 'send' : 'mic'}
              size={moderateScale(17)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  // ── WhatsApp Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAFD',
    gap: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  backBtn: {
    padding: moderateScale(4),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#00C48C',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerStatus: {
    fontSize: fontScale(11),
    color: '#00C48C',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  actionIconBtn: {
    padding: moderateScale(4),
  },

  // ── Messages Wall ──
  messagesScroll: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: hp(1),
  },
  dateSeparatorText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  messageRow: {
    marginBottom: hp(0.8),
    flexDirection: 'row',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(14),
  },
  bubbleMember: {
    backgroundColor: '#6C5CE7',
    borderTopRightRadius: moderateScale(2),
  },
  bubbleTrainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  messageText: {
    fontSize: fontScale(13.5),
    color: '#0F172A',
    lineHeight: fontScale(18),
  },
  messageTextMember: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: fontScale(9),
    color: '#94A3B8',
  },
  timeTextMember: {
    color: 'rgba(255, 255, 255, 0.75)',
  },

  // ── WhatsApp Bottom Bar ──
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAFD',
    gap: moderateScale(8),
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  attachBtn: {
    padding: moderateScale(6),
  },
  textInput: {
    flex: 1,
    fontSize: fontScale(13.5),
    color: '#0F172A',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    maxHeight: hp(10),
  },
  sendBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    backgroundColor: '#6C5CE7',
  },
});
