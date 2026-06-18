import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightColors, Typography, Spacing, Radii, Shadows } from '../../theme';

interface Supplement {
  id: string;
  name: string;
  category: 'Protein' | 'Creatine' | 'Pre-Workout' | 'Vitamins';
  icon: string;
  price: string;
  rating: number;
  weight: string;
  description: string;
}

const SUPPLEMENTS: Supplement[] = [
  {
    id: 's1',
    name: 'ESN Designer Whey',
    category: 'Protein',
    icon: '🥛',
    price: '₹3,999',
    rating: 4.8,
    weight: '1000g',
    description: 'High-quality whey blend with excellent solubility and gourmet flavors.',
  },
  {
    id: 's2',
    name: 'ON Micronized Creatine',
    category: 'Creatine',
    icon: '⚡',
    price: '₹1,499',
    rating: 4.9,
    weight: '250g',
    description: '100% pure monohydrate supporting muscle size, strength, and power.',
  },
  {
    id: 's3',
    name: 'Xtend Recovery BCAA',
    category: 'Pre-Workout',
    icon: '🍉',
    price: '₹2,199',
    rating: 4.7,
    weight: '30 Servings',
    description: '7g BCAAs with electrolytes for muscle recovery and hydration.',
  },
  {
    id: 's4',
    name: 'MB Biozyme Whey',
    category: 'Protein',
    icon: '💪',
    price: '₹4,499',
    rating: 4.6,
    weight: '1000g',
    description: 'Enhanced absorption formula clinically tested to lower digestion issues.',
  },
  {
    id: 's5',
    name: 'Cellucor C4 Sport',
    category: 'Pre-Workout',
    icon: '🔥',
    price: '₹2,799',
    rating: 4.5,
    weight: '30 Servings',
    description: 'Explosive energy and focus booster optimized for intense training.',
  },
  {
    id: 's6',
    name: 'Animal Pak Multivitamin',
    category: 'Vitamins',
    icon: '💊',
    price: '₹3,299',
    rating: 4.8,
    weight: '44 Paks',
    description: 'Comprehensive micronutrient pack supporting general health and defense.',
  },
];

export default function SupplementsScreen() {
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<{ [id: string]: number }>({});

  const categories = ['All', 'Protein', 'Creatine', 'Pre-Workout', 'Vitamins'];

  const filteredItems = SUPPLEMENTS.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const handleAddToCart = (item: Supplement) => {
    setCartCount(prev => prev + 1);
    setCartItems(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    Alert.alert('Added to Cart', `${item.name} has been added to your shopping bag.`);
  };

  const handleCheckout = () => {
    if (cartCount === 0) {
      Alert.alert('Cart Empty', 'Your shopping bag is empty. Please add items to checkout.');
      return;
    }
    Alert.alert(
      'Checkout',
      `Ready to buy ${cartCount} item(s) for store pick-up at the front desk?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Order',
          onPress: () => {
            setCartCount(0);
            setCartItems({});
            Alert.alert('Success', 'Order placed successfully! Please pay and collect at the gym counter.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={LightColors.accentCyan} />
      <View style={styles.root}>
        <View style={styles.container}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View>
            <Text style={styles.navTitle}>Protein & Supplies</Text>
            <Text style={styles.navSubtitle}>Certified products at FitCore Desk</Text>
          </View>
          <TouchableOpacity
            style={styles.cartIconContainer}
            activeOpacity={0.8}
            onPress={handleCheckout}
          >
            <Text style={styles.cartEmoji}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Horizontal Filter */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterTab,
                  activeCategory === cat && styles.filterTabActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeCategory === cat && styles.filterTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Catalog Grid Scroll */}
        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredItems.map(item => (
              <View key={item.id} style={styles.productCard}>
                {/* Product Icon Emoji */}
                <View style={styles.imageBlock}>
                  <Text style={styles.imageEmoji}>{item.icon}</Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>

                {/* Meta */}
                <View style={styles.metaBlock}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productWeight}>{item.weight}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.ratingVal}>{item.rating}</Text>
                  </View>
                  <Text style={styles.productPrice}>{item.price}</Text>
                </View>

                {/* Buy Button */}
                <TouchableOpacity
                  style={styles.buyBtn}
                  activeOpacity={0.8}
                  onPress={() => handleAddToCart(item)}
                >
                  <Text style={styles.buyBtnText}>Add To Cart</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LightColors.accentCyan,
  },
  root: {
    flex: 1,
    backgroundColor: LightColors.bgBase,
  },
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  navTitle: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    color: LightColors.textPrimary,
  },
  navSubtitle: {
    fontSize: Typography.fontSizeXs,
    color: LightColors.textSecondary,
    marginTop: 2,
  },
  cartIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LightColors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: LightColors.border,
  },
  cartEmoji: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: LightColors.danger,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
  },
  filterWrapper: {
    backgroundColor: LightColors.bgSurface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: LightColors.bgElevated,
    borderWidth: 1,
    borderColor: LightColors.border,
  },
  filterTabActive: {
    backgroundColor: LightColors.info,
    borderColor: LightColors.info,
  },
  filterText: {
    fontSize: Typography.fontSizeXs,
    color: LightColors.textSecondary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  gridContainer: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: LightColors.bgSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: LightColors.border,
    overflow: 'hidden',
    ...Shadows.card,
    padding: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageBlock: {
    width: '100%',
    height: 110,
    backgroundColor: LightColors.bgElevated,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageEmoji: {
    fontSize: 48,
  },
  categoryPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
  },
  metaBlock: {
    marginTop: 12,
    marginBottom: 12,
  },
  productName: {
    fontSize: Typography.fontSizeMd,
    fontWeight: Typography.fontWeightBold,
    color: LightColors.textPrimary,
  },
  productWeight: {
    fontSize: Typography.fontSizeXs,
    color: LightColors.textMuted,
    marginTop: 2,
    fontWeight: Typography.fontWeightMedium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  starIcon: {
    color: LightColors.warning,
    fontSize: 12,
  },
  ratingVal: {
    fontSize: Typography.fontSizeXs,
    color: LightColors.textSecondary,
    fontWeight: Typography.fontWeightBold,
  },
  productPrice: {
    fontSize: Typography.fontSizeLg,
    fontWeight: Typography.fontWeightExtraBold,
    color: LightColors.textPrimary,
    marginTop: 6,
  },
  buyBtn: {
    backgroundColor: LightColors.info,
    borderRadius: Radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeXs,
    fontWeight: Typography.fontWeightBold,
  },
});
