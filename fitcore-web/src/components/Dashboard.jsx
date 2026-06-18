import React, { useState } from 'react';
import DashboardView from './views/DashboardView.jsx';
import MembersView from './views/MembersView.jsx';
import TrainersView from './views/TrainersView.jsx';
import PlansView from './views/PlansView.jsx';
import AttendanceView from './views/AttendanceView.jsx';
import PaymentsView from './views/PaymentsView.jsx';
import WorkoutsView from './views/WorkoutsView.jsx';
import DietsView from './views/DietsView.jsx';
import ClassesView from './views/ClassesView.jsx';
import NotificationsView from './views/NotificationsView.jsx';
import ReportsView from './views/ReportsView.jsx';
import SettingsView from './views/SettingsView.jsx';
import ProfileView from './views/ProfileView.jsx';

import logoIcon from '../assets/Icone.png';

const INITIAL_MEMBERS = [
  {
    id: 'm1',
    name: 'Ankit Kumar',
    phone: '8530292487',
    joinedDate: 'Jan 10, 2026',
    plan: 'Gold Annual Pass',
    trainer: 'Vikram Singh',
    status: 'Active',
    avatar: 'AK',
    attendance: [
      { date: '2026-06-17', checkIn: '08:20 AM', checkOut: '09:45 AM', status: 'Present' },
      { date: '2026-06-16', checkIn: '08:15 AM', checkOut: '09:30 AM', status: 'Present' },
      { date: '2026-06-15', checkIn: '08:30 AM', checkOut: '09:50 AM', status: 'Present' }
    ],
    payments: [
      { id: 'TX-9018', date: 'Jan 10, 2026', amount: '₹8,000', method: 'UPI', status: 'Paid' }
    ],
    workoutPlan: {
      Chest: 'Incline Bench Press (4x10), Chest Flyes (3x12)',
      Back: 'Lat Pulldowns (4x10), Cable Rows (3x12)',
      Leg: 'Squats (4x8), Leg Extensions (3x15)',
      Shoulder: 'Overhead Press (4x10), Lateral Raises (3x15)',
      Cardio: '15 mins Treadmill HIIT'
    },
    dietPlan: {
      Breakfast: 'Oats with milk, scoop of whey, 1 banana',
      Lunch: '200g Grilled Chicken, Brown Rice, Broccoli',
      Dinner: 'Baked Salmon or Paneer, Sweet Potato, Salad',
      Snacks: 'Almonds, Apple, green tea',
      WaterIntake: '4 Liters'
    },
    measurements: { weight: '76 kg', height: '178 cm', chest: '40 in', biceps: '15 in', waist: '32 in' },
    progress: [
      { date: 'Jan 10', weight: '79 kg' },
      { date: 'Mar 15', weight: '77 kg' },
      { date: 'Jun 10', weight: '76 kg' }
    ],
    medicalNotes: 'No major injuries. Mild knee tension during deep squats.',
    history: 'Registered as premium member. Consistently visits during morning slot.'
  },
  {
    id: 'm2',
    name: 'Rahul Sharma',
    phone: '9123456789',
    joinedDate: 'Feb 15, 2026',
    plan: 'Silver 6 Months',
    trainer: 'Ananya Joshi',
    status: 'Active',
    avatar: 'RS',
    attendance: [
      { date: '2026-06-17', checkIn: '09:10 AM', checkOut: '10:30 AM', status: 'Present' },
      { date: '2026-06-16', checkIn: '09:05 AM', checkOut: '10:15 AM', status: 'Present' }
    ],
    payments: [
      { id: 'TX-8802', date: 'Feb 15, 2026', amount: '₹4,500', method: 'Card', status: 'Paid' }
    ],
    workoutPlan: { Chest: 'Dumbbell Press (4x10)', Back: 'Pullups (4x8)', Leg: 'Leg Press (3x12)', Shoulder: 'Shoulder Press', Cardio: 'Cycling 20 mins' },
    dietPlan: { Breakfast: '3 Egg Whites, 2 slices Brown Bread', Lunch: 'Dal, Roti, Mixed Veg, Tofu', Dinner: 'Soya Chunks, Rice, Salad', Snacks: 'Roasted Chana', WaterIntake: '3 Liters' },
    measurements: { weight: '68 kg', height: '172 cm', chest: '37 in', biceps: '13 in', waist: '30 in' },
    progress: [{ date: 'Feb 15', weight: '71 kg' }, { date: 'May 10', weight: '68 kg' }],
    medicalNotes: 'Asthmatic. Carry inhaler.',
    history: 'Renewed membership for another 6 months.'
  },
  {
    id: 'm3',
    name: 'Neha Singh',
    phone: '9876543210',
    joinedDate: 'Jun 17, 2026',
    plan: 'Basic 3 Months',
    trainer: 'None',
    status: 'Active',
    avatar: 'NS',
    attendance: [
      { date: '2026-06-17', checkIn: '06:15 PM', checkOut: '07:30 PM', status: 'Present' }
    ],
    payments: [
      { id: 'TX-9912', date: 'Jun 17, 2026', amount: '₹2,500', method: 'UPI', status: 'Paid' }
    ],
    workoutPlan: { Chest: 'Pushups (3x15)', Back: 'Lat Pulldowns', Leg: 'Squats', Shoulder: 'Lateral Raises', Cardio: 'Treadmill Jogging' },
    dietPlan: { Breakfast: 'Poha, Green Tea', Lunch: 'Salad, Dal, 1 Roti', Dinner: 'Soup, Grilled Paneer', Snacks: 'Fruit Salad', WaterIntake: '3 Liters' },
    measurements: { weight: '60 kg', height: '165 cm', chest: '34 in', biceps: '11 in', waist: '28 in' },
    progress: [{ date: 'Jun 17', weight: '60 kg' }],
    medicalNotes: 'None.',
    history: 'Joined today. Set target for general fitness and active cardio.'
  },
  {
    id: 'm4',
    name: 'Amit Verma',
    phone: '9898989898',
    joinedDate: 'Mar 05, 2026',
    plan: 'Gold Annual Pass',
    trainer: 'Rohit Desai',
    status: 'Active',
    avatar: 'AV',
    attendance: [],
    payments: [
      { id: 'TX-9021', date: 'Mar 05, 2026', amount: '₹8,000', method: 'UPI', status: 'Paid' }
    ],
    workoutPlan: {},
    dietPlan: {},
    measurements: { weight: '88 kg', height: '182 cm' },
    progress: [],
    medicalNotes: 'Lower back disk issues. No heavy deadlifts.',
    history: 'Gold member. Training focuses on posture and back core strength.'
  },
  {
    id: 'm5',
    name: 'Sanya Gupta',
    phone: '9567123450',
    joinedDate: 'May 28, 2026',
    plan: 'Basic 3 Months',
    trainer: 'None',
    status: 'Pending',
    avatar: 'SG',
    attendance: [],
    payments: [
      { id: 'TX-9014', date: 'May 28, 2026', amount: '₹2,500', method: 'Cash', status: 'Pending' }
    ],
    workoutPlan: {},
    dietPlan: {},
    measurements: {},
    progress: [],
    medicalNotes: 'None',
    history: 'Pending cash payment check clearance from front desk.'
  }
];

