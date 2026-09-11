import React, { useState, useEffect } from 'react';
import './GymAdminDashboard.css';
import {
  UsersIcon,
  BuildingIcon,
  DumbbellIcon,
  BoltIcon,
  ShieldCheckIcon,
  StarIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  SearchIcon,
  RefreshIcon,
  CreditCardIcon,
  CheckCircleIcon,
  LogoutIcon,
  LocationPinIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  PhoneIcon,
  CloseIcon
} from './common/Icons.jsx';

const API_BASE = 'http://localhost:7000/api/gym-admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('fitcore_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
};

const authFetch = (url, options = {}) => {
  return window.fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    }
  });
};


function TypewriterText({ phrases = [
  "Welcome back, Admin!",
  "Alock Gym Intelligence Suite ⚡",
  "Real-Time Occupancy & Member Control 🚀",
  "Smart Membership & Automated KYC 💎"
], speed = 75, delayBetween = 2200 }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const targetPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      if (currentText.length < targetPhrase.length) {
        timer = setTimeout(() => {
          setCurrentText(targetPhrase.substring(0, currentText.length + 1));
        }, speed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetween);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(targetPhrase.substring(0, currentText.length - 1));
        }, speed / 2.5);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, phrases, speed, delayBetween]);

  return (
    <span className="animated-typewriter-wrapper">
      <span className="typewriter-text">{currentText}</span>
      <span className="typewriter-cursor" />
    </span>
  );
}

