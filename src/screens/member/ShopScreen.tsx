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
  Modal,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { apiService } from '../../services/api';


// ── Native Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const dumbbellIcon = require('../../assets/Icons/dumbbell.png');
const clockImg = require('../../assets/Icons2/clock.png');

interface VendorProduct {
  id: string;
  name: string;
  brand: string;
  category: 'protein' | 'creatine' | 'preworkout' | 'bcaa' | 'vitamins' | 'gear';
  categoryLabel: string;
  icon: string;
  price: number;
  mrp: number;
  rating: number;
  reviewsCount: string;
  servingOrWeight: string;
  flavor: string;
  vendorName: string;
  inStock: boolean;
  tag?: string;
}

const VENDOR_PRODUCTS: VendorProduct[] = [
  {
    id: 'vp1',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    category: 'protein',
    categoryLabel: 'Whey Protein',
    icon: '🥛',
    price: 4999,
    mrp: 6499,
    rating: 4.9,
    reviewsCount: '1.4k',
    servingOrWeight: '2 kg (60 Servings)',
    flavor: 'Double Rich Chocolate',
    vendorName: 'FitSupplements India (Official)',
    inStock: true,
    tag: 'Bestseller 🔥',
  },
  {
    id: 'vp2',
    name: 'Biozyme Performance Whey',
    brand: 'MuscleBlaze',
    category: 'protein',
    categoryLabel: 'Whey Protein',
    icon: '💪',
    price: 3699,
    mrp: 4699,
    rating: 4.8,
    reviewsCount: '980',
    servingOrWeight: '2 kg (66 Servings)',
    flavor: 'Rich Chocolate Fudge',
    vendorName: 'MuscleBlaze Direct',
    inStock: true,
    tag: 'Top Value',
  },
  {
    id: 'vp3',
    name: 'Micronized Creatine Monohydrate',
    brand: 'Optimum Nutrition',
    category: 'creatine',
    categoryLabel: 'Creatine',
    icon: '⚡',
    price: 1399,
    mrp: 1899,
    rating: 4.9,
    reviewsCount: '2.1k',
    servingOrWeight: '250g (83 Servings)',
    flavor: 'Unflavored',
    vendorName: 'FitSupplements India',
    inStock: true,
    tag: 'Pure 100%',
  },
  {
    id: 'vp4',
    name: 'Creatine Monohydrate 200 Mesh',
    brand: 'MuscleBlaze',
    category: 'creatine',
    categoryLabel: 'Creatine',
    icon: '⚡',
    price: 999,
    mrp: 1399,
    rating: 4.7,
    reviewsCount: '840',
    servingOrWeight: '250g (83 Servings)',
    flavor: 'Fruit Punch',
    vendorName: 'MuscleBlaze Direct',
    inStock: true,
  },
  {
    id: 'vp5',
    name: 'C4 Original Explosive Pre-Workout',
    brand: 'Cellucor',
    category: 'preworkout',
    categoryLabel: 'Pre-Workout',
    icon: '🔥',
    price: 2499,
    mrp: 3299,
    rating: 4.8,
    reviewsCount: '620',
    servingOrWeight: '30 Servings (195g)',
    flavor: 'Icy Blue Razz',
    vendorName: 'NutraHub Official',
    inStock: true,
    tag: 'High Energy 🚀',
  },
  {
    id: 'vp6',
    name: 'Psychotic Extreme Pre-Workout',
    brand: 'Insane Labz',
    category: 'preworkout',
    categoryLabel: 'Pre-Workout',
    icon: '🔥',
    price: 2799,
    mrp: 3599,
    rating: 4.6,
    reviewsCount: '410',
    servingOrWeight: '35 Servings (216g)',
    flavor: 'Watermelon Rush',
    vendorName: 'NutraHub Official',
    inStock: true,
  },
  {
    id: 'vp7',
    name: 'Xtend Original BCAA Recovery',
    brand: 'Scivation Xtend',
    category: 'bcaa',
    categoryLabel: 'BCAAs & Recovery',
    icon: '🍉',
    price: 2199,
    mrp: 2899,
    rating: 4.9,
    reviewsCount: '750',
    servingOrWeight: '30 Servings (420g)',
    flavor: 'Watermelon Madness',
    vendorName: 'Scivation India',
    inStock: true,
  },
  {
    id: 'vp8',
    name: 'Animal Pak Multivitamin & Minerals',
    brand: 'Universal Nutrition',
    category: 'vitamins',
    categoryLabel: 'Vitamins & Health',
    icon: '💊',
    price: 3499,
    mrp: 4499,
    rating: 4.8,
    reviewsCount: '530',
    servingOrWeight: '44 Paks',
    flavor: 'Pills Pack',
    vendorName: 'Universal India',
    inStock: true,
  },
  {
    id: 'vp9',
    name: 'Pro Heavy Leather Weightlifting Belt',
    brand: 'FitCore Pro Gear',
    category: 'gear',
    categoryLabel: 'Gym Gear',
    icon: '🥋',
    price: 1899,
    mrp: 2799,
    rating: 4.9,
    reviewsCount: '320',
    servingOrWeight: '10mm Thickness • M/L',
    flavor: 'Genuine Cowhide Leather',
    vendorName: 'FitCore Official Store',
    inStock: true,
  },
  {
    id: 'vp10',
    name: 'Stainless Steel Insulated Shaker (750ml)',
    brand: 'FitCore Gear',
    category: 'gear',
    categoryLabel: 'Gym Gear',
    icon: '🥤',
    price: 899,
    mrp: 1299,
    rating: 4.7,
    reviewsCount: '890',
    servingOrWeight: '750 ml Double Wall',
    flavor: 'Matte Black Metal',
    vendorName: 'FitCore Official Store',
    inStock: true,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Items', icon: '✨' },
  { key: 'protein', label: 'Whey Protein', icon: '🥛' },
  { key: 'creatine', label: 'Creatine', icon: '⚡' },
  { key: 'preworkout', label: 'Pre-Workout', icon: '🔥' },
  { key: 'bcaa', label: 'BCAAs', icon: '🍉' },
  { key: 'vitamins', label: 'Vitamins', icon: '💊' },
  { key: 'gear', label: 'Gym Gear', icon: '🥋' },
];

export default function ShopScreen({ navigation }: any) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveProducts, setLiveProducts] = useState<VendorProduct[]>(VENDOR_PRODUCTS);
  const [cart, setCart] = useState<Record<string, number>>({ vp1: 1 });
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [orderPlacedModal, setOrderPlacedModal] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'reception' | 'home'>('reception');
  const [paymentOption, setPaymentOption] = useState<'upi' | 'card' | 'reception'>('upi');

  // ── Fetch Live Products from API ──
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res: any = await apiService.getProducts(selectedCat !== 'all' ? selectedCat : undefined);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: VendorProduct[] = res.data.map((p: any) => ({
            id: p.id || p._id,
            name: p.name,
            brand: p.brand || 'FitCore',
            category: p.category || 'protein',
            categoryLabel: p.categoryLabel || p.category || 'Supplements',
            icon: p.icon || '💊',
            price: p.memberPrice || p.price || 999,
            mrp: p.mrp || 1499,
            rating: p.rating || 4.8,
            reviewsCount: String(p.totalReviews || '120'),
            servingOrWeight: p.servingOrWeight || 'Standard',
            flavor: p.flavor || 'Original',
            vendorName: p.vendorName || 'Official Vendor',
            inStock: p.inStock !== false,
            tag: p.tag,
          }));
          setLiveProducts(mapped);
        }
      } catch (err) {
        console.log('Using local cached products');
      }
    }
    fetchProducts();
  }, [selectedCat]);

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

  const filteredProducts = liveProducts.filter((prod) => {
    const matchesCat = selectedCat === 'all' || prod.category === selectedCat;
    const matchesSearch = searchQuery
      ? prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });


  const cartItemIds = Object.keys(cart).filter((id) => cart[id] > 0);
  const totalCartCount = cartItemIds.reduce((sum, id) => sum + cart[id], 0);

  const cartSubtotal = cartItemIds.reduce((sum, id) => {
    const item = VENDOR_PRODUCTS.find((p) => p.id === id);
    return sum + (item ? item.price * cart[id] : 0);
  }, 0);

  const memberDiscount = Math.round(cartSubtotal * 0.15); // 15% Member Discount
  const grandTotal = Math.max(0, cartSubtotal - memberDiscount);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const navigateToCheckout = () => {
    const items = cartItemIds.map((id) => {
      const prod = VENDOR_PRODUCTS.find((p) => p.id === id)!;
      return {
        id: prod.id,
        name: prod.name,
        brand: prod.brand,
        servingOrWeight: prod.servingOrWeight,
        flavor: prod.flavor,
        price: prod.price,
        mrp: prod.mrp,
        icon: prod.icon,
        qty: cart[id],
      };
    });
    navigation.navigate('CartCheckout', { items });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
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

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Supplements & Store</Text>
            <View style={styles.officialBadge}>
              <View style={styles.officialDot} />
              <Text style={styles.officialText}>Verified Gym Vendors</Text>
            </View>
          </View>

          {/* Cart Icon Button */}
          <TouchableOpacity
            style={styles.cartIconBtn}
            onPress={() => (totalCartCount > 0 ? navigateToCheckout() : navigation.navigate('CartCheckout'))}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: fontScale(16) }}>🛒</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartBadgePill}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchContainer}>
          <Text style={{ fontSize: fontScale(13), marginRight: 6 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Whey, Creatine, Pre-Workout, Belts..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ── 1. MEMBER DEAL HERO BANNER ── */}
            <View style={styles.dealHeroCard}>
              <View style={styles.dealHeroLeft}>
                <View style={styles.dealTag}>
                  <Text style={styles.dealTagText}>⚡ MEMBER EXCLUSIVE</Text>
                </View>
                <Text style={styles.dealTitle}>FLAT 15% OFF</Text>
                <Text style={styles.dealSub}>
                  Automatic member discount applied at checkout. Pick up at Gym Desk!
                </Text>
              </View>
              <View style={styles.dealIconBox}>
                <Text style={{ fontSize: fontScale(38) }}>🏷️</Text>
              </View>
            </View>

            {/* ── 2. CATEGORY PILLS HORIZONTAL SCROLL ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={{ gap: moderateScale(8), paddingRight: wp(5) }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCat === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catPill, isSelected && styles.catPillActive]}
                    onPress={() => setSelectedCat(cat.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: fontScale(12), marginRight: 4 }}>{cat.icon}</Text>
                    <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── 3. SECTION TITLE ── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {selectedCat === 'all' ? 'All Certified Products' : CATEGORIES.find((c) => c.key === selectedCat)?.label}
                </Text>
                <Text style={styles.sectionSub}>
                  Showing {filteredProducts.length} vendor items • 100% Genuine Guarantee
                </Text>
              </View>
            </View>

            {/* ── 4. TWO-COLUMN PRODUCT GRID ── */}
            <View style={styles.productsGrid}>
              {filteredProducts.map((prod) => {
                const qtyInCart = cart[prod.id] || 0;
                const discountPercent = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);

                return (
                  <View key={prod.id} style={styles.productCard}>
                    {/* Top Tag & Rating */}
                    <View style={styles.prodCardTop}>
                      {prod.tag ? (
                        <View style={styles.prodTagPill}>
                          <Text style={styles.prodTagText}>{prod.tag}</Text>
                        </View>
                      ) : (
                        <View style={styles.verifiedVendorTag}>
                          <Text style={styles.verifiedVendorText}>✓ Verified</Text>
                        </View>
                      )}
                      <Text style={styles.prodRatingText}>⭐ {prod.rating}</Text>
                    </View>

                    {/* Product Icon Center */}
                    <View style={styles.prodIconCircle}>
                      <Text style={{ fontSize: fontScale(38) }}>{prod.icon}</Text>
                    </View>

                    {/* Brand & Title */}
                    <Text style={styles.prodBrandText}>{prod.brand}</Text>
                    <Text style={styles.prodNameText} numberOfLines={2}>
                      {prod.name}
                    </Text>

                    {/* Flavor / Spec */}
                    <Text style={styles.prodSpecText} numberOfLines={1}>
                      {prod.servingOrWeight}
                    </Text>

                    {/* Price Row */}
                    <View style={styles.prodPriceRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={styles.prodPriceVal}>₹{prod.price.toLocaleString('en-IN')}</Text>
                        <Text style={styles.prodMrpVal}>₹{prod.mrp.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.discountPill}>
                        <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                      </View>
                    </View>

                    {/* Add / Stepper CTA */}
                    {qtyInCart === 0 ? (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => updateQuantity(prod.id, 1)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.addBtnText}>+ ADD TO CART</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(prod.id, -1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepperQtyText}>{qtyInCart}</Text>

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(prod.id, 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

      

            <View style={{ height: hp(22) }} />
          </Animated.View>
        </ScrollView>

        {/* ── FLOATING QUICK CART SUMMARY BAR ── */}
        {totalCartCount > 0 && (
          <View style={styles.floatingCartContainer}>
            <View style={styles.floatingCartCard}>
              <View>
                <Text style={styles.floatingCartItems}>
                  🛒 {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'} Selected
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                  <Text style={styles.floatingCartTotal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                  <Text style={styles.floatingCartSavings}>Saved ₹{memberDiscount}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.floatingCheckoutBtn}
                onPress={navigateToCheckout}
                activeOpacity={0.85}
              >
                <Text style={styles.floatingCheckoutBtnText}>CHECKOUT →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(0, 196, 140, 0.08)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  officialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C48C',
    marginRight: 5,
  },
  officialText: {
    fontSize: fontScale(10),
    color: '#00A86B',
    fontWeight: '800',
  },
  cartIconBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    position: 'relative',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cartBadgePill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6C5CE7',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // ── Search Bar ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(5),
    marginBottom: hp(1.4),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(12),
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  // ── Deal Hero Banner ──
  dealHeroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dealHeroLeft: {
    flex: 1,
    paddingRight: moderateScale(10),
  },
  dealTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    marginBottom: 4,
  },
  dealTagText: {
    fontSize: fontScale(9.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dealTitle: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  dealSub: {
    fontSize: fontScale(11),
    color: 'rgba(255, 255, 255, 0.90)',
    marginTop: 2,
    lineHeight: fontScale(15),
  },
  dealIconBox: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Category Pills ──
  categoryScroll: {
    marginBottom: hp(1.8),
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  catPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catPillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },

  // ── Section Title ──
  sectionHeaderRow: {
    marginBottom: hp(1.4),
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

  // ── 2-Col Grid ──
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: moderateScale(10),
    marginBottom: hp(2),
  },
  productCard: {
    width: (wp(90) - moderateScale(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    justifyContent: 'space-between',
  },
  prodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  prodTagPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(1.5),
    borderRadius: moderateScale(4),
  },
  prodTagText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#D97706',
  },
  verifiedVendorTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(1.5),
    borderRadius: moderateScale(4),
  },
  verifiedVendorText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#00A86B',
  },
  prodRatingText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#0F172A',
  },
  prodIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#F8FAFC',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  prodBrandText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.3,
  },
  prodNameText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    lineHeight: fontScale(16),
  },
  prodSpecText: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  prodPriceRow: {
    marginTop: 8,
    marginBottom: 8,
  },
  prodPriceVal: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  prodMrpVal: {
    fontSize: fontScale(10),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(5),
    paddingVertical: 1,
    borderRadius: moderateScale(4),
    marginTop: 2,
  },
  discountText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  addBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(8),
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: fontScale(10.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(10),
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(8),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  stepperBtnText: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  stepperQtyText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },

  // ── Trust Card ──
  trustCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  trustSub: {
    fontSize: fontScale(9),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  trustDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },

  // ── Floating Cart Bar ──
  floatingCartContainer: {
    position: 'absolute',
    bottom: moderateScale(86),
    left: wp(5),
    right: wp(5),
    zIndex: 99,
  },
  floatingCartCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  floatingCartItems: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#94A3B8',
  },
  floatingCartTotal: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  floatingCartSavings: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#00C48C',
  },
  floatingCheckoutBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
  },
  floatingCheckoutBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  checkoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(26),
    borderTopRightRadius: moderateScale(26),
    padding: moderateScale(20),
    paddingBottom: hp(4),
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.6),
  },
  checkoutModalTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutModalSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#64748B',
  },

  // Cart Rows
  cartItemsList: {
    marginBottom: hp(1.8),
  },
  cartRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  cartItemBrand: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  cartItemPrice: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
    marginTop: 2,
  },
  modalStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 8,
  },
  modalStepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepperBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalStepperQtyText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },

  modalSectionTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: moderateScale(8),
    marginTop: moderateScale(8),
  },
  deliverySelectorRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(1.6),
  },
  deliveryOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  deliveryOptionCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6C5CE7',
  },
  deliveryOptionTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#475569',
  },
  deliveryOptionTitleActive: {
    color: '#6C5CE7',
  },
  deliveryOptionSub: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    marginTop: 2,
  },

  // Payment
  paymentSelectorCol: {
    gap: moderateScale(8),
    marginBottom: hp(1.8),
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: moderateScale(10),
  },
  paymentRowActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6C5CE7',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#6C5CE7',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C5CE7',
  },
  paymentLabel: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#334155',
  },
  paymentLabelActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  paymentDesc: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },

  // Bill
  billCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    fontWeight: '600',
  },
  billVal: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  billTotalLabel: {
    fontSize: fontScale(13.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  billTotalVal: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#6C5CE7',
  },

  placeOrderBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  placeOrderBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Success Modal
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(22),
    alignItems: 'center',
    marginHorizontal: wp(6),
  },
  successIconCircle: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  successTitle: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(17),
    marginBottom: hp(2),
  },
  orderIdBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginBottom: hp(2.5),
  },
  orderIdText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
