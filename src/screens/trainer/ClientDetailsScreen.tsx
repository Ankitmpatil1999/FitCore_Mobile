import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { getDaysRemaining } from '../../data/mockData';
import apiService from '../../services/api';

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

  // Use passed member object as initial state; will be enriched by live fetch
  const initialClient = member || {
    id: memberId || '',
    name: 'Loading...',
    phone: '',
    avatar: '--',
    weight: null,
    height: null,
    bmi: null,
    goal: 'general_fitness',
    medicalIssues: '',
    emergencyContact: '',
    emergencyPhone: '',
    planName: '',
    expiryDate: '',
    joinDate: '',
    status: 'active',
  };

  const [client, setClient] = useState<any>(initialClient);
  const [liveWorkoutPlan, setLiveWorkoutPlan] = useState<any | null>(null);
  const [liveDietPlan, setLiveDietPlan] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const daysLeft = client.expiryDate ? getDaysRemaining(client.expiryDate) : 0;

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchClientDetails = async () => {
    const targetId = memberId || client?.id || client?._id;
    if (!targetId) return;

    try {
      setLoadingData(true);

      // Fetch live member profile from backend (enriches data beyond nav params)
      const memberRes: any = await apiService.getMemberProfile(targetId);
      if (memberRes?.success && memberRes.data) {
        const m = memberRes.data;
        setClient((prev: any) => ({
          ...prev,
          name: m.name || prev.name,
          phone: m.phone || prev.phone,
          email: m.email || prev.email,
          weight: m.weight ?? prev.weight,
          height: m.height ?? prev.height,
          bmi: m.bmi ?? prev.bmi,
          goal: m.goal || prev.goal,
          medicalIssues: m.medicalIssues || prev.medicalIssues || 'None',
          emergencyContact: m.emergencyContact || prev.emergencyContact || '',
          emergencyPhone: m.emergencyPhone || prev.emergencyPhone || '',
          planName: m.planName || m.plan || prev.planName || '',
          expiryDate: m.expiryDate || prev.expiryDate || '',
          joinDate: m.joinDate || m.startDate || prev.joinDate || '',
          status: m.status || prev.status || 'active',
          avatar: m.avatar || prev.avatar,
        }));
      }

      // Fetch live Diet Plan
      const dietRes: any = await apiService.getMemberDiet(targetId);
      if (dietRes?.success && dietRes.data) {
        setLiveDietPlan(dietRes.data);
      }

      // Fetch live Workout Plan
      const workoutRes: any = await apiService.getMemberWorkout(targetId);
      if (workoutRes?.success && workoutRes.data) {
        setLiveWorkoutPlan(workoutRes.data);
      }
    } catch (err) {
      console.log('Error fetching live client details:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Always start from passed member data, then enrich with API
    if (member) setClient(member);
    fetchClientDetails();
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
  }, [memberId]);

  const memberStatus = (client.status || 'active').toLowerCase();
  const statusColor = memberStatus === 'active' ? '#059669' : memberStatus === 'expired' ? '#EF4444' : '#F59E0B';
  const statusBg = memberStatus === 'active' ? '#ECFDF5' : memberStatus === 'expired' ? '#FFF1F2' : '#FFFBEB';

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
              <Text style={styles.avatarText}>{client.avatar || (client.name ? client.name.slice(0, 2).toUpperCase() : 'M')}</Text>
            </View>

            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientPhone}>{client.phone || 'No phone on record'}</Text>

            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                GOAL: {(client.goal || 'general_fitness').replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>

            {/* Membership status pill */}
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1)} Membership
              </Text>
            </View>

            <View style={styles.statGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.weight ? `${client.weight} kg` : '—'}</Text>
                <Text style={styles.statLbl}>Weight</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.height ? `${client.height} cm` : '—'}</Text>
                <Text style={styles.statLbl}>Height</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{client.bmi || '—'}</Text>
                <Text style={styles.statLbl}>BMI</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{daysLeft > 0 ? `${daysLeft}d` : '—'}</Text>
                <Text style={styles.statLbl}>Pass Left</Text>
              </View>
            </View>

            {loadingData && (
              <ActivityIndicator size="small" color="#6C5CE7" style={{ marginTop: 8 }} />
            )}
          </View>

          {/* ── 3 QUICK ASSIGN ACTIONS ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('AssignWorkout', { memberId: client.id, memberName: client.name })}
              activeOpacity={0.85}
            >
              <Icon name="barbell-outline" size={moderateScale(18)} color="#6C5CE7" />
              <Text style={styles.assignActionText}>Assign{"\n"}Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('AssignDiet', { memberId: client.id, memberName: client.name })}
              activeOpacity={0.85}
            >
              <Icon name="nutrition-outline" size={moderateScale(18)} color="#00C48C" />
              <Text style={styles.assignActionText}>Assign{"\n"}Diet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('ScheduleSessions', { memberId: client.id, memberName: client.name })}
              activeOpacity={0.85}
            >
              <Icon name="calendar-outline" size={moderateScale(18)} color="#F59E0B" />
              <Text style={styles.assignActionText}>Schedule{"\n"}Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.assignActionBtn}
              onPress={() => navigation.navigate('TrainerChat', { memberId: client.id, memberName: client.name })}
              activeOpacity={0.85}
            >
              <Icon name="chatbubble-ellipses-outline" size={moderateScale(18)} color="#6366F1" />
              <Text style={styles.assignActionText}>Message{"\n"}Client</Text>
            </TouchableOpacity>
          </View>

          {/* ── CURRENT ACTIVE WORKOUT CARD ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Assigned Workout Split</Text>
                <Text style={styles.cardSub}>
                  {liveWorkoutPlan?.title || liveWorkoutPlan?.name || 'Personalized Coaching Split'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('AssignWorkout', { memberId: client.id, memberName: client.name })}
              >
                <Text style={styles.cardEditAction}>Edit Plan</Text>
              </TouchableOpacity>
            </View>

            {liveWorkoutPlan?.days && Array.isArray(liveWorkoutPlan.days) ? (
              <View style={styles.tagRow}>
                {liveWorkoutPlan.days.map((d: any, idx: number) => (
                  <View key={d.day || idx} style={styles.splitTag}>
                    <Text style={styles.splitTagText}>{d.day ? d.day.slice(0, 3) : `Day ${idx + 1}`}: {d.focus || 'Workout'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.tagRow}>
                {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'].map((split) => (
                  <View key={split} style={styles.splitTag}>
                    <Text style={styles.splitTagText}>{split}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── CURRENT ACTIVE DIET TARGETS ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Assigned Nutrition Protocol</Text>
                <Text style={styles.cardSub}>
                  {liveDietPlan?.title || 'Daily Calorie & Macro Target'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('AssignDiet', { memberId: client.id, memberName: client.name })}
              >
                <Text style={styles.cardEditAction}>Edit Diet</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#6C5CE7' }]} />
                <Text style={styles.macroText}>{liveDietPlan?.proteinGrams || 160}g Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#00C48C' }]} />
                <Text style={styles.macroText}>{liveDietPlan?.carbsGrams || 240}g Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.macroText}>{liveDietPlan?.fatsGrams || 60}g Fats</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.macroText}>{liveDietPlan?.targetCalories || 2400} kcal</Text>
              </View>
            </View>
          </View>

          {/* ── MEMBERSHIP INFO CARD ── */}
          {(client.planName || client.joinDate || client.expiryDate) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Membership Details</Text>
              <View style={styles.infoGrid}>
                {client.planName ? (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Active Plan</Text>
                    <Text style={styles.infoValue}>{client.planName}</Text>
                  </View>
                ) : null}
                {client.joinDate ? (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Joined On</Text>
                    <Text style={styles.infoValue}>{client.joinDate}</Text>
                  </View>
                ) : null}
                {client.expiryDate ? (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Expires On</Text>
                    <Text style={[styles.infoValue, { color: daysLeft < 15 ? '#EF4444' : '#0F172A' }]}>
                      {client.expiryDate}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* ── MEDICAL & EMERGENCY CARD ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Medical & Emergency Info</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Medical Issues</Text>
                <Text style={styles.infoValue}>{client.medicalIssues || 'None reported'}</Text>
              </View>
              {(client.emergencyContact || client.emergencyPhone) ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>
                    {client.emergencyContact}{client.emergencyContact && client.emergencyPhone ? ` — ${client.emergencyPhone}` : (client.emergencyPhone || '')}
                  </Text>
                </View>
              ) : null}
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
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: hp(2),
  },
  assignActionBtn: {
    width: '22%',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  assignActionText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginTop: hp(0.5),
    gap: moderateScale(6),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  cardEditAction: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macroText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0F172A',
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    marginVertical: hp(0.8),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontScale(11),
    fontWeight: '700',
  },

  // Info grid for membership / medical cards
  infoGrid: {
    marginTop: hp(1),
    gap: moderateScale(10),
  },
  infoItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#F0EEF9',
  },
  infoLabel: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
});

