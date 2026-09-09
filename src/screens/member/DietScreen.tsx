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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
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

// ── Asset Icons (Native PNGs) ──
const healthyIconImg = require('../../assets/Icons2/healthy.png');
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const kcalIconImg = require('../../assets/Icons/kcal.png');
const clockIconImg = require('../../assets/Icons2/clock.png');

interface MealItem {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  name: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  isLogged: boolean;
}

interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  taken: boolean;
}

const INITIAL_MEALS: MealItem[] = [
  {
    id: 'm1',
    type: 'Breakfast',
    name: 'Oatmeal & Protein Power Bowl',
    items: ['60g Rolled Oats', '1 Scoop Whey Protein', '3 Boiled Eggs', 'Handful of Blueberries'],
    calories: 520,
    protein: 38,
    carbs: 55,
    fats: 14,
    time: '08:00 AM',
    isLogged: true,
  },
  {
    id: 'm2',
    type: 'Lunch',
    name: 'Grilled Chicken & Jasmine Rice',
    items: ['200g Grilled Chicken Breast', '150g Cooked Rice', 'Steamed Broccoli & Olive Oil'],
    calories: 680,
    protein: 54,
    carbs: 65,
    fats: 16,
    time: '01:30 PM',
    isLogged: false,
  },
  {
    id: 'm3',
    type: 'Snack',
    name: 'Pre-Workout Greek Yogurt & Banana',
    items: ['150g Greek Yogurt 0%', '1 Banana', '15g Raw Almonds', '1 tsp Honey'],
    calories: 310,
    protein: 22,
    carbs: 38,
    fats: 8,
    time: '05:00 PM',
    isLogged: false,
  },
  {
    id: 'm4',
    type: 'Dinner',
    name: 'Tikka Paneer / Salmon Quinoa Bowl',
    items: ['180g Low-Fat Paneer / Salmon', '100g Quinoa', 'Mixed Greens & Avocado Slice'],
    calories: 560,
    protein: 42,
    carbs: 40,
    fats: 18,
    time: '08:30 PM',
    isLogged: false,
  },
];

