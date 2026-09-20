import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import { getMembersByTrainer, Member, getDaysRemaining } from '../../data/mockData';

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

export default function TrainerClientsScreen({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const gymId = currentGym?.id || currentTrainer?.gymId;

  const allClients = getMembersByTrainer(trainerId, gymId);
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState<string>('all');

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

  const goals = [
    { id: 'all', label: 'All Clients' },
    { id: 'muscle_building', label: 'Muscle Gain' },
    { id: 'fat_loss', label: 'Fat Loss' },
    { id: 'general_fitness', label: 'General Fitness' },
  ];

  const filtered = allClients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchGoal = goalFilter === 'all' || c.goal === goalFilter;
    return matchSearch && matchGoal;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Assigned Clients</Text>
            <Text style={styles.headerSub}>{allClients.length} Active Trainees</Text>
          </View>
          <TouchableOpacity
            style={styles.chatHeaderBtn}
            onPress={() => navigation.navigate('TrainerChat')}
            activeOpacity={0.85}
          >
            <Icon name="chatbubble-ellipses" size={moderateScale(16)} color="#FFFFFF" />
            <Text style={styles.chatHeaderText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={moderateScale(18)} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search client name or phone..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={moderateScale(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── GOAL FILTER PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.goalScroll}
          contentContainerStyle={{ paddingHorizontal: wp(5), gap: moderateScale(8) }}
        >
          {goals.map((g) => {
            const isActive = goalFilter === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalPill, isActive && styles.goalPillActive]}
                onPress={() => setGoalFilter(g.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.goalPillText, isActive && styles.goalPillTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="people-outline" size={moderateScale(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Clients Found</Text>
              <Text style={styles.emptySub}>No trainees match your search or filter.</Text>
            </View>
          ) : (
            filtered.map((client) => {
              const daysLeft = getDaysRemaining(client.expiryDate);

              return (
                <AnimatedPressable
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => navigation.navigate('ClientDetails', { member: client })}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{client.avatar || 'M'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.clientTopRow}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      <View style={styles.goalBadge}>
                        <Text style={styles.goalBadgeText}>
                          {client.goal.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.clientSub}>
                      {client.weight} kg • BMI {client.bmi} • {daysLeft}d left
                    </Text>
                  </View>

                  <Icon name="chevron-forward" size={moderateScale(18)} color="#94A3B8" />
                </AnimatedPressable>
              );
            })
          )}

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
  headerTitle: {
    fontSize: fontScale(21),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  chatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chatHeaderText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    marginHorizontal: wp(5),
    height: moderateScale(44),
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(1.2),
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13),
    color: '#0F172A',
  },

  goalScroll: {
    maxHeight: moderateScale(42),
    marginBottom: hp(1.5),
  },
  goalPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  goalPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  goalPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#64748B',
  },
  goalPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: wp(5),
  },

  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  clientAvatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#F3F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  clientAvatarText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  clientTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  clientName: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  goalBadge: {
    backgroundColor: '#F3F2FE',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(5),
  },
  goalBadgeText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  clientSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(4),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
