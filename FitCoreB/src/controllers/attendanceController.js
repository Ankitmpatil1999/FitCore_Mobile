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
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Morning Shift: 04:00 AM (240 mins) to 01:00 PM / 13:00 (780 mins)
  if (timeInMinutes >= 240 && timeInMinutes < 780) {
    return 'MORNING';
  }
  // Afternoon Gap / Transition: 01:00 PM (780 mins) to 04:00 PM / 16:00 (960 mins)
  if (timeInMinutes >= 780 && timeInMinutes < 960) {
    return 'AFTERNOON';
  }
  // Evening Shift: 04:00 PM / 16:00 (960 mins) to 11:00 PM / 23:00 (1380 mins)
  if (timeInMinutes >= 960 && timeInMinutes < 1380) {
    return 'EVENING';
  }
  // Night Shift: 11:00 PM to 04:00 AM
  return 'NIGHT';
}

// ── AUTO CHECK-OUT ENGINE ─────────────────────────────────
/**
 * Auto Check-Out Engine
 * Automatically checks out members who forgot to check out when their shift/session completes.
 * Shift Matrix & Cutoffs:
 * - MORNING Shift: 04:00 AM to 13:00 (1:00 PM) -> Auto Cutoff at 13:00
 * - AFTERNOON Shift: 13:00 (1:00 PM) to 16:00 (4:00 PM) -> Auto Cutoff at 16:00
 * - EVENING Shift: 16:00 (4:00 PM) to 23:00 (11:00 PM) -> Auto Cutoff at 23:00
 * - NIGHT Shift: 23:00 (11:00 PM) to 04:00 AM -> Auto Cutoff at 04:00 AM (Next Day)
 * - Past Date Unclosed Records -> Auto Cutoff at respective shift end of check-in date
 */
