import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadows } from '../../theme';
import { PRODUCTS, Product, ProductCategory } from '../../data/mockData';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  protein: 'Protein',
  creatine: 'Creatine',
  pre_workout: 'Pre-Workout',
  mass_gainer: 'Mass Gainer',
  accessories: 'Accessories',
  apparel: 'Apparel',
  bcaa: 'BCAA',
  multivitamin: 'Multivitamin',
  fish_oil: 'Fish Oil',
  peanut_butter: 'Peanut Butter',
  oats: 'Oats',
  equipment: 'Equipment',
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  protein: '#8B5CF6',
  creatine: '#3B82F6',
  pre_workout: '#EF4444',
  mass_gainer: '#10B981',
  accessories: '#F59E0B',
  apparel: '#EC4899',
  bcaa: '#10B981',
  multivitamin: '#3B82F6',
  fish_oil: '#F59E0B',
  peanut_butter: '#EF4444',
  oats: '#8B5CF6',
  equipment: '#6366F1',
};

export default function ShopScreen() {
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [showCart, setShowCart] = useState(false);

  const filtered = categoryFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === categoryFilter);

  const cartTotal = cart.reduce((s, item) => s + item.product.price * item.qty, 0);
  const cartCount = cart.reduce((s, item) => s + item.qty, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { product, qty: 1 }];
    });
    Alert.alert('Added to Cart', `${product.name} added!`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) { Alert.alert('Cart Empty', 'Add items to cart first.'); return; }
    Alert.alert('Order Placed!', `Your order of ₹${cartTotal.toLocaleString('en-IN')} has been placed! Collect from the gym counter.`);
    setCart([]);
    setShowCart(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#EC4899" />
      <View style={styles.root}>

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Supplements & More</Text>
              <Text style={styles.headerTitle}>Shop 🛍️</Text>
            </View>
            <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(!showCart)} activeOpacity={0.85}>
              <Text style={styles.cartIcon}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Cart preview */}
        {showCart && cart.length > 0 && (
          <View style={styles.cartPreview}>
            <Text style={styles.cartTitle}>Your Cart 🛒</Text>
            {cart.map(item => (
              <View key={item.product.id} style={styles.cartRow}>
                <Text style={styles.cartEmoji}>{item.product.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>₹{item.product.price.toLocaleString('en-IN')} × {item.qty}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                  <Text style={{ fontSize: 16, color: '#EF4444' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.cartFooter}>
              <Text style={styles.cartTotalText}>Total: ₹{cartTotal.toLocaleString('en-IN')}</Text>
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutBtnText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <TouchableOpacity
              style={[styles.catChip, categoryFilter === 'all' && styles.catChipActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Text style={[styles.catChipText, categoryFilter === 'all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, categoryFilter === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.catChipText, categoryFilter === cat && { color: '#FFFFFF' }]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.countLabel}>{filtered.length} products</Text>

          {/* Product grid */}
          <View style={styles.productGrid}>
            {filtered.map(product => {
              const discount = product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;
              const inCart = cart.find(c => c.product.id === product.id);

              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productEmojiBox}>
                    <Text style={{ fontSize: 36 }}>{product.emoji}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                  )}

                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.productPrice, { color: CATEGORY_COLORS[product.category] }]}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </Text>
                    {discount > 0 && (
                      <Text style={styles.productMRP}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                    )}
                  </View>

                  <View style={[styles.stockPill, { backgroundColor: product.stock > 5 ? '#ECFDF5' : '#FEF3C7' }]}>
                    <Text style={[styles.stockText, { color: product.stock > 5 ? '#10B981' : '#F59E0B' }]}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addCartBtn, inCart && styles.addCartBtnActive, product.stock === 0 && { backgroundColor: '#F1F5F9' }]}
                    onPress={() => product.stock > 0 && addToCart(product)}
                    activeOpacity={0.85}
                    disabled={product.stock === 0}
                  >
                    <Text style={[styles.addCartBtnText, inCart && { color: '#FFFFFF' }]}>
                      {inCart ? `In Cart (${inCart.qty})` : product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                    </Text>
                  </TouchableOpacity>
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
  safeArea: { flex: 1, backgroundColor: '#EC4899' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#EC4899' },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  cartBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartIcon: { fontSize: 22 },
  cartBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#EC4899' },
  cartPreview: {
    backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card,
    width: '90%', maxWidth: 600, alignSelf: 'center',
  },
  cartTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cartEmoji: { fontSize: 24 },
  cartItemName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  cartItemPrice: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cartTotalText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  checkoutBtn: { backgroundColor: '#EC4899', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  checkoutBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scroll: {
    padding: 16, paddingBottom: 40,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  catScroll: { marginBottom: 14 },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  countLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 14 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card, position: 'relative' },
  productEmojiBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  discountBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  discountText: { fontSize: 9, fontWeight: '800', color: '#10B981' },
  productBrand: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  productName: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginTop: 3, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  productPrice: { fontSize: 16, fontWeight: '800' },
  productMRP: { fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through' },
  stockPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginBottom: 10, alignSelf: 'flex-start' },
  stockText: { fontSize: 10, fontWeight: '700' },
  addCartBtn: { backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addCartBtnActive: { backgroundColor: '#EC4899' },
  addCartBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },
});