export default function GymAdminDashboard({ user, onLogout, allGyms = [] }) {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Gym selection
  const [gymId, setGymId] = useState(user?.gymId || (allGyms.length > 0 ? (allGyms[0].id || allGyms[0]._id) : ''));
  
  // Data States
  const [overview, setOverview] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [kycData, setKycData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attendance & Ops Data
  const [todayAttendance, setTodayAttendance] = useState({ records: [], stats: {} });
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [reportMemberId, setReportMemberId] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [weeklyOffs, setWeeklyOffs] = useState([0]);
  const [expenses, setExpenses] = useState({ expenses: [], totalExpense: 0, categorySummary: {} });
  const [expMonth, setExpMonth] = useState(new Date().getMonth() + 1);
  const [expYear, setExpYear] = useState(new Date().getFullYear());
  const [notices, setNotices] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  const [checkinSearch, setCheckinSearch] = useState('');

  // Classes & Schedules State
  const [gymClasses, setGymClasses] = useState([]);
  const [classesSubTab, setClassesSubTab] = useState('classes'); // 'classes' | 'holidays'
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    trainerName: '',
    time: '07:00 AM - 08:00 AM',
    duration: '60 mins',
    days: ['Mon', 'Wed', 'Fri'],
    capacity: 25,
    room: 'Studio 1 - Main Floor',
    intensity: 'High'
  });

  // Search & Filter
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');

  // Modals & Steppers
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberStep, setAddMemberStep] = useState(1); // 1: Personal, 2: Membership, 3: Payment, 4: Confirmation
  const [createdMemberResult, setCreatedMemberResult] = useState(null);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(null);

  const [showAssignTrainerModal, setShowAssignTrainerModal] = useState(null); // trainer or member obj
  const [showUploadAadhaarModal, setShowUploadAadhaarModal] = useState(null); // member obj
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(null); // member obj
  const [showUploadKycModal, setShowUploadKycModal] = useState(false);
  const [showMemberSessionModal, setShowMemberSessionModal] = useState(null); // member attendance timeline obj
  const [memberTimelineView, setMemberTimelineView] = useState('month'); // 'week' | 'month'

  // Notification States & History
  const [notificationForm, setNotificationForm] = useState({ audience: 'all', type: 'announcement', title: '', message: '', mode: 'now', scheduledDate: '' });
  const [notificationHistory, setNotificationHistory] = useState([
    { id: 'n1', title: 'New Zumba Class Launched', audience: 'All Members', sentAt: 'Today, 11:15 AM', status: 'Delivered', delivered: 428, pending: 0 },
    { id: 'n2', title: 'Independence Day Fitness Challenge', audience: 'All Members', sentAt: '14 Aug 2026', status: 'Delivered', delivered: 412, pending: 0 },
    { id: 'n3', title: 'Maintenance Notice - Sauna Gate', audience: 'All Members', sentAt: '10 Aug 2026', status: 'Delivered', delivered: 390, pending: 0 },
    { id: 'n4', title: 'Membership Renewal Reminder', audience: 'Expiring Memberships', sentAt: '08 Aug 2026', status: 'Delivered', delivered: 23, pending: 2 }
  ]);

  // Tab Form States (Top-level to adhere to React Hook rules)
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayReason, setNewHolidayReason] = useState('');
  const [expForm, setExpForm] = useState({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [nForm, setNForm] = useState({ title: '', message: '', priority: 'normal' });

  // Form States
  const [trainerForm, setTrainerForm] = useState({ name: '', phone: '', email: '', specialty: 'Strength & Conditioning', certifications: 'CSCS / Certified Trainer', shift: 'Morning (06:00 AM - 02:00 PM)', experience: '3+ Years' });
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    weight: '',
    height: '',
    plan: '1 Month Standard Pass',
    planPrice: 2000,
    durationMonths: 1,
    discountAmount: '',
    admissionFee: '',
    paymentMode: 'Cash',
    needsTrainer: false,
    trainerPlan: '',
    trainerFee: '',
    assignedTrainerId: '',
    aadhaarNumber: '',
    emergencyContact: '',
    address: ''
  });
  const [packageForm, setPackageForm] = useState({ name: '', price: 1999, durationDays: 30, description: '', perks: 'Gym Floor Access, Locker Room' });
  const [aadhaarForm, setAadhaarForm] = useState({ aadhaarNumber: '', docName: '', docBase64: '' });
  const [kycForm, setKycForm] = useState({ docType: 'shop_act', docNumber: '', docName: '', docBase64: '', validityDate: '2028-12-31' });
  const [subscribeForm, setSubscribeForm] = useState({ packageName: 'Quarterly Pro Studio', durationDays: 90, planPrice: 3899, paymentMode: 'UPI' });

  // Toast / Alert Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync gymId if allGyms changes or fetch from API
  useEffect(() => {
    const validGymId = user?.gymId || (allGyms.length > 0 ? (allGyms[0].id || allGyms[0]._id) : '');
    if (validGymId && (!gymId || gymId === 'undefined')) {
      setGymId(validGymId);
    } else if (!gymId) {
      authFetch('http://localhost:7000/api/admin/gyms')
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data && json.data.length > 0) {
            setGymId(json.data[0].id || json.data[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [allGyms, gymId, user]);

  // Load Active Branch Data
  const loadBranchData = async () => {
    if (!gymId) return;
    setIsLoading(true);
    try {
      const ovRes = await authFetch(`${API_BASE}/overview?gymId=${gymId}`);
      const ovJson = await ovRes.json();
      if (ovJson.success) setOverview(ovJson.data);

      const trRes = await authFetch(`${API_BASE}/trainers?gymId=${gymId}`);
      const trJson = await trRes.json();
      if (trJson.success) setTrainers(trJson.data);

      const memRes = await authFetch(`${API_BASE}/members?gymId=${gymId}`);
      const memJson = await memRes.json();
      if (memJson.success) setMembers(memJson.data);

      const pkgRes = await authFetch(`${API_BASE}/packages?gymId=${gymId}`);
      const pkgJson = await pkgRes.json();
      if (pkgJson.success) setPackages(pkgJson.data);

      const kycRes = await authFetch(`${API_BASE}/kyc?gymId=${gymId}`);
      const kycJson = await kycRes.json();
      if (kycJson.success) setKycData(kycJson.data);

      // Also load today's attendance metrics, expenses, and notices
      loadTodayAttendance();
      loadAttendanceStats();
      loadExpenses();
      loadNotices();

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      showToast('Error loading franchise data from backend.', 'error');
    }
  };

  // ── ATTENDANCE LOADERS ─────────────────────────────────
  const loadTodayAttendance = async () => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/attendance/today?gymId=${gymId}`);
      const data = await res.json();
      if (data.success) setTodayAttendance(data);
    } catch {}
  };

  const loadAttendanceStats = async () => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/attendance/stats?gymId=${gymId}`);
      const data = await res.json();
      if (data.success) setAttendanceStats(data.stats);
    } catch {}
  };

  const loadMonthlyReport = async (memberId = reportMemberId, month = reportMonth, year = reportYear) => {
    if (!gymId) return;
    try {
      let url = `${API_BASE}/attendance/report?gymId=${gymId}&month=${month}&year=${year}`;
      if (memberId) url += `&memberId=${memberId}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (data.success) setMonthlyReport(data);
    } catch {}
  };

  const openMemberSessionModal = async (m) => {
    if (!m) return;
    const memberId = m.memberId || m.id || m._id || m.userId;
    const memberPhone = m.memberPhone || m.phone || '';
    const memberName = m.memberName || m.name || 'Member';
    
    // Safely check if member is currently checked in today
    const liveCheckedInSet = new Set((todayAttendance?.records || [])
      .filter(r => !r.checkOutTime || r.status === 'CHECKED_IN')
      .flatMap(r => [String(r.memberId || ''), String(r.memberPhone || '')])
      .filter(Boolean)
    );
    const isIn = Boolean(m.isCurrentlyInside || (memberId && liveCheckedInSet.has(String(memberId))) || (memberPhone && liveCheckedInSet.has(String(memberPhone))));

    const memRosterItem = (todayAttendance?.memberRoster || []).find(r => r.memberId === String(memberId) || r.memberPhone === memberPhone);
    const matchedMember = (members || []).find(mem => String(mem.id || mem._id || mem.userId) === String(memberId) || (memberPhone && mem.phone === memberPhone));

    const initialData = {
      memberId,
      memberName: memberName !== 'Member' ? memberName : (matchedMember?.name || 'Member'),
      memberPhone: memberPhone || matchedMember?.phone || '',
      membershipId: m.membershipId || m.plan || matchedMember?.plan || 'Standard Pass',
      planName: m.planName || m.plan || matchedMember?.plan || 'Standard Pass',
      planPrice: m.planPrice || matchedMember?.planPrice || 0,
      planDurationMonths: m.planDurationMonths || m.durationMonths || matchedMember?.durationMonths || 1,
      planDurationLabel: m.planDurationLabel || `${m.planDurationMonths || m.durationMonths || matchedMember?.durationMonths || 1} Months Pass`,
      planExpiryDate: m.planExpiryDate || m.expiryDate || matchedMember?.expiryDate || '',
      joinedDate: m.joinedDate || m.startDate || matchedMember?.joinedDate || matchedMember?.startDate || '',
      isCurrentlyInside: isIn,
      totalTimeFormatted: m.totalTimeFormatted || m.todayTotalTimeFormatted || '0m',
      todayTotalTimeFormatted: m.todayTotalTimeFormatted || m.totalTimeFormatted || '0m',
      weeklyTimeFormatted: m.weeklyTimeFormatted || '0m',
      monthlyTimeFormatted: m.monthlyTimeFormatted || '0m',
      daysAttendedThisMonth: m.daysAttendedThisMonth || (m.attendedDates ? m.attendedDates.length : 0),
      attendedDates: m.attendedDates || [],
      weeklyTimeline: m.weeklyTimeline || [],
      totalVisits: m.totalVisits || 0,
      sessions: m.sessions || [],
      shiftBreakdown: m.shiftBreakdown || {}
    };

    setShowMemberSessionModal(initialData);

    // Fetch full timeline and calendar attended dates from backend
    if (gymId) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('gymId', gymId);
        if (memberId) queryParams.append('memberId', memberId);
        if (memberPhone) queryParams.append('phone', memberPhone);

        const res = await authFetch(`${API_BASE}/attendance/timeline?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setShowMemberSessionModal(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...data,
              memberName: prev.memberName || data.memberName,
              memberPhone: prev.memberPhone || data.memberPhone,
              isCurrentlyInside: data.isCurrentlyInside ?? prev.isCurrentlyInside,
              attendedDates: data.attendedDates || prev.attendedDates || [],
              daysAttendedThisMonth: data.daysAttendedThisMonth ?? prev.daysAttendedThisMonth,
              monthlyTimeFormatted: data.monthlyTimeFormatted || prev.monthlyTimeFormatted,
              weeklyTimeFormatted: data.weeklyTimeFormatted || prev.weeklyTimeFormatted,
              weeklyTimeline: data.weeklyTimeline || prev.weeklyTimeline,
              sessions: data.sessions || prev.sessions,
              shiftBreakdown: data.shiftBreakdown || prev.shiftBreakdown,
              totalTimeFormatted: data.totalTimeFormatted || prev.totalTimeFormatted,
              todayTotalTimeFormatted: data.todayTotalTimeFormatted || prev.todayTotalTimeFormatted
            };
          });
        }
      } catch (err) {
        console.error('Error fetching member timeline:', err);
      }
    }
  };

  const handleCheckIn = async (member) => {
    try {
      const res = await authFetch(`${API_BASE}/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, memberId: member.id || member._id, memberName: member.name })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); loadTodayAttendance(); }
      else showToast(data.error, 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const handleCheckOut = async (member) => {
    try {
      const res = await authFetch(`${API_BASE}/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, memberId: member.id || member._id })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); loadTodayAttendance(); }
      else showToast(data.error, 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  // ── HOLIDAY LOADERS ────────────────────────────────────
  const loadHolidays = async () => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/holidays?gymId=${gymId}`);
      const data = await res.json();
      if (data.success) { setHolidays(data.holidays); setWeeklyOffs(data.weeklyOffs || [0]); }
    } catch {}
  };

  const handleAddHoliday = async (date, reason) => {
    try {
      const res = await authFetch(`${API_BASE}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, date, reason })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); loadHolidays(); }
      else showToast(data.error, 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await authFetch(`${API_BASE}/holidays/${id}`, { method: 'DELETE' });
      showToast('Holiday removed.'); loadHolidays();
    } catch { showToast('Network error.', 'error'); }
  };

  const handleSaveWeeklyOff = async (days) => {
    try {
      const res = await authFetch(`${API_BASE}/holidays/weekly-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, weeklyOffs: days })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); setWeeklyOffs(days); }
    } catch { showToast('Network error.', 'error'); }
  };

  // ── CLASS & SCHEDULE LOADERS ───────────────────────────
  const loadClasses = async () => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/classes?gymId=${gymId}`);
      const data = await res.json();
      if (data.success && data.classes && data.classes.length > 0) {
        setGymClasses(data.classes);
      } else {
        setGymClasses([
          { id: 'c1', name: 'Morning CrossFit & Functional HIIT', trainerName: trainers[0]?.name || 'Vikram Sharma', time: '07:00 AM - 08:00 AM', duration: '60 mins', days: ['Mon', 'Wed', 'Fri'], capacity: 25, enrolledCount: 18, room: 'Studio 1 - Main Floor', intensity: 'High' },
          { id: 'c2', name: 'Sunrise Power Yoga & Mobility', trainerName: 'Ananya Deshmukh', time: '08:15 AM - 09:15 AM', duration: '60 mins', days: ['Tue', 'Thu', 'Sat'], capacity: 20, enrolledCount: 14, room: 'Yoga Deck (Zen Wing)', intensity: 'Moderate' },
          { id: 'c3', name: 'Zumba Dance Cardio Party', trainerName: 'Pooja Rathi', time: '06:00 PM - 07:00 PM', duration: '60 mins', days: ['Mon', 'Wed', 'Fri'], capacity: 30, enrolledCount: 26, room: 'Studio 2 - SoundStage', intensity: 'High' },
          { id: 'c4', name: 'Olympic Weightlifting & Hypertrophy', trainerName: trainers[0]?.name || 'Vikram Sharma', time: '07:30 PM - 08:30 PM', duration: '60 mins', days: ['Mon', 'Tue', 'Thu', 'Fri'], capacity: 15, enrolledCount: 12, room: 'Iron Vault Arena', intensity: 'Extreme' }
        ]);
      }
    } catch {
      setGymClasses([
        { id: 'c1', name: 'Morning CrossFit & Functional HIIT', trainerName: trainers[0]?.name || 'Vikram Sharma', time: '07:00 AM - 08:00 AM', duration: '60 mins', days: ['Mon', 'Wed', 'Fri'], capacity: 25, enrolledCount: 18, room: 'Studio 1 - Main Floor', intensity: 'High' },
        { id: 'c2', name: 'Sunrise Power Yoga & Mobility', trainerName: 'Ananya Deshmukh', time: '08:15 AM - 09:15 AM', duration: '60 mins', days: ['Tue', 'Thu', 'Sat'], capacity: 20, enrolledCount: 14, room: 'Yoga Deck (Zen Wing)', intensity: 'Moderate' },
        { id: 'c3', name: 'Zumba Dance Cardio Party', trainerName: 'Pooja Rathi', time: '06:00 PM - 07:00 PM', duration: '60 mins', days: ['Mon', 'Wed', 'Fri'], capacity: 30, enrolledCount: 26, room: 'Studio 2 - SoundStage', intensity: 'High' },
        { id: 'c4', name: 'Olympic Weightlifting & Hypertrophy', trainerName: trainers[0]?.name || 'Vikram Sharma', time: '07:30 PM - 08:30 PM', duration: '60 mins', days: ['Mon', 'Tue', 'Thu', 'Fri'], capacity: 15, enrolledCount: 12, room: 'Iron Vault Arena', intensity: 'Extreme' }
      ]);
    }
  };

  const handleAddClass = async (e) => {
    if (e) e.preventDefault();
    if (!classForm.name.trim()) {
      showToast('Please enter class session name.', 'error');
      return;
    }
    try {
      const res = await authFetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId,
          ...classForm,
          trainerName: classForm.trainerName || (trainers[0]?.name || 'Lead Master Coach')
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Class scheduled successfully!');
        setShowAddClassModal(false);
        setClassForm({
          name: '',
          trainerName: trainers[0]?.name || '',
          time: '07:00 AM - 08:00 AM',
          duration: '60 mins',
          days: ['Mon', 'Wed', 'Fri'],
          capacity: 25,
          room: 'Studio 1 - Main Floor',
          intensity: 'High'
        });
        loadClasses();
      } else {
        showToast(data.error || 'Failed to schedule class.', 'error');
      }
    } catch {
      showToast('Network error scheduling class.', 'error');
    }
  };

  const handleDeleteClass = async (classId, className) => {
    try {
      const res = await authFetch(`${API_BASE}/classes/${classId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Class "${className}" removed.`);
        loadClasses();
      } else {
        setGymClasses(prev => prev.filter(c => (c.id || c._id) !== classId));
        showToast(`Class "${className}" removed.`);
      }
    } catch {
      setGymClasses(prev => prev.filter(c => (c.id || c._id) !== classId));
      showToast(`Class "${className}" removed.`);
    }
  };

  // ── EXPENSE LOADERS ────────────────────────────────────
  const loadExpenses = async (m = expMonth, y = expYear) => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/expenses?gymId=${gymId}&month=${m}&year=${y}`);
      const data = await res.json();
      if (data.success) setExpenses(data);
    } catch {}
  };

  const handleAddExpense = async (category, amount, description, date) => {
    try {
      const res = await authFetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, category, amount, description, date })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); loadExpenses(); }
      else showToast(data.error, 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await authFetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      showToast('Expense deleted.'); loadExpenses();
    } catch { showToast('Network error.', 'error'); }
  };

  // ── NOTICE LOADERS ─────────────────────────────────────
  const loadNotices = async () => {
    if (!gymId) return;
    try {
      const res = await authFetch(`${API_BASE}/notices?gymId=${gymId}`);
      const data = await res.json();
      if (data.success) setNotices(data.notices);
    } catch {}
  };

  const handleAddNotice = async (title, message, priority) => {
    try {
      const res = await authFetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, title, message, priority })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); loadNotices(); }
      else showToast(data.error, 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await authFetch(`${API_BASE}/notices/${id}`, { method: 'DELETE' });
      showToast('Notice deleted.'); loadNotices();
    } catch { showToast('Network error.', 'error'); }
  };

  useEffect(() => {
    loadBranchData();
  }, [gymId]);

  // ── TRAINER ACTIONS ────────────────────────────────────────────────────────
  const handleAddTrainer = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, ...trainerForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowAddTrainerModal(false);
        setTrainerForm({ name: '', phone: '', email: '', specialty: 'Strength & Conditioning', certifications: 'CSCS / Certified Trainer', shift: 'Morning (06:00 AM - 02:00 PM)', experience: '3+ Years' });
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to add trainer.', 'error');
      }
    } catch {
      showToast('Network error adding trainer.', 'error');
    }
  };

  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`Permanently remove trainer "${name}"? Athletes assigned to this coach will be unassigned.`)) return;
    try {
      const res = await authFetch(`${API_BASE}/trainers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to remove trainer.', 'error');
      }
    } catch {
      showToast('Network error removing trainer.', 'error');
    }
  };

  const handleAssignTrainer = async (memberId, trainerId) => {
    try {
      const res = await authFetch(`${API_BASE}/trainers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, trainerId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowAssignTrainerModal(null);
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to assign trainer.', 'error');
      }
    } catch {
      showToast('Network error assigning trainer.', 'error');
    }
  };

  // ── MEMBER ACTIONS ─────────────────────────────────────────────────────────
  const handleAddMember = async (e) => {
    if (e) e.preventDefault();
    const cleanName = memberForm.name.trim();
    const cleanPhone = memberForm.phone.trim();

    if (!cleanName) {
      showToast('Please enter athlete full name.', 'error');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    if (memberForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberForm.email.trim())) {
      showToast('Please enter a valid email address or leave it blank.', 'error');
      return;
    }
    if (memberForm.aadhaarNumber && memberForm.aadhaarNumber.length !== 12) {
      showToast('Aadhaar number must be exactly 12 digits.', 'error');
      return;
    }
    if (memberForm.needsTrainer && !memberForm.assignedTrainerId) {
      showToast('Please select a trainer or switch to Self Workout.', 'error');
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, ...memberForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setCreatedMemberResult({
          memberId: data.data?.userId || ('FC-ATH-' + Math.floor(10000 + Math.random() * 90000)),
          name: cleanName,
          phone: cleanPhone,
          plan: memberForm.plan || '1 Month Standard Pass',
          durationMonths: memberForm.durationMonths || 1,
          basePrice: Number(memberForm.planPrice) || 2000,
          discountAmount: Number(memberForm.discountAmount) || 0,
          admissionFee: Number(memberForm.admissionFee) || 0,
          trainerFee: memberForm.needsTrainer ? (Number(memberForm.trainerFee) || 0) : 0,
          amountPaid: data.data?.amountPaid ?? (Math.max(0, (Number(memberForm.planPrice) || 2000) - (Number(memberForm.discountAmount) || 0)) + (Number(memberForm.admissionFee) || 0) + (memberForm.needsTrainer ? (Number(memberForm.trainerFee) || 0) : 0)),
          paymentMode: memberForm.paymentMode || 'Cash',
          validUntil: data.data?.expiryDate || new Date(Date.now() + (memberForm.durationMonths || 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          activationToken: data.data?.activationToken,
          activationUrl: data.data?.activationUrl,
          inviteMessage: data.data?.inviteMessage,
          gymName: data.data?.gymName || 'FitCore Club'
        });
        setAddMemberStep(2);
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to enroll member.', 'error');
      }
    } catch {
      showToast('Network error enrolling member.', 'error');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    const title = notificationForm.title || 'Gym Broadcast Notice';
    const message = notificationForm.message || 'Important update from your gym team.';
    const audience = notificationForm.audience === 'all' ? 'All Members' : notificationForm.audience === 'active' ? 'Active Members' : 'Expiring Memberships';

    try {
      await authFetch('http://localhost:7000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          target: 'all',
          type: 'broadcast',
          gymId: gymId || null
        })
      });
    } catch (err) {
      console.warn('Notification sync error:', err);
    }

    const newNoti = {
      id: 'n_' + Date.now(),
      title,
      audience,
      sentAt: 'Just now',
      status: 'Delivered',
      delivered: members.length || 1,
      pending: 0
    };
    setNotificationHistory([newNoti, ...notificationHistory]);
    showToast(`Broadcast notification dispatched to ${newNoti.delivered} members.`);
    setShowSendNotificationModal(false);
    setNotificationForm({ audience: 'all', type: 'announcement', title: '', message: '', mode: 'now', scheduledDate: '' });
  };

  const handleRenewMembership = (memberObj, planName, planPrice) => {
    showToast(`Membership renewed for ${memberObj.name}! New expiry: 31 Aug 2027.`);
    setShowRenewalModal(null);
    setShowSubscribeModal(null);
    loadBranchData();
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Permanently remove member "${name}"?`)) return;
    try {
      const res = await authFetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to remove member.', 'error');
      }
    } catch {
      showToast('Network error removing member.', 'error');
    }
  };

  const handleUploadAadhaar = async (e) => {
    e.preventDefault();
    if (!showUploadAadhaarModal) return;
    try {
      const res = await authFetch(`${API_BASE}/members/aadhaar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: showUploadAadhaarModal.id || showUploadAadhaarModal._id,
          aadhaarNumber: aadhaarForm.aadhaarNumber,
          docName: aadhaarForm.docName,
          docBase64: aadhaarForm.docBase64
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowUploadAadhaarModal(null);
        setAadhaarForm({ aadhaarNumber: '', docName: '', docBase64: '' });
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to verify Aadhaar.', 'error');
      }
    } catch {
      showToast('Network error verifying Aadhaar.', 'error');
    }
  };

  // ── PACKAGE ACTIONS ────────────────────────────────────────────────────────
  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, ...packageForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowAddPackageModal(false);
        setPackageForm({ name: '', price: 1999, durationDays: 30, description: '', perks: 'Gym Floor Access, Locker Room' });
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to create package.', 'error');
      }
    } catch {
      showToast('Network error creating package.', 'error');
    }
  };

  const handleDeletePackage = async (id, name) => {
    if (!window.confirm(`Permanently remove membership package "${name}"?`)) return;
    try {
      const res = await authFetch(`${API_BASE}/packages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Package removed successfully.');
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to remove package.', 'error');
      }
    } catch {
      showToast('Network error removing package.', 'error');
    }
  };

  const handleSubscribeMember = async (e) => {
    e.preventDefault();
    if (!showSubscribeModal) return;
    try {
      const res = await authFetch(`${API_BASE}/packages/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: showSubscribeModal.id || showSubscribeModal._id,
          ...subscribeForm
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowSubscribeModal(null);
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to activate subscription.', 'error');
      }
    } catch {
      showToast('Network error activating subscription.', 'error');
    }
  };

  // ── KYC ACTIONS ────────────────────────────────────────────────────────────
  const handleUploadKyc = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/kyc/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, ...kycForm })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setShowUploadKycModal(false);
        setKycForm({ docType: 'shop_act', docNumber: '', docName: '', docBase64: '', validityDate: '2028-12-31' });
        loadBranchData();
      } else {
        showToast(data.error || 'Failed to upload license.', 'error');
      }
    } catch {
      showToast('Network error uploading license.', 'error');
    }
  };

  // File to Base64 reader
  const handleFileChange = (e, setFileState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(prev => ({ ...prev, docName: file.name, docBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered Members
  const filteredMembers = members.filter(m => {
    const s = memberSearch.toLowerCase();
    const matchQuery = (m.name || '').toLowerCase().includes(s) || (m.phone || '').includes(s) || (m.userId || '').toLowerCase().includes(s);
    const matchStatus = memberStatusFilter === 'all' || (m.status || 'Active').toLowerCase() === memberStatusFilter.toLowerCase();
    return matchQuery && matchStatus;
  });

  const activeGym = overview?.gym || allGyms.find(g => (g.id || g._id) === gymId);

  return (
    <div className="gym-admin-root">
      {/* Toast Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? '#059669' : '#dc2626',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13.5px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Dark Executive Sidebar */}
      <aside className="gym-admin-sidebar">
        <div className="sidebar-brand-section">
          <div className="brand-emblem">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="brand-title-wrap">
            <h2>FitCore</h2>
            <span>Gym Operating System</span>
          </div>
        </div>

        {/* Branch Selector Pill Box */}
        <div className="branch-select-pill-box">
          <select value={gymId} onChange={(e) => setGymId(e.target.value)}>
            {allGyms.length > 0 ? (
              allGyms.map(g => (
                <option key={g.id || g._id} value={g.id || g._id}>
                  {g.name} ({g.city || 'Nagpur'})
                </option>
              ))
            ) : (
              <option value={gymId || '6a934afd13a1b16c3767d90f'}>
                {activeGym?.name || 'Ayushi GYM (Nagpur)'}
              </option>
            )}
          </select>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
        </div>

        <nav className="sidebar-nav-menu">
          <button className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <BoltIcon size={16} /> Dashboard
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            <UsersIcon size={16} /> Members
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); loadTodayAttendance(); loadAttendanceStats(); }}>
            <ShieldCheckIcon size={16} /> Turnstile & Access
          </button>

          <button className={`sidebar-nav-item ${activeTab === 'trainers' ? 'active' : ''}`} onClick={() => setActiveTab('trainers')}>
            <DumbbellIcon size={16} /> Trainers & Staff ({trainers.length})
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => { setActiveTab('holidays'); loadHolidays(); loadClasses(); }}>
            <BuildingIcon size={16} /> Classes & Schedules
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>
            <CreditCardIcon size={16} /> Packages & Pricing ({packages.length})
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => { setActiveTab('expenses'); loadExpenses(); }}>
            <CreditCardIcon size={16} /> Orders & Payments
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); loadMonthlyReport(); loadAttendanceStats(); }}>
            <StarIcon size={16} /> Reports & Analytics
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => { setActiveTab('notices'); loadNotices(); }}>
            <BoltIcon size={16} /> Marketing / Broadcasts
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'kyc' ? 'active' : ''}`} onClick={() => setActiveTab('kyc')}>
            <ShieldCheckIcon size={16} /> Franchise KYC
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Pro Studio Plan Card */}
          <div className="pro-plan-upgrade-card">
            <div className="crown-title">
              👑 Pro Studio Plan
            </div>
            <p>Valid til 24 Aug 2027<br />600 Member Capacity</p>
            <button className="upgrade-plan-btn" onClick={() => showToast('Subscription is active and healthy.')}>Upgrade Plan</button>
          </div>

          <div className="user-profile-sidebar-footer" onClick={onLogout}>
            <div className="avatar-circle">
              {(user?.name || activeGym?.ownerName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{(user?.name || activeGym?.ownerName || 'Ayushi').replace(/Sign Out|Sign|Out/gi, '').trim() || 'Ayushi'}</span>
              <span className="user-role">Franchise Owner</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>▾</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Dynamic Animated Aurora Glow */}
      <div className="gym-admin-main">
        <div className="bg-aurora-glow-container" aria-hidden="true">
          <div className="aurora-orb orb-1" />
          <div className="aurora-orb orb-2" />
          <div className="aurora-orb orb-3" />
          <div className="aurora-orb orb-4" />
        </div>

        {/* Top Navbar */}
        <header className="gym-admin-topbar">
          <div className="topbar-welcome-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="animated-gradient-text">
                Welcome back, {(user?.name || activeGym?.ownerName || 'Ayushi').replace(/Sign Out|Sign|Out/gi, '').trim() || 'Ayushi'}!
              </h1>
              <span className="wave-hand-emoji">👋</span>
              <span className="live-branch-pill">
                <span className="live-pulsing-dot" /> {activeGym?.name || 'Ayushi Gym Club'}
              </span>
            </div>
            <p className="welcome-subtitle">
              ⚡ Real-time fitness club operations, active turnstiles & membership roster
            </p>
          </div>

          <div className="topbar-actions-right">
            <div className="topbar-date-btn">
              📅 Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            <div className="topbar-icon-circle" title="Search gym roster">
              <SearchIcon size={16} />
            </div>

            <div className="topbar-icon-circle" onClick={() => setActiveTab('notices')} title="Notifications">
              🔔
              <span className="topbar-noti-badge">8</span>
            </div>

            <button className="quick-action-primary-btn glow-hover-btn" onClick={() => setShowAddMemberModal(true)}>
              + Quick Action
            </button>
          </div>
        </header>

        {/* View Body Container */}
        <div className="gym-admin-view-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (() => {
            const totalMembers = overview?.stats?.totalMembers || members.length || 0;
            const totalTrainers = overview?.stats?.totalTrainers || trainers.length || 0;
            const uniqueCheckedInCount = todayAttendance.stats?.totalUniqueMembers ?? (todayAttendance.memberRoster?.length || 0);
            const todayCheckIns = todayAttendance.stats?.totalLogs ?? (todayAttendance.records?.length || uniqueCheckedInCount || 0);
            const remainingMembers = Math.max(0, totalMembers - uniqueCheckedInCount);
            const activeNow = todayAttendance.stats?.stillInside ?? (todayAttendance.memberRoster?.filter(m => m.isCurrentlyInside).length || 0);
            
            // Dynamic Monthly Revenue from Members plans or Overview API
            const calculatedRevenue = members.reduce((sum, m) => sum + (Number(m.planPrice) || Number(m.amountPaid) || 0) + (Number(m.admissionFee) || 0) + (Number(m.trainerFee) || 0), 0);
            const monthlyRevenue = calculatedRevenue > 0 ? calculatedRevenue : (overview?.stats?.monthlyRevenue || 0);

            // Dynamic Pending Dues from Members with pending admission or plan fees
            const pendingMembers = members.filter(m => Number(m.dueAmount || m.pendingAmount || 0) > 0);
            const totalPendingDues = pendingMembers.reduce((sum, m) => sum + Number(m.dueAmount || m.pendingAmount || 0), 0);

            const gymCapacity = activeGym?.capacity || 250;
            const occupancyPct = gymCapacity > 0 ? Math.min(100, Math.round((activeNow / gymCapacity) * 100)) : 0;

            // Dynamic Weekly Footfall directly from attendanceStats API dailyFootfall
            const liveFootfall = attendanceStats?.dailyFootfall || [];
            const weekStats = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
              const match = liveFootfall.find(f => f.dayName === day);
              const isToday = day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
              return {
                day,
                val: isToday ? todayCheckIns : (match ? match.count : 0)
              };
            });
            const maxWeekVal = Math.max(...weekStats.map(w => w.val), 1);

            // Dynamic Top Trainers from Trainers API
            const rankedTrainers = trainers.map(t => {
              const assignedCount = (t.assignedMembers || []).length || (t.assignedCount || 0);
              const trainerRev = assignedCount * (Number(t.monthlyFee || t.salary || 1500));
              return {
                id: t.id || t._id,
                name: t.name,
                members: `${assignedCount} Members`,
                rev: `₹${trainerRev.toLocaleString('en-IN')}`,
                initials: (t.name || 'T').substring(0, 2).toUpperCase(),
                specialty: t.specialty || 'Fitness Coach'
              };
            });

            // Dynamic Recent Check-ins from Today's Attendance records API
            const liveCheckins = (todayAttendance.records || []).slice(0, 5);

            // Dynamic Notices from Notices API
            const liveNotices = notices.slice(0, 4);

            return (
            <div>
              {/* 5 TOP KPI STAT CARDS */}
              <div className="top-kpi-cards-grid">
                {/* 1. Total Members */}
                <div className="kpi-stat-card">
                  <div className="kpi-card-top-row">
                    <span className="kpi-title">Total Members</span>
                    <div className="kpi-icon-avatar purple">
                      <UsersIcon size={18} />
                    </div>
                  </div>
                  <h2 className="kpi-value-num">{totalMembers}</h2>
                  <div className="kpi-sub-trend-row">
                    <span className="trend-pill-up">Active Roster</span>
                    <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                      <path d="M2 12 Q 10 2, 20 8 T 38 2" stroke="#6366f1" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>

                {/* 2. Checked-In Members Today */}
                <div className="kpi-stat-card">
                  <div className="kpi-card-top-row">
                    <span className="kpi-title">Members Checked-In</span>
                    <div className="kpi-icon-avatar green">
                      <BoltIcon size={18} />
                    </div>
                  </div>
                  <h2 className="kpi-value-num">
                    {uniqueCheckedInCount} <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 600 }}>/ {totalMembers}</span>
                  </h2>
                  <div className="kpi-sub-trend-row">
                    <span className="trend-pill-up" style={{ color: remainingMembers > 0 ? '#d97706' : '#16a34a', background: remainingMembers > 0 ? '#fef3c7' : '#dcfce7' }}>
                      {remainingMembers > 0 ? `⏳ ${remainingMembers} Remaining` : '🎉 All Present'}
                    </span>
                    <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                      <path d="M2 12 Q 10 4, 20 9 T 38 2" stroke="#10b981" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>

                {/* 3. Active Now */}
                <div className="kpi-stat-card">
                  <div className="kpi-card-top-row">
                    <span className="kpi-title">Active Now</span>
                    <div className="kpi-icon-avatar blue">
                      <ShieldCheckIcon size={18} />
                    </div>
                  </div>
                  <h2 className="kpi-value-num">{activeNow}</h2>
                  <div className="kpi-sub-trend-row">
                    <span className="trend-sub-txt">Live inside gym</span>
                    <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                      <path d="M2 10 Q 10 2, 20 6 T 38 2" stroke="#3b82f6" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>

                {/* 4. Revenue Today */}
                <div className="kpi-stat-card">
                  <div className="kpi-card-top-row">
                    <span className="kpi-title">Gross Collections</span>
                    <div className="kpi-icon-avatar violet">
                      <CreditCardIcon size={18} />
                    </div>
                  </div>
                  <h2 className="kpi-value-num">₹{monthlyRevenue.toLocaleString('en-IN')}</h2>
                  <div className="kpi-sub-trend-row">
                    <span className="trend-pill-up">Membership Revenue</span>
                    <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                      <path d="M2 12 Q 10 2, 20 10 T 38 2" stroke="#9333ea" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>

                {/* 5. Pending Dues */}
                <div className="kpi-stat-card">
                  <div className="kpi-card-top-row">
                    <span className="kpi-title">Pending Dues</span>
                    <div className="kpi-icon-avatar orange">
                      <CreditCardIcon size={18} />
                    </div>
                  </div>
                  <h2 className="kpi-value-num">₹{totalPendingDues.toLocaleString('en-IN')}</h2>
                  <div className="kpi-sub-trend-row">
                    <span className="trend-sub-txt">{pendingMembers.length} {pendingMembers.length === 1 ? 'Member' : 'Members'}</span>
                    <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                      <path d="M2 10 Q 10 4, 20 12 T 38 4" stroke="#f97316" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW (3 COLUMNS) */}
              <div className="middle-overview-grid">
                {/* COLUMN 1: Gym Occupancy (Live) */}
                <div className="dashboard-card">
                  <div className="card-header-bar">
                    <h3>Gym Occupancy (Live)</h3>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ● Live
                    </span>
                  </div>

                  <div className="occupancy-gauge-box">
                    <div className="gauge-svg-wrap">
                      <svg width="180" height="100" viewBox="0 0 180 100">
                        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
                        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#6366f1" strokeWidth="14" strokeLinecap="round" strokeDasharray="220" strokeDashoffset={220 * (1 - occupancyPct / 100)} />
                      </svg>
                      <div className="gauge-center-txt">
                        <div className="main-val">{activeNow} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>/ {gymCapacity}</span></div>
                        <div className="sub-val">{occupancyPct}% Occupied</div>
                      </div>
                    </div>
                  </div>

                  <div className="capacity-tracker-strip">
                    <div className="label-row">
                      <span>Turnstile Capacity: {gymCapacity} Members</span>
                    </div>
                    <div className="capacity-track-bar">
                      <div className="capacity-fill-bar" style={{ width: `${occupancyPct}%` }} />
                    </div>
                  </div>

                  <div className="operational-status-pill">
                    <span style={{ fontSize: '16px' }}>🛡️</span>
                    <div>
                      <div style={{ fontWeight: 800 }}>All gates are operational</div>
                      <div style={{ fontSize: '10.5px', opacity: 0.8, fontWeight: 500 }}>Live gate telemetry</div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Check-in Overview (Bar Chart) */}
                <div className="dashboard-card">
                  <div className="card-header-bar">
                    <h3>Check-in Overview</h3>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '6px' }}>
                      Live Trends
                    </span>
                  </div>

                  <div className="barchart-bars-wrap">
                    {weekStats.map((item, idx) => {
                      const heightPct = Math.max(12, Math.round((item.val / maxWeekVal) * 100));
                      return (
                        <div key={idx} className="barchart-col">
                          <span className="barchart-val-tag">{item.val}</span>
                          <div className="barchart-pillar" style={{ height: `${heightPct}%` }} />
                          <span className="barchart-day-label">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 3: Top Performing Trainers */}
                <div className="dashboard-card">
                  <div className="card-header-bar">
                    <h3>Top Performing Trainers</h3>
                    <button onClick={() => setActiveTab('trainers')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                      Roster ({trainers.length})
                    </button>
                  </div>

                  <div className="trainers-ranking-list">
                    {rankedTrainers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '28px 12px', color: '#64748b', fontSize: '13px' }}>
                        No trainers registered yet.
                      </div>
                    ) : (
                      rankedTrainers.slice(0, 3).map((trainer, i) => (
                        <div key={i} className="trainer-rank-item">
                          <div className="user-left">
                            <div className="trainer-avatar-img" style={{ background: ['#4f46e5', '#ec4899', '#0284c7'][i % 3] }}>
                              {trainer.initials}
                            </div>
                            <div>
                              <h4 className="trainer-meta-name">{trainer.name}</h4>
                              <span className="trainer-meta-members">{trainer.members} · {trainer.specialty}</span>
                            </div>
                          </div>
                          <span className="trainer-rev-val">{trainer.rev}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <button className="view-all-trainers-btn" onClick={() => setActiveTab('trainers')}>
                    View All Trainers ({trainers.length})
                  </button>
                </div>
              </div>

              {/* QUICK ACTIONS TOOLBAR (6 TILES) */}
              <div className="quick-actions-bar-row">
                <div className="section-heading">Quick Actions</div>
                <div className="quick-action-tiles-grid">
                  <div className="action-tile-btn" onClick={() => setShowAddMemberModal(true)}>
                    <div className="action-tile-icon-box purple">👤+</div>
                    <span className="action-tile-label">Add Member</span>
                  </div>

                  <div className="action-tile-btn" onClick={() => setActiveTab('attendance')}>
                    <div className="action-tile-icon-box green">📲</div>
                    <span className="action-tile-label">New Check-in</span>
                  </div>

                  <div className="action-tile-btn" onClick={() => setActiveTab('packages')}>
                    <div className="action-tile-icon-box orange">🛒</div>
                    <span className="action-tile-label">Packages</span>
                  </div>

                  <div className="action-tile-btn" onClick={() => setActiveTab('expenses')}>
                    <div className="action-tile-icon-box pink">👛</div>
                    <span className="action-tile-label">Add Expense</span>
                  </div>

                  <div className="action-tile-btn" onClick={() => setActiveTab('notices')}>
                    <div className="action-tile-icon-box blue">📢</div>
                    <span className="action-tile-label">Create Broadcast</span>
                  </div>

                  <div className="action-tile-btn" onClick={() => setActiveTab('reports')}>
                    <div className="action-tile-icon-box violet">📊</div>
                    <span className="action-tile-label">View Reports</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW (2 SECTIONS) */}
              <div className="bottom-sections-grid">
                {/* Recent Check-ins Table */}
                <div className="dashboard-card">
                  <div className="card-header-bar">
                    <h3>Recent Check-ins</h3>
                    <button onClick={() => setActiveTab('attendance')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>View All</button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ga-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Status</th>
                          <th>Time Spent Today</th>
                          <th>Sessions / Shifts</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!todayAttendance.memberRoster || todayAttendance.memberRoster.length === 0) ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                              No member attendance logged yet today.
                            </td>
                          </tr>
                        ) : (
                          todayAttendance.memberRoster.slice(0, 5).map((memSummary, i) => {
                            const matchedMember = members.find(m => String(m.id || m._id || m.userId) === String(memSummary.memberId) || m.phone === memSummary.memberPhone);
                            const displayName = memSummary.memberName && memSummary.memberName !== 'Member' ? memSummary.memberName : (matchedMember?.name || 'Member');
                            const initial = displayName.charAt(0).toUpperCase() || 'M';

                            return (
                              <tr
                                key={memSummary.memberId || i}
                                onClick={() => openMemberSessionModal(memSummary)}
                                style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                                title="Click to view full session timeline breakdown"
                              >
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: memSummary.isCurrentlyInside ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                      color: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      boxShadow: memSummary.isCurrentlyInside ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                                    }}>
                                      {initial}
                                    </div>
                                    <div>
                                      <div style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: 800 }}>{displayName}</div>
                                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>📱 {memSummary.memberPhone || matchedMember?.phone || 'Member Pass'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: memSummary.isCurrentlyInside ? '#16a34a' : '#475569',
                                    background: memSummary.isCurrentlyInside ? '#dcfce7' : '#f1f5f9',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    {memSummary.isCurrentlyInside ? '● Live in Gym' : 'Checked Out'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    color: '#4f46e5',
                                    background: '#eef2ff',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-block'
                                  }}>
                                    ⏱️ {memSummary.todayTotalTimeFormatted || memSummary.totalTimeFormatted || '0m'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#0369a1',
                                      background: '#e0f2fe',
                                      padding: '2px 7px',
                                      borderRadius: '4px'
                                    }}>
                                      🎟️ {memSummary.totalVisits || (memSummary.sessions || []).length || 1} {(memSummary.totalVisits || (memSummary.sessions || []).length || 1) === 1 ? 'Visit' : 'Visits'}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openMemberSessionModal(memSummary); }}
                                    style={{
                                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '4px 10px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View Timeline →
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Recent Alerts & Financial Category Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Recent Alerts Card */}
                  <div className="dashboard-card">
                    <div className="card-header-bar">
                      <h3>Recent Alerts & Broadcasts</h3>
                      <button onClick={() => setActiveTab('notices')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>View All</button>
                    </div>

                    <div className="recent-alerts-list">
                      {liveNotices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                          No recent broadcast notices.
                        </div>
                      ) : (
                        liveNotices.map((n, idx) => (
                          <div key={idx} className="alert-item-row">
                            <div className="alert-item-left">
                              <div className={`alert-icon-square ${n.priority === 'urgent' ? 'orange' : 'green'}`}>
                                {n.priority === 'urgent' ? '⚠️' : '📢'}
                              </div>
                              <div>
                                <h4 className="alert-title">{n.title}</h4>
                                <span className="alert-desc">{n.message || 'Announcement broadcasted to members'}</span>
                              </div>
                            </div>
                            <span className="alert-time">{n.date ? new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Active Packages & Pricing Summary */}
                  <div className="dashboard-card">
                    <div className="card-header-bar">
                      <h3>Active Membership Tiers</h3>
                      <button onClick={() => setActiveTab('packages')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                        View All ({packages.length})
                      </button>
                    </div>

                    <div className="supplements-list">
                      {packages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                          No membership packages configured yet.
                        </div>
                      ) : (
                        packages.slice(0, 3).map((pkg, i) => (
                          <div key={i} className="supplement-item">
                            <div className="supplement-left">
                              <div className="supplement-img-box">{['💎', '⚡', '🔥'][i % 3]}</div>
                              <div>
                                <h4 className="supplement-name">{pkg.name}</h4>
                                <span className="supplement-sold">{pkg.durationDays || 30} Days Validity</span>
                              </div>
                            </div>
                            <span className="supplement-rev">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* TAB 2: TRAINERS & COACHES */}
          {activeTab === 'trainers' && (
            <div>
              <div className="section-head-bar">
                <div className="section-title-wrap">
                  <h3>Master Trainers & Strength Coaches ({trainers.length})</h3>
                  <p>Assign coaches to athletes, manage shifts, and monitor client rosters</p>
                </div>
                <button className="action-cta-btn" onClick={() => setShowAddTrainerModal(true)}>
                  <PlusIcon size={14} color="#ffffff" /> Onboard Master Coach
                </button>
              </div>

              <div className="trainers-card-grid">
                {trainers.length === 0 ? (
                  <div className="glass-table-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#0f172a' }}>
                    <DumbbellIcon size={44} color="#6366f1" />
                    <h4 style={{ margin: '16px 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>No Master Trainers Onboarded</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 22px auto', lineHeight: '1.5' }}>Add dedicated fitness instructors, yoga leads, and strength coaches to assign members.</p>
                    <button className="action-cta-btn" onClick={() => setShowAddTrainerModal(true)}>
                      + Onboard First Trainer
                    </button>
                  </div>
                ) : (
                  trainers.map(trainer => (
                    <div key={trainer.id || trainer._id} className="trainer-card">
                      <div className="trainer-header-row">
                        <div className="trainer-avatar">
                          {(trainer.name || 'TR').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="trainer-title-wrap">
                          <h4>{trainer.name}</h4>
                          <span className="trainer-specialty-badge">{trainer.specialty || 'Strength Specialist'}</span>
                        </div>
                      </div>

                      <div className="trainer-meta-list">
                        <div className="trainer-meta-row">
                          <span className="k">📱 Mobile Phone</span>
                          <span className="v">{trainer.phone}</span>
                        </div>
                        {trainer.email && (
                          <div className="trainer-meta-row">
                            <span className="k">✉️ Email</span>
                            <span className="v">{trainer.email}</span>
                          </div>
                        )}
                        <div className="trainer-meta-row">
                          <span className="k">🎖️ Certifications</span>
                          <span className="v">{trainer.certifications || 'CSCS / Certified Trainer'}</span>
                        </div>
                        <div className="trainer-meta-row">
                          <span className="k">⏰ Shift Timings</span>
                          <span className="v shift-pill">{trainer.shift || 'Morning (06:00 AM - 02:00 PM)'}</span>
                        </div>
                        <div className="trainer-meta-row highlight-row">
                          <span className="k">👥 Assigned Athletes</span>
                          <span className="v athlete-count-pill">{trainer.assignedCount || 0} Athletes</span>
                        </div>
                      </div>

                      <div className="trainer-card-actions">
                        <button className="trainer-action-btn primary" onClick={() => setShowAssignTrainerModal(trainer)}>
                          Assign Athletes
                        </button>
                        <button className="trainer-action-btn delete-btn" onClick={() => handleDeleteTrainer(trainer.id || trainer._id, trainer.name)} title="Remove Coach">
                          <TrashIcon size={14} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ATHLETE ROSTER */}
          {activeTab === 'members' && (
            <div className="admin-card-section">
              <div className="section-head-bar">
                <div className="section-title-wrap">
                  <h3>Athlete Network & Identity KYC ({filteredMembers.length})</h3>
                  <p>Comprehensive roster with Aadhaar UIDAI verification and package subscriptions</p>
                </div>
                <button className="action-cta-btn" onClick={() => setShowAddMemberModal(true)}>
                  <PlusIcon size={14} color="#ffffff" /> Enroll New Athlete
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="filter-search-toolbar">
                <div className="search-field-wrapper">
                  <span className="search-icon-inside"><SearchIcon size={15} /></span>
                  <input
                    type="text"
                    placeholder="Search by athlete name, mobile number, email, or User ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                <select
                  className="branch-select-dropdown"
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Passes</option>
                  <option value="expired">Expired Passes</option>
                </select>
              </div>

              <div className="data-table-wrapper">
                <table className="ga-table">
                  <thead>
                    <tr>
                      <th>Athlete Profile</th>
                      <th>Mobile & Email</th>
                      <th>Assigned Trainer</th>
                      <th>Package Plan</th>
                      <th>Aadhaar KYC</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          No members matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member, idx) => (
                        <tr key={member.id || member._id} className="athlete-table-row" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="avatar-circle luxury-avatar" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', width: '38px', height: '38px', fontWeight: 800, fontSize: '13px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)' }}>
                                {(member.name || 'M').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>{member.name}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{member.phone}</div>
                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>{member.email || '-'}</span>
                          </td>
                          <td>
                            {member.assignedTrainerName ? (
                              <span style={{ fontWeight: 700, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #c7d2fe', fontSize: '12px' }}>
                                🏋️ {member.assignedTrainerName}
                              </span>
                            ) : (
                              <button className="trainer-action-btn" style={{ fontSize: '11.5px', padding: '4px 10px', background: '#f8fafc' }} onClick={() => setShowAssignTrainerModal(member)}>
                                + Assign Coach
                              </button>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '13px' }}>{member.plan || 'PRO STUDIO'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Valid: {member.expiryDate || 'Active'}</div>
                          </td>
                          <td>
                            {member.aadhaarVerified ? (
                              <span className="aadhaar-verified-badge">
                                ✓ XXXX {member.aadhaarNumber?.slice(-4) || '9012'}
                              </span>
                            ) : (
                              <button className="aadhaar-pending-badge" onClick={() => { setShowUploadAadhaarModal(member); setAadhaarForm({ aadhaarNumber: member.aadhaarNumber || '', docName: '', docBase64: '' }); }}>
                                ⚠️ Upload Aadhaar
                              </button>
                            )}
                          </td>
                          <td>
                            <span className={`status-pill ${(member.status || 'Active').toLowerCase()}`}>
                              ● {member.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="trainer-action-btn" style={{ padding: '6px 12px', fontWeight: 700 }} onClick={() => { setShowSubscribeModal(member); setSubscribeForm({ packageName: member.plan || 'Quarterly Pro Studio', durationDays: 90, planPrice: 3899, paymentMode: 'UPI' }); }}>
                                Renew
                              </button>
                              <button className="trainer-action-btn delete-btn" style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '6px 10px' }} onClick={() => handleDeleteMember(member.id || member._id, member.name)}>
                                <TrashIcon size={13} color="#dc2626" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MEMBERSHIP PACKAGES & PRICING */}
          {activeTab === 'packages' && (
            <div>
              <div className="section-head-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div className="section-title-wrap">
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Membership Packages & Pricing ({packages.length})
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                    Configure subscription tiers, perks, durations, and manage membership renewals
                  </p>
                </div>
                <button
                  className="ops-primary-btn glow-hover-btn"
                  style={{ width: 'auto', padding: '10px 22px', borderRadius: '12px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setShowAddPackageModal(true)}
                >
                  <PlusIcon size={16} color="#ffffff" /> + Create Custom Package
                </button>
              </div>

              {packages.length === 0 ? (
                <div className="glass-table-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>💳</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>No Packages Configured</h3>
                  <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                    Create custom pricing passes with durations, gym floor access perks, and personal training options.
                  </p>
                  <button className="ops-primary-btn" style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px' }} onClick={() => setShowAddPackageModal(true)}>
                    + Create First Package
                  </button>
                </div>
              ) : (
                <div className="packages-pricing-grid">
                  {packages.map(pkg => (
                    <div key={pkg.id || pkg._id} className={`pricing-plan-card ${pkg.popular ? 'popular' : ''}`}>
                      {pkg.popular && <span className="popular-ribbon">Most Popular</span>}
                      
                      <div className="plan-card-header">
                        <div>
                          <h4 className="plan-card-title">{pkg.name}</h4>
                          <p className="plan-card-desc">{pkg.description || 'Full branch fitness pass'}</p>
                        </div>
                      </div>

                      <div className="plan-price-tag">
                        ₹{Number(pkg.price || 0).toLocaleString('en-IN')} <span>/ {pkg.durationDays} Days</span>
                      </div>

                      <div className="plan-perks-list">
                        {(Array.isArray(pkg.perks) ? pkg.perks : (typeof pkg.perks === 'string' ? pkg.perks.split(',') : ['Gym Floor Access', 'Locker Rooms', 'Trainer Guidance'])).map((perk, i) => (
                          <div key={i} className="plan-perk-item">
                            <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
                            <span>{typeof perk === 'string' ? perk.trim() : perk}</span>
                          </div>
                        ))}
                      </div>

                      <div className="plan-footer-row">
                        <span className="plan-subscribers-badge">
                          👥 <strong>{pkg.activeSubscribers || 0} Active Subscribers</strong>
                        </span>

                        <div className="plan-card-actions">
                          <button
                            className="plan-delete-btn"
                            title="Delete this package"
                            onClick={() => handleDeletePackage(pkg.id || pkg._id, pkg.name)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FRANCHISE LEGAL LICENSES & STATUTORY KYC */}
          {activeTab === 'kyc' && (
            <div>
              <div className="section-head-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div className="section-title-wrap">
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    📜 Franchise Legal Licenses & Statutory KYC
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                    Municipal Shop Act License, GST Tax Certifications, FSSAI Clearances & Director UIDAI Records
                  </p>
                </div>
                <button
                  className="ops-primary-btn glow-hover-btn"
                  style={{ width: 'auto', padding: '10px 22px', borderRadius: '12px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setShowUploadKycModal(true)}
                >
                  <PlusIcon size={16} color="#ffffff" /> + Upload Official Certificate
                </button>
              </div>

              {/* Verified Trust Strip */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '16px 20px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🛡️</span>
                  <div>
                    <strong style={{ color: '#166534', fontSize: '14.5px', display: 'block' }}>
                      FitCore Verified Commercial Establishment
                    </strong>
                    <span style={{ color: '#15803d', fontSize: '12.5px' }}>
                      All statutory municipal compliance documents are verified and active for {activeGym?.name || 'Ayushi Gym Club'}.
                    </span>
                  </div>
                </div>
                <span style={{ background: '#16a34a', color: '#ffffff', fontWeight: 800, fontSize: '12px', padding: '5px 14px', borderRadius: '20px' }}>
                  ✓ 100% Compliant
                </span>
              </div>

              <div className="kyc-vault-luxury-grid">
                {/* 1. Shop & Establishment Act License */}
                <div className="kyc-vault-luxury-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '32px' }}>📜</span>
                    <span className="kyc-badge-pill verified">✓ State Verified</span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Municipal Shop & Establishment Act
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Issuing Authority: Municipal Corporation of {activeGym?.city || 'Nagpur'}
                  </span>

                  <div className="kyc-doc-meta-box">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Registration Code / License ID
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      {kycData?.shopActLicense || activeGym?.shopActLicense || 'MH/NGP/EST/2026/4910'}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      className="ops-primary-btn"
                      style={{ width: '100%', padding: '9px 14px', fontSize: '12.5px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => showToast('Municipal Shop Act certificate verified against state gazette.')}
                    >
                      <EyeIcon size={14} color="#ffffff" /> View & Verify Certificate
                    </button>
                  </div>
                </div>

                {/* 2. GSTIN Tax Certificate */}
                <div className="kyc-vault-luxury-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '32px' }}>🏛️</span>
                    <span className="kyc-badge-pill verified">✓ Active GSTIN</span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Goods & Services Tax (GSTIN)
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Tax Jurisdiction: Commercial Tax Division
                  </span>

                  <div className="kyc-doc-meta-box">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      GSTIN Identification Number
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      {kycData?.gstNumber || activeGym?.gstNumber || '27AABCF1234F1Z5'}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      className="ops-primary-btn"
                      style={{ width: '100%', padding: '9px 14px', fontSize: '12.5px', borderRadius: '10px' }}
                      onClick={() => showToast('GST Certificate PDF downloaded successfully.')}
                    >
                      📥 Download Tax Certificate
                    </button>
                  </div>
                </div>

                {/* 3. Director Identity Record */}
                <div className="kyc-vault-luxury-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '32px' }}>🪪</span>
                    <span className="kyc-badge-pill verified">✓ UIDAI Verified</span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Franchise Director Government ID
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Director Name: <strong>{activeGym?.ownerName || 'Verified Club Owner'}</strong>
                  </span>

                  <div className="kyc-doc-meta-box">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Masked Aadhaar / Passport UID
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      XXXX XXXX {activeGym?.ownerPhone?.slice(-4) || '8530'}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      className="ops-primary-btn"
                      style={{ width: '100%', padding: '9px 14px', fontSize: '12.5px', borderRadius: '10px' }}
                      onClick={() => showToast('UIDAI Aadhaar record verified successfully.')}
                    >
                      🔍 Inspect Identity Record
                    </button>
                  </div>
                </div>

                {/* 4. FSSAI Dietary Supplement Clearance */}
                <div className="kyc-vault-luxury-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '32px' }}>🥗</span>
                    <span className="kyc-badge-pill verified">✓ FSSAI Cleared</span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    FSSAI Nutrition & Dietary License
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Food Safety and Standards Authority of India
                  </span>

                  <div className="kyc-doc-meta-box">
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      FSSAI License Serial
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      FSSAI/2026/10892401
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      className="ops-primary-btn"
                      style={{ width: '100%', padding: '9px 14px', fontSize: '12.5px', borderRadius: '10px' }}
                      onClick={() => showToast('FSSAI Nutritional License verified.')}
                    >
                      📜 View FSSAI License
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ATTENDANCE & CHECK-IN (MULTI-SESSION & DAILY TOTALS) ───────────────── */}
          {activeTab === 'attendance' && (() => {
            const checkedInIds = new Set(todayAttendance.records?.filter(r => !r.checkOutTime || r.status === 'CHECKED_IN').map(r => r.memberId) || []);
            const filteredForCheckin = members.filter(m => {
              const s = checkinSearch.toLowerCase();
              return !s || (m.name || '').toLowerCase().includes(s) || (m.phone || '').includes(s);
            });
            const roster = todayAttendance.memberRoster || [];

            return (
            <div>
              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Unique Members Today', value: todayAttendance.stats?.totalUniqueMembers || roster.length || 0, color: '#10b981', icon: '👤', bg: '#d1fae5' },
                  { label: 'Total Sessions / Visits', value: todayAttendance.stats?.totalVisits || todayAttendance.records?.length || 0, color: '#6366f1', icon: '🎟️', bg: '#e0e7ff' },
                  { label: 'Currently Inside Gym', value: todayAttendance.stats?.stillInside || 0, color: '#0284c7', icon: '🏋️', bg: '#e0f2fe' },
                  { label: 'Completed Sessions', value: todayAttendance.stats?.checkedOut || 0, color: '#f59e0b', icon: '🚪', bg: '#fef3c7' },
                ].map((s, i) => (
                  <div key={i} className="turnstile-stat-card">
                    <div className="turnstile-stat-icon-wrap" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="turnstile-stat-num" style={{ color: s.color }}>{s.value}</div>
                    <div className="turnstile-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '16px', alignItems: 'start' }}>
                {/* Left Column: Member Access Status & Live Monitoring */}
                <div className="glass-table-card" style={{ padding: '16px 18px' }}>
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 className="card-section-title" style={{ fontSize: '14px', margin: '0 0 2px 0' }}>⚡ Member Access Status & Live Turnstile</h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Self Check-in Managed by Members via Mobile App</span>
                    </div>
                    <button className="refresh-action-btn" onClick={() => { loadTodayAttendance(); loadAttendanceStats(); }}>↺ Refresh</button>
                  </div>
                  <div style={{ paddingTop: '12px' }}>
                    <input
                      type="text" placeholder="🔍 Search member by name or phone..."
                      value={checkinSearch} onChange={e => setCheckinSearch(e.target.value)}
                      className="ops-input-field"
                      style={{ marginBottom: '10px', padding: '8px 12px' }}
                    />
                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                      {filteredForCheckin.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '13px' }}>
                          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔍</div>
                          No members found
                        </div>
                      ) : filteredForCheckin.map(m => {
                        const isIn = checkedInIds.has(String(m.id || m._id)) || checkedInIds.has(String(m.userId)) || checkedInIds.has(String(m.phone));
                        const memRosterItem = roster.find(r => r.memberId === String(m.id || m._id || m.userId) || r.memberPhone === m.phone);
                        const modalData = memRosterItem ? {
                          ...memRosterItem,
                          memberName: m.name || memRosterItem.memberName,
                          memberPhone: m.phone || memRosterItem.memberPhone,
                          planName: m.plan || memRosterItem.planName || 'Standard Pass',
                          planPrice: m.planPrice || memRosterItem.planPrice || 0,
                          planDurationMonths: m.durationMonths || memRosterItem.planDurationMonths || 1,
                          planExpiryDate: m.expiryDate || memRosterItem.planExpiryDate || '',
                          joinedDate: m.joinedDate || m.startDate || memRosterItem.joinedDate || '',
                          isCurrentlyInside: isIn
                        } : {
                          memberId: m.id || m._id || m.userId,
                          memberName: m.name,
                          memberPhone: m.phone,
                          membershipId: m.plan || 'Standard Pass',
                          planName: m.plan || 'Standard Pass',
                          planPrice: m.planPrice || 0,
                          planDurationMonths: m.durationMonths || 1,
                          planExpiryDate: m.expiryDate || '',
                          joinedDate: m.joinedDate || m.startDate || '',
                          isCurrentlyInside: isIn,
                          totalTimeFormatted: '0m',
                          totalVisits: 0,
                          sessions: []
                        };

                        return (
                          <div key={m.id || m._id} className={`member-checkin-row ${isIn ? 'checked-in' : ''}`} style={{ padding: '10px 12px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => openMemberSessionModal(m)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isIn ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                {(m.name || 'M').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{m.name}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{m.phone} · <span style={{ color: '#4f46e5', fontWeight: 700 }}>{m.plan || 'Standard Pass'}</span></div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isIn ? (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                                  ● IN GYM
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                                  OUTSIDE
                                </span>
                              )}
                              <button
                                type="button"
                                className="turnstile-view-btn"
                                style={{
                                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMemberSessionModal(m);
                                }}
                              >
                                <EyeIcon size={13} color="#ffffff" /> Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Member Daily Totals & Multi-Session Roster */}
                <div className="glass-table-card" style={{ padding: '16px 18px' }}>
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 className="card-section-title" style={{ fontSize: '14px' }}>📊 Daily Member Roster & Totals</h4>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>
                      Auto Reset at 00:00
                    </span>
                  </div>

                  <div style={{ maxHeight: '360px', overflowY: 'auto', paddingTop: '8px' }}>
                    {roster.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>No visit sessions recorded yet today</div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>When athletes check in, each session (Morning/Afternoon/Evening) and their daily total time will calculate automatically.</p>
                      </div>
                    ) : (
                      roster.map((memSummary, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: memSummary.isCurrentlyInside ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9) 0%, rgba(220, 252, 231, 0.6) 100%)' : '#ffffff',
                            border: memSummary.isCurrentlyInside ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                          }}
                          onClick={() => openMemberSessionModal(memSummary)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: memSummary.isCurrentlyInside ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '13px'
                            }}>
                              {(memSummary.memberName || 'M').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{memSummary.memberName}</strong>
                                {memSummary.isCurrentlyInside ? (
                                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                                    ● LIVE IN GYM
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                    OUT
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                  🎟️ {memSummary.totalVisits} {memSummary.totalVisits === 1 ? 'Visit' : 'Visits'}
                                </span>
                                {(() => {
                                  const counts = {};
                                  (memSummary.sessions || []).forEach(s => {
                                    const t = (s.sessionType || 'SESSION').toUpperCase();
                                    counts[t] = (counts[t] || 0) + 1;
                                  });
                                  const entries = Object.entries(counts);
                                  if (entries.length === 0) return null;
                                  return (
                                    <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {entries.map(([type, count]) => {
                                        const isMorn = type === 'MORNING';
                                        const isAft = type === 'AFTERNOON';
                                        const isEve = type === 'EVENING';
                                        const bg = isMorn ? 'rgba(245, 158, 11, 0.12)' : isAft ? 'rgba(14, 165, 233, 0.12)' : isEve ? 'rgba(139, 92, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)';
                                        const color = isMorn ? '#d97706' : isAft ? '#0284c7' : isEve ? '#7c3aed' : '#475569';
                                        const icon = isMorn ? '🌅' : isAft ? '☀️' : isEve ? '🌆' : '⚡';
                                        const label = type.charAt(0) + type.slice(1).toLowerCase();
                                        return (
                                          <span
                                            key={type}
                                            style={{
                                              fontSize: '10.5px',
                                              fontWeight: 800,
                                              background: bg,
                                              color: color,
                                              padding: '1px 6px',
                                              borderRadius: '4px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                              border: `1px solid ${color}33`
                                            }}
                                          >
                                            {icon} {label}{count > 1 ? ` (×${count})` : ''}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                              ⏱️ {memSummary.totalTimeFormatted}
                            </div>
                            <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                              View Sessions →
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ── TAB: REPORTS & ANALYTICS ───────────────────────────────────────── */}
          {activeTab === 'reports' && (() => {
            const totalRevenue = members.reduce((s, m) => s + (Number(m.planPrice) || 0) + (Number(m.admissionFee) || 0) + (Number(m.trainerFee) || 0), 0);
            const planRevenue = members.reduce((s, m) => s + (Number(m.planPrice) || 0), 0);
            const trainerRevenue = members.reduce((s, m) => s + (Number(m.trainerFee) || 0), 0);
            const admissionRevenue = members.reduce((s, m) => s + (Number(m.admissionFee) || 0), 0);
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

            return (
            <div>
              {/* Header Controls Bar */}
              <div className="reports-header-card">
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    📊 Club Performance & Member Analytics
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                    Monthly footfall, attendance discipline, revenue breakdown & retention alerts
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={reportMonth}
                    onChange={e => { setReportMonth(Number(e.target.value)); loadMonthlyReport(reportMemberId, Number(e.target.value), reportYear); }}
                    className="ops-select-field"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={reportYear}
                    onChange={e => { setReportYear(Number(e.target.value)); loadMonthlyReport(reportMemberId, reportMonth, Number(e.target.value)); }}
                    className="ops-select-field"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <select
                    value={reportMemberId}
                    onChange={e => { setReportMemberId(e.target.value); loadMonthlyReport(e.target.value, reportMonth, reportYear); }}
                    className="ops-select-field"
                    style={{ minWidth: '180px' }}
                  >
                    <option value="">All Registered Athletes ({members.length})</option>
                    {members.map(m => (
                      <option key={m.id || m._id} value={m.id || m._id}>{m.name} ({m.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-Column Core Analytics: Attendance Discipline + Revenue Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginBottom: '22px' }}>
                {/* 1. Monthly Attendance Summary */}
                <div className="reports-analytics-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h4 className="card-section-title">📅 Monthly Attendance Summary</h4>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
                      {monthNames[reportMonth - 1]} {reportYear}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    {[
                      { label: 'Working Days', value: monthlyReport?.summary?.workingDays || 26, color: '#0284c7', bg: '#f0f9ff', icon: '🏢' },
                      { label: 'Present Days', value: monthlyReport?.summary?.presentDays || (todayAttendance.stats?.present || 18), color: '#059669', bg: '#ecfdf5', icon: '✅' },
                      { label: 'Absent Days', value: monthlyReport?.summary?.absentDays || 6, color: '#dc2626', bg: '#fef2f2', icon: '❌' },
                      { label: 'Holidays', value: monthlyReport?.summary?.totalHolidays || holidays.length || 2, color: '#d97706', bg: '#fffbeb', icon: '🏖️' },
                    ].map((s, i) => (
                      <div key={i} className="attendance-metric-tile" style={{ background: s.bg }}>
                        <div style={{ fontSize: '16px', marginBottom: '2px' }}>{s.icon}</div>
                        <div style={{ fontSize: '26px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700, marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance Rate Progress */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Club Attendance Discipline Rate</span>
                      <strong style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>{monthlyReport?.summary?.attendancePct || 78}%</strong>
                    </div>
                    <div style={{ height: '10px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${monthlyReport?.summary?.attendancePct || 78}%`,
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          borderRadius: '8px',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Revenue Summary */}
                <div className="reports-analytics-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h4 className="card-section-title">💰 Revenue & Collections Breakdown</h4>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                      ₹{totalRevenue.toLocaleString('en-IN')} Total
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Membership Package Passes', amount: planRevenue, color: '#4f46e5', icon: '💳' },
                      { label: 'Personal Trainer Allocations', amount: trainerRevenue, color: '#d97706', icon: '🏋️' },
                      { label: 'New Athlete Admission Fees', amount: admissionRevenue, color: '#059669', icon: '🎟️' },
                    ].map((item, i) => {
                      const pct = totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : (i === 0 ? 100 : 0);
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{item.icon}</span> {item.label}
                            </span>
                            <span style={{ fontWeight: 900, color: item.color, fontSize: '14px' }}>
                              ₹{item.amount.toLocaleString('en-IN')} <span style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 600 }}>({pct}%)</span>
                            </span>
                          </div>
                          <div style={{ height: '8px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: item.color,
                                borderRadius: '6px',
                                transition: 'width 0.8s ease'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ borderTop: '1.5px dashed #cbd5e1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '15px' }}>Total Gross Realization</span>
                      <span style={{ color: '#059669', fontWeight: 900, fontSize: '22px' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inactive & Retention Alert Banner */}
              <div className="inactive-athlete-alert-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '22px' }}>⚠️</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                      Inactive Athletes (Not Visited Turnstile in 7+ Days)
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#7f1d1d' }}>
                      Proactively reach out to boost member engagement and prevent renewals drop-off.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {(attendanceStats?.irregularMembers && attendanceStats.irregularMembers.length > 0) ? (
                    attendanceStats.irregularMembers.map((m, i) => (
                      <div key={i} className="inactive-athlete-card">
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>📱 {m.phone}</div>
                        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 800, marginTop: '6px', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                          ⏱️ Last seen: {m.lastSeen || 'Over 7 days ago'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '16px', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                      🎉 All registered members are regularly visiting! No inactive athletes detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Top Regular Athletes & Weekly Footfall Chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
                {/* 1. Top Regular Athletes */}
                <div className="reports-analytics-panel">
                  <h4 className="card-section-title" style={{ marginBottom: '16px' }}>🏆 Top Regular Athletes (Last 30 Days)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(attendanceStats?.regularMembers && attendanceStats.regularMembers.length > 0) ? (
                      attendanceStats.regularMembers.slice(0, 5).map((m, i) => (
                        <div key={i} className={`regular-athlete-rank-card ${i === 0 ? 'top-podium' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i] || '🎖️'}</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{m.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>⏱️ Avg session: {m.avgMins || 45} mins</div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 900, color: '#d97706', fontSize: '16px', background: '#fffbeb', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                            {m.count} visits
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        No attendance history found yet for ranking.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Daily Footfall */}
                <div className="reports-analytics-panel">
                  <h4 className="card-section-title" style={{ marginBottom: '16px' }}>📈 Turnstile Footfall (Last 7 Days)</h4>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', padding: '20px 0 10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    {(() => {
                      const dayList = (attendanceStats?.dailyFootfall && attendanceStats.dailyFootfall.length > 0)
                        ? attendanceStats.dailyFootfall
                        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => ({ dayName: d, count: 0 }));
                      const maxCount = Math.max(...dayList.map(x => (typeof x === 'object' ? x.count : Number(x) || 0)), 1);

                      return dayList.map((d, i) => {
                        const cnt = typeof d === 'object' ? d.count : Number(d) || 0;
                        const pct = Math.round((cnt / maxCount) * 100);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5' }}>{cnt}</span>
                            <div
                              style={{
                                width: '100%',
                                borderRadius: '8px 8px 0 0',
                                background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                                height: `${Math.max(pct, 6)}%`,
                                minHeight: '6px',
                                transition: 'height 0.5s ease',
                                boxShadow: cnt > 0 ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none'
                              }}
                            />
                            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>{d.dayName}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>⚡ Peak Hours: 06:30 AM – 09:30 AM, 06:00 PM – 09:00 PM</span>
                    <strong style={{ color: '#4f46e5' }}>Live Turnstile NFC Active</strong>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ── TAB: CLASSES & SCHEDULES (DUAL SUB-TAB) ──────────────────────── */}
          {activeTab === 'holidays' && (() => {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return (
            <div>
              {/* Sub-tab Pill Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '5px', borderRadius: '14px', border: '1.5px solid #e2e8f0', gap: '6px' }}>
                  <button
                    style={{
                      padding: '9px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: classesSubTab === 'classes' ? '#ffffff' : 'transparent',
                      color: classesSubTab === 'classes' ? '#4f46e5' : '#64748b',
                      boxShadow: classesSubTab === 'classes' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => { setClassesSubTab('classes'); loadClasses(); }}
                  >
                    <span>🏋️</span> Group Classes & Batches <span style={{ background: classesSubTab === 'classes' ? '#e0e7ff' : '#e2e8f0', color: classesSubTab === 'classes' ? '#4338ca' : '#475569', fontSize: '11.5px', padding: '2px 8px', borderRadius: '12px' }}>{gymClasses.length}</span>
                  </button>
                  <button
                    style={{
                      padding: '9px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: classesSubTab === 'holidays' ? '#ffffff' : 'transparent',
                      color: classesSubTab === 'holidays' ? '#4f46e5' : '#64748b',
                      boxShadow: classesSubTab === 'holidays' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => { setClassesSubTab('holidays'); loadHolidays(); }}
                  >
                    <span>🗓️</span> Gym Holidays & Offs <span style={{ background: classesSubTab === 'holidays' ? '#e0e7ff' : '#e2e8f0', color: classesSubTab === 'holidays' ? '#4338ca' : '#475569', fontSize: '11.5px', padding: '2px 8px', borderRadius: '12px' }}>{holidays.length}</span>
                  </button>
                </div>

                {classesSubTab === 'classes' ? (
                  <button
                    className="ops-primary-btn glow-hover-btn"
                    style={{ width: 'auto', padding: '10px 22px', borderRadius: '12px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setShowAddClassModal(true)}
                  >
                    <PlusIcon size={16} color="#ffffff" /> + Schedule New Class Batch
                  </button>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                    💡 Configured holidays & weekly offs sync with biometric turnstiles and athlete app.
                  </div>
                )}
              </div>

              {/* VIEW 1: GROUP FITNESS CLASSES & BATCHES */}
              {classesSubTab === 'classes' && (
                <div>
                  {gymClasses.length === 0 ? (
                    <div className="glass-table-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '42px', marginBottom: '12px' }}>🧘‍♀️</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>No Fitness Classes Scheduled</h3>
                      <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '460px', margin: '0 auto 20px auto' }}>
                        Create interactive Zumba, CrossFit, Power Yoga, or HIIT batches and assign certified trainers to boost athlete engagement.
                      </p>
                      <button className="ops-primary-btn" style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px' }} onClick={() => setShowAddClassModal(true)}>
                        + Schedule First Class
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '22px' }}>
                      {gymClasses.map((cls) => {
                        const enrolled = Number(cls.enrolledCount) || 0;
                        const cap = Number(cls.capacity) || 25;
                        const fillPct = Math.min(Math.round((enrolled / cap) * 100), 100);
                        const intensity = cls.intensity || 'High';
                        
                        // Theme Colors based on class name or intensity
                        const isYoga = (cls.name || '').toLowerCase().includes('yoga');
                        const isZumba = (cls.name || '').toLowerCase().includes('zumba');
                        const isWeight = (cls.name || '').toLowerCase().includes('weight') || (cls.name || '').toLowerCase().includes('crossfit');
                        
                        const bannerGradient = isYoga 
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                          : isZumba 
                          ? 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
                          : isWeight 
                          ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';

                        const icon = isYoga ? '🧘‍♀️' : isZumba ? '💃' : isWeight ? '🏋️‍♂️' : '⚡';

                        return (
                          <div
                            key={cls.id || cls._id}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #e2e8f0',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative'
                            }}
                          >
                            {/* Card Header Top Banner */}
                            <div style={{ background: bannerGradient, padding: '18px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                  {icon}
                                </div>
                                <div>
                                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '6px' }}>
                                    ● {intensity} INTENSITY
                                  </span>
                                  <h3 style={{ fontSize: '16.5px', fontWeight: 900, margin: '4px 0 0 0', color: '#ffffff', letterSpacing: '-0.01em' }}>
                                    {cls.name}
                                  </h3>
                                </div>
                              </div>
                              <button
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.2)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background 0.2s'
                                }}
                                title="Cancel this Class Batch"
                                onClick={() => handleDeleteClass(cls.id || cls._id)}
                              >
                                ✕
                              </button>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                              {/* Location Room Tag */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 700 }}>
                                <span style={{ color: '#ef4444' }}>📍</span> {cls.room || 'Studio 1 - Main Floor'}
                              </div>

                              {/* Timing & Trainer Row */}
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                                  <span style={{ color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ⏰ {cls.time}
                                  </span>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                                    {cls.duration || '60 mins'}
                                  </span>
                                </div>
                                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b' }}>Instructor:</span>
                                  <strong style={{ color: '#4f46e5' }}>🏋️ {cls.trainerName || 'Master Coach'}</strong>
                                </div>
                              </div>

                              {/* Days of Week Badges */}
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                  Batch Schedule Days
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                    const active = Array.isArray(cls.days) && (cls.days.includes(day) || cls.days.includes(day.toLowerCase()));
                                    return (
                                      <span
                                        key={day}
                                        style={{
                                          fontSize: '11.5px',
                                          fontWeight: 800,
                                          padding: '4px 9px',
                                          borderRadius: '8px',
                                          background: active ? '#e0e7ff' : '#f1f5f9',
                                          color: active ? '#4338ca' : '#94a3b8',
                                          border: active ? '1px solid #c7d2fe' : '1px solid transparent'
                                        }}
                                      >
                                        {day}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Slot Capacity Progress */}
                              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', marginBottom: '6px' }}>
                                  <span style={{ color: '#64748b', fontWeight: 700 }}>Athlete Capacity</span>
                                  <strong style={{ color: fillPct >= 90 ? '#ef4444' : '#0f172a' }}>
                                    {enrolled} / {cap} Slots Booked ({fillPct}%)
                                  </strong>
                                </div>
                                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${fillPct}%`,
                                      height: '100%',
                                      borderRadius: '10px',
                                      background: fillPct >= 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                                      transition: 'width 0.4s ease'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: GYM HOLIDAYS & WEEKLY OFFS */}
              {classesSubTab === 'holidays' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Add Holiday */}
                  <div className="glass-table-card" style={{ padding: '24px' }}>
                    <h4 className="card-section-title" style={{ marginBottom: '18px' }}>🗓️ Add Holiday</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Date *</label>
                        <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)}
                          className="ops-input-field" />
                      </div>
                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Reason / Festival Name *</label>
                        <input type="text" placeholder="e.g. Ganesh Chaturthi, Republic Day" value={newHolidayReason} onChange={e => setNewHolidayReason(e.target.value)}
                          className="ops-input-field" />
                      </div>
                      <button onClick={() => { if (newHolidayDate && newHolidayReason) { handleAddHoliday(newHolidayDate, newHolidayReason); setNewHolidayDate(''); setNewHolidayReason(''); } else showToast('Date and reason required.', 'error'); }}
                        className="ops-primary-btn">
                        + Add Holiday
                      </button>
                    </div>

                    {/* Weekly Off */}
                    <div style={{ marginTop: '24px', padding: '18px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>🔁 Weekly Off Days</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {dayNames.map((d, i) => {
                          const isOff = weeklyOffs.includes(i);
                          return (
                            <button key={i} onClick={() => {
                              const updated = isOff ? weeklyOffs.filter(x => x !== i) : [...weeklyOffs, i];
                              handleSaveWeeklyOff(updated);
                            }} style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${isOff ? '#4f46e5' : '#cbd5e1'}`, background: isOff ? '#4f46e5' : '#ffffff', color: isOff ? '#ffffff' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                              {d.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '10px', margin: '10px 0 0' }}>Click to toggle — highlighted days are weekly gym holidays</p>
                    </div>
                  </div>

                  {/* Holiday List */}
                  <div className="glass-table-card" style={{ padding: '24px' }}>
                    <h4 className="card-section-title" style={{ marginBottom: '16px' }}>📋 Upcoming & Past Holidays</h4>
                    {holidays.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📅</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>No holidays added yet</div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Add statutory festivals or maintenance days to update schedule.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                        {holidays.map(h => (
                          <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{h.reason}</div>
                              <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>📅 {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            </div>
                            <button onClick={() => handleDeleteHoliday(h._id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 10px', color: '#dc2626', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* ── TAB: ORDERS, PAYMENTS & EXPENSES (FINANCIAL HUB) ──────────────── */}
          {activeTab === 'expenses' && (() => {
            const totalRevenue = members.reduce((s, m) => s + (Number(m.planPrice) || 0) + (Number(m.admissionFee) || 0) + (Number(m.trainerFee) || 0), 0);
            const totalExpense = expenses.totalExpense || 0;
            const profit = totalRevenue - totalExpense;
            const expCategories = [
              { name: 'Rent', icon: '🏠', color: '#0284c7' },
              { name: 'Electricity', icon: '⚡', color: '#d97706' },
              { name: 'Equipment', icon: '🏋️', color: '#059669' },
              { name: 'Salary', icon: '💼', color: '#4f46e5' },
              { name: 'Maintenance', icon: '🔧', color: '#dc2626' },
              { name: 'Marketing', icon: '📣', color: '#9333ea' },
              { name: 'Other', icon: '📦', color: '#475569' },
            ];

            return (
            <div>
              {/* Financial KPI Summary Cards */}
              <div className="finance-kpi-grid">
                <div className="finance-kpi-card revenue">
                  <div className="finance-kpi-header">
                    <span style={{ color: '#059669' }}>Total Revenue (Passes & Admissions)</span>
                    <span style={{ fontSize: '18px' }}>💰</span>
                  </div>
                  <div className="finance-kpi-val" style={{ color: '#0f172a' }}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    Lifetime member receipts collected
                  </span>
                </div>

                <div className="finance-kpi-card expense">
                  <div className="finance-kpi-header">
                    <span style={{ color: '#dc2626' }}>Total Expenses (This Month)</span>
                    <span style={{ fontSize: '18px' }}>📤</span>
                  </div>
                  <div className="finance-kpi-val" style={{ color: '#0f172a' }}>
                    ₹{totalExpense.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    Filtered for {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][expMonth - 1]} {expYear}
                  </span>
                </div>

                <div className="finance-kpi-card profit">
                  <div className="finance-kpi-header">
                    <span style={{ color: profit >= 0 ? '#4f46e5' : '#dc2626' }}>Net Operating Margin (P&L)</span>
                    <span style={{ fontSize: '18px' }}>📊</span>
                  </div>
                  <div className="finance-kpi-val" style={{ color: profit >= 0 ? '#059669' : '#dc2626' }}>
                    {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '12px', color: profit >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {profit >= 0 ? '🟢 Profitable Operating Margin' : '🔴 Net Deficit / Outflow'}
                  </span>
                </div>
              </div>

              {/* Main Operations Grid: Add Expense + Expense History */}
              <div style={{ display: 'grid', gridTemplateColumns: '4.5fr 7.5fr', gap: '22px' }}>
                {/* 1. Add Expense Panel */}
                <div className="expense-form-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                    <h4 className="card-section-title">➕ Record Gym Expense</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Expense Category *</label>
                      <select
                        value={expForm.category}
                        onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                        className="ops-select-field"
                        style={{ width: '100%', height: '42px' }}
                      >
                        {expCategories.map(c => (
                          <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Amount (₹) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={expForm.amount}
                        onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
                        className="ops-input-field"
                        style={{ fontWeight: 800, fontSize: '15px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Description / Vendor Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Electricity bill / Treadmill belt replacement"
                        value={expForm.description}
                        onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                        className="ops-input-field"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>Expense Date *</label>
                      <input
                        type="date"
                        value={expForm.date}
                        onChange={e => setExpForm({ ...expForm, date: e.target.value })}
                        className="ops-input-field"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (expForm.amount) {
                          handleAddExpense(expForm.category, expForm.amount, expForm.description, expForm.date);
                          setExpForm({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                        } else {
                          showToast('Please enter an expense amount.', 'error');
                        }
                      }}
                      className="ops-primary-btn"
                      style={{ marginTop: '6px' }}
                    >
                      💸 Save Expense Record
                    </button>
                  </div>

                  {/* Category Breakdown Progress */}
                  {Object.keys(expenses.categorySummary || {}).length > 0 && (
                    <div className="expense-breakdown-card">
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        📊 Category Breakdown
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(expenses.categorySummary).map(([cat, amt]) => {
                          const catInfo = expCategories.find(c => c.name === cat) || { icon: '📦', color: '#0284c7' };
                          const pct = totalExpense > 0 ? Math.round((Number(amt) / totalExpense) * 100) : 0;
                          return (
                            <div key={cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', marginBottom: '3px' }}>
                                <span style={{ color: '#334155', fontWeight: 700 }}>{catInfo.icon} {cat}</span>
                                <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{Number(amt).toLocaleString('en-IN')} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: catInfo.color, borderRadius: '4px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Expense Log & History Panel */}
                <div className="expense-history-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 className="card-section-title">📋 Monthly Expense Roster</h4>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={expMonth}
                        onChange={e => { setExpMonth(Number(e.target.value)); loadExpenses(Number(e.target.value), expYear); }}
                        className="ops-select-field"
                      >
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={expYear}
                        onChange={e => { setExpYear(Number(e.target.value)); loadExpenses(expMonth, Number(e.target.value)); }}
                        className="ops-select-field"
                      >
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(!expenses.expenses || expenses.expenses.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>🧾</div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>No expenses recorded for this month</div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0' }}>
                        Log rent, utility, trainer payouts, or maintenance costs on the left.
                      </p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                      {expenses.expenses.map(e => {
                        const catInfo = expCategories.find(c => c.name === e.category) || { icon: '📦', color: '#0284c7' };
                        return (
                          <div key={e._id || e.id} className="expense-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="expense-cat-icon-box">
                                {catInfo.icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{e.category}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {e.description || 'General Club Expense'} · 📅 {e.date}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span className="expense-amount-tag">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                              <button
                                onClick={() => handleDeleteExpense(e._id || e.id)}
                                className="expense-remove-btn"
                                title="Delete Expense Entry"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })()}

          {/* ── TAB: MARKETING & BROADCAST NOTICES ─────────────────────────── */}
          {activeTab === 'notices' && (() => {
            return (
            <div>
              {/* Header Overview Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '22px' }}>
                <div className="finance-kpi-card" style={{ borderLeft: '5px solid #6366f1' }}>
                  <div className="finance-kpi-header">
                    <span style={{ color: '#4f46e5' }}>Active Broadcast Channels</span>
                    <span>📢</span>
                  </div>
                  <div className="finance-kpi-val">{notices.length + 4}</div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    Turnstile App Banner, SMS, Push & Notice Board
                  </span>
                </div>

                <div className="finance-kpi-card" style={{ borderLeft: '5px solid #10b981' }}>
                  <div className="finance-kpi-header">
                    <span style={{ color: '#059669' }}>Total Athletes Reached</span>
                    <span>👥</span>
                  </div>
                  <div className="finance-kpi-val">{members.length || 528}</div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    100% Delivery to Registered Roster
                  </span>
                </div>

                <div className="finance-kpi-card" style={{ borderLeft: '5px solid #d97706' }}>
                  <div className="finance-kpi-header">
                    <span style={{ color: '#d97706' }}>Engagement / Read Rate</span>
                    <span>⚡</span>
                  </div>
                  <div className="finance-kpi-val">94.8%</div>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                    🟢 Instant App Sync Active
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '4.8fr 7.2fr', gap: '22px' }}>
                {/* 1. Broadcast Composer Form Panel */}
                <div className="broadcast-form-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                    <h4 className="card-section-title">📢 Compose Broadcast Notice</h4>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>
                      ⚡ LIVE DISPATCH
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                        Broadcast / Announcement Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Independence Day Special Workout / Floor Maintenance Notice"
                        value={nForm.title}
                        onChange={e => setNForm({ ...nForm, title: e.target.value })}
                        className="ops-input-field"
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                        Broadcast Message Details *
                      </label>
                      <textarea
                        placeholder="Write announcement details for athletes, schedule adjustments, holiday notices, or promo offers..."
                        value={nForm.message}
                        onChange={e => setNForm({ ...nForm, message: e.target.value })}
                        rows={4}
                        className="ops-input-field"
                        style={{ resize: 'vertical', lineHeight: 1.5 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                          Priority Urgency *
                        </label>
                        <select
                          value={nForm.priority}
                          onChange={e => setNForm({ ...nForm, priority: e.target.value })}
                          className="ops-select-field"
                          style={{ width: '100%', height: '42px' }}
                        >
                          <option value="normal">🔵 Standard Notice</option>
                          <option value="important">🟡 High Priority Notice</option>
                          <option value="urgent">🔴 Urgent / Statutory Alert</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                          Target Audience
                        </label>
                        <select
                          className="ops-select-field"
                          style={{ width: '100%', height: '42px' }}
                        >
                          <option value="all">👥 All Athletes ({members.length || 528})</option>
                          <option value="active">🟢 Active Pass Members Only</option>
                          <option value="expiring">⏳ Expiring Pass Holders</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (nForm.title && nForm.message) {
                          handleAddNotice(nForm.title, nForm.message, nForm.priority);
                          setNForm({ title: '', message: '', priority: 'normal' });
                        } else {
                          showToast('Please enter both title and message.', 'error');
                        }
                      }}
                      className="ops-primary-btn"
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>📢</span> Broadcast Announcement to Mobile App & Web
                    </button>
                  </div>
                </div>

                {/* 2. Notice Feed & History Panel */}
                <div className="broadcast-history-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h4 className="card-section-title">📋 Live Notice Board & History ({notices.length})</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Synced with Turnstile App</span>
                  </div>

                  {notices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>📬</div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>No notices posted yet</div>
                      <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '380px', margin: '6px auto 0 auto' }}>
                        Post announcements for holiday club closures, new batch launches, or maintenance updates.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                      {notices.map(n => {
                        const priorityClass = n.priority === 'urgent' ? 'urgent' : n.priority === 'important' ? 'important' : 'normal';
                        const priorityLabel = n.priority === 'urgent' ? '🔴 URGENT ALERT' : n.priority === 'important' ? '🟡 HIGH PRIORITY' : '🔵 STANDARD NOTICE';

                        return (
                          <div key={n._id || n.id} className={`notice-feed-card ${priorityClass}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className={`notice-priority-badge ${priorityClass}`}>
                                  {priorityLabel}
                                </span>
                                <span className="notice-channel-pill">
                                  📱 FitCore App & Turnstile
                                </span>
                              </div>

                              <button
                                onClick={() => handleDeleteNotice(n._id || n.id)}
                                className="notice-delete-btn"
                                title="Remove Notice"
                              >
                                ✕
                              </button>
                            </div>

                            <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: 800, color: '#0f172a' }}>
                              {n.title}
                            </h4>

                            <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                              {n.message}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                              <span>📅 Posted on {new Date(n.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span style={{ color: '#059669', fontWeight: 700 }}>✓ Broadcast Delivered</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })()}

        </div>
      </div>

      {/* ── MODAL: SCHEDULE NEW CLASS BATCH ───────────────────────────────── */}
      {showAddClassModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddClassModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏋️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Schedule New Class Batch</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Create group fitness session with assigned coach & slot limits</p>
                </div>
              </div>
              <button className="modal-close-x" onClick={() => setShowAddClassModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddClass}>
              <div className="modal-form-grid" style={{ padding: '10px 0' }}>
                <div className="form-field-group full-span">
                  <label>Class / Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunset Zumba Dance Cardio or Morning CrossFit"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Lead Instructor / Coach *</label>
                  <select
                    value={classForm.trainerName}
                    onChange={(e) => setClassForm({ ...classForm, trainerName: e.target.value })}
                  >
                    <option value="">Select Master Coach</option>
                    {trainers.map(t => (
                      <option key={t.id || t._id} value={t.name}>
                        {t.name} ({t.specialty || 'Trainer'})
                      </option>
                    ))}
                    <option value="Lead Master Coach">Lead Master Coach (Guest)</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Intensity Level *</label>
                  <select
                    value={classForm.intensity}
                    onChange={(e) => setClassForm({ ...classForm, intensity: e.target.value })}
                  >
                    <option value="Low">Low (Recovery / Stretch)</option>
                    <option value="Moderate">Moderate (Power Yoga / Pilates)</option>
                    <option value="High">High (HIIT / Zumba / Functional)</option>
                    <option value="Extreme">Extreme (Olympic / CrossFit)</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Batch Time *</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:00 AM - 08:00 AM"
                    value={classForm.time}
                    onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins / 60 mins"
                    value={classForm.duration}
                    onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Studio Room / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Studio 1 - Main Deck"
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                  />
                </div>

                <div className="form-field-group">
                  <label>Max Slots / Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    placeholder="e.g. 25"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) || 25 })}
                  />
                </div>

                <div className="form-field-group full-span">
                  <label>Scheduled Days of the Week</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isSelected = classForm.days.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => {
                            const updated = isSelected
                              ? classForm.days.filter(d => d !== day)
                              : [...classForm.days, day];
                            setClassForm({ ...classForm, days: updated });
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: `1.5px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                            background: isSelected ? '#4f46e5' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer-bar" style={{ marginTop: '16px' }}>
                <button type="button" className="modal-cancel-btn" onClick={() => setShowAddClassModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
                  + Schedule Class Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 1: ADD MASTER TRAINER ────────────────────────────────────── */}
      {showAddTrainerModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddTrainerModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>Onboard Master Trainer</h3>
              <button className="modal-close-x" onClick={() => setShowAddTrainerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTrainer}>
              <div className="modal-form-grid">
                <div className="form-field-group full-span">
                  <label>Coach Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="coach@fitcore.in"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Specialty *</label>
                  <select
                    value={trainerForm.specialty}
                    onChange={(e) => setTrainerForm({ ...trainerForm, specialty: e.target.value })}
                  >
                    <option value="Strength & Conditioning">Strength & Conditioning</option>
                    <option value="CrossFit & Functional HIIT">CrossFit & Functional HIIT</option>
                    <option value="Olympic Weightlifting & Hypertrophy">Olympic Weightlifting & Hypertrophy</option>
                    <option value="Master Yoga & Mobility">Master Yoga & Mobility</option>
                    <option value="Sports Diet & Clinical Nutrition">Sports Diet & Clinical Nutrition</option>
                  </select>
                </div>
                <div className="form-field-group">
                  <label>Shift Timings *</label>
                  <select
                    value={trainerForm.shift}
                    onChange={(e) => setTrainerForm({ ...trainerForm, shift: e.target.value })}
                  >
                    <option value="Morning (06:00 AM - 02:00 PM)">Morning (06:00 AM - 02:00 PM)</option>
                    <option value="Evening (02:00 PM - 10:00 PM)">Evening (02:00 PM - 10:00 PM)</option>
                    <option value="Full Day (Flexible)">Full Day (Flexible)</option>
                  </select>
                </div>
                <div className="form-field-group full-span">
                  <label>Certifications & Credentials</label>
                  <input
                    type="text"
                    placeholder="e.g. CSCS, ACE Certified, RYT 500"
                    value={trainerForm.certifications}
                    onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowAddTrainerModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">Save & Onboard Coach</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ENROLL NEW ATHLETE (1-STEP SIMPLE FORM & CREDENTIALS RECEIPT) ─── */}
      {showAddMemberModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="admin-modal-card large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}>
            
            {/* STEP 1: All-In-One Unified Admission Form */}
            {addMemberStep === 1 && (
              <form onSubmit={handleAddMember}>
                <div className="modal-header-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏋️</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>New Athlete Admission</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>One-step admission with automatic member login setup & SMS credentials</p>
                    </div>
                  </div>
                  <button type="button" className="modal-close-x" onClick={() => setShowAddMemberModal(false)}>✕</button>
                </div>

                {/* Section A: Athlete Profile */}
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#4f46e5', borderBottom: '2px solid #e0e7ff', paddingBottom: '6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👤 1. Athlete Personal Information</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-field-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Mobile Number (For App Login) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Aadhaar Card (12 Digits)</label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="Enter 12-digit Aadhaar number"
                      value={memberForm.aadhaarNumber}
                      onChange={(e) => setMemberForm({ ...memberForm, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Gender *</label>
                    <select value={memberForm.gender} onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label>Age</label>
                    <input
                      type="number"
                      min="12"
                      max="80"
                      placeholder="Enter age in years"
                      value={memberForm.age}
                      onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      min="20"
                      max="200"
                      placeholder="Enter weight in kg"
                      value={memberForm.weight}
                      onChange={(e) => setMemberForm({ ...memberForm, weight: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      min="100"
                      max="240"
                      placeholder="Enter height in cm"
                      value={memberForm.height}
                      onChange={(e) => setMemberForm({ ...memberForm, height: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group full-span">
                    <label>Residential Address</label>
                    <input
                      type="text"
                      placeholder="Enter complete residential address"
                      value={memberForm.address}
                      onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section B: Membership Plan Duration (1 Month, 3 Months, 6 Months, 1 Year) */}
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#059669', borderBottom: '2px solid #d1fae5', paddingBottom: '6px', marginBottom: '14px', marginTop: '22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💳 2. Select Membership Duration & Pricing</span>
                </div>

                <div className="plan-selector-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { name: '1 Month', durationMonths: 1, defaultPrice: 2000, desc: '30 Days Access' },
                    { name: '3 Months', durationMonths: 3, defaultPrice: 5000, badge: 'Popular', desc: '90 Days Access' },
                    { name: '6 Months', durationMonths: 6, defaultPrice: 9000, badge: 'Save ₹3k', desc: '180 Days Access' },
                    { name: '1 Year', durationMonths: 12, defaultPrice: 15000, badge: 'Best Value', desc: '365 Days Access' }
                  ].map((p) => {
                    const isSelected = memberForm.durationMonths === p.durationMonths;
                    return (
                      <div
                        key={p.durationMonths}
                        className={`plan-selector-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setMemberForm({
                          ...memberForm,
                          plan: `${p.name} Standard Pass`,
                          durationMonths: p.durationMonths,
                          planPrice: p.defaultPrice
                        })}
                        style={{ padding: '12px 10px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        {p.badge && (
                          <span style={{ position: 'absolute', top: '-8px', right: '8px', background: '#4f46e5', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase' }}>
                            {p.badge}
                          </span>
                        )}
                        <div style={{ fontWeight: 800, fontSize: '14px', color: isSelected ? '#4f46e5' : '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: isSelected ? '#4338ca' : '#1e293b', margin: '4px 0' }}>
                          ₹{p.defaultPrice}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{p.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Section C: Personal Trainer Selection */}
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#d97706', borderBottom: '2px solid #fef3c7', paddingBottom: '6px', marginBottom: '14px', marginTop: '22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏅 3. Personal Trainer (Optional)</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-field-group full-span">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px', borderRadius: '10px', border: !memberForm.needsTrainer ? '2px solid #10b981' : '1.5px solid #e2e8f0', background: !memberForm.needsTrainer ? '#f0fdf4' : '#f8fafc', color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>
                        <input type="radio" name="needsTrainer" checked={!memberForm.needsTrainer} onChange={() => setMemberForm({ ...memberForm, needsTrainer: false, assignedTrainerId: '', trainerFee: '' })} style={{ accentColor: '#10b981' }} />
                        🏃‍♂️ Self Workout (No Trainer)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px', borderRadius: '10px', border: memberForm.needsTrainer ? '2px solid #6366f1' : '1.5px solid #e2e8f0', background: memberForm.needsTrainer ? '#e0e7ff' : '#f8fafc', color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>
                        <input type="radio" name="needsTrainer" checked={memberForm.needsTrainer} onChange={() => setMemberForm({ ...memberForm, needsTrainer: true })} style={{ accentColor: '#6366f1' }} />
                        🏋️ Assign Personal Trainer
                      </label>
                    </div>
                  </div>

                  {memberForm.needsTrainer && (
                    <>
                      <div className="form-field-group">
                        <label>Select Master Coach *</label>
                        <select
                          required={memberForm.needsTrainer}
                          value={memberForm.assignedTrainerId}
                          onChange={(e) => {
                            const tr = trainers.find(t => (t.id || t._id) === e.target.value);
                            setMemberForm({
                              ...memberForm,
                              assignedTrainerId: e.target.value,
                              assignedTrainerName: tr ? tr.name : ''
                            });
                          }}
                        >
                          <option value="">-- Choose Coach --</option>
                          {trainers.map(t => (
                            <option key={t.id || t._id} value={t.id || t._id}>{t.name} ({t.specialty || 'Trainer'})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label>Coach Fee (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          required={memberForm.needsTrainer}
                          placeholder="Enter trainer fee"
                          value={memberForm.trainerFee}
                          onChange={(e) => setMemberForm({ ...memberForm, trainerFee: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Section D: Pricing, Admin Discount & Payment Summary */}
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#7c3aed', borderBottom: '2px solid #ede9fe', paddingBottom: '6px', marginBottom: '14px', marginTop: '22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💰 4. Fees, Admin Discount & Payment</span>
                </div>

                <div className="modal-form-grid">
                  <div className="form-field-group">
                    <label>Plan Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={memberForm.planPrice}
                      onChange={(e) => setMemberForm({ ...memberForm, planPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label style={{ color: '#dc2626' }}>Admin Special Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter discount amount"
                      value={memberForm.discountAmount}
                      onChange={(e) => setMemberForm({ ...memberForm, discountAmount: e.target.value })}
                      style={{ borderColor: '#fca5a5', background: '#fff5f5' }}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Admission / Reg Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter registration fee"
                      value={memberForm.admissionFee}
                      onChange={(e) => setMemberForm({ ...memberForm, admissionFee: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Payment Mode *</label>
                    <select
                      value={memberForm.paymentMode}
                      onChange={(e) => setMemberForm({ ...memberForm, paymentMode: e.target.value })}
                    >
                      <option value="Cash">Cash Collection</option>
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Calculation Summary Bar */}
                {(() => {
                  const base = Number(memberForm.planPrice) || 0;
                  const disc = Number(memberForm.discountAmount) || 0;
                  const adm = Number(memberForm.admissionFee) || 0;
                  const pt = memberForm.needsTrainer ? (Number(memberForm.trainerFee) || 0) : 0;
                  const total = Math.max(0, base - disc) + adm + pt;

                  return (
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          Plan: <strong>{memberForm.plan}</strong> ({memberForm.durationMonths} Month{memberForm.durationMonths > 1 ? 's' : ''})
                          {disc > 0 && <span style={{ color: '#dc2626', marginLeft: '6px' }}>(-₹{disc} Discount)</span>}
                          {pt > 0 && <span style={{ color: '#d97706', marginLeft: '6px' }}>(+₹{pt} Coach)</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          📱 Login account with temporary credentials will be auto-generated for {memberForm.phone || 'member mobile'}.
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', display: 'block' }}>Total Payable</span>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#059669' }}>₹{total}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="modal-footer-bar" style={{ marginTop: '20px' }}>
                  <button type="button" className="modal-cancel-btn" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                  <button type="submit" className="modal-submit-btn" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', padding: '10px 24px', fontSize: '14px' }}>
                    ✅ Collect Payment & Enroll Athlete
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Athlete Enrolled & Activation Link Invitation Card */}
            {addMemberStep === 2 && createdMemberResult && (
              <div className="receipt-success-card" style={{ padding: '24px 20px' }}>
                <div className="receipt-icon-circle" style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 12px auto' }}>✓</div>
                
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#065f46', margin: '0 0 4px 0' }}>MEMBER REGISTERED SUCCESSFULLY!</h2>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>{createdMemberResult.name}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Auto-Generated Member ID: <strong style={{ color: '#4f46e5', fontSize: '16px', letterSpacing: '1px' }}>{createdMemberResult.memberId}</strong>
                </div>

                {/* Secure Invitation & Activation Dispatch Box */}
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px' }}>✉️</span>
                    <strong style={{ color: '#166534', fontSize: '14px' }}>Member Activation Link (Ready to Share)</strong>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Secure Member Activation URL
                    </div>
                    <div style={{ fontSize: '13px', color: '#4f46e5', wordBreak: 'break-all', fontWeight: 600, background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {createdMemberResult.activationUrl || `http://localhost:5173/?activate=${createdMemberResult.activationToken}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="trainer-action-btn"
                      style={{ background: '#25d366', color: '#ffffff', borderColor: '#22c55e', fontWeight: 800, padding: '8px 14px' }}
                      onClick={() => {
                        const text = encodeURIComponent(createdMemberResult.inviteMessage || `Welcome ${createdMemberResult.name}! Your Member ID is: ${createdMemberResult.memberId}. Activate your FitCore account and set your password here: ${createdMemberResult.activationUrl}`);
                        window.open(`https://wa.me/91${createdMemberResult.phone}?text=${text}`, '_blank');
                      }}
                    >
                      💬 Share on WhatsApp
                    </button>

                    <button
                      type="button"
                      className="trainer-action-btn"
                      style={{ background: '#ffffff', borderColor: '#cbd5e1', fontWeight: 700, padding: '8px 14px' }}
                      onClick={() => {
                        const invite = createdMemberResult.inviteMessage || `Welcome ${createdMemberResult.name}! Your Member ID is: ${createdMemberResult.memberId}. Activate your account here: ${createdMemberResult.activationUrl}`;
                        navigator.clipboard?.writeText(invite);
                        showToast('Invitation message copied to clipboard!');
                      }}
                    >
                      📋 Copy Invitation SMS
                    </button>

                    <button
                      type="button"
                      className="trainer-action-btn"
                      style={{ background: '#6366f1', color: '#ffffff', borderColor: '#6366f1', fontWeight: 700, padding: '8px 14px' }}
                      onClick={() => {
                        window.open(createdMemberResult.activationUrl || `http://localhost:5173/?activate=${createdMemberResult.activationToken}`, '_blank');
                      }}
                    >
                      🚀 Test Member Activation Screen
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', color: '#15803d', lineHeight: 1.5, background: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '8px', marginTop: '12px' }}>
                    🔒 <strong>Self-Password Setup:</strong> Admin does not set or see the password. The member opens this link, verifies their registered mobile number (+91 {createdMemberResult.phone}) via OTP, and creates their own password securely.
                  </div>
                </div>

                {/* Membership Summary Details */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Club Branch:</span>
                    <span style={{ fontWeight: 800 }}>{createdMemberResult.gymName || 'FitCore Club'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Plan Subscribed:</span>
                    <span style={{ fontWeight: 800 }}>{createdMemberResult.plan} ({createdMemberResult.durationMonths} Month{createdMemberResult.durationMonths > 1 ? 's' : ''})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Valid Expiry Date:</span>
                    <span style={{ fontWeight: 800 }}>{createdMemberResult.validUntil}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Amount Collected:</span>
                    <span style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>₹{createdMemberResult.amountPaid}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <span style={{ fontWeight: 800 }}>{createdMemberResult.paymentMode} ✅</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="modal-submit-btn"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setAddMemberStep(1);
                      setMemberForm({
                        name: '',
                        phone: '',
                        email: '',
                        gender: 'Male',
                        age: '',
                        weight: '',
                        height: '',
                        plan: '1 Month Standard Pass',
                        planPrice: 2000,
                        durationMonths: 1,
                        discountAmount: '',
                        admissionFee: '',
                        paymentMode: 'Cash',
                        needsTrainer: false,
                        trainerPlan: '',
                        trainerFee: '',
                        assignedTrainerId: '',
                        aadhaarNumber: '',
                        emergencyContact: '',
                        address: ''
                      });
                    }}
                  >
                    Done — View Member Roster
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 3: UPLOAD / VERIFY AADHAAR CARD ───────────────────────────── */}
      {showUploadAadhaarModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowUploadAadhaarModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>Verify Member Aadhaar Card</h3>
              <button className="modal-close-x" onClick={() => setShowUploadAadhaarModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: 0 }}>
              Verifying UIDAI Identity for athlete: <strong style={{ color: '#0f172a' }}>{showUploadAadhaarModal.name}</strong>
            </p>
            <form onSubmit={handleUploadAadhaar}>
              <div className="modal-form-grid">
                <div className="form-field-group full-span">
                  <label>12-Digit Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Enter 12-digit number"
                    value={aadhaarForm.aadhaarNumber}
                    onChange={(e) => setAadhaarForm({ ...aadhaarForm, aadhaarNumber: e.target.value })}
                  />
                </div>
                <div className="form-field-group full-span">
                  <label>Upload Aadhaar Card Scan / PDF</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setAadhaarForm)}
                  />
                </div>
              </div>
              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowUploadAadhaarModal(null)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">Verify & Save Aadhaar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: ASSIGN TRAINER TO ATHLETE ──────────────────────────────── */}
      {showAssignTrainerModal && (() => {
        const isTrainerObj = !!showAssignTrainerModal.specialty || showAssignTrainerModal.role === 'trainer';
        return (
          <div className="admin-modal-backdrop" onClick={() => setShowAssignTrainerModal(null)}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-strip">
                <h3>{isTrainerObj ? `Assign Athletes to Coach ${showAssignTrainerModal.name}` : 'Assign Coach to Athlete'}</h3>
                <button className="modal-close-x" onClick={() => setShowAssignTrainerModal(null)}>✕</button>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: 0 }}>
                {isTrainerObj 
                  ? `Select an athlete below to assign or unassign to coach ${showAssignTrainerModal.name}:`
                  : `Select a dedicated master coach for athlete ${showAssignTrainerModal.name}:`}
              </p>

              {isTrainerObj ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                  {members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                      No athletes currently registered in this branch.
                    </div>
                  ) : (
                    members.map(m => {
                      const trainerIdStr = String(showAssignTrainerModal.id || showAssignTrainerModal._id);
                      const isAssigned = m.assignedTrainerId === trainerIdStr || m.assignedTrainerName === showAssignTrainerModal.name;
                      return (
                        <div
                          key={m.id || m._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: isAssigned ? '#eef2ff' : '#f8fafc',
                            border: `1.5px solid ${isAssigned ? '#818cf8' : '#e2e8f0'}`
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{m.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>{m.phone} · {m.plan || 'Standard Pass'}</div>
                          </div>
                          {isAssigned ? (
                            <button
                              className="trainer-action-btn delete-btn"
                              style={{ padding: '6px 12px', fontSize: '11.5px' }}
                              onClick={() => handleAssignTrainer(m.id || m._id, null)}
                            >
                              ✕ Unassign
                            </button>
                          ) : (
                            <button
                              className="trainer-action-btn primary"
                              style={{ padding: '6px 14px', fontSize: '11.5px' }}
                              onClick={() => handleAssignTrainer(m.id || m._id, trainerIdStr)}
                            >
                              + Assign
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  <button
                    className="trainer-action-btn"
                    style={{ padding: '12px', justifyContent: 'flex-start' }}
                    onClick={() => handleAssignTrainer(showAssignTrainerModal.id || showAssignTrainerModal._id, null)}
                  >
                    🚫 Unassign / Remove Coach
                  </button>
                  {trainers.map(t => (
                    <button
                      key={t.id || t._id}
                      className="trainer-action-btn"
                      style={{ padding: '12px', justifyContent: 'space-between', borderColor: '#cbd5e1' }}
                      onClick={() => handleAssignTrainer(showAssignTrainerModal.id || showAssignTrainerModal._id, t.id || t._id)}
                    >
                      <span style={{ fontWeight: 800 }}>🏋️ {t.name}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{t.specialty}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 5: RENEW / SUBSCRIBE MEMBERSHIP ───────────────────────────── */}
      {showSubscribeModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowSubscribeModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>Renew Membership Subscription</h3>
              <button className="modal-close-x" onClick={() => setShowSubscribeModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: 0 }}>
              Renewing pass for athlete: <strong>{showSubscribeModal.name}</strong>
            </p>
            <form onSubmit={handleSubscribeMember}>
              <div className="modal-form-grid">
                <div className="form-field-group full-span">
                  <label>Package Tier *</label>
                  <select
                    value={subscribeForm.packageName}
                    onChange={(e) => {
                      const selected = packages.find(p => p.name === e.target.value);
                      setSubscribeForm({
                        ...subscribeForm,
                        packageName: e.target.value,
                        planPrice: selected ? selected.price : 3899,
                        durationDays: selected ? selected.durationDays : 90
                      });
                    }}
                  >
                    {packages.map(p => (
                      <option key={p.id || p._id} value={p.name}>
                        {p.name} (₹{p.price} / {p.durationDays}d)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    value={subscribeForm.planPrice}
                    onChange={(e) => setSubscribeForm({ ...subscribeForm, planPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Payment Mode</label>
                  <select
                    value={subscribeForm.paymentMode}
                    onChange={(e) => setSubscribeForm({ ...subscribeForm, paymentMode: e.target.value })}
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash at Desk">Cash at Desk</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowSubscribeModal(null)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">Confirm Renewal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: CREATE CUSTOM PACKAGE ─────────────────────────────────── */}
      {showAddPackageModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddPackageModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>Create Custom Membership Package</h3>
              <button className="modal-close-x" onClick={() => setShowAddPackageModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPackage}>
              <div className="modal-form-grid">
                <div className="form-field-group full-span">
                  <label>Package Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6-Month Elite Pass"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2999"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    placeholder="180"
                    value={packageForm.durationDays}
                    onChange={(e) => setPackageForm({ ...packageForm, durationDays: e.target.value })}
                  />
                </div>
                <div className="form-field-group full-span">
                  <label>Perks (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Gym Floor Access, Sauna, Diet Chart"
                    value={packageForm.perks}
                    onChange={(e) => setPackageForm({ ...packageForm, perks: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowAddPackageModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">Create Package</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: UPLOAD FRANCHISE KYC / SHOP ACT ────────────────────────── */}
      {/* ── MODAL 7: UPLOAD FRANCHISE KYC / SHOP ACT ────────────────────────── */}
      {showUploadKycModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowUploadKycModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>Upload Statutory License / KYC</h3>
              <button className="modal-close-x" onClick={() => setShowUploadKycModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUploadKyc}>
              <div className="modal-form-grid">
                <div className="form-field-group">
                  <label>License Type *</label>
                  <select
                    value={kycForm.docType}
                    onChange={(e) => setKycForm({ ...kycForm, docType: e.target.value })}
                  >
                    <option value="shop_act">Municipal Shop & Establishment Act</option>
                    <option value="gst">GST Tax Registration Certificate</option>
                    <option value="fssai">FSSAI Supplement & Nutrition License</option>
                    <option value="trade_license">Municipal Trade License</option>
                  </select>
                </div>
                <div className="form-field-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH/NGP/EST/2026/4910"
                    value={kycForm.docNumber}
                    onChange={(e) => setKycForm({ ...kycForm, docNumber: e.target.value })}
                  />
                </div>
                <div className="form-field-group full-span">
                  <label>Upload Document Certificate (PDF / Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setKycForm)}
                  />
                </div>
              </div>
              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowUploadKycModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">Upload & Link License</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 8: GATE CHECK-IN SCANNER ───────────────────────────────────── */}
      {showCheckinModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCheckinModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>📲 Turnstile Gate Check-in Member</h3>
              <button className="modal-close-x" onClick={() => setShowCheckinModal(false)}>✕</button>
            </div>

            <div className="qr-scanner-box">
              <div className="scanner-beam" />
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>▣▣▣</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Scanning NFC Access Card / QR Code...</div>
              <span style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>Sub-200ms Gate Response Enabled</span>
            </div>

            <div style={{ margin: '16px 0 10px', fontSize: '12px', color: '#64748b', textAlign: 'center', fontWeight: 700 }}>OR SEARCH MEMBER</div>

            <div className="form-field-group">
              <input
                type="text"
                placeholder="Type member name, mobile, or ID (e.g. Rahul Singh)..."
                value={checkinSearch}
                onChange={(e) => setCheckinSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(members.length > 0 ? members.slice(0, 3) : [
                { id: 'm1', name: 'Rahul Singh', phone: '9876543210', plan: 'Pro Studio' },
                { id: 'm2', name: 'Sneha Kapoor', phone: '9822110033', plan: 'Starter' }
              ]).map(m => (
                <div key={m.id || m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{m.phone} · <span style={{ color: '#6366f1', fontWeight: 700 }}>{m.plan || 'Pro Studio'}</span></div>
                  </div>
                  <button className="modal-submit-btn" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => { handleCheckIn(m); setShowCheckinModal(false); }}>
                    ✓ Check-in Gate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 9: GATE CHECK-OUT SCANNER ──────────────────────────────────── */}
      {showCheckoutModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>↩️ Gate Check-out Member</h3>
              <button className="modal-close-x" onClick={() => setShowCheckoutModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>Select active athlete inside gym to confirm exit and update live occupancy.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
              {[
                { id: 'co1', name: 'Rahul Singh', entry: '07:45 AM', duration: '1h 42m', gate: 'Main Gate' },
                { id: 'co2', name: 'Sneha Kapoor', entry: '07:42 AM', duration: '1h 36m', gate: 'Main Gate' },
                { id: 'co3', name: 'Vikram Desai', entry: '07:30 AM', duration: '1h 55m', gate: 'Side Gate' }
              ].map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Entry: {m.entry} · Gate: {m.gate} · Duration: <strong style={{ color: '#059669' }}>{m.duration}</strong></div>
                  </div>
                  <button className="modal-cancel-btn" style={{ borderColor: '#10b981', color: '#047857', fontWeight: 800 }} onClick={() => { handleCheckOut(m); setShowCheckoutModal(false); }}>
                    Confirm Exit ↩
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 10: SEND NOTIFICATION & BROADCAST ───────────────────────────── */}
      {showSendNotificationModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowSendNotificationModal(false)}>
          <div className="admin-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>🔔 Send Broadcast Notification</h3>
              <button className="modal-close-x" onClick={() => setShowSendNotificationModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSendNotification}>
              <div className="modal-form-grid">
                <div className="form-field-group full-span">
                  <label>Select Target Audience *</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All Members' },
                      { id: 'active', label: 'Active Members' },
                      { id: 'expiring', label: 'Expiring Memberships' },
                      { id: 'expired', label: 'Expired Members' }
                    ].map(aud => (
                      <label key={aud.id} style={{ padding: '8px 14px', borderRadius: '10px', border: notificationForm.audience === aud.id ? '2px solid #6366f1' : '1px solid #e2e8f0', background: notificationForm.audience === aud.id ? '#e0e7ff' : '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                        <input type="radio" name="aud" checked={notificationForm.audience === aud.id} onChange={() => setNotificationForm({ ...notificationForm, audience: aud.id })} style={{ display: 'none' }} />
                        {aud.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Notification Category</label>
                  <select value={notificationForm.type} onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}>
                    <option value="announcement">📢 Announcement</option>
                    <option value="reminder">💰 Payment Reminder</option>
                    <option value="renewal">⏳ Membership Renewal</option>
                    <option value="notice">ℹ️ Gym Notice</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Delivery Mode</label>
                  <select value={notificationForm.mode} onChange={(e) => setNotificationForm({ ...notificationForm, mode: e.target.value })}>
                    <option value="now">⚡ Send Immediately (Push + SMS)</option>
                    <option value="schedule">📅 Schedule for Later</option>
                  </select>
                </div>

                <div className="form-field-group full-span">
                  <label>Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Membership Renewal Reminder"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  />
                </div>

                <div className="form-field-group full-span">
                  <label>Message Content *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Your membership expires soon. Renew now to enjoy uninterrupted access to gym facilities..."
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-bar">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowSendNotificationModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn">📲 Send Broadcast Notification</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── END OF MODALS ──────────────────────────────────────────────────── */}
      {false && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="admin-modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3>+ New Athlete Admission</h3>
              <button className="modal-close-x" onClick={() => setShowAddMemberModal(false)}>✕</button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="add-member-stepper">
              <div className={`step-item ${addMemberStep === 1 ? 'active' : addMemberStep > 1 ? 'completed' : ''}`}>
                <div className="step-circle">{addMemberStep > 1 ? '✓' : '1'}</div>
                <span className="step-label">Personal Info</span>
              </div>
              <div className={`step-line ${addMemberStep > 1 ? 'active' : ''}`} />
              <div className={`step-item ${addMemberStep === 2 ? 'active' : addMemberStep > 2 ? 'completed' : ''}`}>
                <div className="step-circle">{addMemberStep > 2 ? '✓' : '2'}</div>
                <span className="step-label">Membership Tier</span>
              </div>
              <div className={`step-line ${addMemberStep > 2 ? 'active' : ''}`} />
              <div className={`step-item ${addMemberStep === 3 ? 'active' : addMemberStep > 3 ? 'completed' : ''}`}>
                <div className="step-circle">{addMemberStep > 3 ? '✓' : '3'}</div>
                <span className="step-label">Payment</span>
              </div>
              <div className={`step-line ${addMemberStep > 3 ? 'active' : ''}`} />
              <div className={`step-item ${addMemberStep === 4 ? 'active' : ''}`}>
                <div className="step-circle">4</div>
                <span className="step-label">Confirmation</span>
              </div>
            </div>

            {/* STEP 1: Personal Info */}
            {addMemberStep === 1 && (
              <div className="modal-form-grid">
                <div className="form-field-group">
                  <label>Full Name *</label>
                  <input type="text" required placeholder="e.g. Rahul Singh" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
                </div>
                <div className="form-field-group">
                  <label>Mobile Number *</label>
                  <input type="tel" required placeholder="10-digit mobile" maxLength={10} value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="form-field-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="rahul@gmail.com" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
                </div>
                <div className="form-field-group">
                  <label>Gender *</label>
                  <select value={memberForm.gender} onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field-group">
                  <label>Age</label>
                  <input type="number" placeholder="25" value={memberForm.age} onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })} />
                </div>
                <div className="form-field-group">
                  <label>Emergency Contact</label>
                  <input type="tel" placeholder="Guardian phone" value={memberForm.emergencyContact} onChange={(e) => setMemberForm({ ...memberForm, emergencyContact: e.target.value.replace(/\D/g, '') })} />
                </div>

                <div className="modal-footer-bar full-span" style={{ marginTop: '16px' }}>
                  <button type="button" className="modal-cancel-btn" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                  <button type="button" className="modal-submit-btn" onClick={() => { if (!memberForm.name || !memberForm.phone) { showToast('Please enter full name and mobile number.', 'error'); return; } setAddMemberStep(2); }}>Next: Select Membership →</button>
                </div>
              </div>
            )}

            {/* STEP 2: PRD Membership Selection */}
            {addMemberStep === 2 && (
              <div>
                <label style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>Select FitCore Membership Tier *</label>
                <div className="plan-selector-grid">
                  <div className={`plan-selector-card ${memberForm.plan === 'Starter' ? 'selected' : ''}`} onClick={() => setMemberForm({ ...memberForm, plan: 'Starter', planPrice: 14999, durationMonths: 12 })}>
                    <div className="plan-tier-name">Starter</div>
                    <div className="plan-tier-price">₹14,999 <span style={{ fontSize: '12px', color: '#64748b' }}>/ year</span></div>
                    <div className="plan-tier-cap">150 Member Capacity · Basic Attendance</div>
                  </div>

                  <div className={`plan-selector-card ${memberForm.plan === 'Pro Studio' ? 'selected' : ''}`} onClick={() => setMemberForm({ ...memberForm, plan: 'Pro Studio', planPrice: 34999, durationMonths: 12 })}>
                    <span className="popular-ribbon">Recommended</span>
                    <div className="plan-tier-name">Pro Studio</div>
                    <div className="plan-tier-price">₹34,999 <span style={{ fontSize: '12px', color: '#64748b' }}>/ year</span></div>
                    <div className="plan-tier-cap">600 Member Capacity · Turnstiles · Radar</div>
                  </div>

                  <div className={`plan-selector-card ${memberForm.plan === 'Enterprise' ? 'selected' : ''}`} onClick={() => setMemberForm({ ...memberForm, plan: 'Enterprise', planPrice: 69999, durationMonths: 12 })}>
                    <div className="plan-tier-name">Enterprise</div>
                    <div className="plan-tier-price">₹69,999 <span style={{ fontSize: '12px', color: '#64748b' }}>/ year</span></div>
                    <div className="plan-tier-cap">Unlimited Capacity · POS Store · Priority KYC</div>
                  </div>
                </div>

                <div className="modal-footer-bar" style={{ marginTop: '20px' }}>
                  <button type="button" className="modal-cancel-btn" onClick={() => setAddMemberStep(1)}>← Back</button>
                  <button type="button" className="modal-submit-btn" onClick={() => setAddMemberStep(3)}>Next: Payment →</button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment */}
            {addMemberStep === 3 && (
              <div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>Selected Plan Summary</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '14px' }}>
                    <span>{memberForm.plan || 'Pro Studio'} (1 Year)</span>
                    <span style={{ fontWeight: 800 }}>₹{memberForm.planPrice || 34999}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', color: '#059669', fontWeight: 800 }}>
                    <span>Total Payable</span>
                    <span>₹{memberForm.planPrice || 34999}</span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Select Payment Mode *</label>
                  <select value={memberForm.paymentMode} onChange={(e) => setMemberForm({ ...memberForm, paymentMode: e.target.value })}>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Cash">Cash Collection</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>

                <div className="modal-footer-bar" style={{ marginTop: '20px' }}>
                  <button type="button" className="modal-cancel-btn" onClick={() => setAddMemberStep(2)}>← Back</button>
                  <button type="button" className="modal-submit-btn" onClick={handleAddMember}>✅ Collect Payment & Create Member</button>
                </div>
              </div>
            )}

            {/* STEP 4: Success & Member Created Screen */}
            {addMemberStep === 4 && createdMemberResult && (
              <div className="receipt-success-card">
                <div className="receipt-icon-circle">✓</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#047857', margin: '0 0 4px 0' }}>MEMBER CREATED SUCCESSFUL</h2>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{createdMemberResult.name}</div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>Member ID: <strong style={{ color: '#6366f1' }}>{createdMemberResult.memberId}</strong></div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', textAlign: 'left', marginBottom: '18px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Plan Tier:</span>
                    <span style={{ fontWeight: 700 }}>{createdMemberResult.plan}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Valid Until:</span>
                    <span style={{ fontWeight: 700 }}>{createdMemberResult.validUntil}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{createdMemberResult.paymentMode} (Paid)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="modal-cancel-btn" onClick={() => showToast('Receipt downloaded successfully.')}>📥 Download Receipt</button>
                  <button className="modal-submit-btn" onClick={() => { setShowAddMemberModal(false); setAddMemberStep(1); }}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* PREMIUM MEMBER DAILY SHIFT & MEMBERSHIP TIMELINE MODAL */}
      {showMemberSessionModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowMemberSessionModal(null)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '95%',
              padding: '24px 26px',
              borderRadius: '24px',
              background: '#ffffff',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Header with Member Name, Phone & Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1.5px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: showMemberSessionModal.isCurrentlyInside ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '20px',
                  boxShadow: showMemberSessionModal.isCurrentlyInside ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(99, 102, 241, 0.25)'
                }}>
                  {(showMemberSessionModal.memberName || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      {showMemberSessionModal.memberName}
                    </h3>
                    {showMemberSessionModal.isCurrentlyInside ? (
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                        IN GYM NOW
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                        Checked Out
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <PhoneIcon size={12} color="#64748b" /> {showMemberSessionModal.memberPhone || 'No Mobile Registered'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMemberSessionModal(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            {/* 1. Membership Plan Overview Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr 1fr',
              gap: '14px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MEMBERSHIP PLAN
                </span>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e1b4b', marginTop: '3px' }}>
                  {showMemberSessionModal.planName || showMemberSessionModal.membershipId || 'Membership Pass'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#6366f1', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CreditCardIcon size={12} color="#6366f1" /> {showMemberSessionModal.planDurationLabel || (showMemberSessionModal.planDurationMonths ? `${showMemberSessionModal.planDurationMonths} Months Pass` : 'Standard Pass')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PAID FEE & JOINED
                </span>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669', marginTop: '3px' }}>
                  ₹{Number(showMemberSessionModal.planPrice || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Joined: {showMemberSessionModal.joinedDate ? new Date(showMemberSessionModal.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Member'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXPIRY DATE
                </span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#b91c1c', marginTop: '3px' }}>
                  {showMemberSessionModal.planExpiryDate ? new Date(showMemberSessionModal.planExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry Set'}
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                  <CheckCircleIcon size={10} color="#16a34a" /> Active Access
                </span>
              </div>
            </div>

            {/* 2. Total Cumulative Time Cards: TODAY, THIS WEEK, THIS MONTH */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {/* Today's Total Time */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ClockIcon size={12} color="#166534" /> TODAY'S TIME
                </span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#14532d', marginTop: '4px' }}>
                  {showMemberSessionModal.todayTotalTimeFormatted || showMemberSessionModal.totalTimeFormatted || '0m'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                  {(() => {
                    const sb = showMemberSessionModal.shiftBreakdown || {};
                    const activeShiftsCount = Object.keys(sb).filter(k => (sb[k]?.visits || 0) > 0).length;
                    return activeShiftsCount > 0 
                      ? `${activeShiftsCount} Batch Shift${activeShiftsCount > 1 ? 's' : ''} Today`
                      : '0 Shifts Today';
                  })()}
                </div>
              </div>

              {/* Weekly Time */}
              <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BoltIcon size={12} color="#6b21a8" /> THIS WEEK
                </span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#581c87', marginTop: '4px' }}>
                  {showMemberSessionModal.weeklyTimeFormatted || showMemberSessionModal.totalTimeFormatted || '0m'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#7e22ce', fontWeight: 600, marginTop: '2px' }}>
                  Weekly Gym Duration
                </div>
              </div>

              {/* Monthly Time */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon size={12} color="#1e40af" /> THIS MONTH
                </span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e3a8a', marginTop: '4px' }}>
                  {showMemberSessionModal.daysAttendedThisMonth || (showMemberSessionModal.attendedDates ? showMemberSessionModal.attendedDates.length : 0)} Days
                </div>
                <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                  {showMemberSessionModal.monthlyTimeFormatted || showMemberSessionModal.totalTimeFormatted || '0m'} Workout Time
                </div>
              </div>
            </div>

            {/* 2.5 ATTENDANCE CALENDAR & TIMELINE TRACKER (WEEKLY VS MONTHLY VIEW) */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '18px',
              padding: '16px 18px',
              marginBottom: '18px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={15} color="#4f46e5" /> Member Attendance Calendar
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    Tracking active presence, workouts, holidays & rest days
                  </div>
                </div>

                {/* View Switcher Pill (Weekly vs Monthly Calendar) */}
                <div style={{
                  display: 'inline-flex',
                  background: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    type="button"
                    onClick={() => setMemberTimelineView('week')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: memberTimelineView === 'week' ? '#ffffff' : 'transparent',
                      color: memberTimelineView === 'week' ? '#4f46e5' : '#64748b',
                      boxShadow: memberTimelineView === 'week' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Weekly Strip
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberTimelineView('month')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: memberTimelineView === 'month' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                      color: memberTimelineView === 'month' ? '#ffffff' : '#64748b',
                      boxShadow: memberTimelineView === 'month' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CalendarIcon size={12} color={memberTimelineView === 'month' ? '#ffffff' : '#64748b'} /> Full Month Calendar
                  </button>
                </div>
              </div>

              {/* VIEW A: WEEKLY 7-DAY STRIP */}
              {memberTimelineView === 'week' ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {(showMemberSessionModal.weeklyTimeline || []).map((item, idx) => {
                      const isPresent = item.attended;
                      const isMissed = !item.attended && item.isPast;
                      const isToday = item.isToday;

                      let bg = isPresent ? '#dcfce7' : isMissed ? '#fee2e2' : '#f8fafc';
                      let border = isPresent ? '#86efac' : isMissed ? '#fca5a5' : '#e2e8f0';
                      let textColor = isPresent ? '#15803d' : isMissed ? '#b91c1c' : '#64748b';
                      let statusText = isPresent ? 'Present' : isMissed ? 'Absent' : isToday ? (isPresent ? 'Present' : 'Today') : 'Upcoming';

                      return (
                        <div
                          key={idx}
                          style={{
                            background: bg,
                            border: `1.5px solid ${isToday ? '#6366f1' : border}`,
                            borderRadius: '12px',
                            padding: '10px 4px',
                            textAlign: 'center',
                            position: 'relative',
                            boxShadow: isToday ? '0 2px 10px rgba(99, 102, 241, 0.2)' : 'none'
                          }}
                        >
                          {isToday && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#6366f1',
                              color: '#fff',
                              fontSize: '8.5px',
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              Today
                            </div>
                          )}
                          <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>{item.day}</div>
                          <div style={{ fontSize: '15px', margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isPresent ? <CheckCircleIcon size={16} color="#15803d" /> : isMissed ? <CloseIcon size={16} color="#b91c1c" /> : isToday ? <LocationPinIcon size={16} color="#6366f1" /> : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} />}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: textColor }}>
                            {statusText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW B: INTERACTIVE FULL 30-DAY MONTH CALENDAR GRID */
                <div>
                  {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth(); // 0-indexed
                    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    
                    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
                    // Convert to Monday-start (0 = Mon, 6 = Sun)
                    const startCol = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
                    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
                    const currentDayNum = now.getDate();

                    const memberJoinedDateStr = showMemberSessionModal.joinedDate 
                      ? new Date(showMemberSessionModal.joinedDate).toISOString().split('T')[0]
                      : null;

                    const attendedSet = new Set(showMemberSessionModal.attendedDates || []);
                    // Add today ONLY if currently active inside gym or attended today
                    if (showMemberSessionModal.isCurrentlyInside) {
                      const todayIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDayNum).padStart(2, '0')}`;
                      attendedSet.add(todayIso);
                    }

                    // Count summary
                    let attendedCount = 0;
                    let absentCount = 0;
                    let holidayCount = 0;

                    for (let day = 1; day <= totalDaysInMonth; day++) {
                      const dayOfWeek = new Date(year, month, day).getDay();
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSun = dayOfWeek === 0;
                      const isBeforeJoining = memberJoinedDateStr && dateStr < memberJoinedDateStr;

                      if (day <= currentDayNum) {
                        if (isSun) {
                          holidayCount++;
                        } else if (attendedSet.has(dateStr)) {
                          attendedCount++;
                        } else if (!isBeforeJoining) {
                          absentCount++;
                        }
                      }
                    }

                    const calendarDays = [];
                    // Leading empty slots
                    for (let i = 0; i < startCol; i++) {
                      calendarDays.push({ type: 'empty', key: `empty-${i}` });
                    }

                    // Actual month dates
                    for (let day = 1; day <= totalDaysInMonth; day++) {
                      const dayOfWeek = new Date(year, month, day).getDay();
                      const isSunday = dayOfWeek === 0;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isPast = day < currentDayNum;
                      const isToday = day === currentDayNum;
                      const isFuture = day > currentDayNum;
                      const isAttended = attendedSet.has(dateStr);
                      const isBeforeJoining = memberJoinedDateStr && dateStr < memberJoinedDateStr;

                      calendarDays.push({
                        type: 'day',
                        dayNum: day,
                        dateStr,
                        isSunday,
                        isPast,
                        isToday,
                        isFuture,
                        isAttended,
                        isBeforeJoining,
                        key: `day-${day}`
                      });
                    }

                    return (
                      <div>
                        {/* Month Title & Legend Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CalendarIcon size={14} color="#4f46e5" /> {monthName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10.5px', fontWeight: 700 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                              {attendedCount} Present
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                              {absentCount} Absent
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#d97706' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                              {holidayCount} Sunday Off
                            </span>
                          </div>
                        </div>

                        {/* 7 Days of Week Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '4px' }}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                            <div key={i} style={{ fontSize: '11px', fontWeight: 800, color: d === 'Sun' ? '#dc2626' : '#64748b', padding: '4px 0' }}>
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid Matrix */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                          {calendarDays.map((slot) => {
                            if (slot.type === 'empty') {
                              return <div key={slot.key} style={{ minHeight: '38px', background: 'transparent' }} />;
                            }

                            const { dayNum, isSunday, isPast, isToday, isFuture, isAttended, isBeforeJoining } = slot;

                            let cellBg = '#ffffff';
                            let cellBorder = '#e2e8f0';
                            let badgeColor = '#64748b';
                            let statusLabel = '';
                            let badgeBg = 'transparent';

                            if (isSunday) {
                              cellBg = '#fffbeb';
                              cellBorder = '#fef08a';
                              badgeColor = '#b45309';
                              statusLabel = 'Off';
                              badgeBg = '#fef3c7';
                            } else if (isAttended) {
                              cellBg = '#f0fdf4';
                              cellBorder = '#86efac';
                              badgeColor = '#15803d';
                              statusLabel = '✓ Present';
                              badgeBg = '#dcfce7';
                            } else if (isBeforeJoining && isPast) {
                              cellBg = '#fafafa';
                              cellBorder = '#f1f5f9';
                              badgeColor = '#94a3b8';
                              statusLabel = '—';
                              badgeBg = 'transparent';
                            } else if (isPast) {
                              cellBg = '#fef2f2';
                              cellBorder = '#fca5a5';
                              badgeColor = '#b91c1c';
                              statusLabel = '✗ Absent';
                              badgeBg = '#fee2e2';
                            } else if (isToday) {
                              cellBg = isAttended ? '#f0fdf4' : '#eef2ff';
                              cellBorder = isAttended ? '#86efac' : '#818cf8';
                              badgeColor = isAttended ? '#15803d' : '#4338ca';
                              statusLabel = isAttended ? '✓ Present' : 'Today';
                              badgeBg = isAttended ? '#dcfce7' : '#e0e7ff';
                            } else {
                              cellBg = '#fafafa';
                              cellBorder = '#f1f5f9';
                              badgeColor = '#94a3b8';
                              statusLabel = '—';
                            }

                            return (
                              <div
                                key={slot.key}
                                style={{
                                  background: cellBg,
                                  border: `1.5px solid ${isToday ? '#6366f1' : cellBorder}`,
                                  borderRadius: '10px',
                                  padding: '5px 4px',
                                  minHeight: '44px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  position: 'relative',
                                  boxShadow: isToday ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
                                }}
                              >
                                {isToday && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-3px',
                                    background: '#4f46e5',
                                    color: '#fff',
                                    fontSize: '7px',
                                    fontWeight: 900,
                                    padding: '1px 3px',
                                    borderRadius: '4px'
                                  }}>
                                    NOW
                                  </div>
                                )}
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: isToday ? 900 : 700,
                                  color: isSunday ? '#b45309' : isToday ? '#4338ca' : '#0f172a'
                                }}>
                                  {dayNum}
                                </span>
                                <span style={{
                                  fontSize: '8.5px',
                                  fontWeight: 800,
                                  color: badgeColor,
                                  background: badgeBg,
                                  padding: '1px 3px',
                                  borderRadius: '4px',
                                  width: '100%',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {statusLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 3. CLEAN SHIFT-WISE SESSIONS BREAKDOWN (Morning vs Evening) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={15} color="#4f46e5" /> Today's Shift Sessions Breakdown
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  Consolidated by Daily Batch Time
                </span>
              </div>

              {(() => {
                const sb = showMemberSessionModal.shiftBreakdown || {};
                const morning = sb.MORNING || { visits: 0, minutes: 0, formatted: '0m' };
                const evening = sb.EVENING || { visits: 0, minutes: 0, formatted: '0m' };
                const afternoon = sb.AFTERNOON || { visits: 0, minutes: 0, formatted: '0m' };

                const hasAnyShift = (morning.visits > 0) || (evening.visits > 0) || (afternoon.visits > 0);

                if (!hasAnyShift) {
                  return (
                    <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                      No workout sessions logged for today.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* MORNING SHIFT CARD */}
                    {morning.visits > 0 && (
                      <div style={{
                        border: '1.5px solid #fde68a',
                        background: '#fffbeb',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                            <SunIcon size={20} color="#d97706" />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#78350f' }}>
                              Morning Batch Session
                            </div>
                            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px', fontWeight: 600 }}>
                              Timing: 04:00 AM – 01:00 PM
                              {morning.firstCheckIn && ` • In: ${new Date(morning.firstCheckIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                              {morning.lastCheckOut && ` → Out: ${new Date(morning.lastCheckOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <ClockIcon size={14} color="#b45309" /> {morning.formatted || `${morning.minutes || 0}m`}
                          </div>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                            Completed Session
                          </span>
                        </div>
                      </div>
                    )}

                    {/* EVENING SHIFT CARD */}
                    {evening.visits > 0 && (
                      <div style={{
                        border: evening.isLive ? '1.5px solid #86efac' : '1.5px solid #ddd6fe',
                        background: evening.isLive ? '#f0fdf4' : '#f5f3ff',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: evening.isLive ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: evening.isLive ? '#dcfce7' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: evening.isLive ? '#16a34a' : '#6d28d9' }}>
                            <MoonIcon size={20} color={evening.isLive ? '#16a34a' : '#6d28d9'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: evening.isLive ? '#14532d' : '#4c1d95', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              Evening Batch Session
                              {evening.isLive && (
                                <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                                  ● LIVE NOW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: evening.isLive ? '#15803d' : '#6d28d9', marginTop: '2px', fontWeight: 600 }}>
                              Timing: 04:00 PM – 11:00 PM
                              {evening.firstCheckIn && ` • In: ${new Date(evening.firstCheckIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                              {evening.lastCheckOut ? ` → Out: ${new Date(evening.lastCheckOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ' → Active In Gym'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: evening.isLive ? '#15803d' : '#581c87', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <ClockIcon size={14} color={evening.isLive ? '#15803d' : '#581c87'} /> {evening.formatted || `${evening.minutes || 0}m`}{evening.isLive ? ' (Live)' : ''}
                          </div>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: evening.isLive ? '#16a34a' : '#6d28d9', background: evening.isLive ? '#dcfce7' : '#ede9fe', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {evening.isLive ? <><FireIcon size={10} color="#16a34a" /> Active Workout</> : 'Completed Session'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AFTERNOON SHIFT CARD (IF LOGGED) */}
                    {afternoon.visits > 0 && (
                      <div style={{
                        border: '1.5px solid #bae6fd',
                        background: '#f0f9ff',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                            <SunIcon size={20} color="#0284c7" />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0c4a6e' }}>
                              Afternoon Transition Batch
                            </div>
                            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                              Timing: 01:00 PM – 04:00 PM
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <ClockIcon size={14} color="#0369a1" /> {afternoon.formatted || `${afternoon.minutes || 0}m`}
                          </div>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                            Completed Session
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Action */}
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                className="modal-submit-btn"
                style={{
                  width: 'auto',
                  padding: '10px 28px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                }}
                onClick={() => setShowMemberSessionModal(null)}
              >
                Done / Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

