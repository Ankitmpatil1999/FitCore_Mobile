const { getDb } = require('../config/mongoClient');
const { ObjectId } = require('mongodb');

function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSessionType(date = new Date()) {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) return 'MORNING';      // 05:00 AM - 11:59 AM
  if (hours >= 12 && hours < 17) return 'AFTERNOON';  // 12:00 PM - 04:59 PM
  if (hours >= 17 && hours < 21) return 'EVENING';    // 05:00 PM - 08:59 PM
  return 'NIGHT';                                     // 09:00 PM - 04:59 AM
}

// ── CHECK-IN ──────────────────────────────────────────────
exports.checkIn = async (req, res) => {
  try {
    const { gymId, memberId, memberName, membershipId } = req.body;
    if (!gymId || !memberId) return res.status(400).json({ success: false, error: 'gymId and memberId required.' });

    const db = await getDb();
    const today = getLocalDateStr(new Date());

    // Build gym query supporting string and ObjectId
    const gymQuery = {
      $or: [
        { gymId: String(gymId) },
        { gym_id: String(gymId) }
      ]
    };
    if (ObjectId.isValid(gymId)) {
      gymQuery.$or.push({ gymId: new ObjectId(gymId) });
      gymQuery.$or.push({ gym_id: new ObjectId(gymId) });
    }

    // 1. Verify Member Subscription / Expiry
    const member = await db.collection('members').findOne({
      $or: [{ userId: String(memberId) }, { id: String(memberId) }, { _id: String(memberId) }, ...(ObjectId.isValid(memberId) ? [{ _id: new ObjectId(memberId) }] : [])]
    });

    if (member && member.expiryDate) {
      const expiry = new Date(member.expiryDate);
      if (expiry < new Date()) {
        return res.status(403).json({
          success: false,
          isExpired: true,
          error: 'Membership has expired. Please renew subscription before check-in.'
        });
      }
    }

    // 2. Check if already checked in and NOT yet checked out
    const existingOpen = await db.collection('attendance').findOne({
      ...gymQuery,
      memberId: String(memberId),
      $or: [{ date: today }, { visitDate: today }],
      checkOutTime: null
    });

    if (existingOpen) {
      return res.status(400).json({
        success: false,
        error: `${memberName || 'Member'} is already inside the gym (Checked in at ${new Date(existingOpen.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}). Please check out first.`
      });
    }

    const now = new Date();
    const sessionType = getSessionType(now);

    const record = {
      gymId: String(gymId),
      memberId: String(memberId),
      memberName: memberName || member?.name || 'Member',
      membershipId: membershipId || member?.plan || 'Standard Plan',
      date: today,
      visitDate: today,
      sessionType,
      checkInTime: now.toISOString(),
      checkOutTime: null,
      duration: null,
      durationMins: 0,
      status: 'CHECKED_IN',
      method: 'kiosk',
      createdAt: now,
      updatedAt: now
    };

    await db.collection('attendance').insertOne(record);

    res.json({
      success: true,
      message: `${record.memberName} checked in for ${sessionType} session! 🏋️`,
      record
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── CHECK-OUT ─────────────────────────────────────────────
exports.checkOut = async (req, res) => {
  try {
    const { gymId, memberId } = req.body;
    if (!gymId || !memberId) return res.status(400).json({ success: false, error: 'gymId and memberId required.' });

    const db = await getDb();
    const today = getLocalDateStr(new Date());

    const gymQuery = {
      $or: [
        { gymId: String(gymId) },
        { gym_id: String(gymId) }
      ]
    };
    if (ObjectId.isValid(gymId)) {
      gymQuery.$or.push({ gymId: new ObjectId(gymId) });
      gymQuery.$or.push({ gym_id: new ObjectId(gymId) });
    }

    let record = await db.collection('attendance').findOne({
      ...gymQuery,
      memberId: String(memberId),
      $or: [{ date: today }, { visitDate: today }],
      checkOutTime: null
    });

    if (!record) {
      record = await db.collection('attendance').findOne({
        ...gymQuery,
        memberId: String(memberId),
        checkOutTime: null
      });
    }

    if (!record) {
      return res.status(400).json({ success: false, error: 'No active check-in found for this member.' });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(record.checkInTime);
    const durationMs = checkOutTime - checkInTime;
    const durationMins = Math.max(1, Math.round(durationMs / 60000));
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const duration = hours > 0 ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
    const caloriesBurned = Math.round(durationMins * 6.2);

    await db.collection('attendance').updateOne(
      { _id: record._id },
      {
        $set: {
          checkOutTime: checkOutTime.toISOString(),
          duration,
          durationMins,
          durationMinutes: durationMins,
          caloriesBurned,
          status: 'CHECKED_OUT',
          updatedAt: checkOutTime
        }
      }
    );

    res.json({
      success: true,
      message: `Checked out successfully! Duration: ${duration} (${record.sessionType || 'Session'}). 🔥 ${caloriesBurned} kcal.`,
      duration,
      durationMins,
      sessionType: record.sessionType
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── TODAY'S ATTENDANCE (WITH MULTI-SESSION GROUPING) ─────────
exports.getTodayAttendance = async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });

    const db = await getDb();
    const today = getLocalDateStr(new Date());

    const gymFilter = {
      $or: [
        { gymId: String(gymId) },
        { gym_id: String(gymId) }
      ]
    };
    if (ObjectId.isValid(gymId)) {
      gymFilter.$or.push({ gymId: new ObjectId(gymId) });
      gymFilter.$or.push({ gym_id: new ObjectId(gymId) });
    }

    const records = await db.collection('attendance')
      .find({
        ...gymFilter,
        $or: [{ date: today }, { visitDate: today }]
      })
      .sort({ checkInTime: -1 })
      .toArray();

    // Group records by memberId for daily multi-session breakdown
    const memberMap = {};
    records.forEach(r => {
      const mid = String(r.memberId);
      if (!memberMap[mid]) {
        memberMap[mid] = {
          memberId: mid,
          memberName: r.memberName || 'Member',
          membershipId: r.membershipId || 'Active Plan',
          visitDate: today,
          totalVisits: 0,
          totalMinutes: 0,
          isCurrentlyInside: false,
          sessions: []
        };
      }

      const isInside = !r.checkOutTime || r.status === 'CHECKED_IN';
      let durMins = r.durationMins || r.durationMinutes || 0;
      if (isInside) {
        memberMap[mid].isCurrentlyInside = true;
        durMins = Math.max(1, Math.round((Date.now() - new Date(r.checkInTime).getTime()) / 60000));
      }

      memberMap[mid].totalVisits += 1;
      memberMap[mid].totalMinutes += durMins;
      memberMap[mid].sessions.push({
        id: r._id,
        sessionType: r.sessionType || getSessionType(new Date(r.checkInTime)),
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        duration: r.duration || (isInside ? `${durMins}m (Live)` : `${durMins}m`),
        durationMins: durMins,
        status: isInside ? 'CHECKED_IN' : 'CHECKED_OUT',
        caloriesBurned: r.caloriesBurned || Math.round(durMins * 6.2)
      });
    });

    const memberRoster = Object.values(memberMap).map(m => {
      const h = Math.floor(m.totalMinutes / 60);
      const mins = m.totalMinutes % 60;
      return {
        ...m,
        totalTimeFormatted: h > 0 ? `${h}h ${String(mins).padStart(2, '0')}m` : `${mins}m`,
        avgVisitMins: Math.round(m.totalMinutes / m.totalVisits)
      };
    }).sort((a, b) => (b.isCurrentlyInside ? 1 : 0) - (a.isCurrentlyInside ? 1 : 0) || b.totalMinutes - a.totalMinutes);

    const totalUniqueMembers = Object.keys(memberMap).length;
    const totalVisits = records.length;
    const stillInside = records.filter(r => !r.checkOutTime || r.status === 'CHECKED_IN').length;
    const checkedOut = totalVisits - stillInside;

    res.json({
      success: true,
      records,
      memberRoster,
      stats: {
        totalUniqueMembers,
        totalVisits,
        stillInside,
        checkedOut,
        date: today
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── MEMBER SPECIFIC DAILY TIMELINE ─────────────────────────
exports.getMemberDailyTimeline = async (req, res) => {
  try {
    const { gymId, memberId, date } = req.query;
    if (!gymId || !memberId) return res.status(400).json({ success: false, error: 'gymId and memberId required.' });

    const targetDate = date || getLocalDateStr(new Date());
    const db = await getDb();

    const sessions = await db.collection('attendance')
      .find({
        gymId: String(gymId),
        memberId: String(memberId),
        $or: [{ date: targetDate }, { visitDate: targetDate }]
      })
      .sort({ checkInTime: 1 })
      .toArray();

    let totalMinutes = 0;
    let isCurrentlyInside = false;

    const formattedSessions = sessions.map(s => {
      const isInside = !s.checkOutTime || s.status === 'CHECKED_IN';
      let durMins = s.durationMins || s.durationMinutes || 0;
      if (isInside) {
        isCurrentlyInside = true;
        durMins = Math.max(1, Math.round((Date.now() - new Date(s.checkInTime).getTime()) / 60000));
      }
      totalMinutes += durMins;

      return {
        id: s._id,
        sessionType: s.sessionType || getSessionType(new Date(s.checkInTime)),
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime,
        duration: s.duration || (isInside ? `${durMins}m (Live)` : `${durMins}m`),
        durationMins: durMins,
        status: isInside ? 'CHECKED_IN' : 'CHECKED_OUT',
        caloriesBurned: s.caloriesBurned || Math.round(durMins * 6.2)
      };
    });

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const totalTimeFormatted = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;

    res.json({
      success: true,
      visitDate: targetDate,
      totalVisits: sessions.length,
      totalMinutes,
      totalTimeFormatted,
      isCurrentlyInside,
      sessions: formattedSessions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── MONTHLY ATTENDANCE REPORT ─────────────────────────────
exports.getMonthlyReport = async (req, res) => {
  try {
    const { gymId, memberId, month, year } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });

    const db = await getDb();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

    const query = { gymId: String(gymId), date: { $gte: startDate, $lte: endDate } };
    if (memberId) query.memberId = String(memberId);

    const records = await db.collection('attendance').find(query).sort({ date: 1 }).toArray();

    // Get holidays for this gym
    const holidays = await db.collection('holidays').find({
      gymId: String(gymId), date: { $gte: startDate, $lte: endDate }
    }).toArray();
    const holidayDates = new Set(holidays.map(h => h.date));

    // Get weekly offs
    const weeklyOffDoc = await db.collection('gym_settings').findOne({ gymId: String(gymId) });
    const weeklyOffs = weeklyOffDoc?.weeklyOffs || [0]; // Default Sunday

    // Build day-by-day report
    const daysInMonth = new Date(y, m, 0).getDate();
    const report = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      const isHoliday = holidayDates.has(dateStr) || weeklyOffs.includes(dayOfWeek);
      const dayRecords = records.filter(r => r.date === dateStr || r.visitDate === dateStr);

      // Sum all minutes for that day across multi-sessions
      const dayTotalMins = dayRecords.reduce((acc, curr) => acc + (curr.durationMins || curr.durationMinutes || 0), 0);
      const dh = Math.floor(dayTotalMins / 60);
      const dm = dayTotalMins % 60;
      const dayTotalFormatted = dh > 0 ? `${dh}h ${dm}m` : (dm > 0 ? `${dm}m` : '-');

      report.push({
        date: dateStr,
        day: d,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        isHoliday,
        holidayReason: holidays.find(h => h.date === dateStr)?.reason || (weeklyOffs.includes(dayOfWeek) ? 'Weekly Off' : null),
        isPresent: dayRecords.length > 0,
        totalVisits: dayRecords.length,
        totalMinutes: dayTotalMins,
        totalTimeFormatted: dayTotalFormatted,
        records: dayRecords
      });
    }

    const totalDays = daysInMonth;
    const totalHolidays = report.filter(r => r.isHoliday).length;
    const workingDays = totalDays - totalHolidays;
    const presentDays = report.filter(r => r.isPresent && !r.isHoliday).length;
    const attendancePct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    res.json({
      success: true,
      month: m, year: y,
      report,
      summary: { totalDays, totalHolidays, workingDays, presentDays, absentDays: workingDays - presentDays, attendancePct }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── ATTENDANCE STATS ──────────────────────────────────────
exports.getAttendanceStats = async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ success: false, error: 'gymId required.' });

    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const records = await db.collection('attendance').find({
      gymId, date: { $gte: startDate, $lte: today }
    }).toArray();

    // Members attendance count
    const memberCounts = {};
    records.forEach(r => {
      if (!memberCounts[r.memberId]) memberCounts[r.memberId] = { name: r.memberName, count: 0, totalMins: 0 };
      memberCounts[r.memberId].count++;
      memberCounts[r.memberId].totalMins += (r.durationMins || 0);
    });

    const regularMembers = Object.entries(memberCounts)
      .map(([id, data]) => ({ memberId: id, ...data, avgMins: Math.round(data.totalMins / data.count) }))
      .sort((a, b) => b.count - a.count);

    // Get all members to find irregular ones
    const allMembers = await db.collection('members').find({ gymId }).toArray();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentStart = sevenDaysAgo.toISOString().split('T')[0];

    const recentRecords = await db.collection('attendance').find({
      gymId, date: { $gte: recentStart, $lte: today }
    }).toArray();
    const recentMemberIds = new Set(recentRecords.map(r => r.memberId));

    const irregularMembers = allMembers
      .filter(m => !recentMemberIds.has(String(m._id)) && !recentMemberIds.has(m.userId))
      .map(m => ({ memberId: String(m._id), name: m.name, phone: m.phone, lastSeen: 'Over 7 days ago' }));

    // Daily footfall for last 7 days
    const sevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      sevenDays.push({ date: ds, dayName, count: records.filter(r => r.date === ds).length });
    }

    // Peak hours
    const hourCounts = {};
    records.forEach(r => {
      if (r.checkInTime) {
        const h = new Date(r.checkInTime).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      success: true,
      stats: {
        totalCheckIns30Days: records.length,
        avgDailyFootfall: Math.round(records.length / 30),
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
        regularMembers: regularMembers.slice(0, 10),
        irregularMembers: irregularMembers.slice(0, 10),
        dailyFootfall: sevenDays
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
