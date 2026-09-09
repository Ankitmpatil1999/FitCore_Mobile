const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    // req.user is already decoded by verifyToken middleware
    const { id: userId, role } = req.user;

    const db = await getDb();

    // Build OR conditions for matching notifications
    const orConditions = [
      { target: 'all' },
      { target: role },
      { userId: userId },
    ];

    const notifications = await db.collection('notifications')
      .find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/notifications
exports.createNotification = async (req, res, next) => {
  try {
    const { title, message, target, type, gymId, userId } = req.body;

    if (!title || !message || !target) {
      return res.status(400).json({ success: false, error: 'Title, message, and target are required.' });
    }

    const db = await getDb();
    const noti = {
      title,
      message,
      target, // 'admin' | 'super_admin' | 'gym_owner' | 'member' | 'all'
      type: type || 'push',
      gymId: gymId || null,
      userId: userId || null,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
      createdAt: new Date(),
    };

    await db.collection('notifications').insertOne(noti);

    res.status(201).json({ success: true, data: noti });
  } catch (err) {
    next(err);
  }
};

// POST /api/notifications/clear
exports.clearNotifications = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    const db = await getDb();

    const orConditions = [
      { target: 'all' },
      { target: role },
      { userId: userId },
    ];

    await db.collection('notifications').deleteMany({ $or: orConditions });

    res.json({ success: true, message: 'All notifications cleared successfully!' });
  } catch (err) {
    next(err);
  }
};
