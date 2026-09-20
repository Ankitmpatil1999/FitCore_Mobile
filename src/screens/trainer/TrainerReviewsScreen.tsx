import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Radii } from '../../theme';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';
import apiService from '../../services/api';

const leftArrowIcon = require('../../assets/Icons2/left-arrow.png');

interface ReviewItem {
  _id?: string;
  id?: string;
  memberName: string;
  memberAvatar: string;
  rating: number;
  date: string;
  tag: string;
  comment: string;
  sessionType: string;
  helpfulCount: number;
  helpfulUserIds?: string[];
}

interface BreakdownItem {
  stars: number;
  count: number;
  percent: number;
}

export default function TrainerReviewsScreen({ navigation }: any) {
  const { currentTrainer, currentGym, currentUser } = useAppContext();
  const trainerId = currentTrainer?.id || currentUser?.id || 't1';
  const trainerName = currentTrainer?.name || currentUser?.name || 'Coach Kunal';
  const gymName = currentGym?.name || 'FitCore Gym';
  const currentUserId = currentUser?.id || 'user_anon';

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState('5.0');
  const [totalReviews, setTotalReviews] = useState(0);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([
    { stars: 5, count: 0, percent: 0 },
    { stars: 4, count: 0, percent: 0 },
    { stars: 3, count: 0, percent: 0 },
    { stars: 2, count: 0, percent: 0 },
    { stars: 1, count: 0, percent: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3'>('all');

  // ── Write Review Modal ──
  const [addReviewModal, setAddReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTag, setNewTag] = useState('Transformation Specialist');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Entrance Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scoreScaleAnim = useRef(new Animated.Value(0.8)).current;

  const fetchLiveReviews = async () => {
    try {
      setLoading(true);
      const res: any = await apiService.getTrainerReviews(trainerId);
      if (res?.success && res.data) {
        setReviews(res.data.reviews || []);
        setAvgRating(res.data.avgRating || '5.0');
        setTotalReviews(res.data.totalReviews || (res.data.reviews?.length ?? 0));
        if (Array.isArray(res.data.breakdown)) {
          setBreakdown(res.data.breakdown);
        }
      }
    } catch (err) {
      console.log('Error fetching live reviews from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      Animated.spring(scoreScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    fetchLiveReviews();
  }, [trainerId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveReviews();
  };

  const handleToggleHelpful = async (reviewId: string) => {
    try {
      // Instant optimistic UI
      setReviews((prev) =>
        prev.map((r) => {
          const rId = r._id || r.id;
          if (rId === reviewId) {
            const userIds = Array.isArray(r.helpfulUserIds) ? r.helpfulUserIds : [];
            const isLiked = userIds.includes(currentUserId);
            const nextCount = isLiked ? Math.max(0, r.helpfulCount - 1) : r.helpfulCount + 1;
            const nextUsers = isLiked
              ? userIds.filter((u) => u !== currentUserId)
              : [...userIds, currentUserId];
            return { ...r, helpfulCount: nextCount, helpfulUserIds: nextUsers };
          }
          return r;
        })
      );

      await apiService.toggleReviewHelpful(reviewId, currentUserId);
    } catch (e) {
      console.log('Error updating helpful count:', e);
    }
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('Comment Required', 'Please enter your feedback comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res: any = await apiService.createTrainerReview({
        trainerId,
        memberId: currentUser?.id || 'm_live',
        memberName: currentUser?.name || 'Member',
        memberAvatar: currentUser?.avatar || 'MB',
        rating: newRating,
        tag: newTag,
        comment: newComment.trim(),
        sessionType: '1-on-1 Personal Training',
      });

      if (res?.success) {
        Alert.alert('Review Added ✅', 'Thank you! Your review has been saved to the database.');
        setAddReviewModal(false);
        setNewComment('');
        fetchLiveReviews();
      } else {
        Alert.alert('Submission Error', res?.message || 'Unable to submit review.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Network error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered List
  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === '5') return Number(r.rating) >= 4.5;
    if (selectedFilter === '4') return Number(r.rating) >= 3.5 && Number(r.rating) < 4.5;
    if (selectedFilter === '3') return Number(r.rating) < 3.5;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* ── Ambient Background Glows ── */}
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
          <View style={styles.headerCenterBox}>
            <Text style={styles.headerTitle}>Coach Rating & Reviews</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {gymName} • {trainerName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.writeReviewHeaderBtn}
            onPress={() => setAddReviewModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="create-outline" size={moderateScale(18)} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {/*1. HERO SCORE & RATING BREAKDOWN CARD (100% DB API DATA)*/}
          <View style={styles.heroScoreCard}>
            {/* Top Left: Score Big Box */}
            <View style={styles.scoreLeftCol}>
              <Animated.Text style={[styles.bigRatingText, { transform: [{ scale: scoreScaleAnim }] }]}>
                {avgRating}
              </Animated.Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon
                    key={s}
                    name={s <= Math.round(Number(avgRating)) ? 'star' : 'star-outline'}
                    size={moderateScale(15)}
                    color="#F59E0B"
                    style={{ marginHorizontal: 1 }}
                  />
                ))}
              </View>
              <Text style={styles.totalReviewsText}>Based on {totalReviews} Reviews</Text>
              <View style={styles.topRatedBadge}>
                <Icon name="ribbon-outline" size={moderateScale(12)} color="#047857" />
                <Text style={styles.topRatedBadgeText}>Verified Coach</Text>
              </View>
            </View>

            {/* Top Right: Star Breakdown Progress Bars */}
            <View style={styles.breakdownCol}>
              {breakdown.map((b) => (
                <View key={b.stars} style={styles.breakdownRow}>
                  <Text style={styles.starLabel}>{b.stars} ★</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${b.percent}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{b.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              2. KEY STRENGTH HIGHLIGHTS (CLEAN SVG VECTOR PILLS)
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>What Members Love</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            <View style={[styles.highlightPill, { backgroundColor: '#EEF2FF', borderColor: 'rgba(99, 102, 241, 0.25)' }]}>
              <Icon name="flame" size={moderateScale(14)} color="#4338CA" />
              <Text style={[styles.highlightPillText, { color: '#4338CA' }]}>High Energy</Text>
            </View>
            <View style={[styles.highlightPill, { backgroundColor: '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
              <Icon name="locate" size={moderateScale(14)} color="#047857" />
              <Text style={[styles.highlightPillText, { color: '#047857' }]}>Posture Correction</Text>
            </View>
            <View style={[styles.highlightPill, { backgroundColor: '#FFFBEB', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Icon name="nutrition" size={moderateScale(14)} color="#B45309" />
              <Text style={[styles.highlightPillText, { color: '#B45309' }]}>Diet Guidance</Text>
            </View>
            <View style={[styles.highlightPill, { backgroundColor: '#FDF2F8', borderColor: 'rgba(236, 72, 153, 0.25)' }]}>
              <Icon name="time" size={moderateScale(14)} color="#BE185D" />
              <Text style={[styles.highlightPillText, { color: '#BE185D' }]}>Punctuality</Text>
            </View>
          </ScrollView>

          {/* ════════════════════════════════════════════════════════════════
              3. REVIEWS LIST WITH FILTER TABS
          ════════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Member Reviews & Feedback</Text>
            <Text style={styles.reviewCountSub}>({filteredReviews.length})</Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterBtn, selectedFilter === 'all' && styles.filterBtnActive]}
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnText, selectedFilter === 'all' && styles.filterBtnTextActive]}>
                All ({reviews.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, selectedFilter === '5' && styles.filterBtnActive]}
              onPress={() => setSelectedFilter('5')}
              activeOpacity={0.8}
            >
              <View style={styles.filterBtnInnerRow}>
                <Text style={[styles.filterBtnText, selectedFilter === '5' && styles.filterBtnTextActive]}>5</Text>
                <Icon name="star" size={moderateScale(11)} color={selectedFilter === '5' ? '#FFFFFF' : '#F59E0B'} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, selectedFilter === '4' && styles.filterBtnActive]}
              onPress={() => setSelectedFilter('4')}
              activeOpacity={0.8}
            >
              <View style={styles.filterBtnInnerRow}>
                <Text style={[styles.filterBtnText, selectedFilter === '4' && styles.filterBtnTextActive]}>4</Text>
                <Icon name="star" size={moderateScale(11)} color={selectedFilter === '4' ? '#FFFFFF' : '#F59E0B'} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, selectedFilter === '3' && styles.filterBtnActive]}
              onPress={() => setSelectedFilter('3')}
              activeOpacity={0.8}
            >
              <View style={styles.filterBtnInnerRow}>
                <Text style={[styles.filterBtnText, selectedFilter === '3' && styles.filterBtnTextActive]}>≤ 3</Text>
                <Icon name="star" size={moderateScale(11)} color={selectedFilter === '3' ? '#FFFFFF' : '#F59E0B'} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Review Cards (Live from MongoDB) */}
          {loading && !refreshing ? (
            <View style={{ paddingVertical: hp(4), alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={{ marginTop: 8, fontSize: fontScale(12), color: '#94A3B8' }}>Loading verified reviews...</Text>
            </View>
          ) : filteredReviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {filteredReviews.map((rev) => {
                const revId = rev._id || rev.id || `rev_${Math.random()}`;
                const userIds = Array.isArray(rev.helpfulUserIds) ? rev.helpfulUserIds : [];
                const isLiked = userIds.includes(currentUserId);

                return (
                  <View key={revId} style={styles.reviewCard}>
                    {/* Top: Avatar, Name, Session & Rating */}
                    <View style={styles.reviewTopRow}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>{rev.memberAvatar || 'MB'}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
                        <Text style={styles.reviewerName}>{rev.memberName}</Text>
                        <Text style={styles.sessionTypeText}>
                          {rev.sessionType || 'Personal Training'} • {rev.date || 'Recent'}
                        </Text>
                      </View>

                      <View style={styles.ratingBadgePill}>
                        <Icon name="star" size={moderateScale(12)} color="#F59E0B" />
                        <Text style={styles.ratingBadgeVal}>{Number(rev.rating).toFixed(1)}</Text>
                      </View>
                    </View>

                    {/* Specialty Tag */}
                    {rev.tag ? (
                      <View style={styles.tagBadge}>
                        <Icon name="checkmark-seal" size={moderateScale(12)} color="#6366F1" />
                        <Text style={styles.tagBadgeText}>{rev.tag}</Text>
                      </View>
                    ) : null}

                    {/* Comment Body */}
                    <Text style={styles.commentBody}>{rev.comment}</Text>

                    {/* Bottom: Helpful Thumb action */}
                    <View style={styles.reviewBottomRow}>
                      <TouchableOpacity
                        style={[styles.helpfulBtn, isLiked && styles.helpfulBtnActive]}
                        onPress={() => handleToggleHelpful(revId)}
                        activeOpacity={0.75}
                      >
                        <Icon
                          name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                          size={moderateScale(13)}
                          color={isLiked ? '#4F46E5' : '#64748B'}
                        />
                        <Text style={[styles.helpfulBtnText, isLiked && styles.helpfulBtnTextActive]}>
                          Helpful ({rev.helpfulCount || 0})
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.verifiedMemberBadge}>
                        <Icon name="shield-checkmark" size={moderateScale(12)} color="#10B981" />
                        <Text style={styles.verifiedMemberText}>Verified Member</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyReviewBox}>
              <Icon name="star-outline" size={moderateScale(24)} color="#94A3B8" />
              <Text style={styles.emptyReviewTitle}>No Reviews Found</Text>
              <Text style={styles.emptyReviewSub}>Be the first to rate and write a review for this coach!</Text>
            </View>
          )}

          <View style={{ height: hp(6) }} />
        </ScrollView>

        {/* ── ADD NEW REVIEW MODAL ── */}
        <Modal
          visible={addReviewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setAddReviewModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Write Coach Review</Text>
                <TouchableOpacity onPress={() => setAddReviewModal(false)}>
                  <Icon name="close" size={moderateScale(20)} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Star Selector */}
              <Text style={styles.fieldLabel}>Rating (Stars)</Text>
              <View style={styles.starSelectRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setNewRating(s)} activeOpacity={0.7}>
                    <Icon
                      name={s <= newRating ? 'star' : 'star-outline'}
                      size={moderateScale(28)}
                      color="#F59E0B"
                      style={{ marginHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tag Selector */}
              <Text style={styles.fieldLabel}>Highlight Tag</Text>
              <View style={styles.tagOptionsRow}>
                {['Transformation Specialist', 'Posture Expert', 'Diet Guidance', 'Cardio & HIIT'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagOptionPill, newTag === t && styles.tagOptionPillActive]}
                    onPress={() => setNewTag(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tagOptionText, newTag === t && styles.tagOptionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment Input */}
              <Text style={styles.fieldLabel}>Your Experience / Feedback</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Share your experience training with this coach..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAddReviewModal(false)}
                  disabled={submittingReview}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  },

  // ── Ambient Glows ──
  ambientGlowTop: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(10),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: hp(30),
    left: -wp(20),
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(1.4),
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerCenterBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  writeReviewHeaderBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },

  // ── Hero Score Card ──
  heroScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: hp(2),
  },
  scoreLeftCol: {
    flex: 1.1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: moderateScale(14),
  },
  bigRatingText: {
    fontSize: fontScale(38),
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: fontScale(44),
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 6,
  },
  totalReviewsText: {
    fontSize: fontScale(11),
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    marginTop: 8,
  },
  topRatedBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#047857',
  },

  breakdownCol: {
    flex: 1.4,
    paddingLeft: moderateScale(14),
    gap: 5,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#475569',
    width: moderateScale(24),
  },
  barTrack: {
    flex: 1,
    height: moderateScale(6),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: moderateScale(3),
  },
  barCount: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: '#94A3B8',
    width: moderateScale(18),
    textAlign: 'right',
  },

  // ── Highlights Tags ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
    marginTop: hp(0.5),
  },
  sectionTitle: {
    fontSize: fontScale(14.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewCountSub: {
    fontSize: fontScale(12.5),
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 6,
  },
  tagScroll: {
    gap: moderateScale(8),
    paddingBottom: hp(1.5),
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    borderWidth: 1,
  },
  highlightPillText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
  },

  // ── Filters Row ──
  filtersRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: hp(1.5),
  },
  filterBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  filterBtnText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },

  // ── Review Cards ──
  reviewsList: {
    gap: moderateScale(12),
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(15),
    borderWidth: 1,
    borderColor: '#ECEAFD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  reviewerAvatarText: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#4F46E5',
  },
  reviewerName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionTypeText: {
    fontSize: fontScale(10.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  ratingBadgeVal: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#B45309',
  },

  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#475569',
  },

  commentBody: {
    fontSize: fontScale(12.5),
    color: '#334155',
    lineHeight: fontScale(18),
    marginBottom: moderateScale(10),
  },

  reviewBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: moderateScale(8),
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  helpfulBtnActive: {
    backgroundColor: '#EEF2FF',
  },
  helpfulBtnText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  helpfulBtnTextActive: {
    color: '#4F46E5',
  },

  verifiedMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedMemberText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#059669',
  },

  emptyReviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(22),
    paddingHorizontal: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAFD',
    marginTop: hp(2),
  },
  emptyReviewTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptyReviewSub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    marginTop: 3,
    textAlign: 'center',
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: fontScale(16.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  starSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: 6,
  },
  tagOptionPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagOptionPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tagOptionText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
  },
  tagOptionTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: fontScale(13),
    color: '#0F172A',
  },
  modalTextArea: {
    height: moderateScale(70),
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: moderateScale(10),
    marginTop: moderateScale(18),
  },
  modalCancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(10),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(110),
  },
  modalSubmitBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
