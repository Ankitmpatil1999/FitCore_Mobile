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

const MOCK_MESSAGES: Message[] = [
  { id: '1', from: 'trainer', text: 'Good morning! How did yesterday\'s chest workout go? Did you hit all 4 sets?', time: '08:05 AM' },
  { id: '2', from: 'member', text: 'Good morning Coach! Yes, completed all sets. Bench press felt solid at 40kg!', time: '08:30 AM' },
  { id: '3', from: 'trainer', text: 'Great progress! Today we have Back & Biceps scheduled. Focus on strict form for Lat Pulldowns.', time: '08:35 AM' },
  { id: '4', from: 'member', text: 'Got it! Should I increase Deadlift load today?', time: '08:40 AM' },
  { id: '5', from: 'trainer', text: 'Yes, aim for 75kg for 10 reps. Keep your core tight. See you at our 06:00 PM session! 🏋️', time: '08:45 AM' },
];

export default function TrainerChatScreen({ route, navigation }: any) {
  const { memberId, memberName } = route.params || {};
  const client = getMemberById(memberId);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

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

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: Date.now().toString(),
      from: 'trainer',
      text: input.trim(),
      time,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    setTimeout(() => {
      const replies = [
        'Understood Coach! Will log my sets right after.',
        'Thanks for the tip! Looking forward to today’s session. 💪',
        'Should I take whey protein immediately after the session?',
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        from: 'member',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
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
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online • Client</Text>
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
          {messages.map((msg) => {
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
          })}
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
});
