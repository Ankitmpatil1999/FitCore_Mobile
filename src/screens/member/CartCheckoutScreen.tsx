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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';

import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';

// ── Asset Icons ──
const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');
const clockImg = require('../../assets/Icons2/clock.png');

interface CartItem {
  id: string;
  name: string;
  brand: string;
  servingOrWeight: string;
  flavor: string;
  price: number;
  mrp: number;
  icon: string;
  qty: number;
}

interface AddressItem {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  flat: string;
  area: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

const INITIAL_CART: CartItem[] = [
  {
    id: 'vp1',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    servingOrWeight: '2 kg (60 Servings)',
    flavor: 'Double Rich Chocolate',
    price: 4999,
    mrp: 6499,
    icon: '🥛',
    qty: 1,
  },
  {
    id: 'vp3',
    name: 'Micronized Creatine Monohydrate',
    brand: 'Optimum Nutrition',
    servingOrWeight: '250g (83 Servings)',
    flavor: 'Unflavored',
    price: 1399,
    mrp: 1899,
    icon: '⚡',
    qty: 1,
  },
];

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: 'addr_1',
    tag: 'Home',
    name: 'Arjun Patil',
    phone: '+91 98230 44819',
    flat: 'Flat 402, Green Heights Phase 2',
    area: 'Shivaji Nagar, Behind Gold Gym',
    city: 'Pune, Maharashtra',
    pincode: '411005',
    isDefault: true,
  },
  {
    id: 'addr_2',
    tag: 'Work',
    name: 'Arjun Patil',
    phone: '+91 98230 44819',
    flat: 'Floor 5, Tower B, Cyber City Tech Park',
    area: 'Viman Nagar',
    city: 'Pune, Maharashtra',
    pincode: '411014',
    isDefault: false,
  },
];

