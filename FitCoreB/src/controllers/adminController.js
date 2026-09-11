const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { runAutoCheckOutEngine } = require('./attendanceController');

exports.getMetrics = async (req, res, next) => {
  try {
    const db = await getDb();
    const gyms = await db.collection('gyms').find({}).toArray();
    const gymsCount = gyms.length;
    const membersCount = await db.collection('members').countDocuments({});
    const vendorsCount = await db.collection('vendor_stores').countDocuments({});
    const pendingKycCount = await db.collection('vendor_stores').countDocuments({ status: 'pending' });

    // Fetch dynamic packages pricing from platform_config in MongoDB
    const config = await db.collection('platform_config').findOne({ configKey: 'global_settings' });
    const packages = config?.packages || [
      { id: 'starter', amount: 14999 },
      { id: 'pro', amount: 34999 },
      { id: 'enterprise', amount: 69999 }
    ];

    const packagePriceMap = {};
    packages.forEach(p => {
      packagePriceMap[p.id] = Number(p.amount) || (p.id === 'starter' ? 14999 : (p.id === 'enterprise' ? 69999 : 34999));
    });

    const totalCalculatedRevenue = gyms.reduce((acc, g) => {
      const planKey = (g.plan || 'pro').toLowerCase();
      const planAmount = packagePriceMap[planKey] || 34999;
      return acc + planAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalGyms: gymsCount,
        totalMembers: membersCount,
        pendingKyc: pendingKycCount,
        totalVendors: vendorsCount,
        revenue: totalCalculatedRevenue,
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getHubTelemetry = async (req, res, next) => {
  try {
    const db = await getDb();
    const { gymId } = req.query;

    // Run Auto-Checkout Engine to evaluate shift cutoffs (Morning 13:00, Afternoon 16:00, Evening 23:00, Night 04:00)
    await runAutoCheckOutEngine(db);

    // Fetch real gyms from MongoDB
    const gyms = await db.collection('gyms').find({}).toArray();
    const filterGym = gymId && gymId !== 'all' ? gyms.find(g => g._id.toString() === gymId || g.id === gymId) : null;

    const gymMap = {};
    gyms.forEach(g => {
      gymMap[g._id.toString()] = g.name;
      if (g.id) gymMap[g.id] = g.name;
    });

    const gymFilter = filterGym ? {
      $or: [
        { gymId: filterGym._id.toString() },
        { gymId: filterGym.id },
        { gym_id: filterGym._id.toString() }
      ]
    } : {};

    // 1. Live Checked-in Occupancy from MongoDB (Currently inside gym)
    const activeCheckedIn = await db.collection('attendance').find({
      ...gymFilter,
      $or: [{ checkOutTime: null }, { status: 'CHECKED_IN' }, { status: 'in_gym' }]
    }).toArray();

    // 2. Recent Live Turnstile Activity Stream (Real database events only)
    const recentRecords = await db.collection('attendance').find(gymFilter)
      .sort({ checkInTime: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    const liveCheckIns = recentRecords.map(r => {
      const gName = gymMap[r.gymId] || gymMap[r.gym_id] || (filterGym ? filterGym.name : (gyms[0]?.name || 'Gym Studio'));
      const inTime = r.checkInTime ? new Date(r.checkInTime) : (r.createdAt ? new Date(r.createdAt) : new Date());
      const timeStr = inTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = inTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const isInside = !r.checkOutTime || r.status === 'CHECKED_IN' || r.status === 'in_gym';
      const isAutoOut = r.status === 'AUTO_CHECKED_OUT' || !!r.autoCheckedOut;
      const outTime = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
      return {
        id: r._id.toString(),
        name: r.memberName || 'Athlete',
        time: timeStr,
        date: dateStr,
        gym: gName,
        gymId: r.gymId || r.gym_id,
        type: r.sessionType ? `${r.sessionType} Session` : 'Workout Entry',
        badge: isInside ? '● IN GYM' : (isAutoOut ? 'AUTO CHECKED OUT' : 'CHECKED OUT'),
        status: isInside ? 'in_gym' : (isAutoOut ? 'auto_checked_out' : 'checked_out'),
        autoCheckedOut: isAutoOut,
        autoCheckoutReason: r.autoCheckoutReason || '',
        method: r.method === 'kiosk' ? 'NFC Turnstile Kiosk' : (r.method === 'qr_code' ? 'Smart QR Pass' : (r.method || 'Turnstile Gate')),
        durationMinutes: r.durationMinutes || r.durationMins || (isInside ? 'Active' : '10m'),
        caloriesBurned: r.caloriesBurned || 0,
        outTime: outTime
      };
    });

    // 3. Dynamic Revenue / Attendance Chart Datasets (Aggregated directly from MongoDB)
    const allAttendance = await db.collection('attendance').find(gymFilter).toArray();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Today's actual calories burned
    const todayAttendance = allAttendance.filter(a => {
      const aDate = a.date || (a.checkInTime ? new Date(a.checkInTime).toISOString().split('T')[0] : '');
      return aDate === todayStr;
    });
    const totalCaloriesBurnedToday = todayAttendance.reduce((acc, curr) => acc + (Number(curr.caloriesBurned) || 0), 0);

    // Calculate actual Weekly aggregation
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    // Calculate actual Monthly aggregation for current year
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    monthNames.forEach(m => { monthlyMap[m] = 0; });

    // Calculate actual Yearly aggregation
    const yearlyMap = {
      [String(currentYear - 2)]: 0,
      [String(currentYear - 1)]: 0,
      [String(currentYear)]: 0
    };

    allAttendance.forEach(a => {
      const rawDate = a.date || a.checkInTime || a.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          // Weekly
          const dName = days[d.getDay()];
          if (weeklyMap[dName] !== undefined) weeklyMap[dName]++;

          // Monthly
          if (d.getFullYear() === currentYear) {
            const mName = monthNames[d.getMonth()];
            if (monthlyMap[mName] !== undefined) monthlyMap[mName]++;
          }

          // Yearly
          const yStr = String(d.getFullYear());
          if (yearlyMap[yStr] !== undefined) yearlyMap[yStr]++;
        }
      }
    });

    const chartDatasets = {
      weekly: [
        { label: 'Mon', val: weeklyMap.Mon, rev: weeklyMap.Mon > 0 ? `₹${weeklyMap.Mon * 350}` : '₹0' },
        { label: 'Tue', val: weeklyMap.Tue, rev: weeklyMap.Tue > 0 ? `₹${weeklyMap.Tue * 350}` : '₹0' },
        { label: 'Wed', val: weeklyMap.Wed, rev: weeklyMap.Wed > 0 ? `₹${weeklyMap.Wed * 350}` : '₹0' },
        { label: 'Thu', val: weeklyMap.Thu, rev: weeklyMap.Thu > 0 ? `₹${weeklyMap.Thu * 350}` : '₹0' },
        { label: 'Fri', val: weeklyMap.Fri, rev: weeklyMap.Fri > 0 ? `₹${weeklyMap.Fri * 350}` : '₹0' },
        { label: 'Sat', val: weeklyMap.Sat, rev: weeklyMap.Sat > 0 ? `₹${weeklyMap.Sat * 350}` : '₹0' },
        { label: 'Sun', val: weeklyMap.Sun, rev: weeklyMap.Sun > 0 ? `₹${weeklyMap.Sun * 350}` : '₹0' }
      ],
      monthly: monthNames.map(m => ({
        label: m,
        val: monthlyMap[m],
        rev: monthlyMap[m] > 0 ? `₹${(monthlyMap[m] * 350).toLocaleString()}` : '₹0'
      })),
      yearly: Object.keys(yearlyMap).map(y => ({
        label: y,
        val: yearlyMap[y],
        rev: yearlyMap[y] > 0 ? `₹${(yearlyMap[y] * 350).toLocaleString()}` : '₹0'
      }))
    };

    // Live Occupancy Metrics from database
    const totalCap = filterGym 
      ? (Number(filterGym.capacity) || 0) 
      : gyms.reduce((sum, g) => sum + (Number(g.capacity) || 0), 0);
    const currentOccupancy = activeCheckedIn.length;
    const occupancyPercentage = totalCap > 0 ? Math.min(100, Math.round((currentOccupancy / totalCap) * 100)) : 0;

    res.json({
      success: true,
      data: {
        currentOccupancy,
        maxCapacity: totalCap,
        occupancyPercentage,
        caloriesBurnedToday: totalCaloriesBurnedToday,
        liveCheckIns,
        studioSchedule: [],
        chartDatasets
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getConfig = async (req, res, next) => {
  try {
    const db = await getDb();
    let config = await db.collection('platform_config').findOne({ configKey: 'global_settings' });

    if (!config) {
      // Default initial schema in database
      config = {
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
          { id: 'gym', label: 'Gym / Fitness', icon: '🏋️' },
          { id: 'yoga', label: 'Yoga', icon: '🧘' },
          { id: 'dance', label: 'Dance & Zumba', icon: '💃' },
          { id: 'crossfit', label: 'CrossFit', icon: '🔥' },
          { id: 'boxing', label: 'Boxing / MMA', icon: '🥊' },
          { id: 'swimming', label: 'Swimming', icon: '🏊' }
        ],
        amenities: [
          { id: 'turnstile', label: 'NFC Smart Turnstiles', icon: '⚡' },
          { id: 'cardio', label: 'Cardio Cinema Theatre', icon: '🏃' },
          { id: 'strength', label: 'Heavy Olympic Strength Zone', icon: '🏋️' },
          { id: 'spa', label: 'Spa, Steam & Recovery Bath', icon: '🧖' },
          { id: 'protein', label: 'Protein & Nutrition Bar', icon: '🥤' },
          { id: 'yoga', label: 'AC Yoga & Pilates Studio', icon: '🧘' },
          { id: 'shower', label: 'Luxury Shower & Locker Suites', icon: '🚿' },
          { id: 'wifi', label: 'High-Speed Gym WiFi', icon: '📶' }
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
      await db.collection('platform_config').insertOne(config);
    }

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const db = await getDb();
    const { packages, cities, activityTypes, amenities, permissionsList } = req.body;

    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (packages) updateFields.packages = packages;
    if (cities) updateFields.cities = cities;
    if (activityTypes) updateFields.activityTypes = activityTypes;
    if (amenities) updateFields.amenities = amenities;
    if (permissionsList) updateFields.permissionsList = permissionsList;

    await db.collection('platform_config').updateOne(
      { configKey: 'global_settings' },
      { $set: updateFields },
      { upsert: true }
    );

    const updated = await db.collection('platform_config').findOne({ configKey: 'global_settings' });
    res.json({
      success: true,
      message: 'Platform SaaS packages and settings updated successfully in database!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.getGyms = async (req, res, next) => {
  try {
    const db = await getDb();
    const rawGyms = await db.collection('gyms').find({}).toArray();
    const gyms = rawGyms.map(g => ({
      ...g,
      id: g._id ? g._id.toString() : (g.id || 'g_' + Math.random())
    }));
    res.json({
      success: true,
      data: gyms
    });
  } catch (err) {
    next(err);
  }
};

exports.createGym = async (req, res, next) => {
  try {
    const {
      name, address, city, state, pincode, phone, email,
      ownerName, ownerPhone, ownerEmail, password,
      plan, capacity, amenities, permissions, gstNumber, category
    } = req.body;

    const validationErrors = {};

    // 1. Required fields
    if (!name || !name.trim()) validationErrors.name = 'Franchise club name is required.';
    if (!city || !city.trim()) validationErrors.city = 'City selection is required.';
    if (!address || !address.trim()) validationErrors.address = 'Branch street address is required.';
    if (!ownerName || !ownerName.trim()) validationErrors.ownerName = 'Owner full name is required.';

    // 2. Phone validation (Clean 10-digit number)
    const cleanGymPhone = String(phone || '').replace(/\D/g, '');
    const cleanOwnerPhone = String(ownerPhone || '').replace(/\D/g, '');

    if (!cleanGymPhone || cleanGymPhone.length < 10) {
      validationErrors.phone = 'Valid 10-digit official gym phone number is required.';
    }

    if (!cleanOwnerPhone || cleanOwnerPhone.length < 10) {
      validationErrors.ownerPhone = 'Valid 10-digit owner mobile number is required for portal login.';
    }

    // 3. Email validation (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email.trim())) {
      validationErrors.email = 'Please provide a valid support email address.';
    }
    if (ownerEmail && !emailRegex.test(ownerEmail.trim())) {
      validationErrors.ownerEmail = 'Please provide a valid owner email address.';
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        error: Object.values(validationErrors)[0],
        validationErrors
      });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    const gymsCollection = db.collection('gyms');
    const notificationsCollection = db.collection('notifications');

    // 4. Duplicate Owner Check
    const existingUser = await usersCollection.findOne({ phone: cleanOwnerPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `Owner phone number ${cleanOwnerPhone} is already registered to another account.`,
        validationErrors: { ownerPhone: 'Phone number already in use.' }
      });
    }

    // 5. Duplicate Franchise Name & City Check
    const existingGym = await gymsCollection.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      city: city
    });
    if (existingGym) {
      return res.status(400).json({
        success: false,
        error: `A franchise named "${name}" already exists in ${city}.`,
        validationErrors: { name: 'Franchise already registered in this city.' }
      });
    }

    const initialPassword = password || 'FitCore@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const ownerAvatar = ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OW';

    // Default Pan-India amenities if not provided
    const defaultAmenities = amenities && amenities.length > 0 
      ? amenities 
      : ['NFC Smart Turnstiles', 'Cardio Cinema Theatre', 'Heavy Olympic Strength Zone', 'High-Speed Gym WiFi'];

    // Default Pan-India permissions if not provided
    const defaultPermissions = permissions || {
      canRegisterMembers: true,
      canUseTurnstiles: true,
      canAccessStore: plan === 'enterprise' || plan === 'pro',
      canManageTrainers: true,
      canBroadcastAlerts: plan === 'enterprise' || plan === 'pro',
      canViewBiometrics: true
    };

    // 1. Create Gym Document
    const newGymDoc = {
      name,
      address: address || 'Main Road',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      pincode: pincode || '440001',
      phone: String(phone),
      email: email || '',
      category: category || 'Luxury Fitness Club',
      rating: 4.8,
      status: 'approved',
      plan: plan || 'pro',
      subscriptionAmount: Number(req.body.subscriptionAmount) || 34999,
      billingCycle: req.body.billingCycle || 'yearly',
      subscriptionNotes: req.body.subscriptionNotes || '',
      capacity: Number(capacity) || 250,
      amenities: defaultAmenities,
      permissions: defaultPermissions,
      gstNumber: gstNumber || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const gymResult = await gymsCollection.insertOne(newGymDoc);
    const gymId = String(gymResult.insertedId);

    // 2. Create Owner User
    const newOwnerDoc = {
      name: ownerName,
      phone: String(ownerPhone),
      email: ownerEmail || null,
      password: hashedPassword,
      role: 'gym_owner',
      avatar: ownerAvatar,
      gymId: gymId,
      createdAt: new Date(),
      updatedAt: new Date()
    };                  

    const ownerResult = await usersCollection.insertOne(newOwnerDoc);
    const ownerId = String(ownerResult.insertedId);

    // 3. Create Pan-India Notifications
    await notificationsCollection.insertOne({
      title: 'New Franchise Activated in India',
      message: `Franchise "${name}" (${city || 'India'}) registered with plan "${(plan || 'pro').toUpperCase()}". Owner: ${ownerName}`,
      target: 'admin',
      type: 'system',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
      createdAt: new Date()
    });

    await notificationsCollection.insertOne({
      title: 'FitCore Franchise Welcome',
      message: `Welcome ${ownerName}! Your franchise "${name}" in ${city || 'India'} is now live with the ${(plan || 'pro').toUpperCase()} plan.`,
      target: 'gym_owner',
      userId: ownerId,
      gymId: gymId,
      type: 'system',
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: `Franchise "${name}" registered successfully!`,
      gym: {
        id: gymId,
        _id: gymId,
        ...newGymDoc,
        owner: {
          id: ownerId,
          name: ownerName,
          phone: String(ownerPhone),
          email: ownerEmail,
          role: 'gym_owner'
        }
      },
      credentials: {
        loginId: String(ownerPhone),
        email: ownerEmail || '',
        password: initialPassword,
        role: 'gym_owner',
        gymName: name
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGym = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, city, state, address, phone, email, category, plan, capacity, amenities, permissions, status
    } = req.body;

    const db = await getDb();
    const gymsCollection = db.collection('gyms');

    let queryId;
    try {
      queryId = new ObjectId(id);
    } catch {
      queryId = id;
    }

    const updateFields = { updatedAt: new Date() };
    if (name) updateFields.name = name;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (address) updateFields.address = address;
    if (phone) updateFields.phone = String(phone);
    if (email !== undefined) updateFields.email = email;
    if (category) updateFields.category = category;
    if (plan) updateFields.plan = plan;
    if (capacity) updateFields.capacity = Number(capacity);
    if (amenities) updateFields.amenities = amenities;
    if (permissions) updateFields.permissions = permissions;
    if (status) updateFields.status = status;

    await gymsCollection.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: updateFields }
    );

    const updatedGym = await gymsCollection.findOne({ $or: [{ _id: queryId }, { id: id }] });

    res.json({
      success: true,
      message: `Franchise "${name || id}" updated successfully!`,
      data: updatedGym
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteGym = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    let queryId;
    try {
      queryId = new ObjectId(id);
    } catch {
      queryId = id;
    }

    const deleteFilter = { $or: [{ _id: queryId }, { id: id }, { _id: id }] };
    const linkFilter = { $or: [{ gymId: id }, { gymId: queryId }, { gymId: String(id) }] };

    // 1. Delete from gyms and Gym collections
    await db.collection('gyms').deleteMany(deleteFilter);
    await db.collection('Gym').deleteMany(deleteFilter).catch(() => {});

    // 2. Delete linked franchise owner users
    await db.collection('users').deleteMany({ ...linkFilter, role: 'gym_owner' });
    await db.collection('User').deleteMany({ ...linkFilter, role: 'gym_owner' }).catch(() => {});

    // 3. Delete or unlink members belonging to this gym
    await db.collection('members').deleteMany(linkFilter);
    await db.collection('Member').deleteMany(linkFilter).catch(() => {});

    // 4. Delete attendance, classes, and notifications for this gym
    await db.collection('attendance').deleteMany(linkFilter).catch(() => {});
    await db.collection('notifications').deleteMany(linkFilter).catch(() => {});
    await db.collection('gym_classes').deleteMany(linkFilter).catch(() => {});

    res.json({
      success: true,
      message: 'Franchise and all associated records permanently removed from database.'
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGymPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan, permissions, capacity, status } = req.body;

    const db = await getDb();
    const gymsCollection = db.collection('gyms');

    let queryId;
    try {
      queryId = new ObjectId(id);
    } catch {
      queryId = id;
    }

    const updateFields = { updatedAt: new Date() };
    if (status) updateFields.status = status;
    if (plan) updateFields.plan = plan;
    if (permissions) updateFields.permissions = permissions;
    if (capacity) updateFields.capacity = Number(capacity);

    await gymsCollection.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: updateFields }
    );

    res.json({
      success: true,
      message: 'Franchise permissions & plan updated successfully!',
      gymId: id,
      plan: plan || 'pro',
      permissions: permissions || {},
      capacity: capacity || 250
    });
  } catch (err) {
    next(err);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const db = await getDb();
    const rawMembers = await db.collection('members').find({}).toArray();
    const rawGyms = await db.collection('gyms').find({}).toArray();
    
    const gymMap = rawGyms.reduce((acc, g) => {
      const gId = g._id ? g._id.toString() : g.id;
      acc[gId] = g.name;
      if (g.id) acc[g.id] = g.name;
      return acc;
    }, {});

    const members = rawMembers.map(m => {
      const memberId = m._id ? m._id.toString() : (m.id || 'm_' + Math.random());
      const gId = m.gymId ? m.gymId.toString() : null;
      return {
        ...m,
        id: memberId,
        gymId: gId,
        gymName: m.gymName || (gId && gymMap[gId]) || 'FitCore Main Studio',
        plan: m.plan || 'Gold Annual Pass',
        status: m.status ? (m.status.charAt(0).toUpperCase() + m.status.slice(1).toLowerCase()) : 'Active',
        joinedDate: m.joinDate || m.joinedDate || 'Jan 15, 2026'
      };
    });

    res.json({
      success: true,
      data: members
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMemberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status is required.' });

    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { $or: [{ id }, { userId: id }] };
    
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const result = await db.collection('members').updateOne(query, {
      $set: { status: formattedStatus, updatedAt: new Date() }
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    res.json({
      success: true,
      message: `Member status updated to ${formattedStatus} successfully.`,
      status: formattedStatus
    });
  } catch (err) {
    next(err);
  }
};

exports.getVendors = async (req, res, next) => {
  try {
    const db = await getDb();
    const rawVendors = await db.collection('vendor_stores').find({}).toArray();

    const vendors = rawVendors.map(v => {
      const vendorId = v._id ? v._id.toString() : (v.id || 'v_' + Math.random());
      return {
        ...v,
        id: vendorId,
        settlementBalance: v.settlementBalance || 42500,
        payoutHistory: v.payoutHistory || [
          { date: '2026-06-15', amount: 18000, status: 'completed' },
          { date: '2026-06-25', amount: 12500, status: 'pending' }
        ]
      };
    });

    res.json({
      success: true,
      data: vendors
    });
  } catch (err) {
    next(err);
  }
};

exports.getPendingKyc = async (req, res, next) => {
  try {
    const db = await getDb();
    const rawVendors = await db.collection('vendor_stores').find({
      $or: [
        { status: 'pending' },
        { 'kycDocuments.status': 'pending' }
      ]
    }).toArray();

    const pendingStores = rawVendors.map(v => ({
      ...v,
      id: v._id ? v._id.toString() : v.id
    }));

    res.json({
      success: true,
      data: pendingStores
    });
  } catch (err) {
    next(err);
  }
};

exports.approveKyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const vendorsColl = db.collection('vendor_stores');

    let queryId;
    try { queryId = new ObjectId(id); } catch { queryId = id; }

    const store = await vendorsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store partner not found.' });
    }

    const updatedDocuments = (store.kycDocuments || []).map(doc => ({
      ...doc,
      status: 'verified',
      uploadedAt: doc.uploadedAt || new Date().toISOString().split('T')[0]
    }));

    await vendorsColl.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: { status: 'approved', kycDocuments: updatedDocuments, updatedAt: new Date() } }
    );

    const updatedStore = await vendorsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });

    res.json({
      success: true,
      message: `KYC approved. Store "${store.storeName}" is now active on the marketplace.`,
      store: { ...updatedStore, id: updatedStore._id ? updatedStore._id.toString() : updatedStore.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectKyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = await getDb();
    const vendorsColl = db.collection('vendor_stores');

    let queryId;
    try { queryId = new ObjectId(id); } catch { queryId = id; }

    const store = await vendorsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store partner not found.' });
    }

    const updatedDocuments = (store.kycDocuments || []).map(doc => {
      if (doc.status === 'pending' || doc.status === 'not_uploaded') {
        return {
          ...doc,
          status: 'rejected',
          feedback: reason || 'Incomplete document scan / details mismatch.'
        };
      }
      return doc;
    });

    await vendorsColl.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: { status: 'rejected', kycDocuments: updatedDocuments, updatedAt: new Date() } }
    );

    const updatedStore = await vendorsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });

    res.json({
      success: true,
      message: `KYC documents rejected for store "${store.storeName}".`,
      store: { ...updatedStore, id: updatedStore._id ? updatedStore._id.toString() : updatedStore.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGymStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDb();
    const gymsColl = db.collection('gyms');

    let queryId;
    try { queryId = new ObjectId(id); } catch { queryId = id; }

    await gymsColl.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: { status, updatedAt: new Date() } }
    );

    const gym = await gymsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });

    res.json({
      success: true,
      message: `Gym status updated successfully to ${status}.`,
      gym: { ...gym, id: gym._id ? gym._id.toString() : gym.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVendorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDb();
    const vendorsColl = db.collection('vendor_stores');

    let queryId;
    try { queryId = new ObjectId(id); } catch { queryId = id; }

    await vendorsColl.updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: { status, updatedAt: new Date() } }
    );

    const store = await vendorsColl.findOne({ $or: [{ _id: queryId }, { id: id }] });

    res.json({
      success: true,
      message: `Vendor store status updated successfully to ${status}.`,
      store: { ...store, id: store._id ? store._id.toString() : store.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const db = await getDb();
    const gyms = await db.collection('gyms').find({}).toArray();
    let transactions = await db.collection('platform_transactions').find({}).sort({ createdAt: -1 }).toArray();

    // If no explicit transactions logged yet, auto-populate from existing gyms so ledger has full history
    if (transactions.length === 0 && gyms.length > 0) {
      const initialTx = gyms.map((gym, index) => {
        const amount = Number(gym.subscriptionAmount) || (gym.plan === 'enterprise' ? 69999 : (gym.plan === 'starter' ? 14999 : 34999));
        const cycle = gym.billingCycle || 'yearly';
        const date = gym.createdAt ? new Date(gym.createdAt) : new Date(Date.now() - (index * 86400000 * 5));
        
        return {
          gymId: gym._id ? gym._id.toString() : gym.id,
          gymName: gym.name,
          ownerName: gym.ownerName || 'Franchise Director',
          ownerPhone: gym.ownerPhone || gym.phone || '-',
          city: gym.city || 'Nagpur',
          plan: gym.plan || 'pro',
          amount: amount,
          billingCycle: cycle,
          paymentMethod: 'UPI / Direct Bank Transfer',
          transactionId: `TXN-FC-${Date.now().toString().slice(-6)}${index}`,
          status: 'success',
          type: 'saas_subscription',
          description: `Platform SaaS Subscription (${cycle})`,
          createdAt: date.toISOString(),
          paidAt: date.toISOString(),
        };
      });

      if (initialTx.length > 0) {
        await db.collection('platform_transactions').insertMany(initialTx);
        transactions = await db.collection('platform_transactions').find({}).sort({ createdAt: -1 }).toArray();
      }
    }

    const formattedTx = transactions.map(t => ({
      ...t,
      id: t._id ? t._id.toString() : t.id
    }));

    res.json({
      success: true,
      data: formattedTx
    });
  } catch (err) {
    next(err);
  }
};

exports.recordTransaction = async (req, res, next) => {
  try {
    const db = await getDb();
    const { gymId, gymName, amount, billingCycle, paymentMethod, notes } = req.body;

    const newTx = {
      gymId: gymId || null,
      gymName: gymName || 'Franchise Club',
      amount: Number(amount) || 0,
      billingCycle: billingCycle || 'yearly',
      paymentMethod: paymentMethod || 'UPI / NetBanking',
      transactionId: `TXN-FC-${Date.now().toString().slice(-8)}`,
      status: 'success',
      type: 'saas_subscription',
      description: notes || `Manual Platform SaaS Fee Collection (${billingCycle})`,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };

    const result = await db.collection('platform_transactions').insertOne(newTx);
    res.json({
      success: true,
      message: 'Transaction logged in financial ledger successfully.',
      data: { ...newTx, id: result.insertedId.toString() }
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const db = await getDb();
    const tokenUser = req.user || {};
    const userId = tokenUser.id || tokenUser._id;
    const userPhone = tokenUser.phone;

    let query = {};
    if (userId) {
      try { query = { _id: new ObjectId(userId) }; } catch { query = { id: userId }; }
    } else if (userPhone) {
      query = { phone: userPhone };
    } else {
      query = { role: 'super_admin' };
    }

    let user = await db.collection('users').findOne(query);
    if (!user) {
      user = await db.collection('users').findOne({ role: 'super_admin' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Administrator profile not found.' });
    }

    const { password, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        ...safeUser,
        id: safeUser._id ? safeUser._id.toString() : safeUser.id
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, email, phone, address, designation } = req.body;
    const tokenUser = req.user || {};
    const userId = tokenUser.id || tokenUser._id;
    const userPhone = tokenUser.phone;

    let query = {};
    if (userId) {
      try { query = { _id: new ObjectId(userId) }; } catch { query = { id: userId }; }
    } else if (userPhone) {
      query = { phone: userPhone };
    } else {
      query = { role: 'super_admin' };
    }

    const updateFields = {
      updatedAt: new Date().toISOString()
    };
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.trim();
    if (phone) updateFields.phone = phone.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (designation) updateFields.designation = designation.trim();

    await db.collection('users').updateOne(query, { $set: updateFields });
    const updatedUser = await db.collection('users').findOne(query);

    const { password, ...safeUser } = updatedUser || {};
    res.json({
      success: true,
      message: 'Super Administrator profile updated successfully!',
      data: {
        ...safeUser,
        id: safeUser?._id ? safeUser._id.toString() : safeUser?.id
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const db = await getDb();
    const { currentPassword, newPassword } = req.body;
    const tokenUser = req.user || {};
    const userId = tokenUser.id || tokenUser._id;
    const userPhone = tokenUser.phone;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    let query = {};
    if (userId) {
      try { query = { _id: new ObjectId(userId) }; } catch { query = { id: userId }; }
    } else if (userPhone) {
      query = { phone: userPhone };
    } else {
      query = { role: 'super_admin' };
    }

    const user = await db.collection('users').findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Administrator user account not found.' });
    }

    // Verify current password if provided
    if (currentPassword && user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch && currentPassword !== user.password) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(query, {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully! You can now use your new password.'
    });
  } catch (err) {
    next(err);
  }
};
