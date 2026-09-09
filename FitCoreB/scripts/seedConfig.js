const { MongoClient } = require('mongodb');

async function seed() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/fitcore';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('fitcore');

    const configDoc = {
      configKey: 'global_settings',
      packages: [
        {
          id: 'starter',
          name: 'Starter Club',
          price: '₹14,999 / yr',
          amount: 14999,
          billingCycle: 'yearly',
          capacity: '150 Members',
          badge: 'Standard',
          features: ['Basic Member Check-in', 'Manual Turnstile Entry', 'Daily Attendance Logs', 'Standard Reports']
        },
        {
          id: 'pro',
          name: 'Pro Studio',
          price: '₹34,999 / yr',
          amount: 34999,
          billingCycle: 'yearly',
          capacity: '600 Members',
          badge: 'Popular',
          recommended: true,
          features: ['Smart NFC Turnstile Sync', 'Live Floor Occupancy Gauge', 'Trainer Scheduling & Classes', 'Real-time Calorie Radar', 'Broadcast Push Alerts']
        },
        {
          id: 'enterprise',
          name: 'Enterprise VIP Flagship',
          price: '₹69,999 / yr',
          amount: 69999,
          billingCycle: 'yearly',
          capacity: 'Unlimited',
          badge: 'All-Inclusive',
          features: ['Unlimited Members & Gates', 'Supplement Store POS Integration', 'Multi-Gate Turnstile Access', 'Priority KYC Approvals', 'Dedicated Account Manager']
        }
      ],
      cities: [
        'Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 
        'Chennai', 'Nagpur', 'Ahmedabad', 'Kolkata', 'Jaipur', 
        'Chandigarh', 'Lucknow', 'Indore', 'Surat', 'Kochi', 'Goa'
      ],
      activityTypes: [
        { id: 'gym', label: 'Gym / Fitness' },
        { id: 'yoga', label: 'Yoga' },
        { id: 'dance', label: 'Dance & Zumba' },
        { id: 'crossfit', label: 'CrossFit' },
        { id: 'boxing', label: 'Boxing / MMA' },
        { id: 'swimming', label: 'Swimming' }
      ],
      amenities: [
        { id: 'turnstile', label: 'NFC Smart Turnstiles' },
        { id: 'cardio', label: 'Cardio Cinema Theatre' },
        { id: 'strength', label: 'Heavy Olympic Strength Zone' },
        { id: 'spa', label: 'Spa, Steam & Recovery Bath' },
        { id: 'protein', label: 'Protein & Nutrition Bar' },
        { id: 'yoga', label: 'AC Yoga & Pilates Studio' },
        { id: 'shower', label: 'Luxury Shower & Locker Suites' },
        { id: 'wifi', label: 'High-Speed Gym WiFi' }
      ],
      permissionsList: [
        { key: 'canRegisterMembers', label: 'Member Onboarding & KYC', desc: 'Allow gym to register and edit member profiles' },
        { key: 'canUseTurnstiles', label: 'NFC Turnstile Scanner Sync', desc: 'Enable automated QR/NFC gate check-in' },
        { key: 'canAccessStore', label: 'Supplement & Gear POS Store', desc: 'Sell MuscleZone/FitGear partner supplements' },
        { key: 'canManageTrainers', label: 'Trainer Portal & Commissions', desc: 'Schedule trainer classes and calculate payroll' },
        { key: 'canBroadcastAlerts', label: 'Push Broadcast Notifications', desc: 'Send real-time alerts to club members' },
        { key: 'canViewBiometrics', label: 'Live Biometrics Radar', desc: 'Track live calorie and BPM heart rate HUD' }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.collection('platform_config').updateOne(
      { configKey: 'global_settings' },
      { $set: configDoc },
      { upsert: true }
    );
    console.log('✅ MongoDB platform_config initialized successfully!');
  } catch (err) {
    console.error('Error seeding platform_config:', err);
  } finally {
    await client.close();
  }
}

seed();
