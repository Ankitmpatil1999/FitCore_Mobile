/**
 * FitCore API Service Bridge
 * Connects FitCore Mobile App to FitCoreB Backend API
 */
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_URL } from '@env';

// Automatically extract the host IP from the React Native Metro bundler URL if running on physical device/emulator
const getDynamicHost = (): string | null => {
  try {
    const scriptURL: string = NativeModules?.SourceCode?.scriptURL || '';
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {}
  return null;
};

const dynamicHost = getDynamicHost();

// Loaded securely from .env (hidden from source code repo)
export const PRODUCTION_API_URL = ENV_API_URL || 'http://localhost:7000/api';

// Candidate URLs: Prioritizes Environment URL, with local development fallbacks
const CANDIDATE_URLS = [
  PRODUCTION_API_URL,
  ...(dynamicHost ? [`http://${dynamicHost}:7000/api`] : []),
  'http://192.168.0.106:7000/api',
  'http://192.168.0.109:7000/api',
  'http://localhost:7000/api',
  'http://127.0.0.1:7000/api',
  'http://10.0.2.2:7000/api',
];

export let API_BASE_URL = PRODUCTION_API_URL;

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

    AsyncStorage.getItem('@fitcore_active_base_url').then((cached) => {
      if (cached) {
        this.activeBaseUrl = cached;
        API_BASE_URL = cached;
      }
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

    const urlsToTry = Array.from(new Set([
      this.activeBaseUrl,
      ...CANDIDATE_URLS,
    ]));

    let lastError: any = null;

    for (const baseUrl of urlsToTry) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        // Allow adequate time (10s) for SMS gateway calls and DB operations
        const timeoutMs = this.activeBaseUrl === baseUrl ? 10000 : 3500;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        });
        clearTimeout(timeoutId);

        let json: any = {};
        let isJson = false;
        try {
          const text = await response.text();
          if (text) {
            json = JSON.parse(text);
            isJson = true;
          }
        } catch {
          json = { message: response.statusText };
        }

        // If response failed (e.g. 404 DEPLOYMENT_NOT_FOUND, 502, 503) and we have other URLs to try, continue
        if (!response.ok && (!isJson || response.status === 404 || response.status >= 500) && urlsToTry.indexOf(baseUrl) < urlsToTry.length - 1) {
          lastError = new Error(`Status ${response.status} from ${baseUrl}`);
          continue;
        }

        if (response.ok && this.activeBaseUrl !== baseUrl) {
          this.activeBaseUrl = baseUrl;
          API_BASE_URL = baseUrl;
          AsyncStorage.setItem('@fitcore_active_base_url', baseUrl).catch(() => {});
        }

        return {
          success: response.ok,
          data: json.data !== undefined ? json.data : json,
          message: json.message,
          error: !response.ok ? (json.error || json.message || `Request failed with status ${response.status}`) : undefined,
        };
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message === 'Aborted') {
          lastError = new Error('Request timed out. Please check your backend connection.');
        } else {
          lastError = err;
        }
      }
    }

    const errorMessage = lastError?.name === 'AbortError' || lastError?.message === 'Aborted'
      ? 'Connection timed out. Please ensure the backend server is running.'
      : (lastError?.message || 'Network error or backend unreachable');

    return {
      success: false,
      error: errorMessage,
    };
  }

  // ── Auth Endpoints ──
  async checkPhone(phone: string) {
    return this.request<any>('/auth/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async login(phone: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async sendFirstTimeOtp(phone: string) {
    return this.request<any>('/auth/send-first-time-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async setupFirstTimePassword(phone: string, otp: string, password: string) {
    const res = await this.request<any>('/auth/setup-first-time-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, password }),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async forgotPassword(phone: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async resetPassword(phone: string, otp: string, password: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, password }),
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
    address?: string;
    photo?: string;
    experienceLevel?: string;
    experienceKey?: string;
    experienceYears?: number;
    experienceMonths?: number;
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
    experienceKey?: string;
    experienceYears?: number;
    experienceMonths?: number;
    joinedDate?: string;
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

  async getMemberWorkout(memberId?: string, tier?: string, level?: string) {
    const params = [];
    if (memberId) params.push(`memberId=${memberId}`);
    if (tier) params.push(`tier=${tier}`);
    if (level) params.push(`level=${level}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request(`/members/workout${query}`);
  }

  async saveMemberCustomWorkout(planData: {
    memberId: string;
    title?: string;
    level?: string;
    goal?: string;
    days: any[];
  }) {
    return this.request('/members/workout/custom', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
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

  async assignDietPlan(data: any) {
    return this.request('/members/diet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkIn(
    memberId: string,
    gymId?: string,
    method = 'qr_code',
    memberName?: string,
    memberPhone?: string
  ) {
    return this.request('/members/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        gymId,
        method,
        memberName,
        memberPhone,
        phone: memberPhone,
      }),
    });
  }

  async checkOut(memberId: string, memberPhone?: string) {
    return this.request('/members/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ memberId, phone: memberPhone, memberPhone }),
    });
  }

  async getAttendanceHistory(memberId: string, phone?: string) {
    const params: string[] = [];
    if (memberId) params.push(`memberId=${encodeURIComponent(memberId)}`);
    if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request(`/members/attendance/history${query}`);
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
  async getNotifications(role: string = 'member', gymId?: string, userId?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (gymId) params.append('gymId', gymId);
    if (userId) params.append('userId', userId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/notifications${query}`);
  }

  async markNotificationRead(id: string, userId?: string) {
    return this.request('/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id, userId }),
    });
  }

  async markAllNotificationsRead(userId?: string, gymId?: string) {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ userId, gymId }),
    });
  }

  async clearNotifications(gymId?: string) {
    return this.request('/notifications/clear', {
      method: 'POST',
      body: JSON.stringify(gymId ? { gymId } : {}),
    });
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

  async getExerciseCategories() {
    return this.request('/exercises/categories');
  }

  // ── Gym Owner / Admin Endpoints ──
  async getOwnerOverview(gymId: string) {
    return this.request(`/gym-admin/overview?gymId=${gymId}`);
  }

  async getOwnerMembers(gymId?: string, params?: { trainerId?: string; trainerName?: string; trainerPhone?: string; status?: string; search?: string }) {
    const qParams = new URLSearchParams();
    if (gymId) qParams.append('gymId', gymId);
    if (params?.trainerId) qParams.append('trainerId', params.trainerId);
    if (params?.trainerName) qParams.append('trainerName', params.trainerName);
    if (params?.trainerPhone) qParams.append('trainerPhone', params.trainerPhone);
    if (params?.status) qParams.append('status', params.status);
    if (params?.search) qParams.append('search', params.search);
    const query = qParams.toString() ? `?${qParams.toString()}` : '';
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

  async renewMemberSubscription(data: {
    memberId: string;
    packageName: string;
    durationDays: number;
    planPrice: number;
    paymentMode?: string;
  }) {
    return this.request('/gym-admin/packages/subscribe', {
      method: 'POST',
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

  async getOwnerMasterWorkoutPlan(gymId?: string) {
    const query = gymId ? `?gymId=${gymId}` : '';
    return this.request(`/gym-admin/workout-plans/master${query}`);
  }

  async saveOwnerMasterWorkoutPlan(data: {
    gymId?: string;
    title?: string;
    description?: string;
    days: any[];
  }) {
    return this.request('/gym-admin/workout-plans/master', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async sendInAppMemberReminder(data: {
    userId: string;
    gymId?: string;
    title: string;
    message: string;
    type?: string;
  }) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        userId: data.userId,
        gymId: data.gymId,
        title: data.title,
        message: data.message,
        target: 'member',
        type: data.type || 'payment_reminder',
      }),
    });
  }

  // ── 1-on-1 Trainer & Member Live Chat / Messaging Endpoints ──
  async getTrainerChatMessages(memberId: string, trainerId?: string) {
    const qTrainer = trainerId ? `&trainerId=${trainerId}` : '';
    return this.request(`/members/trainer-chat/messages?memberId=${memberId}${qTrainer}`);
  }

  async sendTrainerChatMessage(data: {
    memberId: string;
    trainerId?: string;
    from: 'member' | 'trainer';
    text: string;
    senderName?: string;
  }) {
    return this.request('/members/trainer-chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markTrainerChatAsRead(memberId: string, trainerId?: string, readerRole?: 'member' | 'trainer') {
    return this.request('/members/trainer-chat/read', {
      method: 'POST',
      body: JSON.stringify({ memberId, trainerId, readerRole: readerRole || 'member' }),
    });
  }

  // ── Online / Offline Presence Heartbeat Endpoints ──
  async sendPresenceHeartbeat(userId: string, role: string, isOnline: boolean = true) {
    return this.request('/members/presence/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ userId, role, isOnline }),
    });
  }

  async getUserPresence(userId: string) {
    return this.request(`/members/presence/${userId}`);
  }

  // ── Trainer Attendance & Shift Punching Endpoints ──
  async punchTrainerAttendance(trainerId: string, trainerName: string, action: 'check-in' | 'check-out', gymId?: string) {
    return this.request('/gym-admin/trainers/attendance', {
      method: 'POST',
      body: JSON.stringify({ trainerId, trainerName, action, gymId: gymId || 'gym1' }),
    });
  }

  async getTrainerTodayAttendance(trainerId: string) {
    return this.request(`/gym-admin/trainers/${trainerId}/today-attendance`);
  }

  async getTrainerAttendanceHistory(trainerId: string, month?: string) {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request(`/gym-admin/trainers/${trainerId}/attendance-history${q}`);
  }

  async getAllTrainersAttendance(gymId?: string, date?: string) {
    const params = new URLSearchParams();
    if (gymId) params.append('gymId', gymId);
    if (date) params.append('date', date);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/gym-admin/trainers/attendance${q}`);
  }

  // ── Trainer Leave Requests ──
  async createTrainerLeaveRequest(data: {
    trainerId: string;
    trainerName?: string;
    gymId?: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    return this.request('/gym-admin/trainers/leave-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrainerLeaveRequests(gymId?: string, trainerId?: string, status?: string) {
    const params = new URLSearchParams();
    if (gymId) params.append('gymId', gymId);
    if (trainerId) params.append('trainerId', trainerId);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/gym-admin/trainers/leave-requests${q}`);
  }

  async updateTrainerLeaveRequest(id: string, status: 'approved' | 'rejected', notes?: string) {
    return this.request(`/gym-admin/trainers/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  // ── Trainer Reviews & Ratings ──
  async getTrainerReviews(trainerId: string) {
    return this.request(`/gym-admin/trainers/${trainerId}/reviews`);
  }

  async createTrainerReview(data: {
    trainerId: string;
    memberId?: string;
    memberName?: string;
    memberAvatar?: string;
    rating: number;
    tag?: string;
    comment: string;
    sessionType?: string;
  }) {
    return this.request('/gym-admin/trainers/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleReviewHelpful(reviewId: string, userId: string) {
    return this.request(`/gym-admin/trainers/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ── 1-on-1 Personal Training Schedules & Bookings ──
  async getPTSessions(params?: {
    gymId?: string;
    trainerId?: string;
    trainerPhone?: string;
    date?: string;
    status?: string;
    memberId?: string;
  }) {
    const qParams = new URLSearchParams();
    if (params?.gymId) qParams.append('gymId', params.gymId);
    if (params?.trainerId) qParams.append('trainerId', params.trainerId);
    if (params?.trainerPhone) qParams.append('trainerPhone', params.trainerPhone);
    if (params?.date) qParams.append('date', params.date);
    if (params?.status) qParams.append('status', params.status);
    if (params?.memberId) qParams.append('memberId', params.memberId);
    const q = qParams.toString() ? `?${qParams.toString()}` : '';
    return this.request(`/gym-admin/pt-sessions${q}`);
  }

  async createPTSession(data: {
    gymId?: string;
    trainerId?: string;
    trainerName?: string;
    trainerPhone?: string;
    memberId?: string;
    memberName: string;
    memberPhone?: string;
    date?: string;
    time: string;
    focus?: string;
    notes?: string;
  }) {
    return this.request('/gym-admin/pt-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePTSessionStatus(
    id: string,
    data: {
      status?: 'scheduled' | 'completed' | 'cancelled';
      notes?: string;
      focus?: string;
      time?: string;
      date?: string;
    }
  ) {
    return this.request(`/gym-admin/pt-sessions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePTSession(id: string) {
    return this.request(`/gym-admin/pt-sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Account & Data Deletion (Google Play / GDPR Compliance) ──
  async deleteAccount(phoneOrMemberId: string, reason?: string) {
    return this.request('/members/account', {
      method: 'DELETE',
      body: JSON.stringify({ phone: phoneOrMemberId, memberId: phoneOrMemberId, reason: reason || 'User in-app deletion' }),
    });
  }
}


export const apiService = new ApiService();
export default apiService;

