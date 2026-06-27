// ─────────────────────────────────────────────
//  FITCore Mock Data Store
//  All data is in-memory — no backend needed.
// ─────────────────────────────────────────────

export type Role = 'owner' | 'member' | 'vendor' | 'trainer';
export type MemberStatus = 'active' | 'expired' | 'frozen';
export type PaymentStatus = 'completed' | 'pending' | 'refunded';
export type TransactionMethod = 'upi' | 'cash' | 'online';
export type GoalType = 'fat_loss' | 'weight_gain' | 'muscle_building' | 'general_fitness';
export type ProductCategory =
  | 'protein'
  | 'creatine'
  | 'pre_workout'
  | 'mass_gainer'
  | 'bcaa'
  | 'multivitamin'
  | 'fish_oil'
  | 'peanut_butter'
  | 'oats'
  | 'accessories'
  | 'equipment'
  | 'apparel';
export type VendorCategory = 'supplement_store' | 'nutrition_shop' | 'equipment_dealer' | 'accessories_store' | 'sports_nutrition';
export type VendorStatus = 'pending' | 'approved' | 'blocked';
export type OrderStatus = 'new' | 'accepted' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryMethod = 'self' | 'partner' | 'local';
export type DietType =
  | 'weight_loss'
  | 'weight_gain'
  | 'muscle_gain'
  | 'women_fitness'
  | 'diabetic'
  | 'senior';

// ── GYM ─────────────────────────────────────

export interface Facility {
  id: string;
  icon: string;
  name: string;
}

export interface Gym {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  address: string;
  city: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  ownerId: string;
  facilities: Facility[];
  photos: string[];
  subscriptionPlan: 'basic' | 'standard' | 'premium';
}

export const FACILITIES: Facility[] = [
  { id: 'f1', icon: '🅿️', name: 'Parking' },
  { id: 'f2', icon: '🧖', name: 'Steam' },
  { id: 'f3', icon: '🚴', name: 'Cardio' },
  { id: 'f4', icon: '🏋️', name: 'CrossFit' },
  { id: 'f5', icon: '👤', name: 'Personal Training' },
  { id: 'f6', icon: '🔒', name: 'Locker' },
  { id: 'f7', icon: '🏊', name: 'Swimming' },
  { id: 'f8', icon: '🥊', name: 'Boxing' },
  { id: 'f9', icon: '🧘', name: 'Yoga' },
  { id: 'f10', icon: '🍃', name: 'Sauna' },
];

export const GYMS: Gym[] = [
  {
    id: 'gym1',
    name: 'FitCore Elite',
    tagline: 'Where Champions Are Made',
    rating: 4.8,
    address: '42, Koregaon Park, Near Phoenix Mall',
    city: 'Pune, Maharashtra',
    phone: '8530292487',
    email: 'elite@fitcore.in',
    openTime: '5:00 AM',
    closeTime: '11:00 PM',
    isOpen: true,
    ownerId: 'owner1',
    facilities: [
      { id: 'f1', icon: '🅿️', name: 'Parking' },
      { id: 'f2', icon: '🧖', name: 'Steam' },
      { id: 'f3', icon: '🚴', name: 'Cardio' },
      { id: 'f4', icon: '🏋️', name: 'CrossFit' },
      { id: 'f5', icon: '👤', name: 'Personal Training' },
      { id: 'f6', icon: '🔒', name: 'Locker' },
    ],
    photos: [],
    subscriptionPlan: 'premium',
  },
];

// ── USERS / MEMBERS ──────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  gymId: string;
  avatar: string; // initials
}

export interface Member {
  id: string;
  userId: string;
  gymId: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  bmi: number;
  goal: GoalType;
  medicalIssues: string;
  emergencyContact: string;
  emergencyPhone: string;
  planId: string;
  status: MemberStatus;
  joinDate: string;
  expiryDate: string;
  trainerId: string;
  photo: string;
}

export const USERS: User[] = [
  {
    id: 'owner1',
    name: 'Rajesh Patil',
    phone: '8530292487',
    email: 'rajesh@fitcore.in',
    password: 'Hello@123',
    role: 'owner',
    gymId: 'gym1',
    avatar: 'RP',
  },
  {
    id: 'member1',
    name: 'Arjun Mehta',
    phone: '9209282289',
    email: 'arjun@gmail.com',
    password: 'Hello@123',
    role: 'member',
    gymId: 'gym1',
    avatar: 'AM',
  },
  {
    id: 'vendor1',
    name: 'Karan Shetty',
    phone: '9326093115',
    email: 'karan@musclestore.in',
    password: 'Hello@123',
    role: 'vendor',
    gymId: '',
    avatar: 'KS',
  },
];

export const MEMBERS: Member[] = [
  {
    id: 'm1',
    userId: 'member1',
    gymId: 'gym1',
    name: 'Arjun Mehta',
    phone: '9209282289',
    email: 'arjun@gmail.com',
    avatar: 'AM',
    age: 27,
    height: 175,
    weight: 78,
    bmi: 25.5,
    goal: 'muscle_building',
    medicalIssues: 'None',
    emergencyContact: 'Suresh Mehta',
    emergencyPhone: '9876543210',
    planId: 'plan3',
    status: 'active',
    joinDate: '2026-01-15',
    expiryDate: '2027-01-14',
    trainerId: 't1',
    photo: '',
  },
  {
    id: 'm2',
    userId: 'u2',
    gymId: 'gym1',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@gmail.com',
    avatar: 'PS',
    age: 24,
    height: 162,
    weight: 58,
    bmi: 22.1,
    goal: 'fat_loss',
    medicalIssues: 'None',
    emergencyContact: 'Ravi Sharma',
    emergencyPhone: '9876543211',
    planId: 'plan2',
    status: 'active',
    joinDate: '2026-03-01',
    expiryDate: '2026-08-31',
    trainerId: 't2',
    photo: '',
  },
  {
    id: 'm3',
    userId: 'u3',
    gymId: 'gym1',
    name: 'Rahul Desai',
    phone: '8765432109',
    email: 'rahul@gmail.com',
    avatar: 'RD',
    age: 32,
    height: 180,
    weight: 90,
    bmi: 27.8,
    goal: 'weight_gain',
    medicalIssues: 'Lower back pain',
    emergencyContact: 'Kavita Desai',
    emergencyPhone: '8765432108',
    planId: 'plan1',
    status: 'active',
    joinDate: '2026-05-01',
    expiryDate: '2026-05-31',
    trainerId: 't1',
    photo: '',
  },
  {
    id: 'm4',
    userId: 'u4',
    gymId: 'gym1',
    name: 'Sneha Kulkarni',
    phone: '7654321098',
    email: 'sneha@gmail.com',
    avatar: 'SK',
    age: 29,
    height: 158,
    weight: 65,
    bmi: 26.0,
    goal: 'fat_loss',
    medicalIssues: 'Thyroid',
    emergencyContact: 'Mohan Kulkarni',
    emergencyPhone: '7654321097',
    planId: 'plan2',
    status: 'expired',
    joinDate: '2025-12-01',
    expiryDate: '2026-05-31',
    trainerId: 't2',
    photo: '',
  },
  {
    id: 'm5',
    userId: 'u5',
    gymId: 'gym1',
    name: 'Vikash Yadav',
    phone: '6543210987',
    email: 'vikash@gmail.com',
    avatar: 'VY',
    age: 35,
    height: 172,
    weight: 82,
    bmi: 27.7,
    goal: 'general_fitness',
    medicalIssues: 'None',
    emergencyContact: 'Sunita Yadav',
    emergencyPhone: '6543210986',
    planId: 'plan4',
    status: 'frozen',
    joinDate: '2026-02-01',
    expiryDate: '2027-01-31',
    trainerId: 't3',
    photo: '',
  },
  {
    id: 'm6',
    userId: 'u6',
    gymId: 'gym1',
    name: 'Ananya Jain',
    phone: '9988776655',
    email: 'ananya@gmail.com',
    avatar: 'AJ',
    age: 22,
    height: 165,
    weight: 55,
    bmi: 20.2,
    goal: 'muscle_building',
    medicalIssues: 'None',
    emergencyContact: 'Amit Jain',
    emergencyPhone: '9988776654',
    planId: 'plan3',
    status: 'active',
    joinDate: '2026-06-01',
    expiryDate: '2027-05-31',
    trainerId: 't1',
    photo: '',
  },
];