async function runAutoCheckOutEngine(customDb = null) {
  try {
    const db = customDb || (await getDb());
    const now = new Date();
    const todayStr = getLocalDateStr(now);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Find all open attendance records with checkOutTime null or empty
    const openRecords = await db.collection('attendance').find({
      $or: [
        { checkOutTime: null },
        { checkOutTime: '' },
        { status: 'CHECKED_IN' },
        { status: 'in_gym' }
      ]
    }).toArray();

    if (!openRecords || openRecords.length === 0) {
      return { count: 0, records: [] };
    }

    const autoCheckedOutRecords = [];

    for (const record of openRecords) {
      const checkInDate = new Date(record.checkInTime || record.createdAt || now);
      const recordDateStr = record.date || record.visitDate || getLocalDateStr(checkInDate);
      const isPastDate = recordDateStr < todayStr;
      const isToday = recordDateStr === todayStr;

      const sessionType = (record.sessionType || getSessionType(checkInDate)).toUpperCase();

      let shouldAutoCheckout = false;
      let autoCheckoutTime = null;
      let reason = '';

      if (sessionType === 'MORNING') {
        // Morning Shift ends at 13:00 (780 minutes)
        if (isPastDate || (isToday && currentTimeInMinutes >= 780)) {
          shouldAutoCheckout = true;
          const cutoff = new Date(checkInDate);
          cutoff.setHours(13, 0, 0, 0);
          autoCheckoutTime = cutoff;
          reason = 'Morning Shift Cutoff (13:00 / 1:00 PM)';
        }
      } else if (sessionType === 'AFTERNOON') {
        // Afternoon Shift ends at 16:00 (960 minutes)
        if (isPastDate || (isToday && currentTimeInMinutes >= 960)) {
          shouldAutoCheckout = true;
          const cutoff = new Date(checkInDate);
          cutoff.setHours(16, 0, 0, 0);
          autoCheckoutTime = cutoff;
          reason = 'Afternoon Shift Cutoff (16:00 / 4:00 PM)';
        }
      } else if (sessionType === 'EVENING') {
        // Evening Shift ends at 23:00 (1380 minutes)
        if (isPastDate || (isToday && currentTimeInMinutes >= 1380)) {
          shouldAutoCheckout = true;
          const cutoff = new Date(checkInDate);
          cutoff.setHours(23, 0, 0, 0);
          autoCheckoutTime = cutoff;
          reason = 'Evening Shift Cutoff (23:00 / 11:00 PM)';
        }
      } else if (sessionType === 'NIGHT') {
        // Night Shift ends at 04:00 AM next day (240 minutes)
        if (isPastDate || (isToday && currentTimeInMinutes >= 240 && checkInDate.getDate() !== now.getDate())) {
          shouldAutoCheckout = true;
          const cutoff = new Date(checkInDate);
          cutoff.setDate(cutoff.getDate() + 1);
          cutoff.setHours(4, 0, 0, 0);
          autoCheckoutTime = cutoff;
          reason = 'Night Shift Cutoff (04:00 AM)';
        }
      } else {
        // Fallback: More than 6 hours open or past date
        const elapsedMins = Math.round((now - checkInDate) / 60000);
        if (isPastDate || elapsedMins >= 360) {
          shouldAutoCheckout = true;
          const cutoff = new Date(checkInDate.getTime() + 120 * 60000);
          autoCheckoutTime = cutoff;
          reason = 'Session Slot Timeout';
        }
      }

      if (shouldAutoCheckout && autoCheckoutTime) {
        const durationMs = Math.max(0, autoCheckoutTime - checkInDate);
        const durationMins = Math.max(1, Math.min(Math.round(durationMs / 60000), 240));
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const duration = hours > 0 ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
        const caloriesBurned = Math.round(durationMins * 6.2);

        await db.collection('attendance').updateOne(
          { _id: record._id },
          {
            $set: {
              checkOutTime: autoCheckoutTime.toISOString(),
              duration,
              durationMins,
              durationMinutes: durationMins,
              caloriesBurned,
              status: 'AUTO_CHECKED_OUT',
              autoCheckedOut: true,
              autoCheckoutReason: reason,
              badge: 'AUTO CHECKED OUT',
              updatedAt: now
            }
          }
        );

        autoCheckedOutRecords.push({
          id: record._id.toString(),
          memberName: record.memberName,
          sessionType,
          checkInTime: record.checkInTime,
          checkOutTime: autoCheckoutTime.toISOString(),
          reason
        });
      }
    }

    if (autoCheckedOutRecords.length > 0) {
      console.log(`⏱️ [Auto-Checkout Engine] Automatically checked out ${autoCheckedOutRecords.length} members after shift cutoff.`);
    }

    return { count: autoCheckedOutRecords.length, records: autoCheckedOutRecords };
  } catch (err) {
    console.error('❌ [Auto-Checkout Engine Error]:', err.message);
    return { count: 0, error: err.message };
  }
}

exports.runAutoCheckOutEngine = runAutoCheckOutEngine;

