import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGymById,
  type User, type Member, type Gym, type Role, type VendorStore, type Trainer,
} from '../data/mockData';
import apiService from '../services/api';

// ─────────────────────────────────────────────
//  AppContext — global auth + session state
// ─────────────────────────────────────────────

interface AppContextValue {
  currentUser: User | null;
  currentMember: Member | null;
  currentGym: Gym | null;
  currentVendor: VendorStore | null;
  currentTrainer: Trainer | null;
  role: Role | null;
  isLoggedIn: boolean;
  isAppReady: boolean;
  hasSeenOnboarding: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: () => void;
  setAppReady: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function normalizeRole(role: string): Role {
  const r = (role || '').toLowerCase();
  if (['owner', 'gym_owner', 'admin', 'gym_admin'].includes(r)) return 'owner';
  if (['trainer', 'coach', 'instructor'].includes(r)) return 'trainer';
  if (['vendor', 'store_owner', 'seller'].includes(r)) return 'vendor';
  return 'member';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [currentVendor, setCurrentVendor] = useState<VendorStore | null>(null);
  const [currentTrainer, setCurrentTrainer] = useState<Trainer | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const isLoggingOutRef = useRef(false);

  // Auto Logout Handler when Gym Admin deletes or deactivates member account
  const handleAccountDeleted = (message?: string) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    
    logout();
    Alert.alert(
      'Account Removed',
      message || 'Your member account has been removed by the gym administration. You have been logged out.',
      [{ text: 'OK', onPress: () => { isLoggingOutRef.current = false; } }]
    );
  };

  useEffect(() => {
    apiService.setOnAccountDeleted(handleAccountDeleted);
    return () => {
      apiService.setOnAccountDeleted(null);
    };
  }, []);