// ── TRAINERS ────────────────────────────────

export interface Trainer {
  id: string;
  gymId: string;
  name: string;
  avatar: string;
  specialization: string;
  experience: string;
  salary: string;
  timings: string;
  available: boolean;
  assignedMemberIds: string[];
  certifications: string;
  phone: string;
  joinDate: string;
}

export const TRAINERS: Trainer[] = [
  {
    id: 't1',
    gymId: 'gym1',
    name: 'Vikram Singh',
    avatar: 'VS',
    specialization: 'Strength & Powerlifting',
    experience: '7 years',
    salary: '₹35,000/month',
    timings: '6:00 AM – 11:00 AM & 5:00 PM – 9:00 PM',
    available: true,
    assignedMemberIds: ['m1', 'm3', 'm6'],
    certifications: 'ACE Certified, NSCA-CPT',
    phone: '9111222333',
    joinDate: '2022-04-01',
  },
  {
    id: 't2',
    gymId: 'gym1',
    name: 'Ananya Joshi',
    avatar: 'AJ',
    specialization: 'Yoga & Flexibility',
    experience: '5 years',
    salary: '₹28,000/month',
    timings: '7:00 AM – 10:00 AM & 6:00 PM – 8:00 PM',
    available: true,
    assignedMemberIds: ['m2', 'm4'],
    certifications: 'RYT-500, Pilates Certified',
    phone: '9222333444',
    joinDate: '2023-01-15',
  },
  {
    id: 't3',
    gymId: 'gym1',
    name: 'Rohit Desai',
    avatar: 'RD',
    specialization: 'HIIT & Cardio',
    experience: '4 years',
    salary: '₹25,000/month',
    timings: '8:00 AM – 12:00 PM',
    available: false,
    assignedMemberIds: ['m5'],
    certifications: 'ACSM Certified',
    phone: '9333444555',
    joinDate: '2023-08-01',
  },
];

// ── MEMBERSHIP PLANS ─────────────────────────

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  duration: number; // months
  price: number;
  originalPrice: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  features: string[];
  isActive: boolean;
  discount: number; // percentage
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan1',
    gymId: 'gym1',
    name: '1 Month Pass',
    duration: 1,
    price: 999,
    originalPrice: 1199,
    tier: 'bronze',
    features: ['Full gym access', 'Locker', 'Basic assessment'],
    isActive: true,
    discount: 0,
  },
  {
    id: 'plan2',
    gymId: 'gym1',
    name: '3 Month Pass',
    duration: 3,
    price: 2499,
    originalPrice: 3000,
    tier: 'silver',
    features: ['Full gym access', 'Locker', 'Diet consultation', 'Trainer assistance'],
    isActive: true,
    discount: 16,
  },
  {
    id: 'plan3',
    gymId: 'gym1',
    name: '6 Month Pass',
    duration: 6,
    price: 3999,
    originalPrice: 5500,
    tier: 'gold',
    features: [
      'Full gym access',
      'Personal trainer',
      'Diet plan',
      'Workout plan',
      'Monthly assessment',
      'Locker',
    ],
    isActive: true,
    discount: 27,
  },
  {
    id: 'plan4',
    gymId: 'gym1',
    name: '12 Month Pass',
    duration: 12,
    price: 6999,
    originalPrice: 11000,
    tier: 'platinum',
    features: [
      'Full gym access',
      'Dedicated trainer',
      'Custom diet & workout',
      'Monthly body assessment',
      'Supplement discount 10%',
      'Guest passes (2)',
      'Locker',
    ],
    isActive: true,
    discount: 36,
  },
];

// ── ATTENDANCE ───────────────────────────────

export interface AttendanceRecord {
  id: string;
  memberId: string;
  gymId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string | null;
}

export const ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', memberId: 'm1', gymId: 'gym1', date: '2026-06-18', checkIn: '06:15 AM', checkOut: '08:20 AM', duration: '2h 5m' },
  { id: 'a2', memberId: 'm1', gymId: 'gym1', date: '2026-06-17', checkIn: '06:10 AM', checkOut: '08:00 AM', duration: '1h 50m' },
  { id: 'a3', memberId: 'm1', gymId: 'gym1', date: '2026-06-16', checkIn: '06:30 AM', checkOut: '08:30 AM', duration: '2h 00m' },
  { id: 'a4', memberId: 'm1', gymId: 'gym1', date: '2026-06-14', checkIn: '07:00 AM', checkOut: '09:10 AM', duration: '2h 10m' },
  { id: 'a5', memberId: 'm1', gymId: 'gym1', date: '2026-06-13', checkIn: '06:45 AM', checkOut: '08:45 AM', duration: '2h 00m' },
  { id: 'a6', memberId: 'm2', gymId: 'gym1', date: '2026-06-18', checkIn: '07:00 AM', checkOut: '08:30 AM', duration: '1h 30m' },
  { id: 'a7', memberId: 'm3', gymId: 'gym1', date: '2026-06-18', checkIn: '06:00 AM', checkOut: '07:45 AM', duration: '1h 45m' },
];

// ── PRODUCTS ─────────────────────────────────

