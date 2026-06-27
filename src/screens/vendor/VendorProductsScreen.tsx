import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { LightColors } from '../../theme';
import {
  getVendorProductsByStore, VENDOR_PRODUCTS, VendorProduct, ProductCategory,
} from '../../data/mockData';

const CAT_ICONS: Record<string, string> = {
  protein: '💪', creatine: '⚗️', pre_workout: '🔥', mass_gainer: '🏋️',
  bcaa: '💊', multivitamin: '🌿', fish_oil: '🐟', peanut_butter: '🥜',
  oats: '🥣', accessories: '🥤', equipment: '🏋', apparel: '👕',
};

const CAT_COLORS: Record<string, string> = {
  protein: '#8B5CF6', creatine: '#3B82F6', pre_workout: '#EF4444', mass_gainer: '#10B981',
  bcaa: '#EC4899', multivitamin: '#0EA5E9', fish_oil: '#14B8A6', peanut_butter: '#F59E0B',
  oats: '#78716C', accessories: '#F97316', equipment: '#6366F1', apparel: '#DB2777',
};

export default function VendorProductsScreen() {
  const { currentVendor } = useAppContext();
  const vendorId = currentVendor?.id ?? 'vs1';

  const [products, setProducts] = useState<VendorProduct[]>(getVendorProductsByStore(vendorId));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | ProductCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);

  // New product form state
  const [nName, setNName] = useState('');
  const [nBrand, setNBrand] = useState('');
  const [nCategory, setNCategory] = useState<ProductCategory>('protein');
  const [nMrp, setNMrp] = useState('');
  const [nMemberPrice, setNMemberPrice] = useState('');
  const [nOwnerPrice, setNOwnerPrice] = useState('');
  const [nMargin, setNMargin] = useState('');
  const [nStock, setNStock] = useState('');
  const [nWeight, setNWeight] = useState('');
  const [nExpiry, setNExpiry] = useState('');

  const categories = [...new Set(products.map(p => p.category))] as ProductCategory[];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const memberDisc = nMrp && nMemberPrice && parseFloat(nMrp) > parseFloat(nMemberPrice)
    ? Math.round(((parseFloat(nMrp) - parseFloat(nMemberPrice)) / parseFloat(nMrp)) * 100) : 0;
  const ownerDisc = nMrp && nOwnerPrice && parseFloat(nMrp) > parseFloat(nOwnerPrice)
    ? Math.round(((parseFloat(nMrp) - parseFloat(nOwnerPrice)) / parseFloat(nMrp)) * 100) : 0;

  const handleSaveProduct = () => {
    if (!nName || !nBrand || !nMemberPrice || !nStock) {
      Alert.alert('Required', 'Name, Brand, Member Price and Stock are required.');
      return;
    }

    const newProduct: VendorProduct = {
      id: `vp${Date.now()}`,
      vendorId,
      name: nName,
      brand: nBrand,
      category: nCategory,
      description: '',
      ingredients: '',
      nutritionFacts: '',
      weight: nWeight || 'N/A',
      flavours: [],
      images: [CAT_ICONS[nCategory] ?? '📦'],
      mrp: parseFloat(nMrp) || parseFloat(nMemberPrice),
      price: parseFloat(nMemberPrice),
      ownerPrice: parseFloat(nOwnerPrice) || parseFloat(nMemberPrice),
      memberPrice: parseFloat(nMemberPrice),
      margin: parseFloat(nMargin) || 0,
      discount: memberDisc,
      ownerDiscount: ownerDisc,
      stock: parseInt(nStock, 10),
      lowStockThreshold: 5,
      expiryDate: nExpiry || 'N/A',
      rating: 0,
      reviews: 0,
      sold: 0,
      isActive: true,
      tags: [],
      offer: memberDisc > 0 ? `${memberDisc}% OFF` : '',
    };

    setProducts(prev => [newProduct, ...prev]);
    VENDOR_PRODUCTS.push(newProduct);
    Alert.alert('Success', `${nName} has been added to your catalogue!`);
    setShowAddModal(false);
    setNName(''); setNBrand(''); setNMrp(''); setNMemberPrice('');
    setNOwnerPrice(''); setNMargin(''); setNStock(''); setNWeight(''); setNExpiry('');
  };

  const handleToggleActive = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, isActive: !p.isActive } : p,
    ));
  };

  const handleDelete = (productId: string, name: string) => {
    Alert.alert('Delete Product', `Remove "${name}" from your catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setProducts(prev => prev.filter(p => p.id !== productId)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LightColors.bgSurface} />
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerSub}>Catalogue Management</Text>
              <Text style={styles.headerTitle}>Products 📦</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Category filter */}
        <View style={styles.catScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
            <TouchableOpacity
              style={[styles.catChip, catFilter === 'all' && styles.catChipActive]}
              onPress={() => setCatFilter('all')}
            >
              <Text style={[styles.catChipText, catFilter === 'all' && { color: '#FFFFFF' }]}>All ({products.length})</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, catFilter === cat && { backgroundColor: CAT_COLORS[cat] ?? LightColors.accentViolet, borderColor: CAT_COLORS[cat] ?? LightColors.accentViolet }]}
                onPress={() => setCatFilter(cat)}
              >
                <Text style={{ fontSize: 12 }}>{CAT_ICONS[cat] ?? '📦'}</Text>
                <Text style={[styles.catChipText, catFilter === cat && { color: '#FFFFFF' }]}>
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{filtered.length} products</Text>

          {filtered.map(product => {
            const catColor = CAT_COLORS[product.category] ?? LightColors.accentViolet;
            const isLowStock = product.stock <= product.lowStockThreshold;
            return (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, !product.isActive && { opacity: 0.6 }]}
                onPress={() => setSelectedProduct(product)}
                activeOpacity={0.92}
              >
                <View style={styles.productLeft}>
                  <View style={[styles.productEmoji, { backgroundColor: catColor + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{product.images[0]}</Text>
                  </View>
                </View>

                <View style={styles.productInfo}>
                  <View style={styles.productTopRow}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    {product.tags.includes('bestseller') && (
                      <View style={styles.bestsellerBadge}>
                        <Text style={styles.bestsellerText}>⭐ Best</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productBrand}>{product.brand} · {product.weight}</Text>

                  {/* Dual pricing row */}
                  <View style={styles.dualPriceRow}>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceTagLabel}>🏢 Owner</Text>
                      <Text style={[styles.priceTagValue, { color: '#7C3AED' }]}>₹{(product.ownerPrice ?? product.price).toLocaleString('en-IN')}</Text>
                      {product.ownerDiscount > 0 && (
                        <View style={[styles.discChip, { backgroundColor: '#EDE9FE' }]}>
                          <Text style={[styles.discText, { color: '#7C3AED' }]}>{product.ownerDiscount}% off</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceTag}>
                      <Text style={styles.priceTagLabel}>👤 Member</Text>
                      <Text style={[styles.priceTagValue, { color: '#0EA5E9' }]}>₹{(product.memberPrice ?? product.price).toLocaleString('en-IN')}</Text>
                      {product.discount > 0 && (
                        <View style={[styles.discChip, { backgroundColor: '#E0F2FE' }]}>
                          <Text style={[styles.discText, { color: '#0EA5E9' }]}>{product.discount}% off</Text>
                        </View>
                      )}
                    </View>
                    {product.mrp > 0 && (
                      <>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceTag}>
                          <Text style={styles.priceTagLabel}>MRP</Text>
                          <Text style={styles.mrpText}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={styles.productMetaRow}>
                    <View style={[styles.stockPill, { backgroundColor: isLowStock ? LightColors.warningBg : LightColors.successBg }]}>
                      <Text style={[styles.stockText, { color: isLowStock ? LightColors.warning : LightColors.success }]}>
                        {isLowStock ? '⚠️' : '✅'} {product.stock} in stock
                      </Text>
                    </View>
                    <Text style={styles.soldText}>Sold: {product.sold}</Text>
                    {product.margin > 0 && (
                      <View style={styles.marginPill}>
                        <Text style={styles.marginText}>💹 {product.margin}% margin</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: product.isActive ? LightColors.successBg : LightColors.dangerBg }]}
                    onPress={() => handleToggleActive(product.id)}
                  >
                    <Text style={{ fontSize: 14 }}>{product.isActive ? '🟢' : '🔴'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: LightColors.dangerBg }]}
                    onPress={() => handleDelete(product.id, product.name)}
                  >
                    <Text style={{ fontSize: 14 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── PRODUCT DETAIL MODAL ── */}
      {selectedProduct && (
        <Modal visible={!!selectedProduct} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedProduct(null)}>
          <SafeAreaView style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Hero */}
              <View style={styles.detailHero}>
                <View style={[styles.detailEmoji, { backgroundColor: (CAT_COLORS[selectedProduct.category] ?? '#7C3AED') + '20' }]}>
                  <Text style={{ fontSize: 52 }}>{selectedProduct.images[0]}</Text>
                </View>
                <Text style={styles.detailBrand}>{selectedProduct.brand} · {selectedProduct.weight}</Text>
              </View>

              {/* Pricing breakdown */}
              <Text style={styles.detailSectionTitle}>💰 Pricing Breakdown</Text>
              <View style={styles.pricingCard}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>MRP</Text>
                  <Text style={[styles.pricingValue, { textDecorationLine: 'line-through', color: LightColors.textMuted }]}>₹{selectedProduct.mrp.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.pricingRow, styles.pricingHighlight]}>
                  <Text style={styles.pricingLabel}>🏢 Owner Price</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.pricingValue, { color: '#7C3AED', fontWeight: '800' }]}>₹{(selectedProduct.ownerPrice ?? selectedProduct.price).toLocaleString('en-IN')}</Text>
                    {selectedProduct.ownerDiscount > 0 && (
                      <Text style={styles.discountNote}>{selectedProduct.ownerDiscount}% off MRP</Text>
                    )}
                  </View>
                </View>
                <View style={[styles.pricingRow, styles.pricingHighlight]}>
                  <Text style={styles.pricingLabel}>👤 Member Price</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.pricingValue, { color: '#0EA5E9', fontWeight: '800' }]}>₹{(selectedProduct.memberPrice ?? selectedProduct.price).toLocaleString('en-IN')}</Text>
                    {selectedProduct.discount > 0 && (
                      <Text style={styles.discountNote}>{selectedProduct.discount}% off MRP</Text>
                    )}
                  </View>
                </View>
                {selectedProduct.margin > 0 && (
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>💹 Your Margin</Text>
                    <Text style={[styles.pricingValue, { color: LightColors.success, fontWeight: '800' }]}>{selectedProduct.margin}%</Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <Text style={styles.detailSectionTitle}>📊 Product Stats</Text>
              <View style={styles.statsGrid}>
                {[
                  { label: 'In Stock', val: selectedProduct.stock.toString(), color: selectedProduct.stock <= selectedProduct.lowStockThreshold ? LightColors.warning : LightColors.success },
                  { label: 'Units Sold', val: selectedProduct.sold.toString(), color: LightColors.accentViolet },
                  { label: 'Rating', val: `⭐ ${selectedProduct.rating}`, color: LightColors.warning },
                  { label: 'Reviews', val: selectedProduct.reviews.toString(), color: LightColors.info },
                ].map(s => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {selectedProduct.description ? (
                <>
                  <Text style={styles.detailSectionTitle}>📋 Description</Text>
                  <Text style={styles.detailDesc}>{selectedProduct.description}</Text>
                </>
              ) : null}

              {selectedProduct.expiryDate !== 'N/A' && (
                <>
                  <Text style={styles.detailSectionTitle}>📅 Expiry Date</Text>
                  <Text style={styles.detailDesc}>{selectedProduct.expiryDate}</Text>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── ADD PRODUCT MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Category picker */}
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(Object.keys(CAT_ICONS) as ProductCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, nCategory === cat && { backgroundColor: CAT_COLORS[cat] ?? LightColors.accentViolet, borderColor: CAT_COLORS[cat] ?? LightColors.accentViolet }]}
                  onPress={() => setNCategory(cat)}
                >
                  <Text style={{ fontSize: 14 }}>{CAT_ICONS[cat]}</Text>
                  <Text style={[styles.catChipText, nCategory === cat && { color: '#FFFFFF' }]}>{cat.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Basic fields */}
            {[
              { label: 'Product Name *', val: nName, set: setNName, ph: 'e.g. Whey Protein 2kg' },
              { label: 'Brand *', val: nBrand, set: setNBrand, ph: 'e.g. MuscleBlaze' },
              { label: 'Weight / Size', val: nWeight, set: setNWeight, ph: 'e.g. 2 kg, 300 g' },
              { label: 'MRP (₹)', val: nMrp, set: setNMrp, ph: 'e.g. 3499', numeric: true },
              { label: 'Stock Quantity *', val: nStock, set: setNStock, ph: 'e.g. 20', numeric: true },
              { label: 'Expiry Date', val: nExpiry, set: setNExpiry, ph: 'e.g. 2027-06-01' },
            ].map(f => (
              <View key={f.label}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.ph}
                  placeholderTextColor="#94A3B8"
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType={(f as any).numeric ? 'numeric' : 'default'}
                />
              </View>
            ))}

            {/* Dual pricing section */}
            <View style={styles.pricingSectionHeader}>
              <Text style={styles.pricingSectionTitle}>💰 Dual Pricing Setup</Text>
              <Text style={styles.pricingSectionSubtitle}>Set different prices for Gym Owners & Members</Text>
            </View>

            <View style={styles.dualPriceInputRow}>
              <View style={styles.priceInputBox}>
                <Text style={[styles.inputLabel, { color: '#7C3AED' }]}>🏢 Owner Price (₹) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: '#7C3AED' }]}
                  placeholder="Bulk/owner price"
                  placeholderTextColor="#94A3B8"
                  value={nOwnerPrice}
                  onChangeText={setNOwnerPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.priceInputBox}>
                <Text style={[styles.inputLabel, { color: '#0EA5E9' }]}>👤 Member Price (₹) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: '#0EA5E9' }]}
                  placeholder="Regular price"
                  placeholderTextColor="#94A3B8"
                  value={nMemberPrice}
                  onChangeText={setNMemberPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>💹 Your Profit Margin (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 20 (your margin above cost)"
              placeholderTextColor="#94A3B8"
              value={nMargin}
              onChangeText={setNMargin}
              keyboardType="numeric"
            />

            {/* Live discount preview */}
            {(memberDisc > 0 || ownerDisc > 0) && (
              <View style={styles.discPreviewBox}>
                <Text style={styles.discPreviewTitle}>📊 Discount Preview</Text>
                {ownerDisc > 0 && (
                  <View style={styles.discPreviewRow}>
                    <Text style={styles.discPreviewLabel}>🏢 Owner gets</Text>
                    <View style={[styles.discChip, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[styles.discText, { color: '#7C3AED' }]}>{ownerDisc}% OFF MRP</Text>
                    </View>
                  </View>
                )}
                {memberDisc > 0 && (
                  <View style={styles.discPreviewRow}>
                    <Text style={styles.discPreviewLabel}>👤 Member gets</Text>
                    <View style={[styles.discChip, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.discText, { color: '#0EA5E9' }]}>{memberDisc}% OFF MRP</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>📦 Save Product</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LightColors.bgSurface },
  root: { flex: 1, backgroundColor: LightColors.bgBase },
  header: {
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  headerSub: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: LightColors.textPrimary },
  addBtn: {
    backgroundColor: `${LightColors.accentViolet}15`,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: LightColors.accentViolet,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: LightColors.accentViolet },
  searchBarContainer: { backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: LightColors.textPrimary },
  catScrollContainer: { backgroundColor: LightColors.bgSurface, borderBottomWidth: 1, borderBottomColor: LightColors.border },
  catScroll: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  catScrollContent: { paddingVertical: 10, paddingHorizontal: 16 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: LightColors.bgElevated, marginRight: 8, borderWidth: 1, borderColor: LightColors.border },
  catChipActive: { backgroundColor: LightColors.accentViolet, borderColor: LightColors.accentViolet },
  catChipText: { fontSize: 11, fontWeight: '700', color: LightColors.textMuted },
  scroll: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  countLabel: { fontSize: 12, color: LightColors.textMuted, fontWeight: '600', marginBottom: 12 },
  productCard: { backgroundColor: LightColors.bgSurface, borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: LightColors.border },
  productLeft: {},
  productEmoji: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, gap: 5 },
  productTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productName: { flex: 1, fontSize: 14, fontWeight: '800', color: LightColors.textPrimary },
  bestsellerBadge: { backgroundColor: LightColors.warningBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  bestsellerText: { fontSize: 9, fontWeight: '700', color: LightColors.warning },
  productBrand: { fontSize: 11, color: LightColors.textMuted, fontWeight: '500' },
  dualPriceRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  priceTag: { alignItems: 'flex-start', gap: 2 },
  priceTagLabel: { fontSize: 9, fontWeight: '700', color: LightColors.textMuted },
  priceTagValue: { fontSize: 13, fontWeight: '800' },
  mrpText: { fontSize: 11, color: LightColors.textMuted, textDecorationLine: 'line-through' },
  priceDivider: { width: 1, height: 32, backgroundColor: LightColors.border, alignSelf: 'center' },
  discChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  discText: { fontSize: 9, fontWeight: '700' },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  stockText: { fontSize: 10, fontWeight: '700' },
  soldText: { fontSize: 10, color: LightColors.textMuted, fontWeight: '600' },
  marginPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  marginText: { fontSize: 9, fontWeight: '700', color: LightColors.success },
  productActions: { justifyContent: 'center', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Detail modal
  modalRoot: { flex: 1, backgroundColor: LightColors.bgBase },
  modalHeader: {
    backgroundColor: LightColors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: LightColors.border,
  },
  modalHeaderContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,
    width: '100%', maxWidth: 600, alignSelf: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: LightColors.textPrimary, flex: 1, marginRight: 12 },
  modalClose: { fontSize: 22, color: LightColors.textPrimary, fontWeight: '700' },
  modalScroll: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  detailHero: { alignItems: 'center', marginBottom: 20, gap: 8 },
  detailEmoji: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  detailBrand: { fontSize: 13, color: LightColors.textMuted, fontWeight: '600' },
  detailSectionTitle: { fontSize: 13, fontWeight: '800', color: LightColors.textSecondary, marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  pricingCard: { backgroundColor: LightColors.bgSurface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: LightColors.border, marginBottom: 4 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  pricingHighlight: { backgroundColor: LightColors.bgElevated },
  pricingLabel: { fontSize: 13, fontWeight: '600', color: LightColors.textSecondary },
  pricingValue: { fontSize: 14, fontWeight: '700', color: LightColors.textPrimary },
  discountNote: { fontSize: 10, color: LightColors.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statCard: { flex: 1, minWidth: '22%', backgroundColor: LightColors.bgSurface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: LightColors.border },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, color: LightColors.textMuted, fontWeight: '600', marginTop: 3, textAlign: 'center' },
  detailDesc: { fontSize: 13, color: LightColors.textSecondary, lineHeight: 20, marginBottom: 4 },
  // Add product modal
  inputLabel: { fontSize: 12, fontWeight: '700', color: LightColors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: LightColors.bgSurface, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: LightColors.textPrimary },
  pricingSectionHeader: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 4 },
  pricingSectionTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  pricingSectionSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  dualPriceInputRow: { flexDirection: 'row', gap: 12 },
  priceInputBox: { flex: 1 },
  discPreviewBox: { backgroundColor: LightColors.bgSurface, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: LightColors.border, gap: 10 },
  discPreviewTitle: { fontSize: 13, fontWeight: '800', color: LightColors.textPrimary, marginBottom: 4 },
  discPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discPreviewLabel: { fontSize: 13, color: LightColors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: LightColors.accentViolet, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
