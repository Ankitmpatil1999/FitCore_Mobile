import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

// ── Interactive Scale on Press Component ──
function AnimatedPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscle: string;
  description: string;
  videoUrl: string;
}

const DEFAULT_LIBRARY: ExerciseLibraryItem[] = [
  { id: '1', name: 'Barbell Bench Press', muscle: 'Chest', description: 'Lie flat on a bench, grip the barbell slightly wider than shoulder-width, lower the bar to your mid-chest, and push it back up lockouts.', videoUrl: 'bench_press.mp4' },
  { id: '2', name: 'Barbell Back Squat', muscle: 'Quads/Legs', description: 'Rest the bar on your upper traps, stand feet shoulder-width, squat down until thighs are parallel to ground, and drive back up through heels.', videoUrl: 'squats.mp4' },
  { id: '3', name: 'Conventional Deadlift', muscle: 'Hamstrings/Back', description: 'Stand with bar over mid-foot, hinge at hips, grip bar, flatten your back, and pull bar straight up by driving hips forward to lockout.', videoUrl: 'deadlift.mp4' },
  { id: '4', name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', description: 'Sit on an upright bench, press dumbbells overhead until arms are extended, lower under control back to ear level.', videoUrl: 'shoulder_press.mp4' },
];

export default function UploadVideosScreen({ navigation }: any) {
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>(DEFAULT_LIBRARY);
  const [uploadModal, setUploadModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [description, setDescription] = useState('');

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

  const handleUpload = () => {
    if (!name.trim() || !muscle.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in Name, Muscle, and Description.');
      return;
    }

    const newItem: ExerciseLibraryItem = {
      id: `lib_${Date.now()}`,
      name: name.trim(),
      muscle: muscle.trim(),
      description: description.trim(),
      videoUrl: 'default_exercise.mp4',
    };

    setLibrary((prev) => [newItem, ...prev]);
    setUploadModal(false);
    Alert.alert('✓ Added', 'Exercise video tutorial added to catalog!');
    setName('');
    setMuscle('');
    setDescription('');
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
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Form Videos Library</Text>
            <Text style={styles.headerSub}>{library.length} Video Demonstrations</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setUploadModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={moderateScale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {library.map((item) => (
            <AnimatedPressable key={item.id} style={styles.videoCard}>
              <View style={styles.videoThumb}>
                <Icon name="play-circle" size={moderateScale(36)} color="#6C5CE7" />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.muscleBadge}>
                  <Text style={styles.muscleBadgeText}>{item.muscle.toUpperCase()}</Text>
                </View>
                <Text style={styles.videoTitle}>{item.name}</Text>
                <Text style={styles.videoDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </AnimatedPressable>
          ))}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* ── UPLOAD MODAL ── */}
        <Modal visible={uploadModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Movement Video</Text>
                <TouchableOpacity onPress={() => setUploadModal(false)}>
                  <Icon name="close" size={moderateScale(22)} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Movement Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Bulgarian Split Squat"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Muscle Group *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={muscle}
                  onChangeText={setMuscle}
                  placeholder="e.g. Glutes & Quads"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Technique Cues & Description *</Text>
                <TextInput
                  style={[styles.modalInput, { height: moderateScale(70), textAlignVertical: 'top' }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Keep chest upright, lower rear knee smoothly..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpload}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>SAVE TO LIBRARY</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.2),
  },
  backBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  addBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.5),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  videoThumb: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(14),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  muscleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    marginBottom: 4,
  },
  muscleBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  videoTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  videoDesc: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    lineHeight: fontScale(16),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: hp(1.8),
  },
  inputLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    fontSize: fontScale(13.5),
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  submitBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
