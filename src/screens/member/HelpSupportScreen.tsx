import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { wp, hp, fontScale, moderateScale } from '../../theme/responsive';
import { useAppContext } from '../../context/AppContext';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'Membership',
    question: 'How do I renew or upgrade my gym membership?',
    answer:
      'Go to "My Membership Plan" from your Profile or Home tab. You can view all available plans offered by your gym, select a duration (Monthly, Quarterly, Annual), and request a renewal directly through the app or front desk.',
  },
  {
    id: '2',
    category: 'Attendance & QR',
    question: 'How do I mark my gym attendance via Turnstile / QR?',
    answer:
      'Tap on the "Check-In" QR icon on the top right of your Home screen. Scan the QR code placed at your gym turnstile/entry gate, or show your member pass barcode to the receptionist for instant verified check-in.',
  },
  {
    id: '3',
    category: 'Workouts & Diet',
    question: 'Can my trainer update my workout and diet chart?',
    answer:
      'Yes! When your gym assigns you a personal trainer or coach, they can curate custom workout routines and daily nutrition macros directly to your Workout and Diet tabs in real time.',
  },
  {
    id: '4',
    category: 'Account & Data',
    question: 'How is my fitness and health data protected?',
    answer:
      'FitCore uses industry-standard 256-bit TLS/SSL encryption for data in transit and secure cloud databases. We do not sell your personal data to third parties. You can request a copy of your data or complete account deletion anytime.',
  },
  {
    id: '5',
    category: 'Payments & Invoices',
    question: 'Where can I download my payment receipts?',
    answer:
      'Navigate to Profile → Payment & Receipts. All physical gym membership receipts and store purchases are listed with date, transaction ID, mode, and breakdown for your tax and personal records.',
  },
];

