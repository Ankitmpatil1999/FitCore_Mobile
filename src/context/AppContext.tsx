import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  USERS, MEMBERS, GYMS,
  getMemberByPhone, getGymById,
  getVendorStoreByUserId, getTrainerByUserId,
  type User, type Member, type Gym, type Role, type VendorStore, type Trainer,
} from '../data/mockData';

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

    const gym = user.gymId ? (getGymById(user.gymId) ?? GYMS[0]) : null;
    setCurrentUser(user);
    setCurrentGym(gym);
    setRole(user.role);

    if (user.role === 'member') {
      const member = getMemberByPhone(phone);
      setCurrentMember(member ?? null);
      setCurrentVendor(null);
      setCurrentTrainer(null);
    } else if (user.role === 'vendor') {
      const vendorStore = getVendorStoreByUserId(user.id);
      setCurrentVendor(vendorStore ?? null);
      setCurrentMember(null);
      setCurrentTrainer(null);
    } else if (user.role === 'trainer') {
      const trainerObj = getTrainerByUserId(user.id);
      setCurrentTrainer(trainerObj ?? null);
      setCurrentMember(null);
      setCurrentVendor(null);
    } else {
      setCurrentMember(null);
      setCurrentVendor(null);
      setCurrentTrainer(null);
    }

    // Save session credentials
    AsyncStorage.setItem('user_phone', phone);
    AsyncStorage.setItem('user_password', password);

    return { success: true };
  };

  const logout = () => {
    // Clear session credentials
    AsyncStorage.removeItem('user_phone');
    AsyncStorage.removeItem('user_password');
    
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