export interface Product {
  id: string;
  gymId: string;
  name: string;
  brand: string;
  category: ProductCategory;
  mrp: number;
  price: number;
  stock: number;
  sold: number;
  expiryDate: string;
  supplier: string;
  offer: string;
  emoji: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1', gymId: 'gym1', name: 'Whey Protein 2kg',
    brand: 'MuscleBlaze', category: 'protein',
    mrp: 3499, price: 2999, stock: 12, sold: 43,
    expiryDate: '2027-06-01', supplier: 'HealthKart',
    offer: '15% OFF', emoji: '💪',
  },
  {
    id: 'p2', gymId: 'gym1', name: 'Creatine Monohydrate 300g',
    brand: 'Optimum Nutrition', category: 'creatine',
    mrp: 1299, price: 999, stock: 8, sold: 27,
    expiryDate: '2027-03-01', supplier: 'ON Direct',
    offer: '23% OFF', emoji: '⚗️',
  },
  {
    id: 'p3', gymId: 'gym1', name: 'Pre-Workout Ignite',
    brand: 'GNC', category: 'pre_workout',
    mrp: 1899, price: 1499, stock: 5, sold: 18,
    expiryDate: '2026-12-01', supplier: 'GNC Store',
    offer: '21% OFF', emoji: '🔥',
  },
  {
    id: 'p4', gymId: 'gym1', name: 'Mass Gainer 5kg',
    brand: 'Serious Mass', category: 'mass_gainer',
    mrp: 4999, price: 3999, stock: 4, sold: 12,
    expiryDate: '2027-04-01', supplier: 'ON Direct',
    offer: '20% OFF', emoji: '🏋️',
  },
  {
    id: 'p5', gymId: 'gym1', name: 'Gym Shaker 700ml',
    brand: 'FitCore', category: 'accessories',
    mrp: 499, price: 349, stock: 25, sold: 67,
    expiryDate: 'N/A', supplier: 'Local Vendor',
    offer: '30% OFF', emoji: '🥤',
  },
  {
    id: 'p6', gymId: 'gym1', name: 'Gym Gloves (Pair)',
    brand: 'SportX', category: 'accessories',
    mrp: 799, price: 599, stock: 15, sold: 33,
    expiryDate: 'N/A', supplier: 'SportX Wholesale',
    offer: '25% OFF', emoji: '🧤',
  },
  {
    id: 'p7', gymId: 'gym1', name: 'FitCore Dri-Fit T-Shirt',
    brand: 'FitCore', category: 'apparel',
    mrp: 999, price: 699, stock: 30, sold: 51,
    expiryDate: 'N/A', supplier: 'Local Vendor',
    offer: '30% OFF', emoji: '👕',
  },
  {
    id: 'p8', gymId: 'gym1', name: 'Gym Belt (Leather)',
    brand: 'ProFit', category: 'accessories',
    mrp: 1299, price: 999, stock: 7, sold: 14,
    expiryDate: 'N/A', supplier: 'ProFit Direct',
    offer: '23% OFF', emoji: '🎽',
  },
];

// ── PAYMENTS / TRANSACTIONS ──────────────────

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: TransactionMethod;
  status: PaymentStatus;
  date: string;
  description: string;
}

export const PAYMENTS: Payment[] = [
  { id: 'TX-1001', gymId: 'gym1', memberId: 'm1', memberName: 'Arjun Mehta', amount: 3999, method: 'upi', status: 'completed', date: '2026-06-15', description: '6 Month Plan' },
  { id: 'TX-1002', gymId: 'gym1', memberId: 'm2', memberName: 'Priya Sharma', amount: 2499, method: 'online', status: 'completed', date: '2026-06-10', description: '3 Month Plan' },
  { id: 'TX-1003', gymId: 'gym1', memberId: 'm3', memberName: 'Rahul Desai', amount: 999, method: 'cash', status: 'completed', date: '2026-05-01', description: '1 Month Plan' },
  { id: 'TX-1004', gymId: 'gym1', memberId: 'm4', memberName: 'Sneha Kulkarni', amount: 2499, method: 'upi', status: 'pending', date: '2026-06-01', description: '3 Month Renewal' },
  { id: 'TX-1005', gymId: 'gym1', memberId: 'm5', memberName: 'Vikash Yadav', amount: 6999, method: 'online', status: 'completed', date: '2026-02-01', description: '12 Month Plan' },
  { id: 'TX-1006', gymId: 'gym1', memberId: 'm6', memberName: 'Ananya Jain', amount: 3999, method: 'upi', status: 'completed', date: '2026-06-01', description: '6 Month Plan' },
  { id: 'TX-1007', gymId: 'gym1', memberId: 'm3', memberName: 'Rahul Desai', amount: 999, method: 'cash', status: 'pending', date: '2026-06-18', description: '1 Month Renewal' },
];

// ── NOTIFICATIONS ────────────────────────────

export interface Notification {
  id: string;
  gymId: string;
  type: 'payment' | 'member' | 'stock' | 'expiry' | 'general';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  targetRole: 'owner' | 'member' | 'all';
  memberId?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', gymId: 'gym1', type: 'payment',
    title: 'Payment Pending',
    message: "Rahul Desai's 1-month renewal of ₹999 is pending.",
    date: '2026-06-18', isRead: false, targetRole: 'owner',
  },
  {
    id: 'n2', gymId: 'gym1', type: 'expiry',
    title: 'Membership Expiring',
    message: "Rahul Desai's membership expires in 2 days.",
    date: '2026-06-17', isRead: false, targetRole: 'owner',
  },
  {
    id: 'n3', gymId: 'gym1', type: 'stock',
    title: 'Low Stock Alert',
    message: 'Pre-Workout Ignite is running low — only 5 units left.',
    date: '2026-06-16', isRead: true, targetRole: 'owner',
  },
  {
    id: 'n4', gymId: 'gym1', type: 'member',
    title: 'New Member Joined',
    message: 'Ananya Jain has joined with a 6-Month Gold plan.',
    date: '2026-06-01', isRead: true, targetRole: 'owner',
  },
  {
    id: 'n5', gymId: 'gym1', type: 'general',
    title: 'Gym Closed Tomorrow',
    message: 'Gym will remain closed on June 19 for maintenance.',
    date: '2026-06-18', isRead: false, targetRole: 'all',
    memberId: 'm1',
  },
  {
    id: 'n6', gymId: 'gym1', type: 'expiry',
    title: 'Membership Reminder',
    message: 'Your membership expires in 240 days. Keep going strong! 💪',
    date: '2026-06-16', isRead: true, targetRole: 'member',
    memberId: 'm1',
  },
];

// ── WORKOUT PLANS ────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  videoUrl: string;
  isDone: boolean;
}

export interface WorkoutDay {
  day: string; // 'Monday', etc.
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  gymId: string;
  trainerId: string;
  memberId: string;
  name: string;
  goal: GoalType;
  days: WorkoutDay[];
}

