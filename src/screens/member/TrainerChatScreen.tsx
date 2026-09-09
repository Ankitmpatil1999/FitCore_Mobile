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

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'trainer',
    text: "Good morning Arjun! 💪 How did yesterday's workout go? Did you complete all sets on deadlifts?",
    time: '08:05 AM',
  },
  {
    id: '2',
    from: 'member',
    text: 'Good morning Coach! Yes, completed all sets cleanly at 80kg.',
    time: '08:30 AM',
  },
  {
    id: '3',
    from: 'trainer',
    text: "Great progress! Make sure to hit 140g protein and keep hydration high today. 🥗",
    time: '08:35 AM',
  },
  {
    id: '4',
    from: 'member',
    text: 'Will do! Should we schedule a form check tomorrow?',
    time: '08:40 AM',
  },
  {
    id: '5',
    from: 'trainer',
    text: "Yes, let's do 06:30 AM tomorrow! We will check your squat depth. 🏋️‍♂️",
    time: '08:45 AM',
  },
];

import { apiService } from '../../services/api';

export default function TrainerChatScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const [liveTrainer, setLiveTrainer] = useState<any>(currentMember ? getTrainerById(currentMember.trainerId) : undefined);

  useEffect(() => {
    async function loadTrainer() {
      try {
        const userId = currentMember?.id || currentUser?.id;
        const res: any = await apiService.getMemberProfile(userId);
        if (res.success && res.data?.trainer) {
          setLiveTrainer(res.data.trainer);
        }
      } catch (e) {
        console.log('Using cached trainer info');
      }
    }
    loadTrainer();
  }, [currentMember?.id, currentUser?.id]);

  const trainer = liveTrainer || (currentMember ? getTrainerById(currentMember.trainerId) : undefined) || {
    name: 'Coach Vikram Rao',
    specialty: 'Hypertrophy & Strength Coach',
    phone: '+91 98765 43210',
    avatar: '🏋️‍♂️',
  };

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = (textToSend?: string) => {
    const content = textToSend || input.trim();
    if (!content) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: Date.now().toString(),
      from: 'member',
      text: content,
      time,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    // Show simulated typing & reply
    setTimeout(() => {
      setIsTyping(true);
    }, 600);

    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Got it! Make sure you maintain full range of motion. Keep your core braced! 🔥",
        "Great question! I'll review your workout logs and adjust the plan accordingly. 💪",
        "Focus on slow eccentrics (3 seconds down). That will maximize muscle growth.",
        "Hydration is key! Drink at least 3.5L water today. See you at the gym! 🏋️",
        "Confirmed! See you tomorrow at the gym for your session! 🚀",
      ];
      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'trainer',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }, 1500);
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
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {trainer?.name || 'Coach Vikram'}
            </Text>
            <Text style={styles.headerStatus}>
              {isTyping ? 'typing...' : 'Online'}
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
