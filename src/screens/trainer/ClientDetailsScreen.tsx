import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import {
  getMemberById,
  getWorkoutPlanByMember,
  DIET_PLANS,
  getDaysRemaining,
} from '../../data/mockData';

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

export default function ClientDetailsScreen({ route, navigation }: any) {
  const { memberId, member } = route.params || {};
  const client = member || getMemberById(memberId) || {
    id: 'm1',
    name: 'Arjun Mehta',
    phone: '9209282289',
    avatar: 'AM',
    weight: 78,
    height: 175,
    bmi: 25.5,
    goal: 'muscle_building',
    emergencyContact: 'Suresh Mehta',
    emergencyPhone: '9876543210',
    expiryDate: '2027-01-14',
    joinDate: '2026-01-15',
    status: 'active',
  };

  const workoutPlan = getWorkoutPlanByMember(client.id);
  const diet = DIET_PLANS[0];
  const daysLeft = getDaysRemaining(client.expiryDate);

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
          <Text style={styles.headerTitle}>Client Profile</Text>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('TrainerChat', { memberId: client.id, memberName: client.name })}
            activeOpacity={0.7}
          >
            <Icon name="chatbubble-ellipses" size={moderateScale(18)} color="#6C5CE7" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── HERO PROFILE CARD ── */}
          <View style={styles.heroCard}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{client.avatar || 'M'}</Text>
            </View>

            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientPhone}>{client.phone}</Text>

            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                GOAL: {client.goal.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.statGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.weight} kg</Text>
                <Text style={styles.statLbl}>Weight</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.height} cm</Text>
                <Text style={styles.statLbl}>Height</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.bmi}</Text>
                <Text style={styles.statLbl}>BMI</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{daysLeft}d</Text>
                <Text style={styles.statLbl}>Pass Left</Text>
              </View>
            </View>
          </View>

          {/* ── QUICK ASSIGN ACTION BUTTONS ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('AssignWorkout', { memberId: client.id })}
              activeOpacity={0.85}
            >
              <Icon name="barbell-outline" size={moderateScale(20)} color="#6C5CE7" />
              <Text style={styles.assignActionText}>Assign Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('AssignDiet', { memberId: client.id })}
              activeOpacity={0.85}
            >
              <Icon name="nutrition-outline" size={moderateScale(20)} color="#00C48C" />
              <Text style={styles.assignActionText}>Assign Diet</Text>
            </TouchableOpacity>
          </View>

          {/* ── CURRENT ACTIVE WORKOUT CARD ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Workout Split</Text>
            <Text style={styles.cardSub}>{workoutPlan?.name ?? 'Power Hypertrophy 5-Day Split'}</Text>
            <View style={styles.tagRow}>
              {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'].map((split) => (
                <View key={split} style={styles.splitTag}>
                  <Text style={styles.splitTagText}>{split}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── CURRENT ACTIVE DIET TARGETS ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Nutrition Protocol</Text>
            <Text style={styles.cardSub}>{diet?.name ?? 'High Protein Lean Bulk (2,800 kcal)'}</Text>
            <View style={styles.macroRow}>
              <Text style={styles.macroText}>🥩 180g Protein</Text>
              <Text style={styles.macroText}>🍚 320g Carbs</Text>
              <Text style={styles.macroText}>🥑 65g Fats</Text>
            </View>
          </View>

          <View style={{ height: hp(12) }} />
        </ScrollView>
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
  chatBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(19),
    fontWeight: '800',
    color: '#0F172A',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // Hero Profile Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: hp(2),
  },
  avatarBox: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.2),
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  avatarText: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  clientName: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  clientPhone: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
  },
  goalBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    marginVertical: hp(1.2),
  },
  goalBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  statGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginTop: hp(0.5),
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  assignActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  assignActionText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.5),
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginTop: 2,
    marginBottom: hp(1),
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  splitTag: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  splitTagText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginTop: hp(0.5),
  },
  macroText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
});