const INITIAL_SUPPLEMENTS: SupplementItem[] = [
  { id: 's1', name: 'Creatine Monohydrate', dosage: '5g with water', timing: 'Morning', taken: true },
  { id: 's2', name: 'Whey Protein Isolate', dosage: '1 Scoop (30g)', timing: 'Post-Workout', taken: true },
  { id: 's3', name: 'Omega-3 & Multivitamin', dosage: '1 Softgel + 1 Tab', timing: 'With Lunch', taken: false },
  { id: 's4', name: 'Magnesium & Zinc', dosage: '1 Tablet', timing: 'Before Bed', taken: false },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DietScreen({ navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday
  const [meals, setMeals] = useState<MealItem[]>(INITIAL_MEALS);
  const [supplements, setSupplements] = useState<SupplementItem[]>(INITIAL_SUPPLEMENTS);
  const [waterMl, setWaterMl] = useState(2250);
  const [waterTargetMl, setWaterTargetMl] = useState(3500);
  const [liveDietPlan, setLiveDietPlan] = useState<any>(null);

  // ── Entrance Animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Fetch Live Diet Plan from API ──
  useEffect(() => {
    const fetchDiet = async () => {
      try {
        const memberId = currentMember?.id || currentUser?.id;
        const res: any = await apiService.getMemberDiet(memberId);
        if (res.success && res.data) {
          const data = res.data;
          setLiveDietPlan(data);
          if (data.waterLiters) {
            setWaterTargetMl(Math.round(data.waterLiters * 1000));
          }
          if (Array.isArray(data.meals) && data.meals.length > 0) {
            setMeals(data.meals.map((m: any, idx: number) => ({
              id: m.id || `m_${idx}`,
              type: m.mealType || 'Lunch',
              name: m.name || 'Custom Meal',
              items: m.items || [],
              calories: m.calories || 400,
              protein: m.protein || 30,
              carbs: m.carbs || 45,
              fats: m.fats || 10,
              time: m.time || '12:00 PM',
              isLogged: false,
            })));
          }
        }
      } catch (err) {
        console.log('Using default diet plan');
      }
    };
    fetchDiet();
  }, [currentMember?.id, currentUser?.id]);

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

  const calorieTarget = liveDietPlan?.targetCalories || 2400;
  const proteinTarget = liveDietPlan?.proteinGrams || 160;
  const carbsTarget = liveDietPlan?.carbsGrams || 220;
  const fatsTarget = liveDietPlan?.fatsGrams || 65;

  const currentCalories = meals.filter(m => m.isLogged).reduce((acc, m) => acc + m.calories, 0);
  const currentProtein = meals.filter(m => m.isLogged).reduce((acc, m) => acc + m.protein, 0);
  const currentCarbs = meals.filter(m => m.isLogged).reduce((acc, m) => acc + m.carbs, 0);
  const currentFats = meals.filter(m => m.isLogged).reduce((acc, m) => acc + m.fats, 0);

  const caloriesRemaining = Math.max(0, calorieTarget - currentCalories);
  const calPercent = Math.min(100, Math.round((currentCalories / calorieTarget) * 100));

  const toggleMealLogged = (id: string) => {
    setMeals(prev =>
      prev.map(m => (m.id === id ? { ...m, isLogged: !m.isLogged } : m))
    );
  };

  const toggleSupplement = (id: string) => {
    setSupplements(prev =>
      prev.map(s => (s.id === id ? { ...s, taken: !s.taken } : s))
    );
  };

  const addWater = (amount: number) => {
    setWaterMl(prev => Math.max(0, Math.min(waterTargetMl + 1000, prev + amount)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── AMBIENT BACKGROUND GLOWS ── */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowRight} />

        {/* ── TOP HEADER ── */}
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

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Nutrition & Diet</Text>
            <View style={styles.planStatusBadge}>
              <View style={styles.planStatusDot} />
              <Text style={styles.planStatusText}>Assigned by Coach Alex</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logFoodHeaderBtn}
            onPress={() => Alert.alert('Add Custom Food', 'Search our food database or scan nutrition barcode.')}
            activeOpacity={0.8}
          >
            <Text style={styles.logFoodHeaderBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── DAY SELECTOR PILLS ── */}
            <View style={styles.daysRow}>
              {DAYS.map((day, idx) => {
                const isSelected = idx === selectedDay;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayPill, isSelected && styles.dayPillActive]}
                    onPress={() => setSelectedDay(idx)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                      {day}
                    </Text>
                    <View style={[styles.dayPillDot, isSelected && styles.dayPillDotActive]} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 1. MACRO TARGETS HERO CARD ── */}
            <View style={styles.macroHeroCard}>
              <View style={styles.macroTopRow}>
                <View>
                  <View style={styles.heroPlanTag}>
                    <Text style={styles.heroPlanTagText}>⚡ HYPERTROPHY CUT PROTOCOL</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={styles.macroCardCal}>{currentCalories.toLocaleString()}</Text>
                    <Text style={styles.macroCardCalTotal}> / {calorieTarget.toLocaleString()} kcal</Text>
                  </View>
                  <Text style={styles.calRemainingText}>
                    {caloriesRemaining > 0 ? `${caloriesRemaining} kcal remaining today` : 'Target achieved! 🔥'}
                  </Text>
                </View>

                <View style={styles.macroCalBadge}>
                  <Image
                    source={healthyIconImg}
                    style={{ width: moderateScale(26), height: moderateScale(26), tintColor: '#00C48C' }}
                    resizeMode="contain"
                  />
                  <Text style={styles.macroPercentText}>{calPercent}%</Text>
                </View>
              </View>

              {/* Calorie Progress Bar */}
              <View style={styles.calTrack}>
                <View style={[styles.calFill, { width: `${calPercent}%` }]} />
              </View>

              {/* Macro Breakdown 3 Columns */}
              <View style={styles.macroBreakdownRow}>
                {/* Protein */}
                <View style={styles.macroCol}>
                  <View style={styles.macroColHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#00C48C' }]} />
                    <Text style={styles.macroLbl}>Protein</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: '#00C48C' }]}>
                    {currentProtein}g <Text style={styles.macroValTarget}>/ {proteinTarget}g</Text>
                  </Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${Math.min(100, (currentProtein / proteinTarget) * 100)}%`, backgroundColor: '#00C48C' }]} />
                  </View>
                </View>

                <View style={styles.macroDivider} />

                {/* Carbs */}
                <View style={styles.macroCol}>
                  <View style={styles.macroColHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#6C5CE7' }]} />
                    <Text style={styles.macroLbl}>Carbs</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: '#6C5CE7' }]}>
                    {currentCarbs}g <Text style={styles.macroValTarget}>/ {carbsTarget}g</Text>
                  </Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${Math.min(100, (currentCarbs / carbsTarget) * 100)}%`, backgroundColor: '#6C5CE7' }]} />
                  </View>
                </View>

                <View style={styles.macroDivider} />

                {/* Fats */}
                <View style={styles.macroCol}>
                  <View style={styles.macroColHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#FF9900' }]} />
                    <Text style={styles.macroLbl}>Fats</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: '#FF9900' }]}>
                    {currentFats}g <Text style={styles.macroValTarget}>/ {fatsTarget}g</Text>
                  </Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${Math.min(100, (currentFats / fatsTarget) * 100)}%`, backgroundColor: '#FF9900' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* ── 2. WATER HYDRATION TRACKER (CLEAN UI WITH NO BROKEN ICONS) ── */}
            <View style={styles.waterCard}>
              <View style={styles.waterTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.waterIconCircle}>
                    <Text style={{ fontSize: moderateScale(16) }}>💧</Text>
                  </View>
                  <View>
                    <Text style={styles.waterTitle}>Daily Hydration</Text>
                    <Text style={styles.waterSubText}>Target: {(waterTargetMl / 1000).toFixed(1)} Liters (14 Glasses)</Text>
                  </View>
                </View>
                <View style={styles.waterProgressRight}>
                  <Text style={styles.waterAmountText}>{(waterMl / 1000).toFixed(2)} L</Text>
                  <Text style={styles.waterPercentText}>{Math.round((waterMl / waterTargetMl) * 100)}%</Text>
                </View>
              </View>

              {/* Water Progress Bar */}
              <View style={styles.waterTrack}>
                <View
                  style={[
                    styles.waterFill,
                    { width: `${Math.min(100, (waterMl / waterTargetMl) * 100)}%` },
                  ]}
                />
              </View>

              {/* Clean Interactive Water Glass Segment Indicators */}
              <View style={styles.waterGlassesRow}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const glassMl = (i + 1) * 250;
                  const isFilled = waterMl >= glassMl;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.glassItem,
                        isFilled && styles.glassItemFilled,
                      ]}
                      onPress={() => setWaterMl(glassMl)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.glassLevelFill, isFilled && styles.glassLevelFillActive]} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Add Action Buttons */}
              <View style={styles.waterBtnRow}>
                <TouchableOpacity
                  style={styles.waterAddBtn}
                  onPress={() => addWater(250)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnEmoji}>💧</Text>
                  <Text style={styles.waterAddBtnText}>+250 ml (Cup)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.waterAddBtn}
                  onPress={() => addWater(500)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnEmoji}>🧴</Text>
                  <Text style={styles.waterAddBtnText}>+500 ml (Bottle)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.waterAddBtn, styles.waterMinusBtn]}
                  onPress={() => addWater(-250)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.minusSignText}>−</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 3. TODAY'S MEAL TIMELINE ── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Today's Meal Schedule</Text>
                <Text style={styles.sectionSub}>Tap checkmark once eaten to sync macros</Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Add Meal Item', 'Open meal creator modal')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>+ Add Food</Text>
              </TouchableOpacity>
            </View>

            {meals.map((item) => (
              <AnimatedPressable
                key={item.id}
                style={[styles.mealCard, item.isLogged && styles.mealCardLogged]}
                onPress={() => toggleMealLogged(item.id)}
              >
                <TouchableOpacity
                  style={[styles.checkCircle, item.isLogged && styles.checkCircleActive]}
                  onPress={() => toggleMealLogged(item.id)}
                  activeOpacity={0.7}
                >
                  {item.isLogged && (
                    <Text style={styles.checkTickText}>✓</Text>
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={styles.mealHeaderRow}>
                    <View style={styles.mealTypeBadge}>
                      <Text style={styles.mealTypeTag}>{item.type.toUpperCase()}</Text>
                    </View>
                    <View style={styles.mealTimeBadge}>
                      <Image
                        source={clockIconImg}
                        style={{ width: moderateScale(11), height: moderateScale(11), tintColor: '#64748B', marginRight: 4 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.mealTimeText}>{item.time}</Text>
                    </View>
                  </View>

                  <Text style={[styles.mealName, item.isLogged && styles.mealNameLogged]}>
                    {item.name}
                  </Text>

                  {/* Food items bullet summary */}
                  <View style={styles.foodItemsList}>
                    {item.items.map((food, fIdx) => (
                      <Text key={fIdx} style={styles.foodItemText}>
                        • {food}
                      </Text>
                    ))}
                  </View>

                  {/* Macro Pills Row */}
                  <View style={styles.macroPillRow}>
                    <View style={styles.macroPill}>
                      <Image source={kcalIconImg} style={{ width: moderateScale(11), height: moderateScale(11), tintColor: '#E11D48', marginRight: 4 }} resizeMode="contain" />
                      <Text style={styles.macroPillText}>{item.calories} kcal</Text>
                    </View>
                    <View style={[styles.macroPill, { backgroundColor: 'rgba(0, 196, 140, 0.08)' }]}>
                      <Text style={[styles.macroPillText, { color: '#00A86B' }]}>🍗 {item.protein}g P</Text>
                    </View>
                    <View style={[styles.macroPill, { backgroundColor: 'rgba(108, 92, 231, 0.08)' }]}>
                      <Text style={[styles.macroPillText, { color: '#6C5CE7' }]}>🌾 {item.carbs}g C</Text>
                    </View>
                    <View style={[styles.macroPill, { backgroundColor: 'rgba(255, 153, 0, 0.08)' }]}>
                      <Text style={[styles.macroPillText, { color: '#D97706' }]}>🥑 {item.fats}g F</Text>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            ))}

            {/* ── 4. DAILY SUPPLEMENTS CHECKLIST ── */}
            <View style={[styles.sectionHeaderRow, { marginTop: hp(1) }]}>
              <View>
                <Text style={styles.sectionTitle}>Daily Supplements & Vitamins</Text>
                <Text style={styles.sectionSub}>Pre, intra and post workout stack</Text>
              </View>
            </View>

            <View style={styles.supplementsCard}>
              {supplements.map((supp, idx) => {
                const isLast = idx === supplements.length - 1;
                return (
                  <TouchableOpacity
                    key={supp.id}
                    style={[styles.suppRow, !isLast && styles.suppRowBorder]}
                    onPress={() => toggleSupplement(supp.id)}
                    activeOpacity={0.7}
                  >
                    <TouchableOpacity
                      style={[styles.suppCheck, supp.taken && styles.suppCheckActive]}
                      onPress={() => toggleSupplement(supp.id)}
                    >
                      {supp.taken && <Text style={styles.checkTickTextSmall}>✓</Text>}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.suppName, supp.taken && styles.suppNameTaken]}>
                        {supp.name}
                      </Text>
                      <Text style={styles.suppDetail}>
                        {supp.dosage} • <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>{supp.timing}</Text>
                      </Text>
                    </View>

                    <View style={[styles.suppStatusPill, supp.taken ? styles.suppStatusPillDone : styles.suppStatusPillPending]}>
                      <Text style={[styles.suppStatusText, supp.taken ? styles.suppStatusTextDone : styles.suppStatusTextPending]}>
                        {supp.taken ? 'Taken' : 'Pending'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 5. COACH'S ADVICE / DIET NOTE CARD ── */}
            <View style={styles.coachTipCard}>
              <View style={styles.coachTipHeader}>
                <View style={styles.coachAvatarCircle}>
                  <Text style={styles.coachAvatarText}>CA</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachName}>Coach Alex's Nutrition Tip</Text>
                  <Text style={styles.coachNoteTime}>Updated for your Leg Day cycle</Text>
                </View>
                <Text style={{ fontSize: moderateScale(18) }}>💡</Text>
              </View>
              <Text style={styles.coachTipText}>
                "Keep your carbs centered around your workout window today. Drink at least 500ml water with electrolyte 45 minutes before heavy squats to avoid cramping."
              </Text>
            </View>

            <View style={{ height: hp(4) }} />
          </Animated.View>
        </ScrollView>
      </View>
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
    backgroundColor: 'rgba(108, 92, 231, 0.05)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(30),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(0, 196, 140, 0.04)',
  },

  // ── Header ──
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
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  planStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  planStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6C5CE7',
    marginRight: 5,
  },
  planStatusText: {
    fontSize: fontScale(10.5),
    color: '#6C5CE7',
    fontWeight: '700',
  },
  logFoodHeaderBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logFoodHeaderBtnText: {
    fontSize: fontScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: fontScale(24),
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── Days Row ──
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.8),
  },
  dayPill: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  dayPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 3,
  },
  dayPillDotActive: {
    backgroundColor: '#FFFFFF',
  },

  // ── Macro Target Hero Card ──
  macroHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  heroPlanTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    marginBottom: 2,
  },
  heroPlanTagText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  macroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  macroCardCal: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  macroCardCalTotal: {
    fontSize: fontScale(13),
    color: '#64748B',
    fontWeight: '600',
  },
  calRemainingText: {
    fontSize: fontScale(11.5),
    color: '#00A86B',
    fontWeight: '700',
    marginTop: 1,
  },
  macroCalBadge: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(0, 196, 140, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 196, 140, 0.18)',
  },
  macroPercentText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#00A86B',
    marginTop: 2,
  },
  calTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: hp(1.6),
  },
  calFill: {
    height: '100%',
    backgroundColor: '#00C48C',
    borderRadius: 4,
  },
  macroBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  macroCol: {
    flex: 1,
    paddingHorizontal: 2,
  },
  macroColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroLbl: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '700',
  },
  macroVal: {
    fontSize: fontScale(13),
    fontWeight: '800',
    marginBottom: 4,
  },
  macroValTarget: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    fontWeight: '500',
  },
  miniTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  macroDivider: {
    width: 1,
    height: moderateScale(34),
    backgroundColor: '#F1F5F9',
    marginHorizontal: moderateScale(6),
  },

  // ── Water Hydration Card ──
  waterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  waterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  waterIconCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  waterSubText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '500',
  },
  waterProgressRight: {
    alignItems: 'flex-end',
  },
  waterAmountText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0284C7',
  },
  waterPercentText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  waterTrack: {
    height: 7,
    backgroundColor: '#F0F9FF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: hp(1.4),
  },
  waterFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  waterGlassesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
    gap: 4,
  },
  glassItem: {
    flex: 1,
    height: moderateScale(18),
    borderRadius: moderateScale(5),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassItemFilled: {
    backgroundColor: '#E0F2FE',
  },
  glassLevelFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: moderateScale(5),
  },
  glassLevelFillActive: {
    backgroundColor: '#0284C7',
  },
  waterBtnRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  waterAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: moderateScale(9),
    backgroundColor: '#F0F9FF',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  waterMinusBtn: {
    flex: 0.28,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  btnEmoji: {
    fontSize: fontScale(13),
  },
  waterAddBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#0284C7',
  },
  minusSignText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#64748B',
  },

  // ── Meal Schedule ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 1,
  },
  sectionLink: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  mealCardLogged: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(2),
  },
  checkCircleActive: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  checkTickText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '900',
  },
  checkTickTextSmall: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '900',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  mealTypeTag: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  mealTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTimeText: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  mealName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  mealNameLogged: {
    color: '#64748B',
  },
  foodItemsList: {
    marginBottom: moderateScale(8),
  },
  foodItemText: {
    fontSize: fontScale(11),
    color: '#64748B',
    lineHeight: fontScale(15),
  },
  macroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  macroPillText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#E11D48',
  },

  // ── Supplements Card ──
  supplementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  suppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    gap: moderateScale(10),
  },
  suppRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suppCheck: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(7),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suppCheckActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  suppName: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  suppNameTaken: {
    color: '#64748B',
  },
  suppDetail: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    marginTop: 1,
  },
  suppStatusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  suppStatusPillDone: {
    backgroundColor: 'rgba(0, 196, 140, 0.10)',
  },
  suppStatusPillPending: {
    backgroundColor: '#F1F5F9',
  },
  suppStatusText: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  suppStatusTextDone: {
    color: '#00A86B',
  },
  suppStatusTextPending: {
    color: '#94A3B8',
  },

  // ── Coach Advice Card ──
  coachTipCard: {
    backgroundColor: '#FDF8F0',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: hp(2),
  },
  coachTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  coachAvatarCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coachName: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#78350F',
  },
  coachNoteTime: {
    fontSize: fontScale(10),
    color: '#B45309',
  },
  coachTipText: {
    fontSize: fontScale(11.5),
    color: '#92400E',
    lineHeight: fontScale(16),
    fontWeight: '500',
  },
});
