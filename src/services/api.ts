/**
 * FitCore API Service Bridge
 * Connects FitCore Mobile App to FitCoreB Backend API
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Candidate URLs for Android physical device (ADB reverse / Wi-Fi IP) & Android Studio Emulator
const CANDIDATE_URLS = Platform.OS === 'android'
  ? [
      'http://localhost:7000/api',
      'http://10.0.0.14:7000/api',
      'http://10.0.2.2:7000/api',
      'http://192.168.0.115:7000/api',
    ]
  : ['http://localhost:7000/api', 'http://10.0.0.14:7000/api', 'http://192.168.0.115:7000/api'];

export let API_BASE_URL = CANDIDATE_URLS[0];

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private activeBaseUrl: string = CANDIDATE_URLS[0];

  constructor() {
    AsyncStorage.getItem('auth_token').then((t) => {
      if (t) this.token = t;
    }).catch(() => {});
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem('auth_token', token).catch(() => {});
    } else {
      AsyncStorage.removeItem('auth_token').catch(() => {});
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: any = {}
  ): Promise<ApiResponse<T>> {
    if (!this.token) {
      try {
        const savedToken = await AsyncStorage.getItem('auth_token');
        if (savedToken) this.token = savedToken;
      } catch {}
    }

    const urlsToTry = [
      this.activeBaseUrl,
      ...CANDIDATE_URLS.filter((u) => u !== this.activeBaseUrl),
    ];

    let lastError: any = null;

    for (const baseUrl of urlsToTry) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        });
        clearTimeout(timeoutId);

        const json = await response.json();
        this.activeBaseUrl = baseUrl;
        API_BASE_URL = baseUrl;

        return {
          success: response.ok,
          data: json.data !== undefined ? json.data : json,
          message: json.message,
        };
      } catch (err: any) {
        lastError = err;
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Network error or backend unreachable',
    };
  }

  // ── Auth Endpoints ──
  async login(phone: string, password?: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: password || 'Hello@123' }),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  // ── Member Endpoints ──
  async getMemberProfile(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/members/me${query}`);
  }

  // ── Unified Single API for Personal Details & Gym Experience ──
  async savePersonalDetails(data: {
    memberId: string;
    name?: string;
    phone?: string;
    email?: string;
    gender?: string;
    dob?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    goal?: string;
    medicalIssues?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    photo?: string;
    experienceLevel?: string;
    experienceKey?: string;
    joinedDate?: string;
  }) {
    return this.request('/members/personal-details', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExperience(data: {
    memberId: string;
    experienceLevel: string;
    experienceKey: string;
    joinedDate: string;
  }) {
    return this.savePersonalDetails(data);
  }

  async getMemberQRPass(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/members/qr-pass${query}`);
  }

  async getClasses(gymId?: string, memberId?: string) {
    const params = new URLSearchParams();
    if (gymId) params.append('gymId', gymId);
    if (memberId) params.append('memberId', memberId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/members/classes${query}`);
  }

  async bookClass(classId: string, memberId: string, gymId?: string, bookingDate?: string) {
    return this.request(`/members/classes/${classId}/book`, {
      method: 'POST',
      body: JSON.stringify({ memberId, gymId, bookingDate }),
    });
  }

  async getMemberWorkout(memberId?: string) {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/members/workout${query}`);
  }

  async assignWorkoutPlan(planData: {
    memberId: string;
    trainerId?: string;
    trainerName?: string;
    title?: string;
    level?: string;
    goal?: string;
    days: any[];
  }) {
    return this.request('/members/workout/assign', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async logWorkout(data: {
    memberId: string;
    gymId?: string;
    workoutName: string;
    durationMin: number;
    caloriesBurned: number;
    completedSets: any;
  }) {
    return this.request('/members/workout/log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMemberDiet(memberId?: string) {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/members/diet${query}`);
  }

  async checkIn(memberId: string, gymId?: string, method = 'qr_code') {
    return this.request('/members/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ memberId, gymId, method }),
    });
  }

  async checkOut(memberId: string) {
    return this.request('/members/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
  }

  async getAttendanceHistory(memberId: string) {
    return this.request(`/members/attendance/history?memberId=${memberId}`);
  }

  // ── Body Analytics, Measurements & Strength PRs ──
  async getBodyAnalytics(memberId?: string) {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/members/body-analytics${query}`);
  }

  async logWeightCheckpoint(data: {
    memberId: string;
    weight: number;
    date?: string;
    note?: string;
  }) {
    return this.request('/members/body-analytics/weight', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBodyMeasurements(data: {
    memberId: string;
    measurements?: any[];
    waist?: number;
    chest?: number;
    arms?: number;
    shoulders?: number;
    thighs?: number;
    calves?: number;
    unit?: string;
  }) {
    return this.request('/members/body-analytics/measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStrengthPRs(data: {
    memberId: string;
    strengthPRs?: any[];
    bench?: number;
    squat?: number;
    deadlift?: number;
    ohp?: number;
    incline?: number;
    row?: number;
    legpress?: number;
    curl?: number;
  }) {
    return this.request('/members/body-analytics/prs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBodyGoals(data: {
    memberId: string;
    goalWeight?: number;
    startWeight?: number;
    height?: number;
  }) {
    return this.request('/members/body-analytics/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveBodyAnalytics(data: any) {
    return this.request('/members/body-analytics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentHistory(memberId?: string) {
    const query = memberId ? `?memberId=${memberId}` : '';
    return this.request(`/members/payments${query}`);
  }

  // ── Products / Marketplace ──
  async getProducts(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/products${query}`);
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // ── Notifications ──
  async getNotifications(role: string) {
    return this.request(`/notifications?role=${role}`);
  }

  // ── Exercise Library Master API ──
  async getExercises(params: { category?: string; difficulty?: string; search?: string; limit?: number; page?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params.search) searchParams.append('search', params.search);
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.page) searchParams.append('page', String(params.page));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/exercises${query}`);
  }

  async getExerciseById(idOrSlug: string) {
    return this.request(`/exercises/${idOrSlug}`);
  }

  // ── Gym Owner / Admin Endpoints ──
  async getOwnerOverview(gymId: string) {
    return this.request(`/gym-admin/overview?gymId=${gymId}`);
  }

  async getOwnerMembers(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/members${query}`);
  }

  async createOwnerMember(data: any) {
    return this.request('/gym-admin/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOwnerMember(id: string, data: any) {
    return this.request(`/gym-admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOwnerMember(id: string) {
    return this.request(`/gym-admin/members/${id}`, {
      method: 'DELETE',
    });
  }

  async getOwnerTrainers(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/trainers${query}`);
  }

  async createOwnerTrainer(data: any) {
    return this.request('/gym-admin/trainers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOwnerTrainer(id: string, data: any) {
    return this.request(`/gym-admin/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOwnerTrainer(id: string) {
    return this.request(`/gym-admin/trainers/${id}`, {
      method: 'DELETE',
    });
  }

  async getOwnerPackages(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/packages${query}`);
  }

  async createOwnerPackage(data: any) {
    return this.request('/gym-admin/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOwnerPackage(id: string, data: any) {
    return this.request(`/gym-admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOwnerPackage(id: string) {
    return this.request(`/gym-admin/packages/${id}`, {
      method: 'DELETE',
    });
  }

  async getOwnerExpenses(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/expenses${query}`);
  }

  async createOwnerExpense(data: any) {
    return this.request('/gym-admin/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteOwnerExpense(id: string) {
    return this.request(`/gym-admin/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getOwnerAttendanceToday(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/attendance/today${query}`);
  }

  async getOwnerAttendanceStats(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/attendance/stats${query}`);
  }

  async getOwnerGymSettings(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/settings${query}`);
  }

  async updateOwnerGymSettings(data: any) {
    return this.request('/gym-admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOwnerKyc(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/kyc${query}`);
  }

  async getOwnerNotices(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/notices${query}`);
  }

  async createOwnerNotice(data: any) {
    return this.request('/gym-admin/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
