import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  USERS, MEMBERS, GYMS,
  getMemberByPhone, getGymById,
  getVendorStoreByUserId, getTrainerByUserId,
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
  login: (phone: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  completeOnboarding: () => void;
  setAppReady: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const normalizeRole = (r?: string): Role => {
  if (!r) return 'member';
  const lower = r.toLowerCase();
  if (lower === 'owner' || lower === 'gym_owner' || lower === 'admin' || lower === 'gym_admin') return 'owner';
  if (lower === 'trainer') return 'trainer';
  if (lower === 'vendor') return 'vendor';
  return 'member';
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [currentVendor, setCurrentVendor] = useState<VendorStore | null>(null);
  const [currentTrainer, setCurrentTrainer] = useState<Trainer | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

  const login = (phone: string, password: string): { success: boolean; error?: string } => {
    // Find user by phone
    const user = USERS.find(u => u.phone === phone);

    if (!user) {
      // Allow any other number as member with Hello@123
      if (password !== 'Hello@123') {
        return { success: false, error: 'Invalid credentials.' };
      }
      // Guest member — use default gym
      const gym = GYMS[0];
      const guestUser: User = {
        id: `guest_${phone}`,
        name: 'Champion',
        phone,
        email: '',
        password: 'Hello@123',
        role: 'member',
        gymId: gym.id,
        avatar: phone.slice(-2).toUpperCase(),
      };
      setCurrentUser(guestUser);
      setCurrentGym(gym);
      setRole('member');
      setCurrentMember(null);
      setCurrentVendor(null);
      setCurrentTrainer(null);
      
      // Save session credentials
      AsyncStorage.setItem('user_phone', phone);
      AsyncStorage.setItem('user_password', password);
      
      return { success: true };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const effectiveRole = normalizeRole(user.role);
    const gym = user.gymId ? (getGymById(user.gymId) ?? GYMS[0]) : null;
    setCurrentUser({ ...user, role: effectiveRole });
    setCurrentGym(gym);
    setRole(effectiveRole);

    console.log('====================================================');
    console.log(`🔐 [LOGIN SUCCESS] User: "${user.name}" (${user.phone})`);
    console.log(`👑 [ROLE DETECTED] ➜ "${effectiveRole.toUpperCase()}" (original: ${user.role})`);
    console.log(`🏢 [GYM ATTACHED] ➜ "${gym?.name || 'Default Gym'}" (Gym ID: ${gym?.id || 'N/A'})`);
    console.log(`🧭 [NAVIGATION TARGET] ➜ Navigating to "${effectiveRole === 'owner' ? 'OwnerNavigator (Tabs + Dashboard)' : effectiveRole === 'trainer' ? 'TrainerNavigator' : effectiveRole === 'vendor' ? 'VendorNavigator' : 'MemberNavigator'}"`);
    console.log('====================================================');

    if (effectiveRole === 'member') {
      const member = getMemberByPhone(phone);
      setCurrentMember(member ?? null);
      setCurrentVendor(null);
      setCurrentTrainer(null);
    } else if (effectiveRole === 'vendor') {
      const vendorStore = getVendorStoreByUserId(user.id);
      setCurrentVendor(vendorStore ?? null);
      setCurrentMember(null);
      setCurrentTrainer(null);
    } else if (effectiveRole === 'trainer') {
      const trainerObj = getTrainerByUserId(user.id);
      setCurrentTrainer(trainerObj ?? null);
      setCurrentMember(null);
      setCurrentVendor(null);
    } else {
      setCurrentMember(null);
      setCurrentVendor(null);
      setCurrentTrainer(null);
    }

    // Save session credentials & authenticate with backend API
    AsyncStorage.setItem('user_phone', phone);
    AsyncStorage.setItem('user_password', password);
    apiService.login(phone, password).then((backendAuth: any) => {
      console.log('📡 [BACKEND AUTH SYNC RESULT]:', backendAuth);
      if (backendAuth?.user) {
        const backendRole = normalizeRole(backendAuth.user.role);
        setRole(backendRole);
        if (backendAuth.user.gymId) {
          const matchedGym = getGymById(backendAuth.user.gymId) || {
            id: backendAuth.user.gymId,
            name: backendAuth.gym?.name || 'Ayushi GYM',
            tagline: 'Premier Fitness & Health Center',
            rating: 4.9,
            address: backendAuth.gym?.address || 'Civil Lines, Nagpur',
            city: 'Nagpur, Maharashtra',
            phone: phone,
            email: backendAuth.user.email || '',
            openTime: '05:00 AM',
            closeTime: '10:00 PM',
            isOpen: true,
            ownerId: backendAuth.user.id,
            facilities: [],
            photos: [],
            subscriptionPlan: 'premium',
          };
          setCurrentGym(matchedGym as any);
        }
      }
    }).catch((err) => {
      console.log('⚠️ [BACKEND AUTH SYNC ERROR]:', err);
    });

    return { success: true };
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