export default function HelpSupportScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentGym, currentUser, currentMember } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'report'>('faq');

  // Issue reporting form state
  const [issueCategory, setIssueCategory] = useState('Membership & Billing');
  const [issueDescription, setIssueDescription] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@fitcore.app?subject=FitCore%20Member%20Support%20Request');
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/919326093115?text=Hi%20FitCore%20Support%2C%20I%20need%20assistance%20with%20my%20member%20account.');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+919326093115');
  };

  const handleSubmitTicket = () => {
    if (!issueDescription.trim()) {
      Alert.alert('Required Field', 'Please provide a brief description of the issue you are experiencing.');
      return;
    }
    setSubmittingIssue(true);
    setTimeout(() => {
      setSubmittingIssue(false);
      setTicketSubmitted(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FD" />
      <View style={styles.root}>
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={moderateScale(20)} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSub}>FAQs, Grievance & Instant Assistance</Text>
          </View>
        </View>

        {/* ── SEGMENT TABS ── */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'faq' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('faq')}
            activeOpacity={0.8}
          >
            <Icon
              name="help-circle-outline"
              size={moderateScale(16)}
              color={activeTab === 'faq' ? '#6C5CE7' : '#64748B'}
            />
            <Text style={[styles.segmentText, activeTab === 'faq' && styles.segmentTextActive]}>
              FAQs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'contact' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('contact')}
            activeOpacity={0.8}
          >
            <Icon
              name="call-outline"
              size={moderateScale(16)}
              color={activeTab === 'contact' ? '#6C5CE7' : '#64748B'}
            />
            <Text style={[styles.segmentText, activeTab === 'contact' && styles.segmentTextActive]}>
              Contact Us
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'report' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.8}
          >
            <Icon
              name="alert-circle-outline"
              size={moderateScale(16)}
              color={activeTab === 'report' ? '#6C5CE7' : '#64748B'}
            />
            <Text style={[styles.segmentText, activeTab === 'report' && styles.segmentTextActive]}>
              Report Issue
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(6) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. FAQ TAB ── */}
          {activeTab === 'faq' && (
            <View>
              <View style={styles.faqBanner}>
                <View style={styles.faqBannerIconBox}>
                  <Icon name="sparkles" size={moderateScale(22)} color="#6C5CE7" />
                </View>
                <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                  <Text style={styles.faqBannerTitle}>Frequently Asked Questions</Text>
                  <Text style={styles.faqBannerSub}>
                    Quick answers regarding membership, QR entry, workouts and subscriptions.
                  </Text>
                </View>
              </View>

              {FAQS.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.faqHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.faqCategoryPill}>
                          <Text style={styles.faqCategoryPillText}>{item.category.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.faqQuestion}>{item.question}</Text>
                      </View>
                      <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={moderateScale(18)}
                        color="#6C5CE7"
                      />
                    </View>
                    {isExpanded && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── 2. CONTACT US TAB ── */}
          {activeTab === 'contact' && (
            <View>
              <View style={styles.contactHeroCard}>
                <Text style={styles.contactHeroTitle}>We’re Here to Help You</Text>
                <Text style={styles.contactHeroSub}>
                  Our dedicated member success team is available Monday to Saturday, 7:00 AM – 9:00 PM IST.
                </Text>
              </View>

              {/* WhatsApp Support Card */}
              <TouchableOpacity
                style={styles.channelCard}
                onPress={handleOpenWhatsApp}
                activeOpacity={0.85}
              >
                <View style={[styles.channelIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="logo-whatsapp" size={moderateScale(22)} color="#10B981" />
                </View>
                <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                  <Text style={styles.channelTitle}>WhatsApp Support</Text>
                  <Text style={styles.channelSub}>Instant chat assistance with support agent</Text>
                  <Text style={styles.channelHighlight}>+91 93260 93115</Text>
                </View>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CBD5E1" />
              </TouchableOpacity>

              {/* Official Email Card */}
              <TouchableOpacity
                style={styles.channelCard}
                onPress={handleOpenEmail}
                activeOpacity={0.85}
              >
                <View style={[styles.channelIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Icon name="mail" size={moderateScale(22)} color="#6C5CE7" />
                </View>
                <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                  <Text style={styles.channelTitle}>Official Email</Text>
                  <Text style={styles.channelSub}>Billing, gym inquiries & technical feedback</Text>
                  <Text style={styles.channelHighlight}>support@fitcore.app</Text>
                </View>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CBD5E1" />
              </TouchableOpacity>

              {/* Phone Desk Card */}
              <TouchableOpacity
                style={styles.channelCard}
                onPress={handleCallSupport}
                activeOpacity={0.85}
              >
                <View style={[styles.channelIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="call" size={moderateScale(22)} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                  <Text style={styles.channelTitle}>Phone Helpline</Text>
                  <Text style={styles.channelSub}>Direct helpline for urgent gym access issues</Text>
                  <Text style={styles.channelHighlight}>Mon – Sat, 7 AM – 9 PM</Text>
                </View>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CBD5E1" />
              </TouchableOpacity>

              {/* Physical Gym Frontdesk */}
              {currentGym && (
                <View style={styles.gymLocationCard}>
                  <View style={styles.gymLocationTop}>
                    <Icon name="business" size={moderateScale(18)} color="#6C5CE7" />
                    <Text style={styles.gymLocationTitle}>{currentGym.name || 'Your Home Gym'}</Text>
                  </View>
                  <Text style={styles.gymLocationAddress}>
                    {currentGym.address || 'Visit front desk for direct membership extensions and personal training assistance.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── 3. REPORT ISSUE TAB ── */}
          {activeTab === 'report' && (
            <View>
              {ticketSubmitted ? (
                <View style={styles.successTicketCard}>
                  <View style={styles.successTicketIconBox}>
                    <Icon name="checkmark-done-circle" size={moderateScale(48)} color="#10B981" />
                  </View>
                  <Text style={styles.successTicketTitle}>Feedback Submitted</Text>
                  <Text style={styles.successTicketSub}>
                    Thank you! Your ticket ID #FIT-{(Math.random() * 90000 + 10000).toFixed(0)} has been logged. Our technical team will investigate and update you within 24 hours.
                  </Text>
                  <TouchableOpacity
                    style={styles.newTicketBtn}
                    onPress={() => {
                      setTicketSubmitted(false);
                      setIssueDescription('');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.newTicketBtnText}>SUBMIT ANOTHER REPORT</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.reportCard}>
                  <Text style={styles.reportCardTitle}>Report a Problem</Text>
                  <Text style={styles.reportCardSub}>
                    Encountered a bug, check-in malfunction, or payment inconsistency? Let us know so we can fix it immediately.
                  </Text>

                  {/* Category Selection */}
                  <Text style={styles.inputLabel}>ISSUE CATEGORY</Text>
                  <View style={styles.categoryGrid}>
                    {[
                      'Membership & Billing',
                      'QR Check-In',
                      'Workout/Diet Chart',
                      'App Bug / Crash',
                      'Other',
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPill,
                          issueCategory === cat && styles.categoryPillActive,
                        ]}
                        onPress={() => setIssueCategory(cat)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            issueCategory === cat && styles.categoryPillTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Description Input */}
                  <Text style={styles.inputLabel}>EXPLAIN THE ISSUE</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe what happened, what you expected, and any error message..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                    textAlignVertical="top"
                  />

                  {/* Member & Device Meta Tag */}
                  <View style={styles.deviceMetaBox}>
                    <Icon name="information-circle-outline" size={moderateScale(16)} color="#64748B" />
                    <Text style={styles.deviceMetaText}>
                      App: v2.4.0 (Build 2026) • User: {currentUser?.phone || currentMember?.phone || 'Guest'}
                    </Text>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitReportBtn, submittingIssue && { opacity: 0.7 }]}
                    onPress={handleSubmitTicket}
                    disabled={submittingIssue}
                    activeOpacity={0.85}
                  >
                    {submittingIssue ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitReportBtnText}>SUBMIT ISSUE REPORT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(5),
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(10),
    gap: moderateScale(6),
  },
  segmentBtnActive: {
    backgroundColor: '#EEF2FF',
  },
  segmentText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#6C5CE7',
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: wp(5),
  },

  // FAQ
  faqBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  faqBannerIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqBannerTitle: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#0F172A',
  },
  faqBannerSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 2,
    lineHeight: fontScale(15),
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  faqCardExpanded: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqCategoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
    marginBottom: moderateScale(4),
  },
  faqCategoryPillText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#6C5CE7',
    letterSpacing: 0.4,
  },
  faqQuestion: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: fontScale(18),
  },
  faqAnswerContainer: {
    marginTop: moderateScale(10),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswer: {
    fontSize: fontScale(11.5),
    color: '#475569',
    lineHeight: fontScale(17),
  },

  // Contact Tab
  contactHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  contactHeroTitle: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  contactHeroSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 4,
    lineHeight: fontScale(16),
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  channelIconBox: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  channelSub: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  channelHighlight: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#6C5CE7',
    marginTop: 3,
  },
  gymLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  gymLocationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  gymLocationTitle: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  gymLocationAddress: {
    fontSize: fontScale(11),
    color: '#64748B',
    lineHeight: fontScale(16),
  },

  // Report Issue
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEAFD',
  },
  reportCardTitle: {
    fontSize: fontScale(15),
    fontWeight: '900',
    color: '#0F172A',
  },
  reportCardSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 3,
    marginBottom: hp(1.5),
    lineHeight: fontScale(16),
  },
  inputLabel: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: moderateScale(6),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: hp(1.5),
  },
  categoryPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6C5CE7',
  },
  categoryPillText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#6C5CE7',
    fontWeight: '800',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: fontScale(12),
    color: '#0F172A',
    minHeight: hp(14),
    marginBottom: hp(1.5),
  },
  deviceMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
    marginBottom: hp(2),
  },
  deviceMetaText: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
  },
  submitReportBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
  },
  submitReportBtnText: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  successTicketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(22),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  successTicketIconBox: {
    marginBottom: moderateScale(12),
  },
  successTicketTitle: {
    fontSize: fontScale(17),
    fontWeight: '900',
    color: '#065F46',
  },
  successTicketSub: {
    fontSize: fontScale(11.5),
    color: '#047857',
    textAlign: 'center',
    lineHeight: fontScale(17),
    marginTop: moderateScale(6),
    marginBottom: hp(2),
  },
  newTicketBtn: {
    backgroundColor: '#10B981',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
  },
  newTicketBtnText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
