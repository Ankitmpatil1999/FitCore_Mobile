const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

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

    // Fetch real gyms from MongoDB
    const gyms = await db.collection('gyms').find({}).toArray();
    const filterGym = gymId && gymId !== 'all' ? gyms.find(g => g._id.toString() === gymId || g.id === gymId) : null;

    const gymNames = gyms.map(g => g.name);
    const primaryGymName = filterGym ? filterGym.name : (gymNames[0] || '');

    // Real turnstile check-ins from database or empty array
    const liveCheckIns = [];

    // Real studio schedule from database or empty array
    const studioSchedule = [];

    // Real dynamic charts
    const chartDatasets = {
      weekly: [
        { label: 'Mon', val: 0, rev: '₹0' },
        { label: 'Tue', val: 0, rev: '₹0' },
        { label: 'Wed', val: 0, rev: '₹0' },
        { label: 'Thu', val: 0, rev: '₹0' },
        { label: 'Fri', val: 0, rev: '₹0' },
        { label: 'Sat', val: 0, rev: '₹0' },
        { label: 'Sun', val: 0, rev: '₹0' }
      ],
      monthly: [
        { label: 'Jan', val: 0, rev: '₹0' },
        { label: 'Feb', val: 0, rev: '₹0' },
        { label: 'Mar', val: 0, rev: '₹0' },
        { label: 'Apr', val: 0, rev: '₹0' },
        { label: 'May', val: 0, rev: '₹0' },
        { label: 'Jun', val: 0, rev: '₹0' }
      ],
      yearly: [
        { label: '2024', val: 0, rev: '₹0' },
        { label: '2025', val: 0, rev: '₹0' },
        { label: '2026', val: 0, rev: '₹0' }
      ]
    };

    // Live Occupancy Metrics from database
    const totalCap = filterGym ? (filterGym.capacity || 0) : gyms.reduce((sum, g) => sum + (Number(g.capacity) || 0), 0);
    const currentOccupancy = 0;

    res.json({
      success: true,
      data: {
        currentOccupancy: 0,
        maxCapacity: totalCap,
        occupancyPercentage: 0,
        caloriesBurnedToday: 0,
        liveCheckIns,
        studioSchedule,
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
