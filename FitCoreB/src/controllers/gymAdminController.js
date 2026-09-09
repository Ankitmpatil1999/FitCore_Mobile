const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Helper to sanitize ID
const parseId = (id) => {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return id;
  }
};

// ── 1. BRANCH DASHBOARD OVERVIEW ───────────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ success: false, error: 'Gym ID is required.' });
    }

    const db = await getDb();
    const queryId = parseId(gymId);

    // Fetch Gym
    const gym = await db.collection('gyms').findOne({
      $or: [{ _id: queryId }, { id: gymId }, { _id: gymId }]
    });

    if (!gym) {
      return res.status(404).json({ success: false, error: 'Franchise Gym not found.' });
    }

    const idStr = gym._id.toString();
    const filter = { $or: [{ gymId: idStr }, { gymId: gymId }, { gymId: gym.id }] };

    const totalMembers = await db.collection('members').countDocuments(filter);
    const activeMembers = await db.collection('members').countDocuments({
      ...filter,
      status: { $regex: /^active$/i }
    });

    const totalTrainers = await db.collection('trainers').countDocuments(filter);
    const totalPackages = await db.collection('membership_plans').countDocuments(filter);

    // Turnstile check-ins today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckIns = await db.collection('attendance').countDocuments({
      ...filter,
      date: { $regex: new RegExp(`^${todayStr}`) }
    }).catch(() => 0);

    // Recent Members
    const recentMembers = await db.collection('members')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Recent Attendance Stream
    const recentAttendance = await db.collection('attendance')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(6)
      .toArray()
      .catch(() => []);

    // Estimated monthly revenue from active member plans
    const membersList = await db.collection('members').find(filter).toArray();
    const monthlyRevenue = membersList.reduce((acc, m) => {
      const price = Number(m.planPrice || m.amountPaid || (m.plan === 'VIP' ? 4500 : m.plan === 'Pro' ? 2500 : 1500));
      return acc + (isNaN(price) ? 0 : price);
    }, 0);

    res.json({
      success: true,
      data: {
        gym: {
          id: idStr,
          name: gym.name,
          city: gym.city,
          address: gym.address,
          phone: gym.phone,
          email: gym.email,
          ownerName: gym.ownerName,
          ownerPhone: gym.ownerPhone,
          capacity: gym.capacity || 250,
          plan: gym.plan || 'pro',
          status: gym.status || 'approved',
          gstNumber: gym.gstNumber || '',
          shopActLicense: gym.shopActLicense || '',
          kycDocs: gym.kycDocuments || []
        },
        stats: {
          totalMembers,
          activeMembers,
          totalTrainers,
          totalPackages,
          todayCheckIns,
          monthlyRevenue,
          occupancyRate: gym.capacity ? Math.min(100, Math.round((todayCheckIns / gym.capacity) * 100)) : 0
        },
        recentMembers,
        recentAttendance
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── 2. TRAINER MANAGEMENT ──────────────────────────────────────────────────
exports.getTrainers = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const db = await getDb();
    const filter = gymId ? { $or: [{ gymId: gymId }, { gymId: parseId(gymId) }, { gymId: String(gymId) }] } : {};

    const trainers = await db.collection('trainers').find(filter).sort({ createdAt: -1 }).toArray();
    const members = await db.collection('members').find(filter).toArray();

    // Map assigned members count
    const trainersWithStats = trainers.map(t => {
      const tId = t._id.toString();
      const assigned = members.filter(m => m.assignedTrainerId === tId || m.assignedTrainerId === t.id);
      return {
        ...t,
        id: tId,
        assignedCount: assigned.length,
        assignedMembers: assigned.map(m => ({ id: m._id.toString(), name: m.name, phone: m.phone, plan: m.plan }))
      };
    });

    res.json({ success: true, data: trainersWithStats });
  } catch (err) {
    next(err);
  }
};

exports.createTrainer = async (req, res, next) => {
  try {
    const { gymId, name, phone, email, specialty, certifications, shift, experience, rating } = req.body;
    if (!name || !phone || !gymId) {
      return res.status(400).json({ success: false, error: 'Trainer Name, Phone, and Gym ID are required.' });
    }

    const db = await getDb();
    const newTrainer = {
      gymId: String(gymId),
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      specialty: specialty || 'Strength & Conditioning',
      certifications: certifications || 'Certified Fitness Trainer',
      shift: shift || 'Morning (06:00 AM - 02:00 PM)',
      experience: experience || '3+ Years',
      rating: Number(rating) || 4.9,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('trainers').insertOne(newTrainer);
    res.status(201).json({
      success: true,
      message: `Trainer ${name} added successfully!`,
      data: { id: result.insertedId.toString(), ...newTrainer }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.id;

    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('trainers').updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Trainer updated successfully!' });
  } catch (err) {
    next(err);
  }
};

exports.deleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('trainers').deleteOne({ $or: [{ _id: queryId }, { id: id }] });

    // Unassign trainer from members
    await db.collection('members').updateMany(
      { $or: [{ assignedTrainerId: id }, { assignedTrainerId: String(queryId) }] },
      { $set: { assignedTrainerId: null, assignedTrainerName: null, updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Trainer removed and athletes unassigned successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.assignTrainer = async (req, res, next) => {
  try {
    const { memberId, trainerId, trainerName } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Member ID is required.' });
    }

    const db = await getDb();
    const memberQueryId = parseId(memberId);

    let resolvedTrainerName = trainerName;
    if (trainerId && !resolvedTrainerName) {
      const trainer = await db.collection('trainers').findOne({
        $or: [{ _id: parseId(trainerId) }, { id: trainerId }]
      });
      if (trainer) resolvedTrainerName = trainer.name;
    }

    await db.collection('members').updateOne(
      { $or: [{ _id: memberQueryId }, { id: memberId }] },
      {
        $set: {
          assignedTrainerId: trainerId || null,
          assignedTrainerName: resolvedTrainerName || null,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: resolvedTrainerName ? `Athlete successfully assigned to ${resolvedTrainerName}.` : 'Trainer unassigned from athlete.'
    });
  } catch (err) {
    next(err);
  }
};

// ── 3. MEMBER & ATHLETE MANAGEMENT ─────────────────────────────────────────
exports.getMembers = async (req, res, next) => {
  try {
    const { gymId, search, status } = req.query;
    const db = await getDb();

    let query = {};
    if (gymId && gymId !== 'all') {
      query.$or = [{ gymId: gymId }, { gymId: parseId(gymId) }, { gymId: String(gymId) }];
    }
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    let members = await db.collection('members').find(query).sort({ createdAt: -1 }).toArray();

    if (search) {
      const s = search.toLowerCase();
      members = members.filter(m =>
        (m.name || '').toLowerCase().includes(s) ||
        (m.phone || '').includes(s) ||
        (m.email || '').toLowerCase().includes(s) ||
        (m.userId || '').toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: members.map(m => ({ ...m, id: m._id.toString() }))
    });
  } catch (err) {
    next(err);
  }
};

exports.createMember = async (req, res, next) => {
  try {
    const {
      gymId,
      name,
      phone,
      email,
      gender,
      age,
      plan,
      planPrice,
      durationMonths,
      assignedTrainerId,
      assignedTrainerName,
      aadhaarNumber,
      emergencyContact,
      address
    } = req.body;

    const cleanName = name ? name.trim() : '';
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : '';

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Athlete Full Name is required.' });
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit mobile number is required.' });
    }

    if (!gymId) {
      return res.status(400).json({ success: false, error: 'Franchise Gym ID is required.' });
    }

    const db = await getDb();

    // Check duplicate phone in this gym
    const existing = await db.collection('members').findOne({
      phone: cleanPhone,
      $or: [{ gymId: String(gymId) }, { gymId: parseId(gymId) }]
    });

    if (existing) {
      return res.status(400).json({ success: false, error: `Athlete with phone ${cleanPhone} is already registered in this club.` });
    }

    const months = Number(durationMonths) || 1;
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // 1. Generate unique Member ID code (e.g. GYM-000125 or FC-M00125)
    const memberCount = await db.collection('members').countDocuments();
    const memberIdCode = 'GYM-' + String(memberCount + 101).padStart(6, '0');

    // 2. Calculate final billing amounts with Admin Discount
    const basePlanPrice = Number(planPrice) || 2000;
    const adminDiscount = Number(req.body.discountAmount) || 0;
    const registrationFee = Number(req.body.admissionFee) || 0;
    const ptFee = req.body.needsTrainer ? (Number(req.body.trainerFee) || 0) : 0;
    const finalAmountPaid = Math.max(0, basePlanPrice - adminDiscount) + registrationFee + ptFee;

    // 3. Generate Cryptographic Activation Token (valid for self-activation)
    const crypto = require('crypto');
    const activationToken = crypto.randomBytes(24).toString('hex');

    // 4. Fetch Gym Details for personalized invite message
    const gym = await db.collection('gyms').findOne({
      $or: [{ _id: parseId(gymId) }, { id: gymId }, { _id: gymId }]
    });
    const gymName = gym ? gym.name : 'FitCore Fitness Club';

    // 5. Construct secure activation URL
    const clientBaseUrl = req.headers.origin || 'http://localhost:5173';
    const activationUrl = `${clientBaseUrl}/?activate=${activationToken}`;

    const newMember = {
      gymId: String(gymId),
      gymName: gymName,
      userId: memberIdCode,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      gender: gender || 'Unspecified',
      age: Number(age) || null,
      weight: req.body.weight || null,
      height: req.body.height || null,
      address: address || '',
      plan: plan || '1 Month Standard Pass',
      planPrice: basePlanPrice,
      discountAmount: adminDiscount,
      admissionFee: registrationFee,
      amountPaid: finalAmountPaid,
      paymentMode: req.body.paymentMode || 'Cash',
      durationMonths: months,
      startDate: startDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      joinedDate: startDate.toISOString().split('T')[0],
      status: 'Active',
      isActivated: false,
      activationToken: activationToken,
      assignedTrainerId: assignedTrainerId || null,
      assignedTrainerName: assignedTrainerName || null,
      aadhaarNumber: aadhaarNumber ? aadhaarNumber.replace(/\s+/g, '') : null,
      aadhaarVerified: !!aadhaarNumber,
      aadhaarDocUrl: null,
      emergencyContact: emergencyContact || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('members').insertOne(newMember);

    // 6. Formulate SMS / WhatsApp / Email Invitation Message
    const inviteMessage = `Welcome ${name.trim()}! You have been enrolled at ${gymName} (${newMember.plan}). Activate your account and create your password here: ${activationUrl}\n\nNote: Once activated, you will log in using your Mobile Number: ${phone.trim()} and your password. (Member ID: ${memberIdCode})`;

    console.log(`\n======================================================`);
    console.log(`✉️ [ACCOUNT INVITATION DISPATCH] TO: ${phone.trim()}`);
    console.log(`GYM: ${gymName} | LOGIN MOBILE: ${phone.trim()} | MEMBER ID: ${memberIdCode}`);
    console.log(`ACTIVATION LINK: ${activationUrl}`);
    console.log(`MESSAGE:\n${inviteMessage}`);
    console.log(`======================================================\n`);

    res.status(201).json({
      success: true,
      message: `Member ${name} created! Activation invitation link sent to ${phone.trim()}.`,
      data: {
        id: result.insertedId.toString(),
        ...newMember,
        activationToken: activationToken,
        activationUrl: activationUrl,
        inviteMessage: inviteMessage,
        gymName: gymName
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.id;

    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('members').updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Member profile updated successfully!' });
  } catch (err) {
    next(err);
  }
};

exports.deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('members').deleteOne({ $or: [{ _id: queryId }, { id: id }] });
    await db.collection('attendance').deleteMany({ $or: [{ memberId: id }, { memberId: String(queryId) }] }).catch(() => {});

    res.json({ success: true, message: 'Member athlete deleted permanently.' });
  } catch (err) {
    next(err);
  }
};

exports.uploadMemberAadhaar = async (req, res, next) => {
  try {
    const { memberId, aadhaarNumber, docBase64, docName } = req.body;
    if (!memberId || !aadhaarNumber) {
      return res.status(400).json({ success: false, error: 'Member ID and 12-digit Aadhaar Number are required.' });
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 12-digit Aadhaar Number.' });
    }

    const db = await getDb();
    const queryId = parseId(memberId);

    let docUrl = null;
    if (docBase64 && docName) {
      const uploadDir = path.join(__dirname, '../../uploads/kyc');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `aadhaar_${cleanAadhaar}_${Date.now()}_${path.basename(docName)}`;
      const filePath = path.join(uploadDir, filename);
      const base64Data = docBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      docUrl = `/uploads/kyc/${filename}`;
    }

    await db.collection('members').updateOne(
      { $or: [{ _id: queryId }, { id: memberId }] },
      {
        $set: {
          aadhaarNumber: cleanAadhaar,
          aadhaarVerified: true,
          aadhaarDocUrl: docUrl,
          kycStatus: 'Verified',
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Aadhaar Card uploaded and verified successfully!',
      aadhaarDocUrl: docUrl
    });
  } catch (err) {
    next(err);
  }
};

// ── 4. MEMBERSHIP PACKAGES & SUBSCRIPTIONS ─────────────────────────────────
exports.getPackages = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const db = await getDb();
    const filter = gymId ? { $or: [{ gymId: gymId }, { gymId: parseId(gymId) }, { gymId: String(gymId) }] } : {};

    let plans = await db.collection('membership_plans').find(filter).sort({ price: 1 }).toArray();

    // Default system plans if club has none configured
    if (plans.length === 0 && gymId) {
      const defaultPlans = [
        {
          gymId: String(gymId),
          name: 'Monthly Standard',
          durationDays: 30,
          price: 1499,
          description: 'Full access to strength zone, cardio floor, and locker rooms.',
          perks: ['Gym Floor Access', 'Locker & Showers', 'General Trainer Guidance'],
          popular: false,
          createdAt: new Date()
        },
        {
          gymId: String(gymId),
          name: 'Quarterly Pro Studio',
          durationDays: 90,
          price: 3899,
          description: 'Includes sauna, HIIT functional zones, and quarterly fitness assessments.',
          perks: ['All Standard Perks', 'Sauna & Steam Bath', 'Personal Trainer Onboarding', 'Body Analytics'],
          popular: true,
          createdAt: new Date()
        },
        {
          gymId: String(gymId),
          name: 'Annual VIP Athlete Pass',
          durationDays: 365,
          price: 12999,
          description: 'Unlimited 24/7 access with master coach support, nutrition plans, and guest passes.',
          perks: ['24/7 NFC Turnstile Pass', 'Dedicated Personal Trainer', 'Custom Diet Plan', '2 Free Guest Passes / Mo'],
          popular: false,
          createdAt: new Date()
        }
      ];
      await db.collection('membership_plans').insertMany(defaultPlans);
      plans = await db.collection('membership_plans').find(filter).toArray();
    }

    // Map active subscribers count
    const members = await db.collection('members').find(filter).toArray();
    const plansWithStats = plans.map(p => {
      const planName = p.name.toLowerCase();
      const subscribers = members.filter(m => (m.plan || '').toLowerCase().includes(planName) || m.planId === p._id.toString());
      return {
        ...p,
        id: p._id.toString(),
        activeSubscribers: subscribers.length
      };
    });

    res.json({ success: true, data: plansWithStats });
  } catch (err) {
    next(err);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const { gymId, name, price, durationDays, description, perks } = req.body;
    if (!name || !price || !gymId) {
      return res.status(400).json({ success: false, error: 'Package Name, Price, and Gym ID are required.' });
    }

    const db = await getDb();
    const newPlan = {
      gymId: String(gymId),
      name: name.trim(),
      price: Number(price),
      durationDays: Number(durationDays) || 30,
      description: description || '',
      perks: Array.isArray(perks) ? perks : (perks ? perks.split(',').map(s => s.trim()) : []),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('membership_plans').insertOne(newPlan);
    res.status(201).json({
      success: true,
      message: `Package "${name}" created successfully!`,
      data: { id: result.insertedId.toString(), ...newPlan }
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.id;

    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('membership_plans').updateOne(
      { $or: [{ _id: queryId }, { id: id }] },
      { $set: updateData }
    );

    res.json({ success: true, message: 'Package updated successfully!' });
  } catch (err) {
    next(err);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const queryId = parseId(id);

    await db.collection('membership_plans').deleteOne({ $or: [{ _id: queryId }, { id: id }] });
    res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.subscribeMember = async (req, res, next) => {
  try {
    const { memberId, packageName, durationDays, planPrice, paymentMode } = req.body;
    if (!memberId || !packageName) {
      return res.status(400).json({ success: false, error: 'Member ID and Package Name are required.' });
    }

    const db = await getDb();
    const memberQueryId = parseId(memberId);

    const days = Number(durationDays) || 30;
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    await db.collection('members').updateOne(
      { $or: [{ _id: memberQueryId }, { id: memberId }] },
      {
        $set: {
          plan: packageName,
          planPrice: Number(planPrice) || 0,
          startDate: startDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          status: 'Active',
          lastPaymentMode: paymentMode || 'UPI / Online',
          lastRenewedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Subscription activated! Valid through ${expiryDate.toLocaleDateString('en-IN')}.`
    });
  } catch (err) {
    next(err);
  }
};

// ── 5. GYM FRANCHISE KYC & SHOP ACT LICENSES ──────────────────────────────
exports.getGymKyc = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ success: false, error: 'Gym ID is required.' });
    }

    const db = await getDb();
    const gym = await db.collection('gyms').findOne({
      $or: [{ _id: parseId(gymId) }, { id: gymId }, { _id: gymId }]
    });

    if (!gym) {
      return res.status(404).json({ success: false, error: 'Gym not found.' });
    }

    res.json({
      success: true,
      data: {
        gymId: gym._id.toString(),
        gymName: gym.name,
        gstNumber: gym.gstNumber || '',
        shopActLicense: gym.shopActLicense || '',
        documents: gym.kycDocuments || []
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadGymKyc = async (req, res, next) => {
  try {
    const { gymId, docType, docNumber, docName, docBase64, validityDate } = req.body;
    if (!gymId || !docType || !docNumber) {
      return res.status(400).json({ success: false, error: 'Gym ID, Document Type, and License Number are required.' });
    }

    const db = await getDb();
    const queryId = parseId(gymId);

    let docUrl = null;
    if (docBase64 && docName) {
      const uploadDir = path.join(__dirname, '../../uploads/kyc');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `gym_${docType}_${Date.now()}_${path.basename(docName)}`;
      const filePath = path.join(uploadDir, filename);
      const base64Data = docBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      docUrl = `/uploads/kyc/${filename}`;
    }

    const newDoc = {
      id: 'KYC-DOC-' + Math.floor(1000 + Math.random() * 9000),
      docType,
      docNumber: docNumber.trim(),
      docName: docName || docType,
      fileUrl: docUrl,
      validityDate: validityDate || '2028-12-31',
      status: 'Verified',
      uploadedAt: new Date()
    };

    const updateFields = {
      updatedAt: new Date()
    };

    if (docType === 'shop_act' || docType === 'Shop Act License') {
      updateFields.shopActLicense = docNumber.trim();
    } else if (docType === 'gst' || docType === 'GST Certificate') {
      updateFields.gstNumber = docNumber.trim();
    }

    await db.collection('gyms').updateOne(
      { $or: [{ _id: queryId }, { id: gymId }, { _id: gymId }] },
      {
        $set: updateFields,
        $push: { kycDocuments: newDoc }
      }
    );

    res.status(201).json({
      success: true,
      message: `${docType.toUpperCase()} License uploaded and linked successfully!`,
      document: newDoc
    });
  } catch (err) {
    next(err);
  }
};