  // Periodic Account Validity Check (Every 25s when user is logged in as Member)
  useEffect(() => {
    if (!currentUser || role !== 'member') return;

    const checkMemberStillActive = async () => {
      try {
        const memberId = currentMember?.userId || currentMember?.id || currentUser?.id || currentUser?.phone;
        if (!memberId) return;

        const res: any = await apiService.getMemberProfile(memberId);
        if (res?.isDeleted || res?.accountDeleted || (!res?.success && (res?.error?.includes('deleted') || res?.message?.includes('deleted')))) {
          handleAccountDeleted(res?.message);
        }
      } catch (err) {
        // Silently skip if network momentarily drops
      }
    };

    const interval = setInterval(checkMemberStillActive, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.phone, role, currentMember?.id]);

  // Load saved session + onboarding state on app startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedPhone, savedPassword, onboardingSeen] = await Promise.all([
          AsyncStorage.getItem('user_phone'),
          AsyncStorage.getItem('user_password'),
          AsyncStorage.getItem('has_seen_onboarding'),
        ]);

        if (onboardingSeen === 'true') {
          setHasSeenOnboarding(true);
        }

        if (savedPhone && savedPassword) {
          login(savedPhone, savedPassword);
        }
      } catch (e) {
        console.log('Error restoring session:', e);
      }
    };
    loadSession();
  }, []);

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Authenticate with backend API first (Live MongoDB database)
    try {
      const backendAuth = await apiService.login(phone, password);
      if (backendAuth && backendAuth.success && backendAuth.data) {
        const d = backendAuth.data;
        const u = d.user || d;
        const effectiveRole = normalizeRole(u.role || 'member');
        const gymId = u.gymId || d.gym?.id || d.gym?._id || '6aa652bf8907c1d97a7bc551';
        
        const matchedGym = {
          id: gymId,
          name: d.gym?.name || u.gymName || (getGymById(gymId)?.name) || 'FitCore Gym',
          tagline: d.gym?.tagline || 'Transform Your Body & Mind',
          rating: d.gym?.rating || 4.9,
          address: d.gym?.address || `${d.gym?.city || 'Civil Lines'}, Nagpur`,
          city: d.gym?.city || 'Nagpur, Maharashtra',
          phone: d.gym?.phone || phone,
          email: d.gym?.email || u.email || '',
          openTime: d.gym?.openTime || '05:00 AM',
          closeTime: d.gym?.closeTime || '10:00 PM',
          isOpen: true,
          ownerId: d.gym?.ownerId || u.id,
          facilities: d.gym?.facilities || [],
          photos: d.gym?.photos || [],
          subscriptionPlan: d.gym?.subscriptionPlan || 'premium',
        };

        const liveUser: User = {
          id: u.id || u._id || `user_${phone}`,
          name: u.name || 'FitCore Member',
          phone: u.phone || phone,
          email: u.email || '',
          password: password,
          role: effectiveRole,
          gymId: matchedGym.id,
          avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'FC'),
        };

        setCurrentUser(liveUser);
        setCurrentGym(matchedGym as any);
        setRole(effectiveRole);

        console.log('====================================================');
        console.log(`🔐 [BACKEND AUTH SUCCESS] User: "${u.name}" (${u.phone})`);
        console.log(`👑 [ROLE DETECTED] ➜ "${effectiveRole.toUpperCase()}" (raw: ${u.role})`);
        console.log('====================================================');

        if (effectiveRole === 'member') {
          const m = d.member;
          if (m) {
            const liveMember: Member = {
              id: m.id || m._id?.toString() || u.id,
              userId: m.userId || u.id,
              gymId: m.gymId || matchedGym.id,
              gymName: m.gymName || matchedGym.name,
              name: m.name || u.name,
              phone: m.phone || u.phone,
              email: m.email || u.email,
              age: m.age || undefined,
              height: m.height || undefined,
              weight: m.weight || undefined,
              bmi: m.bmi || undefined,
              goal: (m.goal || 'general_fitness') as any,
              medicalIssues: m.medicalIssues || 'None',
              emergencyContact: m.emergencyContact || '',
              emergencyPhone: m.emergencyPhone || '',
              planId: m.planId || 'p1',
              planName: (typeof m.plan === 'object' && m.plan !== null ? m.plan.name : m.plan) || (typeof m.planName === 'object' && m.planName !== null ? m.planName.name : m.planName) || '3 Months Pro Studio',
              status: 'active',
              joinDate: m.joinDate || m.startDate || '2026-09-01',
              startDate: m.startDate || m.joinedDate || '2026-09-01',
              expiryDate: m.expiryDate || '2026-12-12',
              trainerId: m.trainerId || '',
              photo: m.photo || '',
              dietGoal: m.dietGoal || '',
              attendanceCount: m.sessionsDone || 0,
              qrCode: `QR-${m.phone || phone}`,
            };
            setCurrentMember(liveMember);
          } else {
            const dynamicMember: Member = {
              id: u.id || u._id?.toString() || `m_${phone}`,
              userId: u.id || u._id?.toString() || `u_${phone}`,
              gymId: matchedGym.id,
              gymName: matchedGym.name,
              name: u.name || 'Athlete',
              phone: u.phone || phone,
              email: u.email || '',
              goal: 'general_fitness',
              medicalIssues: 'None',
              emergencyContact: '',
              emergencyPhone: '',
              planId: 'p1',
              planName: 'Standard Membership',
              status: 'active',
              joinDate: new Date().toISOString().split('T')[0],
              startDate: new Date().toISOString().split('T')[0],
              expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
              trainerId: '',
              photo: '',
              dietGoal: '',
              attendanceCount: 0,
              qrCode: `QR-${u.phone || phone}`,
            };
            setCurrentMember(dynamicMember);
          }
          setCurrentTrainer(null);
          setCurrentVendor(null);
        } else if (effectiveRole === 'trainer') {
          const liveTrainerJoinDate = u.joinDate || u.joiningDate || (u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-09-16');
          const trainerObj = {
            id: u.id || u._id?.toString() || 't_live',
            gymId: matchedGym.id,
            name: u.name || 'Coach',
            avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'KP'),
            specialization: u.specialization || u.specialty || 'CrossFit & Functional HIIT',
            experience: u.experience || '3+ years',
            salary: u.salary || '₹30,000/month',
            timings: u.timings || u.shift || '6:00 AM – 2:00 PM & 5:00 PM – 10:00 PM',
            available: true,
            assignedMemberIds: u.assignedMemberIds || [],
            certifications: u.certifications || 'CSCS / Certified Trainer',
            phone: u.phone || phone,
            joinDate: liveTrainerJoinDate,
          };
          setCurrentTrainer(trainerObj as any);
          setCurrentMember(null);
          setCurrentVendor(null);
        } else if (effectiveRole === 'vendor') {
          let vendorStore: any = null;
          try {
            const storeRes: any = await apiService.getVendorStore(u.id || u._id);
            if (storeRes?.success && storeRes.store) {
              vendorStore = storeRes.store;
            }
          } catch (e) {
            console.log('Vendor store fetch error:', e);
          }
          if (!vendorStore) {
            vendorStore = {
              id: u.id || u._id || 'vs1',
              userId: u.id || u._id,
              storeName: u.name || 'FitCore Nutrition & Supplements',
              tagline: 'Authentic Supplements & Gear',
              description: 'Official verified fitness supplements and sports gear vendor.',
              address: u.address || 'Civil Lines, Nagpur',
              city: u.city || 'Nagpur',
              state: u.state || 'Maharashtra',
              pincode: u.pincode || '440001',
              phone: u.phone || phone,
              email: u.email || '',
              rating: 4.8,
              totalOrders: 0,
              totalRevenue: 0,
              isApproved: true,
              isOpen: true,
            };
          }
          setCurrentVendor(vendorStore);
          setCurrentMember(null);
          setCurrentTrainer(null);
        } else {
          setCurrentMember(null);
          setCurrentVendor(null);
          setCurrentTrainer(null);
        }

        AsyncStorage.setItem('user_phone', phone);
        AsyncStorage.setItem('user_password', password);
        return { success: true };
      }
      return {
        success: false,
        error: backendAuth?.error || 'Invalid mobile number or password.',
      };
    } catch (backendErr: any) {
      console.log('⚠️ [BACKEND LOGIN ERROR]:', backendErr);
      return {
        success: false,
        error: backendErr?.message || 'Cannot connect to backend server. Please verify your connection.',
      };
    }
  };

  const logout = () => {
    // Clear session credentials
    AsyncStorage.removeItem('user_phone');
    AsyncStorage.removeItem('user_password');
    apiService.setToken(null);
    
    setCurrentUser(null);
    setCurrentMember(null);
    setCurrentGym(null);
    setCurrentVendor(null);
    setCurrentTrainer(null);
    setRole(null);
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem('has_seen_onboarding', 'true');
  };

  const setAppReadyFn = () => {
    setIsAppReady(true);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentMember,
        currentGym,
        currentVendor,
        currentTrainer,
        role,
        isLoggedIn: !!currentUser,
        isAppReady,
        hasSeenOnboarding,
        login,
        logout,
        completeOnboarding,
        setAppReady: setAppReadyFn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