export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'wp1',
    gymId: 'gym1',
    trainerId: 't1',
    memberId: 'm1',
    name: 'Muscle Building 5-Day Split',
    goal: 'muscle_building',
    days: [
      {
        day: 'Monday',
        focus: 'Chest & Triceps',
        exercises: [
          { id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: '8-10', weight: '60 kg', restSeconds: 90, videoUrl: '', isDone: false },
          { id: 'e2', name: 'Incline DB Press', muscleGroup: 'Chest', sets: 3, reps: '10-12', weight: '20 kg', restSeconds: 75, videoUrl: '', isDone: false },
          { id: 'e3', name: 'Cable Flyes', muscleGroup: 'Chest', sets: 3, reps: '12-15', weight: '15 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e4', name: 'Tricep Pushdown', muscleGroup: 'Triceps', sets: 3, reps: '12-15', weight: '25 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e5', name: 'Skull Crushers', muscleGroup: 'Triceps', sets: 3, reps: '10-12', weight: '20 kg', restSeconds: 75, videoUrl: '', isDone: false },
        ],
      },
      {
        day: 'Tuesday',
        focus: 'Back & Biceps',
        exercises: [
          { id: 'e6', name: 'Deadlift', muscleGroup: 'Back', sets: 4, reps: '6-8', weight: '80 kg', restSeconds: 120, videoUrl: '', isDone: false },
          { id: 'e7', name: 'Lat Pulldown', muscleGroup: 'Back', sets: 4, reps: '10-12', weight: '55 kg', restSeconds: 75, videoUrl: '', isDone: false },
          { id: 'e8', name: 'Seated Cable Row', muscleGroup: 'Back', sets: 3, reps: '10-12', weight: '50 kg', restSeconds: 75, videoUrl: '', isDone: false },
          { id: 'e9', name: 'Barbell Curl', muscleGroup: 'Biceps', sets: 3, reps: '10-12', weight: '25 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e10', name: 'Hammer Curl', muscleGroup: 'Biceps', sets: 3, reps: '12-15', weight: '15 kg', restSeconds: 60, videoUrl: '', isDone: false },
        ],
      },
      {
        day: 'Wednesday',
        focus: 'Legs',
        exercises: [
          { id: 'e11', name: 'Barbell Squat', muscleGroup: 'Quads', sets: 4, reps: '8-10', weight: '70 kg', restSeconds: 120, videoUrl: '', isDone: false },
          { id: 'e12', name: 'Leg Press', muscleGroup: 'Quads', sets: 3, reps: '12-15', weight: '150 kg', restSeconds: 90, videoUrl: '', isDone: false },
          { id: 'e13', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', sets: 3, reps: '10-12', weight: '50 kg', restSeconds: 90, videoUrl: '', isDone: false },
          { id: 'e14', name: 'Calf Raises', muscleGroup: 'Calves', sets: 4, reps: '20', weight: 'Bodyweight', restSeconds: 45, videoUrl: '', isDone: false },
        ],
      },
      {
        day: 'Thursday',
        focus: 'Shoulders',
        exercises: [
          { id: 'e15', name: 'OHP (Barbell)', muscleGroup: 'Shoulders', sets: 4, reps: '8-10', weight: '45 kg', restSeconds: 90, videoUrl: '', isDone: false },
          { id: 'e16', name: 'Lateral Raises', muscleGroup: 'Side Delts', sets: 4, reps: '12-15', weight: '10 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e17', name: 'Face Pulls', muscleGroup: 'Rear Delts', sets: 3, reps: '15-20', weight: '20 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e18', name: 'Front Raises', muscleGroup: 'Front Delts', sets: 3, reps: '12', weight: '8 kg', restSeconds: 60, videoUrl: '', isDone: false },
        ],
      },
      {
        day: 'Friday',
        focus: 'Arms & Core',
        exercises: [
          { id: 'e19', name: 'Close-Grip Bench', muscleGroup: 'Triceps', sets: 3, reps: '10', weight: '45 kg', restSeconds: 75, videoUrl: '', isDone: false },
          { id: 'e20', name: 'Preacher Curl', muscleGroup: 'Biceps', sets: 3, reps: '10', weight: '20 kg', restSeconds: 60, videoUrl: '', isDone: false },
          { id: 'e21', name: 'Plank', muscleGroup: 'Core', sets: 3, reps: '60 sec', weight: 'Bodyweight', restSeconds: 45, videoUrl: '', isDone: false },
          { id: 'e22', name: 'Cable Crunch', muscleGroup: 'Abs', sets: 3, reps: '15-20', weight: '25 kg', restSeconds: 45, videoUrl: '', isDone: false },
        ],
      },
      { day: 'Saturday', focus: 'Active Recovery', exercises: [] },
      { day: 'Sunday', focus: 'Rest Day', exercises: [] },
    ],
  },
];

// ── DIET PLANS ───────────────────────────────

export interface Meal {
  name: string;
  items: { food: string; qty: string; calories: number; protein: number }[];
}

export interface DietPlan {
  id: string;
  gymId: string;
  type: DietType;
  name: string;
  totalCalories: number;
  totalProtein: number;
  meals: { breakfast: Meal; lunch: Meal; snack: Meal; dinner: Meal };
  waterIntake: number; // glasses
}

export const DIET_PLANS: DietPlan[] = [
  {
    id: 'dp1',
    gymId: 'gym1',
    type: 'muscle_gain',
    name: 'Muscle Gain Diet',
    totalCalories: 3000,
    totalProtein: 180,
    waterIntake: 10,
    meals: {
      breakfast: {
        name: 'Breakfast',
        items: [
          { food: 'Oats (cooked)', qty: '1 cup', calories: 150, protein: 5 },
          { food: 'Eggs (whole)', qty: '4 eggs', calories: 280, protein: 24 },
          { food: 'Banana', qty: '1 large', calories: 105, protein: 1 },
          { food: 'Whey Protein Shake', qty: '1 scoop', calories: 120, protein: 24 },
        ],
      },
      lunch: {
        name: 'Lunch',
        items: [
          { food: 'Chicken Breast (grilled)', qty: '200g', calories: 330, protein: 62 },
          { food: 'Brown Rice (cooked)', qty: '1.5 cups', calories: 330, protein: 7 },
          { food: 'Mixed Vegetables', qty: '1 cup', calories: 50, protein: 3 },
          { food: 'Curd (low fat)', qty: '200g', calories: 100, protein: 10 },
        ],
      },
      snack: {
        name: 'Evening Snack',
        items: [
          { food: 'Peanut Butter', qty: '2 tbsp', calories: 190, protein: 8 },
          { food: 'Whole Wheat Bread', qty: '2 slices', calories: 140, protein: 6 },
          { food: 'Apple', qty: '1 medium', calories: 95, protein: 0 },
        ],
      },
      dinner: {
        name: 'Dinner',
        items: [
          { food: 'Paneer (low fat)', qty: '150g', calories: 230, protein: 30 },
          { food: 'Chapati (whole wheat)', qty: '3 rotis', calories: 270, protein: 9 },
          { food: 'Sabji (mixed veg)', qty: '1 bowl', calories: 100, protein: 4 },
          { food: 'Dal (lentil soup)', qty: '1 bowl', calories: 130, protein: 9 },
        ],
      },
    },
  },
];

// ── PROGRESS TRACKING ────────────────────────

export interface ProgressEntry {
  date: string;
  weight: number;
  bodyFat: number;
  bmi: number;
  chest: number;
  waist: number;
  arms: number;
  legs: number;
}