// ── MANUAL / ON-DEMAND AUTO CHECKOUT TRIGGER ──────────────
exports.triggerAutoCheckOut = async (req, res) => {
  try {
    const result = await runAutoCheckOutEngine();
    res.json({
      success: true,
      message: `Auto-checkout engine evaluated successfully. ${result.count} expired sessions checked out.`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── CHECK-IN ──────────────────────────────────────────────
exports.checkIn = async (req, res) => {
  try {
    const { gymId, memberId, memberName, membershipId } = req.body;
    if (!gymId || !memberId) return res.status(400).json({ success: false, error: 'gymId and memberId required.' });

    const db = await getDb();
    
    // Automatically run auto-checkout first to clear any expired dangling sessions
    await runAutoCheckOutEngine(db);

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

    // 2. Check if already checked in and NOT yet checked out for active ongoing session
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
    
    // Evaluate and execute auto-checkout for all shift cutoffs
    await runAutoCheckOutEngine(db);

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

    // 1. Fetch all registered members for this gym
    const membersList = await db.collection('members').find(gymFilter).toArray();
    const memberDetailsMap = {};
    membersList.forEach(m => {
      const mid = m._id.toString();
      memberDetailsMap[mid] = m;
      if (m.userId) memberDetailsMap[String(m.userId)] = m;
      if (m.id) memberDetailsMap[String(m.id)] = m;
      if (m.phone) memberDetailsMap[String(m.phone)] = m;
    });

    // Group records by canonical member ID for daily multi-session breakdown
    const memberMap = {};
    records.forEach(r => {
      const rawMid = String(r.memberId || '');
      // Try to find matching registered member
      const matchedMember = memberDetailsMap[rawMid] || 
        (r.memberPhone && memberDetailsMap[r.memberPhone]) ||
        membersList.find(m => rawMid.includes(m.phone) || (r.memberName && m.name && m.name.toLowerCase() === r.memberName.toLowerCase()));

      const canonicalMid = matchedMember ? matchedMember._id.toString() : rawMid;
      const memName = matchedMember?.name || r.memberName || 'Member';
      const memPlan = matchedMember?.plan || r.membershipId || 'Active Plan';

      if (!memberMap[canonicalMid]) {
        memberMap[canonicalMid] = {
          memberId: canonicalMid,
          memberName: memName,
          membershipId: memPlan,
          visitDate: today,
          totalVisits: 0,
          totalMinutes: 0,
          isCurrentlyInside: false,
          shiftBreakdown: {
            MORNING: { visits: 0, minutes: 0, formatted: '0m' },
            AFTERNOON: { visits: 0, minutes: 0, formatted: '0m' },
            EVENING: { visits: 0, minutes: 0, formatted: '0m' },
            NIGHT: { visits: 0, minutes: 0, formatted: '0m' }
          },
          sessions: []
        };
      }

      const isInside = !r.checkOutTime || r.status === 'CHECKED_IN';
      let durMins = r.durationMins || r.durationMinutes || 0;
      if (isInside) {
        memberMap[canonicalMid].isCurrentlyInside = true;
        durMins = Math.max(1, Math.round((Date.now() - new Date(r.checkInTime).getTime()) / 60000));
      }

      const sType = r.sessionType || getSessionType(new Date(r.checkInTime));
      memberMap[canonicalMid].totalVisits += 1;
      memberMap[canonicalMid].totalMinutes += durMins;

      if (!memberMap[canonicalMid].shiftBreakdown[sType]) {
        memberMap[canonicalMid].shiftBreakdown[sType] = {
          visits: 0,
          minutes: 0,
          formatted: '0m',
          firstCheckIn: r.checkInTime,
          lastCheckOut: r.checkOutTime,
          isLive: isInside
        };
      }
      const shiftObj = memberMap[canonicalMid].shiftBreakdown[sType];
      shiftObj.visits += 1;
      shiftObj.minutes += durMins;
      if (isInside) shiftObj.isLive = true;
      if (!shiftObj.firstCheckIn || new Date(r.checkInTime) < new Date(shiftObj.firstCheckIn)) {
        shiftObj.firstCheckIn = r.checkInTime;
      }
      if (!shiftObj.lastCheckOut || (r.checkOutTime && new Date(r.checkOutTime) > new Date(shiftObj.lastCheckOut))) {
        shiftObj.lastCheckOut = r.checkOutTime;
      }

      memberMap[canonicalMid].sessions.push({
        id: r._id,
        sessionType: sType,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        duration: r.duration || (isInside ? `${durMins}m (Live)` : `${durMins}m`),
        durationMins: durMins,
        status: isInside ? 'CHECKED_IN' : 'CHECKED_OUT',
        caloriesBurned: r.caloriesBurned || Math.round(durMins * 6.2)
      });
    });

    // 2. Fetch 30-day attendance to compute weekly & monthly aggregates per member
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const past30Records = await db.collection('attendance')
      .find({ ...gymFilter, date: { $gte: thirtyDaysAgoStr } })
      .toArray();

    // Group 30-day stats per member
    const member30DayStats = {};
    past30Records.forEach(r => {
      const rawMid = String(r.memberId || '');
      const matchedMember = memberDetailsMap[rawMid] || 
        (r.memberPhone && memberDetailsMap[r.memberPhone]) ||
        membersList.find(m => rawMid.includes(m.phone) || (r.memberName && m.name && m.name.toLowerCase() === r.memberName.toLowerCase()));
      const mid = matchedMember ? matchedMember._id.toString() : rawMid;

      if (!member30DayStats[mid]) {
        member30DayStats[mid] = { weeklyMins: 0, monthlyMins: 0, totalDaysAttended: new Set() };
      }
      const dur = r.durationMinutes || r.durationMins || 0;
      member30DayStats[mid].monthlyMins += dur;
      member30DayStats[mid].totalDaysAttended.add(r.date);

      if (r.date >= sevenDaysAgoStr) {
        member30DayStats[mid].weeklyMins += dur;
      }
    });

    const memberRoster = Object.values(memberMap).map(m => {
      const h = Math.floor(m.totalMinutes / 60);
      const mins = m.totalMinutes % 60;

      const memDetail = memberDetailsMap[m.memberId] || {};
      const stats30 = member30DayStats[m.memberId] || { weeklyMins: 0, monthlyMins: 0, totalDaysAttended: new Set() };

      const weeklyMins = stats30.weeklyMins;
      const weeklyH = Math.floor(weeklyMins / 60);
      const weeklyM = weeklyMins % 60;
      const weeklyFormatted = weeklyH > 0 ? `${weeklyH}h ${weeklyM}m` : `${weeklyM}m`;

      const monthlyMins = stats30.monthlyMins;
      const monthlyH = Math.floor(monthlyMins / 60);
      const monthlyM = monthlyMins % 60;
      const monthlyFormatted = monthlyH > 0 ? `${monthlyH}h ${monthlyM}m` : `${monthlyM}m`;

      // Format individual shifts
      Object.keys(m.shiftBreakdown).forEach(st => {
        const sMins = m.shiftBreakdown[st].minutes;
        const sh = Math.floor(sMins / 60);
        const sm = sMins % 60;
        m.shiftBreakdown[st].formatted = sh > 0 ? `${sh}h ${String(sm).padStart(2, '0')}m` : `${sm}m`;
      });

      // Compute past 7 days daily attended status (Mon to Sun)
      const nowRef = new Date();
      const currentDay = nowRef.getDay();
      const distToMon = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(nowRef);
      monday.setDate(nowRef.getDate() - distToMon);
      monday.setHours(0, 0, 0, 0);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyTimeline = dayNames.map((dayName, dIdx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + dIdx);
        const dateStr = getLocalDateStr(d);
        const attended = stats30.totalDaysAttended.has(dateStr);
        const isToday = dateStr === today;
        const isPast = dateStr < today;
        const isFuture = dateStr > today;
        return {
          day: dayName,
          date: dateStr,
          attended,
          isToday,
          isPast,
          isFuture
        };
      });

      return {
        ...m,
        memberName: memDetail.name || m.memberName || 'Member',
        memberPhone: memDetail.phone || '',
        planName: memDetail.plan || 'Standard Gym Plan',
        planDurationMonths: memDetail.durationMonths || 1,
        planDurationLabel: `${memDetail.durationMonths || 1} Month${(memDetail.durationMonths || 1) > 1 ? 's' : ''} Pass`,
        planPrice: memDetail.planPrice || 0,
        planExpiryDate: memDetail.expiryDate || '',
        joinedDate: memDetail.joinedDate || memDetail.startDate || '',
        todayTotalTimeFormatted: h > 0 ? `${h}h ${String(mins).padStart(2, '0')}m` : `${mins}m`,
        totalTimeFormatted: h > 0 ? `${h}h ${String(mins).padStart(2, '0')}m` : `${mins}m`,
        weeklyMinutes: weeklyMins,
        weeklyTimeFormatted: weeklyFormatted,
        monthlyMinutes: monthlyMins,
        monthlyTimeFormatted: monthlyFormatted,
        daysAttendedThisMonth: stats30.totalDaysAttended.size,
        attendedDates: Array.from(stats30.totalDaysAttended),
        weeklyTimeline,
        avgVisitMins: Math.round(m.totalMinutes / m.totalVisits)
      };
    }).sort((a, b) => (b.isCurrentlyInside ? 1 : 0) - (a.isCurrentlyInside ? 1 : 0) || b.totalMinutes - a.totalMinutes);

    const enrichedRecords = records.map(r => {
      const mid = String(r.memberId);
      const memDetail = memberDetailsMap[mid] || {};
      const method = (r.method || 'mobile_qr').toLowerCase();
      let accessTypeLabel = '📱 Mobile App';
      if (method.includes('qr')) accessTypeLabel = '📷 Mobile QR';
      else if (method.includes('button') || method.includes('dashboard')) accessTypeLabel = '📱 One-Tap App';
      else if (method.includes('nfc')) accessTypeLabel = '💳 NFC Pass';
      else if (method.includes('bio')) accessTypeLabel = '👆 Biometric';

      return {
        ...r,
        memberName: memDetail.name || r.memberName || 'Member',
        memberPhone: memDetail.phone || r.memberPhone || '',
        planName: memDetail.plan || r.membershipId || 'Standard Pass',
        accessTypeLabel,
      };
    });

    const totalUniqueMembers = Object.keys(memberMap).length;
    const totalVisits = records.length;
    let stillInside = 0;
    let checkedOut = 0;
    records.forEach(r => {
      const isInside = !r.checkOutTime || r.status === 'CHECKED_IN';
      if (isInside) stillInside++;
      else checkedOut++;
    });

    res.json({
      success: true,
      records: enrichedRecords,
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
    const { gymId, memberId, date, phone } = req.query;
    if (!memberId && !phone) return res.status(400).json({ success: false, error: 'memberId or phone required.' });

    const targetDate = date || getLocalDateStr(new Date());
    const db = await getDb();

    // Look up member profile to resolve all potential IDs
    let memberDoc = null;
    if (memberId && ObjectId.isValid(memberId)) {
      memberDoc = await db.collection('members').findOne({ _id: new ObjectId(memberId) });
    }
    if (!memberDoc && memberId) {
      memberDoc = await db.collection('members').findOne({
        $or: [
          { _id: memberId },
          { userId: memberId },
          { phone: memberId },
          ...(phone ? [{ phone }] : [])
        ]
      });
    }
    if (!memberDoc && phone) {
      memberDoc = await db.collection('members').findOne({ phone });
    }

    const memberMatchClauses = [];
    if (memberId) {
      memberMatchClauses.push({ memberId: String(memberId) });
      if (ObjectId.isValid(memberId)) memberMatchClauses.push({ memberId: new ObjectId(memberId) });
    }
    if (phone) memberMatchClauses.push({ memberPhone: String(phone) });
    if (memberDoc) {
      memberMatchClauses.push(
        { memberId: memberDoc._id.toString() },
        { memberId: String(memberDoc.userId) },
        { memberPhone: memberDoc.phone },
        { memberName: memberDoc.name }
      );
    }

    // Fetch all attendance history for this member
    const allMemberRecords = await db.collection('attendance')
      .find({ $or: memberMatchClauses })
      .sort({ checkInTime: -1 })
      .toArray();

    const sessions = allMemberRecords.filter(r => (r.date === targetDate || r.visitDate === targetDate));

    let totalMinutes = 0;
    let isCurrentlyInside = false;
    const shiftBreakdown = {
      MORNING: { visits: 0, minutes: 0, formatted: '0m' },
      AFTERNOON: { visits: 0, minutes: 0, formatted: '0m' },
      EVENING: { visits: 0, minutes: 0, formatted: '0m' },
      NIGHT: { visits: 0, minutes: 0, formatted: '0m' }
    };

    const formattedSessions = sessions.map(s => {
      const isInside = !s.checkOutTime || s.status === 'CHECKED_IN';
      let durMins = s.durationMins || s.durationMinutes || 0;
      if (isInside) {
        isCurrentlyInside = true;
        durMins = Math.max(1, Math.round((Date.now() - new Date(s.checkInTime).getTime()) / 60000));
      }
      totalMinutes += durMins;

      const sType = s.sessionType || getSessionType(new Date(s.checkInTime));
      if (!shiftBreakdown[sType]) {
        shiftBreakdown[sType] = { visits: 0, minutes: 0, formatted: '0m' };
      }
      shiftBreakdown[sType].visits += 1;
      shiftBreakdown[sType].minutes += durMins;

      return {
        id: s._id,
        sessionType: sType,
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime,
        duration: s.duration || (isInside ? `${durMins}m (Live)` : `${durMins}m`),
        durationMins: durMins,
        status: isInside ? 'CHECKED_IN' : 'CHECKED_OUT',
        caloriesBurned: s.caloriesBurned || Math.round(durMins * 6.2)
      };
    });

    // Format individual shift totals for today
    Object.keys(shiftBreakdown).forEach(st => {
      const sMins = shiftBreakdown[st].minutes;
      const sh = Math.floor(sMins / 60);
      const sm = sMins % 60;
      shiftBreakdown[st].formatted = sh > 0 ? `${sh}h ${String(sm).padStart(2, '0')}m` : `${sm}m`;
    });

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const totalTimeFormatted = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;

    // Attended dates across all history
    const attendedDatesSet = new Set(allMemberRecords.map(r => r.date || r.visitDate).filter(Boolean));
    const attendedDates = Array.from(attendedDatesSet);

    // Current month metrics
    const nowRef = new Date();
    const currentYearMonth = `${nowRef.getFullYear()}-${String(nowRef.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthRecords = allMemberRecords.filter(r => (r.date || r.visitDate || '').startsWith(currentYearMonth));
    const thisMonthAttendedDates = Array.from(new Set(thisMonthRecords.map(r => r.date || r.visitDate).filter(Boolean)));
    const monthlyMins = thisMonthRecords.reduce((acc, curr) => acc + (curr.durationMins || curr.durationMinutes || 0), 0);
    const monthlyH = Math.floor(monthlyMins / 60);
    const monthlyM = monthlyMins % 60;
    const monthlyFormatted = monthlyH > 0 ? `${monthlyH}h ${monthlyM}m` : `${monthlyM}m`;

    // Past 7 days (weekly)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const past7Records = allMemberRecords.filter(r => (r.date || r.visitDate || '') >= sevenDaysAgoStr);
    const weeklyMins = past7Records.reduce((acc, curr) => acc + (curr.durationMins || curr.durationMinutes || 0), 0);
    const weeklyH = Math.floor(weeklyMins / 60);
    const weeklyM = weeklyMins % 60;
    const weeklyFormatted = weeklyH > 0 ? `${weeklyH}h ${weeklyM}m` : `${weeklyM}m`;

    // Weekly Timeline (Monday to Sunday)
    const currentDay = nowRef.getDay();
    const distToMon = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(nowRef);
    monday.setDate(nowRef.getDate() - distToMon);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyTimeline = dayNames.map((dayName, dIdx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + dIdx);
      const dateStr = getLocalDateStr(d);
      const attended = attendedDatesSet.has(dateStr);
      const isToday = dateStr === targetDate;
      const isPast = dateStr < targetDate;
      const isFuture = dateStr > targetDate;
      return {
        day: dayName,
        date: dateStr,
        attended,
        isToday,
        isPast,
        isFuture
      };
    });

    res.json({
      success: true,
      visitDate: targetDate,
      memberName: memberDoc?.name || '',
      memberPhone: memberDoc?.phone || phone || '',
      planName: memberDoc?.plan || memberDoc?.membershipPlan || '',
      planPrice: memberDoc?.planPrice || memberDoc?.price || 0,
      planDurationMonths: memberDoc?.durationMonths || memberDoc?.duration || 1,
      planDurationLabel: memberDoc?.durationMonths ? `${memberDoc.durationMonths} Months Pass` : (memberDoc?.plan ? `${memberDoc.plan} Pass` : 'Standard Pass'),
      joinedDate: memberDoc?.joinedDate || memberDoc?.startDate || memberDoc?.createdAt || '',
      planExpiryDate: memberDoc?.expiryDate || '',
      totalVisits: sessions.length,
      totalMinutes,
      totalTimeFormatted,
      todayTotalTimeFormatted: totalTimeFormatted,
      isCurrentlyInside,
      shiftBreakdown,
      sessions: formattedSessions,
      attendedDates,
      daysAttendedThisMonth: thisMonthAttendedDates.length,
      monthlyMinutes: monthlyMins,
      monthlyTimeFormatted: monthlyFormatted,
      weeklyMinutes: weeklyMins,
      weeklyTimeFormatted: weeklyFormatted,
      weeklyTimeline
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