export default function CartCheckoutScreen({ route, navigation }: any) {
  const { currentMember, currentUser } = useAppContext();
  const passedItems = route?.params?.items;
  const [cartItems, setCartItems] = useState<CartItem[]>(
    passedItems && passedItems.length > 0 ? passedItems : INITIAL_CART
  );

  // Delivery destination
  const [deliveryType, setDeliveryType] = useState<'gym' | 'home'>('gym');

  // Address state
  const [addressList, setAddressList] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_1');

  // Address Modals
  const [showAddressPickerModal, setShowAddressPickerModal] = useState(false);
  const [showAddEditAddressModal, setShowAddEditAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form Fields for Add/Edit
  const [formTag, setFormTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [formName, setFormName] = useState('Arjun Patil');
  const [formPhone, setFormPhone] = useState('+91 98230 44819');
  const [formFlat, setFormFlat] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formCity, setFormCity] = useState('Pune');
  const [formPincode, setFormPincode] = useState('411005');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'gym_desk'>('upi');

  // Order Placement & Live Tracking State
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [pickupOtp, setPickupOtp] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

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
  }, [orderPlaced]);

  // Cart Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = Math.round(subtotal * 0.15); // 15% VIP Member Discount
  const deliveryFee = 0; // Free delivery for members
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  const activeAddress =
    addressList.find((a) => a.id === selectedAddressId) || addressList[0];

  const updateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setFormTag('Home');
    setFormName('Arjun Patil');
    setFormPhone('+91 98230 44819');
    setFormFlat('');
    setFormArea('');
    setFormCity('Pune');
    setFormPincode('411005');
    setShowAddressPickerModal(false);
    setShowAddEditAddressModal(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setFormTag(addr.tag);
    setFormName(addr.name);
    setFormPhone(addr.phone);
    setFormFlat(addr.flat);
    setFormArea(addr.area);
    setFormCity(addr.city);
    setFormPincode(addr.pincode);
    setShowAddressPickerModal(false);
    setShowAddEditAddressModal(true);
  };

  const handleSaveAddress = () => {
    if (!formFlat.trim() || !formArea.trim() || !formPincode.trim()) {
      Alert.alert('Required Fields', 'Please enter your Flat/House No, Area, and 6-digit Pincode.');
      return;
    }

    if (editingAddressId) {
      // Update existing
      setAddressList((prev) =>
        prev.map((item) =>
          item.id === editingAddressId
            ? {
                ...item,
                tag: formTag,
                name: formName,
                phone: formPhone,
                flat: formFlat,
                area: formArea,
                city: formCity,
                pincode: formPincode,
              }
            : item
        )
      );
      setSelectedAddressId(editingAddressId);
    } else {
      // Add new
      const newId = `addr_${Date.now()}`;
      const newAddr: AddressItem = {
        id: newId,
        tag: formTag,
        name: formName,
        phone: formPhone,
        flat: formFlat,
        area: formArea,
        city: formCity,
        pincode: formPincode,
        isDefault: addressList.length === 0,
      };
      setAddressList((prev) => [newAddr, ...prev]);
      setSelectedAddressId(newId);
    }

    setShowAddEditAddressModal(false);
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add supplements to cart before placing an order.');
      return;
    }
    if (deliveryType === 'home' && !activeAddress) {
      Alert.alert('Address Needed', 'Please add a delivery address for home courier.');
      handleOpenAddAddress();
      return;
    }

    const generatedId = `FC-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    const est =
      deliveryType === 'gym'
        ? 'Today by 5:30 PM (Gym Reception Desk)'
        : 'Tomorrow, 2:00 PM – 6:00 PM (Doorstep)';

    setOrderId(generatedId);
    setPickupOtp(generatedOtp);
    setEstimatedTime(est);
    setOrderPlaced(true);

    // Persist to backend database
    apiService.createOrder({
      orderId: generatedId,
      memberId: currentMember?.id || currentUser?.id,
      items: cartItems,
      totalAmount: grandTotal,
      deliveryType,
      paymentMethod,
      address: deliveryType === 'home' ? activeAddress : null,
      status: 'confirmed',
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (orderPlaced ? setOrderPlaced(false) : navigation.goBack())}
            activeOpacity={0.7}
          >
            <Image
              source={leftArrowIcon}
              style={{ width: moderateScale(16), height: moderateScale(16), tintColor: '#0F172A' }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {orderPlaced ? 'Order Status & Tracking' : 'Cart & Checkout'}
            </Text>
            <Text style={styles.headerSub}>
              {orderPlaced ? `Order ID: ${orderId}` : '100% Genuine Certified Supplements'}
            </Text>
          </View>

          <View style={{ width: moderateScale(38) }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {!orderPlaced ? (
              <>
                {/* ── STEP 1: SHOPPING CART REVIEW ── */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>1. Shopping Cart ({cartItems.length})</Text>
                </View>

                {cartItems.length === 0 ? (
                  <View style={styles.emptyCartCard}>
                    <Text style={{ fontSize: fontScale(36), marginBottom: 6 }}>🛒</Text>
                    <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
                    <Text style={styles.emptyCartSub}>Add supplements from the store to continue.</Text>
                    <TouchableOpacity
                      style={styles.browseStoreBtn}
                      onPress={() => navigation.goBack()}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.browseStoreBtnText}>BROWSE STORE</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cartCard}>
                    {cartItems.map((item, idx) => (
                      <View
                        key={item.id}
                        style={[styles.cartItemRow, idx < cartItems.length - 1 && styles.cartItemBorder]}
                      >
                        <View style={styles.itemIconCircle}>
                          <Text style={{ fontSize: fontScale(26) }}>{item.icon}</Text>
                        </View>

                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <Text style={styles.itemBrand}>{item.brand}</Text>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.itemSpec}>
                            {item.servingOrWeight} • {item.flavor}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                            <Text style={styles.itemPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</Text>
                            <Text style={styles.itemMrp}>₹{(item.mrp * item.qty).toLocaleString('en-IN')}</Text>
                          </View>
                        </View>

                        {/* Stepper */}
                        <View style={styles.stepperBox}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateQty(item.id, -1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.stepperBtnText}>−</Text>
                          </TouchableOpacity>

                          <Text style={styles.stepperQty}>{item.qty}</Text>

                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => updateQty(item.id, 1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.stepperBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* Member Coupon Applied Badge */}
                    <View style={styles.couponBadgeRow}>
                      <Text style={styles.couponTag}>⚡ COUPON APPLIED</Text>
                      <Text style={styles.couponSavings}>FITCORE15 (-15% Saved ₹{discount})</Text>
                    </View>
                  </View>
                )}

                {/* ── STEP 2: DELIVERY DESTINATION ── */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>2. Choose Delivery Destination</Text>
                </View>

                <View style={styles.deliveryTabsRow}>
                  {/* Option A: Gym Desk Pickup */}
                  <TouchableOpacity
                    style={[styles.deliveryOptionCard, deliveryType === 'gym' && styles.deliveryOptionCardActive]}
                    onPress={() => setDeliveryType('gym')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.deliveryOptionTop}>
                      <Text style={{ fontSize: fontScale(22) }}>🏢</Text>
                      <View style={[styles.radioCircle, deliveryType === 'gym' && styles.radioCircleActive]}>
                        {deliveryType === 'gym' && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    <Text style={[styles.deliveryTitle, deliveryType === 'gym' && styles.deliveryTitleActive]}>
                      Gym Reception Desk
                    </Text>
                    <Text style={styles.deliveryDesc}>
                      FNS Fitness Club, Reception Counter • Ready Today by 5:30 PM
                    </Text>
                    <View style={styles.freePill}>
                      <Text style={styles.freePillText}>FREE SAME-DAY</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option B: Home Delivery */}
                  <TouchableOpacity
                    style={[styles.deliveryOptionCard, deliveryType === 'home' && styles.deliveryOptionCardActive]}
                    onPress={() => setDeliveryType('home')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.deliveryOptionTop}>
                      <Text style={{ fontSize: fontScale(22) }}>🏠</Text>
                      <View style={[styles.radioCircle, deliveryType === 'home' && styles.radioCircleActive]}>
                        {deliveryType === 'home' && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    <Text style={[styles.deliveryTitle, deliveryType === 'home' && styles.deliveryTitleActive]}>
                      Home Courier
                    </Text>
                    <Text style={styles.deliveryDesc}>
                      Direct delivery to your doorstep • Arrives in 1-2 Days
                    </Text>
                    <View style={[styles.freePill, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={[styles.freePillText, { color: '#6C5CE7' }]}>FREE COURIER</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* ── ADDRESS SELECTION / EDIT / ADD (WHEN HOME DELIVERY IS ACTIVE) ── */}
                {deliveryType === 'home' && (
                  <View style={styles.addressContainer}>
                    {activeAddress ? (
                      <View style={styles.addressActiveCard}>
                        <View style={styles.addressHeaderRow}>
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>📍 {activeAddress.tag.toUpperCase()}</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.changeAddressActionBtn}
                            onPress={() => setShowAddressPickerModal(true)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.changeAddressActionText}>🔄 CHANGE ADDRESS</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.addressRecipient}>{activeAddress.name}</Text>
                        <Text style={styles.addressLine}>{activeAddress.flat}</Text>
                        <Text style={styles.addressLine}>{activeAddress.area}</Text>
                        <Text style={styles.addressLine}>
                          {activeAddress.city} - {activeAddress.pincode}
                        </Text>
                        <Text style={styles.addressPhone}>📱 Contact: {activeAddress.phone}</Text>

                        {/* Fast Edit Button */}
                        <TouchableOpacity
                          style={styles.editThisAddrBtn}
                          onPress={() => handleOpenEditAddress(activeAddress)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editThisAddrText}>✏️ Edit Address Details</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.noAddressCard}
                        onPress={handleOpenAddAddress}
                        activeOpacity={0.85}
                      >
                        <Text style={{ fontSize: fontScale(26), marginBottom: 4 }}>➕</Text>
                        <Text style={styles.noAddressTitle}>Add Delivery Address</Text>
                        <Text style={styles.noAddressSub}>
                          Tap here to add your home/work address for doorstep courier
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── STEP 3: PAYMENT METHOD ── */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>3. Payment Method</Text>
                </View>

                <View style={styles.paymentCol}>
                  {[
                    { key: 'upi', label: '⚡ Instant UPI (GPay / PhonePe / Paytm / BHIM)', desc: 'Fast, secure & zero gateway fees' },
                    { key: 'gym_desk', label: '🏢 Pay upon Pickup at Gym Desk', desc: 'Cash, UPI or Card at reception desk' },
                    { key: 'card', label: '💳 Credit / Debit Card', desc: 'Visa, MasterCard, RuPay with 3D Secure' },
                  ].map((pay) => (
                    <TouchableOpacity
                      key={pay.key}
                      style={[styles.paymentRow, paymentMethod === pay.key && styles.paymentRowActive]}
                      onPress={() => setPaymentMethod(pay.key as any)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, paymentMethod === pay.key && styles.radioCircleActive]}>
                        {paymentMethod === pay.key && <View style={styles.radioDot} />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.paymentTitle, paymentMethod === pay.key && styles.paymentTitleActive]}>
                          {pay.label}
                        </Text>
                        <Text style={styles.paymentSub}>{pay.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── STEP 4: BILL SUMMARY ── */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>4. Price Summary</Text>
                </View>

                <View style={styles.billCard}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Member Special Discount (15%)</Text>
                    <Text style={[styles.billValue, { color: '#00A86B' }]}>- ₹{discount.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery Charges</Text>
                    <Text style={[styles.billValue, { color: '#00A86B' }]}>FREE</Text>
                  </View>

                  <View style={styles.billDivider} />

                  <View style={styles.billRow}>
                    <Text style={styles.billGrandLabel}>Total Amount to Pay</Text>
                    <Text style={styles.billGrandValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Place Order CTA Button */}
                <TouchableOpacity
                  style={styles.placeOrderBtn}
                  onPress={handlePlaceOrder}
                  activeOpacity={0.85}
                >
                  <Text style={styles.placeOrderBtnText}>
                    PLACE ORDER • ₹{grandTotal.toLocaleString('en-IN')} ▶
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── 5. LIVE ORDER STATUS & DELIVERY TRACKING ── */
              <View style={styles.trackingContainer}>
                {/* Celebration Header */}
                <View style={styles.orderPlacedHero}>
                  <View style={styles.celebrationIconBox}>
                    <Text style={{ fontSize: fontScale(38) }}>🎉</Text>
                  </View>
                  <Text style={styles.orderPlacedTitle}>Order Confirmed & Placed!</Text>
                  <Text style={styles.orderPlacedSub}>
                    Thank you, Arjun! Your order has been registered with the certified vendor.
                  </Text>

                  {/* Order ID & Total Paid */}
                  <View style={styles.orderMetaBox}>
                    <View style={styles.orderMetaCol}>
                      <Text style={styles.orderMetaLbl}>ORDER ID</Text>
                      <Text style={styles.orderMetaVal}>{orderId}</Text>
                    </View>
                    <View style={styles.orderMetaDivider} />
                    <View style={styles.orderMetaCol}>
                      <Text style={styles.orderMetaLbl}>TOTAL PAID</Text>
                      <Text style={styles.orderMetaVal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>

                {/* Pickup OTP Box */}
                <View style={styles.otpCard}>
                  <Text style={styles.otpLabel}>
                    {deliveryType === 'gym' ? '🔐 GYM RECEPTION PICKUP OTP' : '🔐 DELIVERY CONFIRMATION OTP'}
                  </Text>
                  <Text style={styles.otpCode}>{pickupOtp}</Text>
                  <Text style={styles.otpHint}>
                    {deliveryType === 'gym'
                      ? 'Show this 4-digit OTP at FNS Fitness Club desk to collect your supplement.'
                      : 'Share this OTP with the courier executive upon doorstep delivery.'}
                  </Text>
                </View>

                {/* Expected Time Card */}
                <View style={styles.estimateCard}>
                  <View style={styles.estimateIconBox}>
                    <Image source={clockImg} style={styles.estimateIcon} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.estimateTitle}>Expected Ready / Arrival Time</Text>
                    <Text style={styles.estimateVal}>{estimatedTime}</Text>
                  </View>
                </View>

                {/* Live 4-Stage Timeline Stepper */}
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineHeaderTitle}>Live Delivery Timeline</Text>

                  {[
                    { title: 'Order Confirmed & Payment Verified', sub: 'Verified by vendor • Just now', done: true, current: false },
                    { title: 'Packing at Certified Vendor Warehouse', sub: 'Authenticity seal & batch verification', done: true, current: true },
                    { title: deliveryType === 'gym' ? 'Dispatched to Gym Reception Desk' : 'Out for Home Courier Delivery', sub: 'Estimated arrival today', done: false, current: false },
                    { title: deliveryType === 'gym' ? 'Ready for Pickup at Gym Desk' : 'Delivered to Doorstep', sub: 'Claim with OTP: ' + pickupOtp, done: false, current: false },
                  ].map((step, idx) => (
                    <View key={idx} style={styles.timelineStepRow}>
                      <View style={styles.timelineLeftCol}>
                        <View
                          style={[
                            styles.timelineNode,
                            step.done && styles.timelineNodeDone,
                            step.current && styles.timelineNodeCurrent,
                          ]}
                        >
                          <Text style={[styles.timelineNodeText, step.done && { color: '#FFFFFF' }]}>
                            {step.done ? '✓' : idx + 1}
                          </Text>
                        </View>
                        {idx < 3 && <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />}
                      </View>

                      <View style={styles.timelineRightCol}>
                        <Text style={[styles.timelineStepTitle, step.done && styles.timelineStepTitleDone]}>
                          {step.title}
                        </Text>
                        <Text style={styles.timelineStepSub}>{step.sub}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Vendor Partner Support Card */}
                <View style={styles.vendorSupportCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.vendorIconBox}>
                      <Text style={{ fontSize: fontScale(20) }}>🛡️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorSupportTitle}>FitSupplements India (Official)</Text>
                      <Text style={styles.vendorSupportSub}>Direct Gym Partner • 100% Genuine Guarantee</Text>
                    </View>
                  </View>
                </View>

                {/* Back to Store CTA */}
                <TouchableOpacity
                  style={styles.backToStoreBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.backToStoreBtnText}>BACK TO STORE</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: hp(6) }} />
          </Animated.View>
        </ScrollView>

        {/* ── MODAL 1: SAVED ADDRESSES SELECTOR / PICKER ── */}
        <Modal visible={showAddressPickerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitleText}>Select Delivery Address</Text>
                  <Text style={styles.modalSubText}>Choose where you want your supplements delivered</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddressPickerModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(45) }}>
                {addressList.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      style={[styles.addrPickerCard, isSelected && styles.addrPickerCardActive]}
                      onPress={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressPickerModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.addrPickerTop}>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>📍 {addr.tag.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </View>

                      <Text style={styles.addrPickerName}>{addr.name}</Text>
                      <Text style={styles.addrPickerLine}>{addr.flat}</Text>
                      <Text style={styles.addrPickerLine}>{addr.area}</Text>
                      <Text style={styles.addrPickerLine}>
                        {addr.city} - {addr.pincode}
                      </Text>
                      <Text style={styles.addrPickerPhone}>📱 {addr.phone}</Text>

                      <TouchableOpacity
                        style={styles.addrEditLink}
                        onPress={() => handleOpenEditAddress(addr)}
                      >
                        <Text style={styles.addrEditLinkText}>✏️ Edit this address</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Add New Address Button */}
              <TouchableOpacity
                style={styles.addNewAddrBtn}
                onPress={handleOpenAddAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.addNewAddrBtnText}>+ ADD NEW ADDRESS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 2: ADD OR EDIT ADDRESS FORM ── */}
        <Modal visible={showAddEditAddressModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editAddressModalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitleText}>
                    {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
                  </Text>
                  <Text style={styles.modalSubText}>Enter accurate details for smooth doorstep delivery</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddEditAddressModal(false)}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(55) }}>
                {/* Tag Pills */}
                <Text style={styles.inputLabel}>Address Tag</Text>
                <View style={styles.tagPillsRow}>
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagPill, formTag === tag && styles.tagPillActive]}
                      onPress={() => setFormTag(tag)}
                    >
                      <Text style={[styles.tagPillText, formTag === tag && styles.tagPillTextActive]}>
                        {tag === 'Home' ? '🏠 Home' : tag === 'Work' ? '🏢 Work' : '📍 Other'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Name & Phone */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="e.g. Arjun Patil"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="+91 98230..."
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Flat / House */}
                <Text style={styles.inputLabel}>Flat / House / Building *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formFlat}
                  onChangeText={setFormFlat}
                  placeholder="e.g. Flat 402, Green Heights Phase 2"
                  placeholderTextColor="#94A3B8"
                />

                {/* Area / Landmark */}
                <Text style={styles.inputLabel}>Street / Area / Landmark *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formArea}
                  onChangeText={setFormArea}
                  placeholder="e.g. Shivaji Nagar, Behind Gold Gym"
                  placeholderTextColor="#94A3B8"
                />

                {/* City & Pincode */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formCity}
                      onChangeText={setFormCity}
                      placeholder="e.g. Pune"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Pincode (6 Digits) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formPincode}
                      onChangeText={setFormPincode}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="e.g. 411005"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.saveAddressBtnText}>
                  {editingAddressId ? 'SAVE CHANGES' : 'SAVE & DELIVER HERE ▶'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(0.5),
  },

  sectionHeaderRow: {
    marginBottom: hp(1),
    marginTop: hp(1),
  },
  sectionTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  // Cart Card
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  cartItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemIconCircle: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBrand: {
    fontSize: fontScale(9.5),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.3,
  },
  itemName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  itemSpec: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  itemMrp: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  stepperBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#0F172A',
  },
  stepperQty: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  couponBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(6),
  },
  couponTag: {
    fontSize: fontScale(9.5),
    fontWeight: '900',
    color: '#6C5CE7',
  },
  couponSavings: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#6C5CE7',
  },

  // Empty Cart
  emptyCartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginBottom: hp(2),
  },
  emptyCartTitle: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyCartSub: {
    fontSize: fontScale(12),
    color: '#64748B',
    marginBottom: hp(2),
  },
  browseStoreBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
  },
  browseStoreBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Delivery Tabs
  deliveryTabsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: hp(1.6),
  },
  deliveryOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#ECEAFD',
    justifyContent: 'space-between',
  },
  deliveryOptionCardActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#FAF5FF',
  },
  deliveryOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  deliveryTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#334155',
    marginBottom: 2,
  },
  deliveryTitleActive: {
    color: '#6C5CE7',
  },
  deliveryDesc: {
    fontSize: fontScale(10),
    color: '#64748B',
    lineHeight: fontScale(14),
    marginBottom: 8,
  },
  freePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  freePillText: {
    fontSize: fontScale(8.5),
    fontWeight: '800',
    color: '#00A86B',
  },

  // ── Address Section ──
  addressContainer: {
    marginBottom: hp(1.8),
  },
  addressActiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#ECEAFD',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  tagBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '900',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  changeAddressActionBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#6C5CE7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  changeAddressActionText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  addressRecipient: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: fontScale(12),
    color: '#475569',
    lineHeight: fontScale(16),
    marginTop: 1,
  },
  addressPhone: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  editThisAddrBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  editThisAddrText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#6C5CE7',
  },
  noAddressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(18),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#6C5CE7',
    alignItems: 'center',
  },
  noAddressTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  noAddressSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Payment
  paymentCol: {
    gap: moderateScale(8),
    marginBottom: hp(1.8),
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    gap: moderateScale(10),
  },
  paymentRowActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#FAF5FF',
  },
  paymentTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#334155',
  },
  paymentTitleActive: {
    color: '#6C5CE7',
  },
  paymentSub: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 2,
  },

  // Bill Card
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
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
  billValue: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  billGrandLabel: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#0F172A',
  },
  billGrandValue: {
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
    marginBottom: hp(2),
  },
  placeOrderBtnText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── TRACKING CONTAINER ──
  trackingContainer: {
    paddingTop: hp(0.5),
  },
  orderPlacedHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    alignItems: 'center',
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  celebrationIconBox: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  orderPlacedTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  orderPlacedSub: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(16),
    marginBottom: hp(1.6),
  },
  orderMetaBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    width: '100%',
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  orderMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  orderMetaLbl: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  orderMetaVal: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#6C5CE7',
    marginTop: 2,
  },
  orderMetaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },

  // OTP Card
  otpCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  otpLabel: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  otpCode: {
    fontSize: fontScale(28),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 8,
    marginBottom: 6,
  },
  otpHint: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(15),
  },

  // Estimate
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.8),
    gap: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  estimateIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#6C5CE7',
  },
  estimateTitle: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  estimateVal: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },

  // Timeline Stepper
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  timelineHeaderTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(1.4),
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(14),
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: moderateScale(26),
    marginRight: moderateScale(10),
  },
  timelineNode: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  timelineNodeCurrent: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  timelineNodeText: {
    fontSize: fontScale(10),
    fontWeight: '900',
    color: '#64748B',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  timelineLineDone: {
    backgroundColor: '#00C48C',
  },
  timelineRightCol: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#64748B',
  },
  timelineStepTitleDone: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timelineStepSub: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    marginTop: 2,
  },

  // Vendor Support
  vendorSupportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  vendorIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorSupportTitle: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#0F172A',
  },
  vendorSupportSub: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },

  backToStoreBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
  },
  backToStoreBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Modals Overlay ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },

  // ── Modal 1: Picker ──
  pickerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
    paddingBottom: hp(4),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.8),
  },
  modalTitleText: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubText: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseX: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  addrPickerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#ECEAFD',
    marginBottom: moderateScale(10),
  },
  addrPickerCardActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#FAF5FF',
  },
  addrPickerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addrPickerName: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  addrPickerLine: {
    fontSize: fontScale(11.5),
    color: '#475569',
    marginTop: 1,
  },
  addrPickerPhone: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 3,
  },
  addrEditLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  addrEditLinkText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#6C5CE7',
  },
  addNewAddrBtn: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  addNewAddrBtnText: {
    fontSize: fontScale(12),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // ── Modal 2: Form ──
  editAddressModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
    paddingBottom: hp(4),
  },
  tagPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
  },
  tagPillActive: {
    backgroundColor: '#6C5CE7',
  },
  tagPillText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: fontScale(12.5),
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  saveAddressBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    marginTop: hp(2),
  },
  saveAddressBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