export const PROGRESS_DATA: ProgressEntry[] = [
  { date: '2026-01-15', weight: 82, bodyFat: 22, bmi: 26.8, chest: 98, waist: 88, arms: 35, legs: 58 },
  { date: '2026-02-15', weight: 81, bodyFat: 21.5, bmi: 26.5, chest: 99, waist: 86, arms: 36, legs: 59 },
  { date: '2026-03-15', weight: 80, bodyFat: 21, bmi: 26.1, chest: 100, waist: 85, arms: 36, legs: 60 },
  { date: '2026-04-15', weight: 79, bodyFat: 20.2, bmi: 25.8, chest: 101, waist: 84, arms: 37, legs: 61 },
  { date: '2026-05-15', weight: 78.5, bodyFat: 19.8, bmi: 25.6, chest: 102, waist: 83, arms: 37, legs: 61 },
  { date: '2026-06-15', weight: 78, bodyFat: 19.2, bmi: 25.5, chest: 103, waist: 82, arms: 38, legs: 62 },
];

// ── ANALYTICS SUMMARY ────────────────────────

export const ANALYTICS = {
  gym1: {
    todayRevenue: 12500,
    monthlyRevenue: 240000,
    pendingAmount: 35000,
    todayCheckIns: 47,
    totalMembers: 142,
    activeMembers: 128,
    expiredMembers: 9,
    frozenMembers: 5,
    totalTrainers: 3,
    productsSoldToday: 7,
    monthlyGrowth: [
      { label: 'Jan', value: 75 },
      { label: 'Feb', value: 82 },
      { label: 'Mar', value: 98 },
      { label: 'Apr', value: 110 },
      { label: 'May', value: 125 },
      { label: 'Jun', value: 142 },
    ],
    revenueChart: [
      { label: 'Jan', value: 185000 },
      { label: 'Feb', value: 198000 },
      { label: 'Mar', value: 215000 },
      { label: 'Apr', value: 225000 },
      { label: 'May', value: 232000 },
      { label: 'Jun', value: 240000 },
    ],
  },
};

// ── HELPER FUNCTIONS ─────────────────────────

export function getMemberById(id: string): Member | undefined {
  return MEMBERS.find(m => m.id === id);
}

export function getMemberByPhone(phone: string): Member | undefined {
  return MEMBERS.find(m => m.phone === phone);
}

export function getTrainerById(id: string): Trainer | undefined {
  return TRAINERS.find(t => t.id === id);
}

export function getPlanById(id: string): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find(p => p.id === id);
}

export function getGymById(id: string): Gym | undefined {
  return GYMS.find(g => g.id === id);
}

