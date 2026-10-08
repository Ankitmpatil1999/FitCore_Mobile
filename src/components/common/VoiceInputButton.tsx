import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import AppIcon from './AppIcon';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface VoiceInputButtonProps {
  currentText?: string;
  onSpeechResult: (text: string) => void;
  language?: 'hi-IN' | 'en-IN';
  style?: any;
}

export default function VoiceInputButton({
  currentText = '',
  onSpeechResult,
  language = 'hi-IN',
  style,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const keepListeningRef = useRef(false);
  const baseTextRef = useRef('');
  const restartTimerRef = useRef<any>(null);
  const activeLangRef = useRef(language);

  activeLangRef.current = language;

  // Pulsing animation when listening
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      animation?.stop();
    };
  }, [isListening]);

  // Restart speech recognition seamlessly for continuous listening
  const safeRestart = () => {
    if (!keepListeningRef.current) return;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    restartTimerRef.current = setTimeout(async () => {
      if (!keepListeningRef.current) return;
      try {
        await Voice.stop().catch(() => {});
        await Voice.start(activeLangRef.current);
      } catch (err) {
        console.log('Voice auto-restart attempt:', err);
      }
    }, 200);
  };

  // Setup Voice event listeners
  useEffect(() => {
    try {
      Voice.onSpeechStart = () => {
        setIsListening(true);
      };

      Voice.onSpeechEnd = () => {
        // If user is still in listening mode, auto-continue listening
        if (keepListeningRef.current) {
          safeRestart();
        } else {
          setIsListening(false);
        }
      };

      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          const finalPhrase = e.value[0].trim();
          if (finalPhrase) {
            const base = baseTextRef.current.trim();
            const combined = base ? `${base} ${finalPhrase}` : finalPhrase;
            baseTextRef.current = combined;
            onSpeechResult(combined);
          }
        }
        // Keep listening for next sentence if active
        if (keepListeningRef.current) {
          safeRestart();
        }
      };

      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          const livePhrase = e.value[0].trim();
          if (livePhrase) {
            const base = baseTextRef.current.trim();
            const combined = base ? `${base} ${livePhrase}` : livePhrase;
            onSpeechResult(combined);
          }
        }
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        const errCode = (e.error as any)?.code;
        // Error 7 (No match / silence) or 6 (speech timeout) in Android: restart if user still wants to speak
        if (keepListeningRef.current && (errCode === '7' || errCode === '6' || errCode === 7 || errCode === 6)) {
          safeRestart();
        } else {
          console.log('Voice Recognition Notice:', e.error);
          if (!keepListeningRef.current) {
            setIsListening(false);
          }
        }
      };
    } catch (err) {
      console.log('Voice setup notice:', err);
    }

    return () => {
      keepListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      } catch {}
    };
  }, [onSpeechResult]);

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const isGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (isGranted) return true;

        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        if (status === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Microphone Permission',
            'Microphone permission is blocked in device settings. Please enable it in App Info > Permissions to use voice typing.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }

        return false;
      } catch (err) {
        console.warn('Audio permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const startVoiceTyping = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) return;

    try {
      baseTextRef.current = (currentText || '').trim();
      keepListeningRef.current = true;
      setIsListening(true);
      await Voice.stop().catch(() => {});
      await Voice.start(language);
    } catch (err: any) {
      console.log('Error starting voice recognition:', err);
      keepListeningRef.current = false;
      setIsListening(false);
      Alert.alert(
        'Voice Typing',
        'Could not start voice recognition. Please try speaking again.'
      );
    }
  };

  const stopVoiceTyping = async () => {
    keepListeningRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    setIsListening(false);
    try {
      await Voice.stop();
    } catch (err) {
      console.log('Error stopping voice:', err);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {!isListening ? (
        <TouchableOpacity
          style={styles.idleVoiceBar}
          onPress={startVoiceTyping}
          activeOpacity={0.8}
        >
          <View style={styles.idleIconBox}>
            <AppIcon name="mic" size={15} color="#4338CA" />
          </View>
          <Text style={styles.idleVoiceText} numberOfLines={1}>
            {language === 'hi-IN'
              ? '🎙️ बोलकर टाइप करें (हिन्दी)'
              : '🎙️ Tap to Speak (English)'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activeVoiceBar}>
          <View style={styles.activeLeftInfo}>
            <Animated.View
              style={[styles.pulsingDot, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={styles.activeListeningText} numberOfLines={1}>
              {language === 'hi-IN'
                ? 'बोलिए (Listening Hindi)...'
                : 'Listening (English)...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={stopVoiceTyping}
            activeOpacity={0.8}
          >
            <View style={styles.stopIconSquare} />
            <Text style={styles.stopBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  idleVoiceBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  idleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleVoiceText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#3730A3',
  },
  activeVoiceBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  activeListeningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stopIconSquare: {
    width: 8,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  stopBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