const INITIAL_TRAINERS = [
  { id: 't1', name: 'Vikram Singh', specialization: 'Strength & Powerlifting', experience: '7 Years', assignedMembers: 8, salary: '₹35,000', status: 'Available' },
  { id: 't2', name: 'Ananya Joshi', specialization: 'Yoga & Flexibility', experience: '5 Years', assignedMembers: 12, salary: '₹28,000', status: 'Available' },
  { id: 't3', name: 'Rohit Desai', specialization: 'HIIT & Cardio', experience: '4 Years', assignedMembers: 5, salary: '₹25,000', status: 'Busy' }
];

const INITIAL_PLANS = [
  { id: 'p1', name: 'Basic Pass', duration: '3 Months', price: '₹2,500' },
  { id: 'p2', name: 'Silver Pass', duration: '6 Months', price: '₹4,500' },
  { id: 'p3', name: 'Gold Pass', duration: '12 Months', price: '₹8,000' }
];

const INITIAL_CLASSES = [
  { id: 'c1', name: 'Power Strength Training', time: '06:00 PM', period: 'PM', trainer: 'Vikram Singh', room: 'Gym Floor A', booked: 14, capacity: 20 },
  { id: 'c2', name: 'Mindful Vinyasa Yoga', time: '07:30 PM', period: 'PM', trainer: 'Ananya Joshi', room: 'Studio B', booked: 15, capacity: 15 },
  { id: 'c3', name: 'High Energy HIIT', time: '08:30 PM', period: 'PM', trainer: 'Rohit Desai', room: 'Gym Floor B', booked: 8, capacity: 25 }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: 'Gym Maintenance Closure', message: 'FitCore floor B will be closed for regular sanitization on Sunday morning between 8 AM to 12 PM.', target: 'All Members', type: 'Push', date: 'Jun 15, 2026' },
  { id: 'n2', title: 'New Supplement Stock Alert', message: 'Fresh stock of ON Whey and Micronized Creatine is now available at the pick-up counter.', target: 'All Members', type: 'Email', date: 'Jun 12, 2026' }
];

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Central states for the in-memory database
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [trainers, setTrainers] = useState(INITIAL_TRAINERS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [gymConfig, setGymConfig] = useState({
    name: 'FITCORE FITNESS CLUB',
    logo: logoIcon,
    hours: '06:00 AM - 10:00 PM',
    branches: 'Mumbai (Main), Pune',
    subscription: 'Enterprise Active',
    taxRate: '18% GST',
    roles: 'Admin, Trainer, Front Desk'
  });

  const [ownerProfile, setOwnerProfile] = useState({
    name: 'Ankit Kumar',
    phone: '8530292487',
    role: 'Gym Owner & Director',
    email: 'ankit@fitcore.io',
    address: 'Elite Sector 4, Link Road, Mumbai'
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'trainers', label: 'Trainers', icon: '👨‍🏫' },
    { id: 'plans', label: 'Membership Plans', icon: '💳' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'workouts', label: 'Workout Plans', icon: '🏋️' },
    { id: 'diets', label: 'Diet Plans', icon: '🥗' },
    { id: 'classes', label: 'Classes', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '📢' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView members={members} trainers={trainers} plans={plans} classes={classes} notifications={notifications} gymConfig={gymConfig} setTab={setActiveTab} />;
      case 'members':
        return <MembersView members={members} setMembers={setMembers} trainers={trainers} plans={plans} />;
      case 'trainers':
        return <TrainersView trainers={trainers} setTrainers={setTrainers} members={members} />;
      case 'plans':
        return <PlansView plans={plans} setPlans={setPlans} />;
      case 'attendance':
        return <AttendanceView members={members} setMembers={setMembers} />;
      case 'payments':
        return <PaymentsView members={members} setMembers={setMembers} plans={plans} />;
      case 'workouts':
        return <WorkoutsView members={members} setMembers={setMembers} />;
      case 'diets':
        return <DietsView members={members} setMembers={setMembers} />;
      case 'classes':
        return <ClassesView classes={classes} setClasses={setClasses} trainers={trainers} />;
      case 'notifications':
        return <NotificationsView notifications={notifications} setNotifications={setNotifications} members={members} trainers={trainers} />;
      case 'reports':
        return <ReportsView members={members} trainers={trainers} plans={plans} />;
      case 'settings':
        return <SettingsView gymConfig={gymConfig} setGymConfig={setGymConfig} />;
      case 'profile':
        return <ProfileView ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} />;
      default:
        return <DashboardView members={members} trainers={trainers} plans={plans} classes={classes} notifications={notifications} gymConfig={gymConfig} setTab={setActiveTab} />;
    }
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src={gymConfig.logo} alt="FitCore Brand Logo" className="sidebar-logo-img" />
          <div className="brand-meta">
            <span className="brand-name">FITCORE</span>
            <span className="brand-status">ADMIN PANEL</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-menu-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="sidebar-menu-btn logout-btn" onClick={onLogout}>
            <span className="menu-icon">🚪</span>
            <span className="menu-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <main className="dashboard-viewport">
        {renderActiveView()}
      </main>
    </div>
  );
}
