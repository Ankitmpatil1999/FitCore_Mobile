const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');

// ── GET HOLIDAYS ──────────────────────────────────────────
exports.getHolidays = async (req, res) => {
  try {
    const { gymId, month, year } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    const query = { gymId };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: start, $lte: end };
    }
    const holidays = await db.collection('holidays').find(query).sort({ date: 1 }).toArray();
    const settings = await db.collection('gym_settings').findOne({ gymId });
    res.json({ success: true, holidays, weeklyOffs: settings?.weeklyOffs || [0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── ADD HOLIDAY ───────────────────────────────────────────
exports.addHoliday = async (req, res) => {
  try {
    const { gymId, date, reason } = req.body;
    if (!gymId || !date || !reason) return res.status(400).json({ success: false, error: 'gymId, date, reason required.' });
    const db = await getDb();
    const holiday = { gymId, date, reason, type: 'one-time', createdAt: new Date() };
    await db.collection('holidays').insertOne(holiday);
    res.json({ success: true, message: `Holiday added: ${reason} on ${date}`, holiday });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE HOLIDAY ────────────────────────────────────────
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.collection('holidays').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Holiday removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── SET WEEKLY OFF ────────────────────────────────────────
exports.setWeeklyOff = async (req, res) => {
  try {
    const { gymId, weeklyOffs } = req.body;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    await db.collection('gym_settings').updateOne(
      { gymId },
      { $set: { weeklyOffs: weeklyOffs || [0], updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Weekly off days updated.', weeklyOffs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET EXPENSES ──────────────────────────────────────────
exports.getExpenses = async (req, res) => {
  try {
    const { gymId, month, year } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-31`;
    const expenses = await db.collection('expenses').find({ gymId, date: { $gte: start, $lte: end } }).sort({ date: -1 }).toArray();
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    // Category-wise summary
    const categories = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      categories[cat] = (categories[cat] || 0) + (Number(e.amount) || 0);
    });
    res.json({ success: true, expenses, totalExpense, categorySummary: categories, month: m, year: y });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── ADD EXPENSE ───────────────────────────────────────────
exports.addExpense = async (req, res) => {
  try {
    const { gymId, category, amount, description, date } = req.body;
    if (!gymId || !category || !amount) return res.status(400).json({ success: false, error: 'gymId, category, amount required.' });
    const db = await getDb();
    const expense = {
      gymId, category, amount: Number(amount), description: description || '',
      date: date || new Date().toISOString().split('T')[0], createdAt: new Date()
    };
    await db.collection('expenses').insertOne(expense);
    res.json({ success: true, message: `Expense added: ₹${amount} (${category})`, expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE EXPENSE ────────────────────────────────────────
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET NOTICES ───────────────────────────────────────────
exports.getNotices = async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    const notices = await db.collection('notices').find({ gymId }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── ADD NOTICE ────────────────────────────────────────────
exports.addNotice = async (req, res) => {
  try {
    const { gymId, title, message, priority } = req.body;
    if (!gymId || !title || !message) return res.status(400).json({ success: false, error: 'gymId, title, message required.' });
    const db = await getDb();
    const notice = { gymId, title, message, priority: priority || 'normal', createdAt: new Date() };
    await db.collection('notices').insertOne(notice);
    res.json({ success: true, message: 'Notice posted!', notice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE NOTICE ─────────────────────────────────────────
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.collection('notices').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET / UPDATE GYM SETTINGS ─────────────────────────────
exports.getGymSettings = async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    let settings = await db.collection('gym_settings').findOne({ gymId });
    if (!settings) {
      settings = {
        gymId, weeklyOffs: [0], batchTimings: [
          { name: 'Morning', start: '06:00', end: '10:00' },
          { name: 'Evening', start: '16:00', end: '21:00' }
        ],
        capacity: 100, autoRenewal: false
      };
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateGymSettings = async (req, res) => {
  try {
    const { gymId, ...updates } = req.body;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    await db.collection('gym_settings').updateOne(
      { gymId },
      { $set: { ...updates, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Settings updated!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── CLASSES & BATCH SCHEDULES ─────────────────────────────
exports.getClasses = async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });
    const db = await getDb();
    const classes = await db.collection('gym_classes').find({ gymId }).sort({ time: 1 }).toArray();
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addClass = async (req, res) => {
  try {
    const { gymId, name, trainerName, trainerId, time, duration, days, capacity, room, intensity } = req.body;
    if (!gymId || !name || !time) return res.status(400).json({ success: false, error: 'gymId, name, and time required.' });
    const db = await getDb();
    const newClass = {
      gymId,
      name,
      trainerName: trainerName || 'Lead Coach',
      trainerId: trainerId || null,
      time,
      duration: duration || '60 mins',
      days: Array.isArray(days) && days.length > 0 ? days : ['Mon', 'Wed', 'Fri'],
      capacity: Number(capacity) || 20,
      enrolledCount: 0,
      room: room || 'Studio A',
      intensity: intensity || 'High',
      createdAt: new Date()
    };
    await db.collection('gym_classes').insertOne(newClass);
    res.json({ success: true, message: `Class "${name}" scheduled successfully!`, classItem: newClass });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.collection('gym_classes').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Class session removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