export function getAttendanceByMember(memberId: string): AttendanceRecord[] {
  return ATTENDANCE.filter(a => a.memberId === memberId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getWorkoutPlanByMember(memberId: string): WorkoutPlan | undefined {
  return WORKOUT_PLANS.find(w => w.memberId === memberId);
}

export function getNotificationsForOwner(gymId: string): Notification[] {
  return NOTIFICATIONS.filter(n => n.gymId === gymId && (n.targetRole === 'owner' || n.targetRole === 'all'));
}

export function getNotificationsForMember(memberId: string): Notification[] {
  return NOTIFICATIONS.filter(
    n => n.targetRole === 'all' || (n.targetRole === 'member' && n.memberId === memberId),
  );
}

export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

// ═══════════════════════════════════════════════════════════════
//  VENDOR PORTAL DATA
// ═══════════════════════════════════════════════════════════════

// ── VENDOR STORE ─────────────────────────────

export type KycDocType = 'aadhaar' | 'pan' | 'electricity_bill' | 'shop_license';
export type KycStatus = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface KycDocument {
  type: KycDocType;
  label: string;
  number: string;              // document number where applicable
  status: KycStatus;
  uploadedAt: string;
  rejectionReason?: string;
}

export interface VendorStore {
  id: string;
  userId: string;               // links to USERS
  storeName: string;
  ownerName: string;
  category: VendorCategory;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId: string;
  bankAccount: string;
  ifsc: string;
  status: VendorStatus;
  avatar: string;               // initials/emoji
  shopImage: string;            // emoji placeholder for shop image
  rating: number;
  totalReviews: number;
  joinDate: string;
  tagline: string;
  description: string;
  deliveryMethods: DeliveryMethod[];
  freeDeliveryAbove: number;    // 0 = no free delivery
  deliveryCharges: number;
  kycDocuments: KycDocument[];  // KYC verification documents
}

export const VENDOR_STORES: VendorStore[] = [
  {
    id: 'vs1',
    userId: 'vendor1',
    storeName: 'MuscleZone Nutrition',
    ownerName: 'Karan Shetty',
    category: 'supplement_store',
    gstNumber: '27AABCS1429B1Z0',
    phone: '9326093115',
    email: 'karan@musclestore.in',
    address: 'Shop 12, Fitness Hub, MG Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    upiId: 'karan.shetty@paytm',
    bankAccount: 'XXXXXXXXXX4521',
    ifsc: 'HDFC0001234',
    status: 'approved',
    avatar: 'MZ',
    shopImage: '🏪',
    rating: 4.7,
    totalReviews: 234,
    joinDate: '2026-01-10',
    tagline: 'Premium Supplements at Gym Prices',
    description: 'Authorized distributor of MuscleBlaze, Optimum Nutrition & GNC. 100% authentic products, same-day delivery in Pune.',
    deliveryMethods: ['self', 'local'],
    freeDeliveryAbove: 999,
    deliveryCharges: 49,
    kycDocuments: [
      { type: 'aadhaar', label: 'Aadhaar Card', number: '1234 5678 9012', status: 'verified', uploadedAt: '2026-01-05' },
      { type: 'pan', label: 'PAN Card', number: 'ABCPS1234D', status: 'verified', uploadedAt: '2026-01-05' },
      { type: 'electricity_bill', label: 'Electricity Bill', number: '', status: 'pending', uploadedAt: '2026-01-08' },
      { type: 'shop_license', label: 'Shop License', number: 'MH/SHOP/2024/1234', status: 'pending', uploadedAt: '2026-01-08' },
    ],
  },
];

// ── VENDOR PRODUCTS ───────────────────────────

export interface VendorProduct {
  id: string;
  vendorId: string;             // links to VendorStore
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  ingredients: string;
  nutritionFacts: string;
  weight: string;               // '1kg', '2kg', etc.
  flavours: string[];
  images: string[];             // emoji placeholders for now
  mrp: number;
  price: number;                // default / member price
  ownerPrice: number;           // special price for gym owners (bulk)
  memberPrice: number;          // price for gym members
  margin: number;               // profit margin % from cost price
  discount: number;             // percentage off MRP for members
  ownerDiscount: number;        // percentage off MRP for owners
  stock: number;
  lowStockThreshold: number;
  expiryDate: string;
  rating: number;
  reviews: number;
  sold: number;
  isActive: boolean;
  tags: string[];
  offer: string;
}

export const VENDOR_PRODUCTS: VendorProduct[] = [
  {
    id: 'vp1',
    vendorId: 'vs1',
    name: 'Whey Protein Gold Standard',
    brand: 'Optimum Nutrition',
    category: 'protein',
    description: '100% Whey Protein with 24g protein per serving. Best in class amino acid profile.',
    ingredients: 'Whey Protein Concentrate, Whey Protein Isolate, Cocoa Powder, Soy Lecithin',
    nutritionFacts: 'Per Serving (32g): Calories 120, Protein 24g, Carbs 3g, Fat 1g',
    weight: '2 kg',
    flavours: ['Double Rich Chocolate', 'Vanilla Ice Cream', 'Strawberry Banana', 'Cookies & Cream'],
    images: ['💪'],
    mrp: 4999,
    price: 3999,
    ownerPrice: 3499,
    memberPrice: 3999,
    margin: 18,
    discount: 20,
    ownerDiscount: 30,
    stock: 24,
    lowStockThreshold: 5,
    expiryDate: '2027-08-01',
    rating: 4.8,
    reviews: 127,
    sold: 89,
    isActive: true,
    tags: ['bestseller', 'whey', 'protein'],
    offer: '20% OFF | Buy 2 Get Free Shaker',
  },
  {
    id: 'vp2',
    vendorId: 'vs1',
    name: 'MuscleBlaze Whey Protein 2kg',
    brand: 'MuscleBlaze',
    category: 'protein',
    description: 'India\'s most trusted whey protein with added digestive enzymes.',
    ingredients: 'Whey Protein Concentrate, Digestive Enzymes Blend, Cocoa',
    nutritionFacts: 'Per Serving (33g): Calories 116, Protein 25g, Carbs 2.4g, Fat 1.2g',
    weight: '2 kg',
    flavours: ['Chocolate', 'Vanilla', 'Mango', 'Strawberry'],
    images: ['🏋️'],
    mrp: 3499,
    price: 2799,
    ownerPrice: 2399,
    memberPrice: 2799,
    margin: 20,
    discount: 20,
    ownerDiscount: 31,
    stock: 18,
    lowStockThreshold: 5,
    expiryDate: '2027-06-01',
    rating: 4.6,
    reviews: 203,
    sold: 145,
    isActive: true,
    tags: ['popular', 'whey', 'india'],
    offer: '20% OFF',
  },
  {
    id: 'vp3',
    vendorId: 'vs1',
    name: 'Creatine Monohydrate 300g',
    brand: 'Optimum Nutrition',
    category: 'creatine',
    description: 'Micronized creatine monohydrate for maximum absorption and strength gains.',
    ingredients: 'Creatine Monohydrate (Creapure)',
    nutritionFacts: 'Per Serving (5g): Creatine 5000mg',
    weight: '300 g',
    flavours: ['Unflavoured'],
    images: ['⚗️'],
    mrp: 1299,
    price: 999,
    ownerPrice: 849,
    memberPrice: 999,
    margin: 22,
    discount: 23,
    ownerDiscount: 35,
    stock: 15,
    lowStockThreshold: 3,
    expiryDate: '2027-03-01',
    rating: 4.7,
    reviews: 89,
    sold: 67,
    isActive: true,
    tags: ['creatine', 'strength'],
    offer: '23% OFF',
  },
  {
    id: 'vp4',
    vendorId: 'vs1',
    name: 'Pre-Workout C4 Original',
    brand: 'Cellucor',
    category: 'pre_workout',
    description: 'Explosive energy, focus, and performance for your toughest workouts.',
    ingredients: 'CarnoSyn Beta-Alanine, Creatine Nitrate, Arginine AKG, Caffeine',
    nutritionFacts: 'Per Serving (6.5g): Caffeine 150mg, Beta-Alanine 1.6g, Creatine Nitrate 1g',
    weight: '195 g',
    flavours: ['Fruit Punch', 'Watermelon', 'Pink Lemonade', 'Orange Burst'],
    images: ['🔥'],
    mrp: 2499,
    price: 1899,
    ownerPrice: 1699,
    memberPrice: 1899,
    margin: 15,
    discount: 24,
    ownerDiscount: 32,
    stock: 9,
    lowStockThreshold: 3,
    expiryDate: '2026-12-01',
    rating: 4.5,
    reviews: 156,
    sold: 78,
    isActive: true,
    tags: ['energy', 'pre-workout', 'focus'],
    offer: '24% OFF',
  },
  {
    id: 'vp5',
    vendorId: 'vs1',
    name: 'Mass Gainer Serious Mass 5kg',
    brand: 'Optimum Nutrition',
    category: 'mass_gainer',
    description: '1250 calories per serving for serious mass gaining. With vitamins and minerals.',
    ingredients: 'Maltodextrin, Whey Protein, Micellar Casein, Egg Albumin, Glutamine',
    nutritionFacts: 'Per Serving (334g): Calories 1250, Protein 50g, Carbs 252g, Fat 4.5g',
    weight: '5 kg',
    flavours: ['Chocolate', 'Vanilla', 'Banana'],
    images: ['🏋️'],
    mrp: 5999,
    price: 4499,
    ownerPrice: 3999,
    memberPrice: 4499,
    margin: 25,
    discount: 25,
    ownerDiscount: 33,
    stock: 7,
    lowStockThreshold: 2,
    expiryDate: '2027-04-01',
    rating: 4.4,
    reviews: 98,
    sold: 42,
    isActive: true,
    tags: ['mass', 'bulk', 'gainer'],
    offer: '25% OFF',
  },
  {
    id: 'vp6',
    vendorId: 'vs1',
    name: 'BCAA 5050 400g',
    brand: 'MuscleBlaze',
    category: 'bcaa',
    description: 'Branched Chain Amino Acids in 2:1:1 ratio for muscle recovery and endurance.',
    ingredients: 'L-Leucine, L-Isoleucine, L-Valine, Vitamin B6',
    nutritionFacts: 'Per Serving (10g): BCAA 5000mg, Leucine 2500mg, Isoleucine 1250mg, Valine 1250mg',
    weight: '400 g',
    flavours: ['Watermelon', 'Green Apple', 'Cola'],
    images: ['💊'],
    mrp: 1799,
    price: 1299,
    ownerPrice: 1099,
    memberPrice: 1299,
    margin: 20,
    discount: 28,
    ownerDiscount: 39,
    stock: 12,
    lowStockThreshold: 3,
    expiryDate: '2027-02-01',
    rating: 4.6,
    reviews: 67,
    sold: 54,
    isActive: true,
    tags: ['recovery', 'bcaa', 'amino'],
    offer: '28% OFF',
  },
  {
    id: 'vp7',
    vendorId: 'vs1',
    name: 'Gym Shaker 700ml',
    brand: 'FitCore',
    category: 'accessories',
    description: 'BPA-free shaker bottle with mesh mixing ball. Leak proof design.',
    ingredients: 'N/A',
    nutritionFacts: 'N/A',
    weight: '200 g',
    flavours: ['Black', 'Blue', 'Red', 'Green'],
    images: ['🥤'],
    mrp: 499,
    price: 349,
    ownerPrice: 279,
    memberPrice: 349,
    margin: 30,
    discount: 30,
    ownerDiscount: 44,
    stock: 45,
    lowStockThreshold: 10,
    expiryDate: 'N/A',
    rating: 4.3,
    reviews: 189,
    sold: 234,
    isActive: true,
    tags: ['accessories', 'shaker'],
    offer: '30% OFF',
  },
  {
    id: 'vp8',
    vendorId: 'vs1',
    name: 'Peanut Butter Crunchy 1kg',
    brand: 'MyFitness',
    category: 'peanut_butter',
    description: 'High protein peanut butter with no added sugar. Perfect pre/post workout snack.',
    ingredients: 'Peanuts 99.5%, Salt 0.5%',
    nutritionFacts: 'Per 32g: Calories 190, Protein 7g, Carbs 7g, Fat 16g',
    weight: '1 kg',
    flavours: ['Crunchy', 'Smooth', 'Chocolate'],
    images: ['🥜'],
    mrp: 799,
    price: 599,
    ownerPrice: 499,
    memberPrice: 599,
    margin: 22,
    discount: 25,
    ownerDiscount: 38,
    stock: 30,
    lowStockThreshold: 5,
    expiryDate: '2026-12-15',
    rating: 4.7,
    reviews: 312,
    sold: 278,
    isActive: true,
    tags: ['peanut', 'protein', 'snack'],
    offer: '25% OFF',
  },
];

// ── VENDOR ORDERS ─────────────────────────────

export interface VendorOrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  total: number;
}

export interface VendorOrder {
  id: string;
  vendorId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerType: 'member' | 'gym_owner';
  items: VendorOrderItem[];
  total: number;
  deliveryCharge: number;
  discount: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  paymentMethod: 'upi' | 'cash_on_delivery' | 'online';
  orderedAt: string;
  updatedAt: string;
  trackingId?: string;
  notes?: string;
}

export const VENDOR_ORDERS: VendorOrder[] = [
  {
    id: 'ORD-3001',
    vendorId: 'vs1',
    buyerId: 'm1',
    buyerName: 'Arjun Mehta',
    buyerPhone: '9209282289',
    buyerType: 'member',
    items: [
      { productId: 'vp1', productName: 'Whey Protein Gold Standard', qty: 1, price: 3999, total: 3999 },
      { productId: 'vp7', productName: 'Gym Shaker 700ml', qty: 1, price: 349, total: 349 },
    ],
    total: 4348,
    deliveryCharge: 0,
    discount: 0,
    status: 'delivered',
    deliveryMethod: 'local',
    deliveryAddress: '42, Koregaon Park, Pune',
    paymentMethod: 'upi',
    orderedAt: '2026-06-10',
    updatedAt: '2026-06-12',
    trackingId: 'FC-TRK-10234',
  },
  {
    id: 'ORD-3002',
    vendorId: 'vs1',
    buyerId: 'm2',
    buyerName: 'Priya Sharma',
    buyerPhone: '9876543210',
    buyerType: 'member',
    items: [
      { productId: 'vp6', productName: 'BCAA 5050 400g', qty: 2, price: 1299, total: 2598 },
    ],
    total: 2598,
    deliveryCharge: 49,
    discount: 0,
    status: 'shipped',
    deliveryMethod: 'partner',
    deliveryAddress: '15, Baner Road, Pune',
    paymentMethod: 'online',
    orderedAt: '2026-06-16',
    updatedAt: '2026-06-17',
    trackingId: 'FC-TRK-10235',
  },
  {
    id: 'ORD-3003',
    vendorId: 'vs1',
    buyerId: 'owner1',
    buyerName: 'Rajesh Patil (FitCore Elite)',
    buyerPhone: '8530292487',
    buyerType: 'gym_owner',
    items: [
      { productId: 'vp2', productName: 'MuscleBlaze Whey Protein 2kg', qty: 10, price: 2799, total: 27990 },
      { productId: 'vp3', productName: 'Creatine Monohydrate 300g', qty: 5, price: 999, total: 4995 },
    ],
    total: 32985,
    deliveryCharge: 0,
    discount: 10,
    status: 'packed',
    deliveryMethod: 'self',
    deliveryAddress: 'FitCore Elite, 42 Koregaon Park, Pune',
    paymentMethod: 'upi',
    orderedAt: '2026-06-17',
    updatedAt: '2026-06-18',
    notes: 'Bulk order — handle with care',
  },
  {
    id: 'ORD-3004',
    vendorId: 'vs1',
    buyerId: 'm6',
    buyerName: 'Ananya Jain',
    buyerPhone: '9988776655',
    buyerType: 'member',
    items: [
      { productId: 'vp4', productName: 'Pre-Workout C4 Original', qty: 1, price: 1899, total: 1899 },
      { productId: 'vp8', productName: 'Peanut Butter Crunchy 1kg', qty: 2, price: 599, total: 1198 },
    ],
    total: 3097,
    deliveryCharge: 0,
    discount: 0,
    status: 'accepted',
    deliveryMethod: 'local',
    deliveryAddress: 'Flat 3B, Agarwal Heights, Pune',
    paymentMethod: 'upi',
    orderedAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 'ORD-3005',
    vendorId: 'vs1',
    buyerId: 'm3',
    buyerName: 'Rahul Desai',
    buyerPhone: '8765432109',
    buyerType: 'member',
    items: [
      { productId: 'vp5', productName: 'Mass Gainer Serious Mass 5kg', qty: 1, price: 4499, total: 4499 },
    ],
    total: 4499,
    deliveryCharge: 0,
    discount: 0,
    status: 'new',
    deliveryMethod: 'self',
    deliveryAddress: '7, Kothrud, Pune',
    paymentMethod: 'cash_on_delivery',
    orderedAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
];

// ── VENDOR WALLET ─────────────────────────────

export interface VendorTransaction {
  id: string;
  vendorId: string;
  type: 'credit' | 'debit' | 'withdrawal' | 'refund';
  amount: number;
  description: string;
  orderId?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface VendorWallet {
  vendorId: string;
  totalEarnings: number;
  pendingSettlement: number;
  availableBalance: number;
  totalWithdrawn: number;
  lastWithdrawalDate: string;
  upiId: string;
}

export const VENDOR_WALLETS: VendorWallet[] = [
  {
    vendorId: 'vs1',
    totalEarnings: 184250,
    pendingSettlement: 36082,
    availableBalance: 148168,
    totalWithdrawn: 120000,
    lastWithdrawalDate: '2026-06-01',
    upiId: 'karan.shetty@paytm',
  },
];

export const VENDOR_TRANSACTIONS: VendorTransaction[] = [
  { id: 'VT-001', vendorId: 'vs1', type: 'credit', amount: 4348, description: 'Order ORD-3001 — Arjun Mehta', orderId: 'ORD-3001', date: '2026-06-12', status: 'completed' },
  { id: 'VT-002', vendorId: 'vs1', type: 'credit', amount: 2647, description: 'Order ORD-3002 — Priya Sharma', orderId: 'ORD-3002', date: '2026-06-17', status: 'pending' },
  { id: 'VT-003', vendorId: 'vs1', type: 'credit', amount: 32985, description: 'Bulk Order ORD-3003 — FitCore Elite', orderId: 'ORD-3003', date: '2026-06-18', status: 'pending' },
  { id: 'VT-004', vendorId: 'vs1', type: 'withdrawal', amount: 50000, description: 'Withdrawal to HDFC ****4521', date: '2026-06-01', status: 'completed' },
  { id: 'VT-005', vendorId: 'vs1', type: 'withdrawal', amount: 70000, description: 'Withdrawal to HDFC ****4521', date: '2026-05-01', status: 'completed' },
  { id: 'VT-006', vendorId: 'vs1', type: 'refund', amount: 350, description: 'Refund — Order ORD-2998', date: '2026-05-20', status: 'completed' },
];

// ── VENDOR REVIEWS ─────────────────────────────

export interface VendorReview {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  productQuality: number;
  deliverySpeed: number;
  packaging: number;
  valueForMoney: number;
  comment: string;
  date: string;
  isVerified: boolean;
}

export const VENDOR_REVIEWS: VendorReview[] = [
  {
    id: 'vr1',
    vendorId: 'vs1',
    productId: 'vp1',
    productName: 'Whey Protein Gold Standard',
    reviewerId: 'm1',
    reviewerName: 'Arjun Mehta',
    rating: 5,
    productQuality: 5,
    deliverySpeed: 5,
    packaging: 5,
    valueForMoney: 4,
    comment: 'Absolutely genuine product! Packaging was perfect and delivery was super fast. Will order again 💪',
    date: '2026-06-13',
    isVerified: true,
  },
  {
    id: 'vr2',
    vendorId: 'vs1',
    productId: 'vp2',
    productName: 'MuscleBlaze Whey Protein',
    reviewerId: 'm6',
    reviewerName: 'Ananya Jain',
    rating: 4,
    productQuality: 4,
    deliverySpeed: 5,
    packaging: 4,
    valueForMoney: 5,
    comment: 'Great value for money. Tastes good and mixes well. Delivery was next day!',
    date: '2026-06-05',
    isVerified: true,
  },
  {
    id: 'vr3',
    vendorId: 'vs1',
    productId: 'vp8',
    productName: 'Peanut Butter Crunchy 1kg',
    reviewerId: 'm2',
    reviewerName: 'Priya Sharma',
    rating: 5,
    productQuality: 5,
    deliverySpeed: 4,
    packaging: 5,
    valueForMoney: 5,
    comment: 'Best peanut butter! No oil separation, amazing taste. The crunchy version is my favorite.',
    date: '2026-05-28',
    isVerified: true,
  },
];

// ── VENDOR OFFERS / COUPONS ────────────────────

export interface VendorCoupon {
  id: string;
  vendorId: string;
  code: string;
  type: 'flat' | 'percentage' | 'bogo' | 'free_delivery';
  value: number;
  minOrderValue: number;
  description: string;
  validUntil: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

export const VENDOR_COUPONS: VendorCoupon[] = [
  {
    id: 'vc1',
    vendorId: 'vs1',
    code: 'MUSCLE20',
    type: 'percentage',
    value: 20,
    minOrderValue: 1500,
    description: '20% off on orders above ₹1,500',
    validUntil: '2026-07-31',
    usedCount: 47,
    maxUses: 200,
    isActive: true,
  },
  {
    id: 'vc2',
    vendorId: 'vs1',
    code: 'FLAT500',
    type: 'flat',
    value: 500,
    minOrderValue: 3000,
    description: 'Flat ₹500 off on orders above ₹3,000',
    validUntil: '2026-06-30',
    usedCount: 23,
    maxUses: 100,
    isActive: true,
  },
  {
    id: 'vc3',
    vendorId: 'vs1',
    code: 'FREEDEL',
    type: 'free_delivery',
    value: 0,
    minOrderValue: 500,
    description: 'Free delivery on all orders above ₹500',
    validUntil: '2026-12-31',
    usedCount: 89,
    maxUses: 500,
    isActive: true,
  },
];

// ── VENDOR HELPER FUNCTIONS ────────────────────

export function getVendorStoreByUserId(userId: string): VendorStore | undefined {
  return VENDOR_STORES.find(vs => vs.userId === userId);
}

export function getVendorStoreById(vendorId: string): VendorStore | undefined {
  return VENDOR_STORES.find(vs => vs.id === vendorId);
}

export function getVendorProductsByStore(vendorId: string): VendorProduct[] {
  return VENDOR_PRODUCTS.filter(vp => vp.vendorId === vendorId);
}

export function getVendorOrdersByStore(vendorId: string): VendorOrder[] {
  return VENDOR_ORDERS.filter(vo => vo.vendorId === vendorId)
    .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
}

export function getVendorWallet(vendorId: string): VendorWallet | undefined {
  return VENDOR_WALLETS.find(w => w.vendorId === vendorId);
}

export function getVendorTransactions(vendorId: string): VendorTransaction[] {
  return VENDOR_TRANSACTIONS.filter(t => t.vendorId === vendorId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getVendorReviews(vendorId: string): VendorReview[] {
  return VENDOR_REVIEWS.filter(r => r.vendorId === vendorId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getVendorCoupons(vendorId: string): VendorCoupon[] {
  return VENDOR_COUPONS.filter(c => c.vendorId === vendorId);
}

export function getAllVendorProducts(): VendorProduct[] {
  return VENDOR_PRODUCTS.filter(p => p.isActive);
}

// ── VENDOR ANALYTICS SUMMARY ──────────────────

export const VENDOR_ANALYTICS = {
  vs1: {
    todayOrders: 2,
    todayRevenue: 7596,
    monthlyRevenue: 184250,
    pendingOrders: 3,
    deliveredOrders: 28,
    totalProducts: 8,
    lowStockProducts: 2,
    avgRating: 4.7,
    totalReviews: 234,
    returnsThisMonth: 1,
    topProduct: 'MuscleBlaze Whey Protein 2kg',
    // Buyer breakdown
    ownerOrderCount: 8,
    memberOrderCount: 20,
    ownerRevenue: 98200,
    memberRevenue: 86050,
    revenueChart: [
      { label: 'Jan', value: 28000 },
      { label: 'Feb', value: 32000 },
      { label: 'Mar', value: 35000 },
      { label: 'Apr', value: 29000 },
      { label: 'May', value: 38000 },
      { label: 'Jun', value: 22250 },
    ],
    // Monthly buyer chart for analytics screen
    ownerRevenueChart: [
      { label: 'Jan', value: 15000 },
      { label: 'Feb', value: 18000 },
      { label: 'Mar', value: 20000 },
      { label: 'Apr', value: 16000 },
      { label: 'May', value: 22000 },
      { label: 'Jun', value: 7200 },
    ],
    memberRevenueChart: [
      { label: 'Jan', value: 13000 },
      { label: 'Feb', value: 14000 },
      { label: 'Mar', value: 15000 },
      { label: 'Apr', value: 13000 },
      { label: 'May', value: 16000 },
      { label: 'Jun', value: 15050 },
    ],
    ordersByStatus: {
      new: 2,
      accepted: 1,
      packed: 1,
      shipped: 1,
      delivered: 28,
      cancelled: 2,
    },
  },
};
