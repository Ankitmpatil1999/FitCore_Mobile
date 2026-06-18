import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIET_PLANS, DietType } from '../../data/mockData';

const DIET_TYPES: { id: DietType; label: string; icon: string }[] = [
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '🔥' },
  { id: 'weight_gain', label: 'Weight Gain', icon: '⬆️' },
  { id: 'women_fitness', label: 'Women Fitness', icon: '👩' },
  { id: 'diabetic', label: 'Diabetic', icon: '🩺' },
  { id: 'senior', label: 'Senior', icon: '🧓' },
];

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'snack', label: 'Snack', icon: '🍎' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
] as const;

export default function DietScreen() {
  const [selectedDietType, setSelectedDietType] = useState<DietType>('muscle_gain');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('breakfast');
  const [waterGlasses, setWaterGlasses] = useState(3);

  const diet = DIET_PLANS.find(d => d.type === selectedDietType) ?? DIET_PLANS[0];
  const meal = diet.meals[selectedMeal];

  const mealCalories = meal.items.reduce((s, i) => s + i.calories, 0);
  const mealProtein = meal.items.reduce((s, i) => s + i.protein, 0);

  const totalCaloriesConsumed = Object.values(diet.meals).reduce(
    (sum, m) => sum + m.items.reduce((s2, i) => s2 + i.calories, 0), 0,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F59E0B" />
      <View style={styles.root}>

        <View style={styles.header}>
          <Text style={styles.headerSub}>Nutrition</Text>
          <Text style={styles.headerTitle}>Diet Plan 🥗</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Diet type selector */}
          <Text style={styles.sectionTitle}>Choose Diet Plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dietTypeScroll}>
            {DIET_TYPES.map(dt => (
              <TouchableOpacity
                key={dt.id}
                style={[styles.dietTypeChip, selectedDietType === dt.id && styles.dietTypeChipActive]}
                onPress={() => setSelectedDietType(dt.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.dietTypeIcon}>{dt.icon}</Text>
                <Text style={[styles.dietTypeLabel, selectedDietType === dt.id && { color: '#FFFFFF' }]}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Daily macro summary */}
          <View style={styles.macroCard}>
            <Text style={styles.macroCardTitle}>Daily Nutrition Summary</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{diet.totalCalories}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarFill, { width: `${Math.min(100, (totalCaloriesConsumed / diet.totalCalories) * 100)}%`, backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroVal, { color: '#3B82F6' }]}>{diet.totalProtein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarFill, { width: '70%', backgroundColor: '#3B82F6' }]} />
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroVal, { color: '#10B981' }]}>~220g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarFill, { width: '55%', backgroundColor: '#10B981' }]} />
                </View>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroVal, { color: '#8B5CF6' }]}>~65g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarFill, { width: '40%', backgroundColor: '#8B5CF6' }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Water tracker */}
          <Text style={styles.sectionTitle}>💧 Water Intake</Text>
          <View style={styles.waterCard}>
            <View style={styles.waterGlasses}>
              {Array.from({ length: diet.waterIntake }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.glassBtn, i < waterGlasses && styles.glassBtnFilled]}
                  onPress={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{i < waterGlasses ? '🥤' : '🫗'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.waterText}>{waterGlasses} / {diet.waterIntake} glasses consumed</Text>
            <View style={styles.waterProgressBar}>
              <View style={[styles.waterProgressFill, { width: `${(waterGlasses / diet.waterIntake) * 100}%` }]} />
            </View>
          </View>

          {/* Meal tabs */}
          <Text style={styles.sectionTitle}>Meal Breakdown</Text>
          <View style={styles.mealTabRow}>
            {MEALS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.mealTab, selectedMeal === m.key && styles.mealTabActive]}
                onPress={() => setSelectedMeal(m.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.mealTabIcon}>{m.icon}</Text>
                <Text style={[styles.mealTabLabel, selectedMeal === m.key && { color: '#F59E0B' }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Current meal */}
          <View style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <Text style={styles.mealCardName}>{meal.name}</Text>
              <View style={styles.mealMacroRow}>
                <View style={[styles.mealMacroPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.mealMacroText, { color: '#F59E0B' }]}>{mealCalories} cal</Text>
                </View>
                <View style={[styles.mealMacroPill, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.mealMacroText, { color: '#3B82F6' }]}>{mealProtein}g protein</Text>
                </View>
              </View>
            </View>

            {meal.items.map((item, i) => (
              <View key={i} style={styles.foodRow}>
                <View style={styles.foodLeft}>
                  <Text style={styles.foodName}>{item.food}</Text>
                  <Text style={styles.foodQty}>{item.qty}</Text>
                </View>
                <View style={styles.foodRight}>
                  <Text style={styles.foodCal}>{item.calories} cal</Text>
                  <Text style={styles.foodProtein}>{item.protein}g protein</Text>
                </View>
              </View>
            ))}
          </View>

          {/* All meals mini-summary */}
          <Text style={styles.sectionTitle}>All Meals Today</Text>
          <View style={styles.allMealsCard}>
            {MEALS.map((m, i) => {
              const mealData = diet.meals[m.key];
              const cal = mealData.items.reduce((s, item) => s + item.calories, 0);
              return (
                <View key={m.key}>
                  <TouchableOpacity
                    style={styles.allMealRow}
                    onPress={() => setSelectedMeal(m.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.allMealIcon}>{m.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.allMealName}>{m.label}</Text>
                      <Text style={styles.allMealItems}>{mealData.items.length} food items</Text>
                    </View>
                    <Text style={styles.allMealCal}>{cal} cal</Text>
                  </TouchableOpacity>
                  {i < MEALS.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F59E0B' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  dietTypeScroll: { marginBottom: 24 },
  dietTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  dietTypeChipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  dietTypeIcon: { fontSize: 16 },
  dietTypeLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  macroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  macroCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  macroGrid: { flexDirection: 'row', gap: 10 },
  macroItem: { flex: 1, alignItems: 'center', gap: 4 },
  macroVal: { fontSize: 16, fontWeight: '800', color: '#F59E0B' },
  macroLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  macroBar: { width: '100%', height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  macroBarFill: { height: '100%', borderRadius: 3 },
  waterCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#DBEAFE' },
  waterGlasses: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  glassBtnFilled: { backgroundColor: '#3B82F6' },
  waterText: { fontSize: 13, fontWeight: '700', color: '#1E40AF', marginBottom: 10 },
  waterProgressBar: { height: 8, backgroundColor: '#DBEAFE', borderRadius: 4, overflow: 'hidden' },
  waterProgressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  mealTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealTab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  mealTabActive: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  mealTabIcon: { fontSize: 20 },
  mealTabLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  mealCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  mealCardName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  mealMacroRow: { gap: 6 },
  mealMacroPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  mealMacroText: { fontSize: 11, fontWeight: '700' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  foodLeft: {},
  foodName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  foodQty: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  foodRight: { alignItems: 'flex-end' },
  foodCal: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  foodProtein: { fontSize: 11, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  allMealsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  allMealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  allMealIcon: { fontSize: 24 },
  allMealName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  allMealItems: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  allMealCal: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
