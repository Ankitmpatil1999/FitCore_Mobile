const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── GET MEMBER PROFILE & DASHBOARD DATA ──────────────────
exports.getMemberProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'm1';

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const membersCollection = db.collection('members');

    let member = await membersCollection.findOne({
      $or: [{ userId: String(userId) }, { _id: String(userId) }, { id: String(userId) }],
    });

    // If not found in mongo collection, provide default active member profile
    if (!member) {
      member = {
        id: String(userId),
        name: 'Arjun Mehta',
        phone: '9876543210',
        email: 'arjun.mehta@fitcore.com',
        gender: 'Male',
        dob: '1996-05-15',
        height: 178,
        weight: 74.5,
        bmi: 23.5,
        goal: 'Hypertrophy & Fat Loss',
        status: 'active',
        joinDate: '2024-01-10',
        expiryDate: new Date(Date.now() + 149 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        photo: '',
      };
    }

    // Fetch Active Plan Details
    let daysRemaining = 149;
    if (member.expiryDate) {
      const expiry = new Date(member.expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceCollection = db.collection('attendance');
    const todayAttendance = await attendanceCollection.findOne({
      memberId: String(userId),
      date: todayStr,
    });

    res.json({
      success: true,
      data: {
        member: {
          id: member.id || member._id || String(userId),
          name: member.name || 'Arjun Mehta',
          phone: member.phone || '9876543210',
          email: member.email || 'member@fitcore.com',
          gender: member.gender || 'Male',
          dob: member.dob || '1996-05-15',
          height: member.height || 178,
          weight: member.weight || 74.5,
          bmi: member.bmi || 23.5,
          goal: member.goal || 'Muscle Gain',
          medicalIssues: member.medicalIssues || 'None',
          emergencyContact: member.emergencyContact || 'Vikram Mehta',
          emergencyPhone: member.emergencyPhone || '9876543211',
          status: member.status || 'active',
          joinDate: member.joinDate || '2024-01-10',
          expiryDate: member.expiryDate,
          daysRemaining,
          photo: member.photo || '',
        },
        gym: {
          id: 'gym_01',
          name: 'FitCore Elite Gym',
          address: 'Phoenix Millennium, Viman Nagar',
          city: 'Pune',
          phone: '+91 98765 43210',
          rating: 4.9,
        },
        plan: {
          name: 'Gold Annual Pass',
          price: 12999,
          durationDays: 365,
        },
        todayCheckedIn: !!todayAttendance,
        checkInTime: todayAttendance?.checkInTime || null,
      },
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── SAVE / UPDATE MEMBER PERSONAL DETAILS & GYM EXPERIENCE (SINGLE API) ──
exports.savePersonalDetails = async (req, res) => {
  try {
    const {
      memberId,
      name,
      phone,
      email,
      gender,
      dob,
      height,
      weight,
      bmi,
      goal,
      medicalIssues,
      emergencyContact,
      emergencyPhone,
      photo,
      experienceLevel,
      experienceKey,
      joinedDate,
      joinDate,
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const membersCollection = db.collection('members');

    const updateFields = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = String(phone);
    if (email !== undefined) updateFields.email = email;
    if (gender !== undefined) updateFields.gender = gender;
    if (dob !== undefined) updateFields.dob = dob;
    if (height !== undefined) updateFields.height = Number(height);
    if (weight !== undefined) updateFields.weight = Number(weight);
    if (bmi !== undefined) updateFields.bmi = Number(bmi);
    if (goal !== undefined) updateFields.goal = goal;
    if (medicalIssues !== undefined) updateFields.medicalIssues = medicalIssues;
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) updateFields.emergencyPhone = emergencyPhone;
    if (photo !== undefined) updateFields.photo = photo;

    // Experience & Joined Date
    if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel;
    if (experienceKey !== undefined) updateFields.experienceKey = experienceKey;
    if (joinedDate !== undefined || joinDate !== undefined) {
      updateFields.joinDate = joinedDate || joinDate;
    }
    updateFields.hasSetExperience = true;

    const result = await membersCollection.findOneAndUpdate(
      { $or: [{ id: String(memberId) }, { userId: String(memberId) }] },
      { $set: updateFields },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: 'Personal details & gym experience saved successfully!',
      data: result.value || updateFields,
    });
  } catch (error) {
    console.error('Error saving personal details:', error);
    return res.status(500).json({ success: false, message: 'Error saving personal details', error: error.message });
  }
};

// ── GET DYNAMIC ROTATING QR PASS TOKEN ───────────────────
exports.getQRPass = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const member = await prisma.member.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Generate secure dynamic time-stamped token
    const timestamp = Date.now();
    const tokenPayload = `${member.id}:${member.gymId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fitcore_secret').update(tokenPayload).digest('hex').substring(0, 16);
    
    const dynamicQrString = `FITCORE_PASS:${tokenPayload}:${signature}`;

    res.json({
      success: true,
      data: {
        qrCode: dynamicQrString,
        memberId: member.id,
        memberName: member.name,
        memberStatus: member.status,
        expiresInSeconds: 60,
        timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating QR pass', error: error.message });
  }
};

// ── GET GROUP CLASSES & SCHEDULES ────────────────────────
exports.getClasses = async (req, res) => {
  try {
    const { gymId, memberId } = req.query;
    const classes = await prisma.gymClass.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    let memberBookings = [];
    if (memberId) {
      const todayStr = new Date().toISOString().split('T')[0];
      memberBookings = await prisma.classBooking.findMany({
        where: {
          memberId,
          bookingDate: { gte: todayStr },
          status: 'confirmed',
        },
      });
    }

    const bookedClassIds = new Set(memberBookings.map((b) => b.classId));

    const enrichedClasses = classes.map((c) => ({
      ...c,
      isBooked: bookedClassIds.has(c.id),
      availableSpots: Math.max(0, c.capacity - c.bookedSeats),
    }));

    res.json({ success: true, data: enrichedClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
  }
};

// ── 1-TAP CLASS BOOKING ───────────────────────────────────
exports.bookClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { memberId, gymId, bookingDate } = req.body;

    if (!classId || !memberId) {
      return res.status(400).json({ success: false, message: 'Class ID and Member ID are required' });
    }

    const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (gymClass.bookedSeats >= gymClass.capacity) {
      return res.status(400).json({ success: false, message: 'Class is already fully booked' });
    }

    const dateStr = bookingDate || new Date().toISOString().split('T')[0];

    // Check if already booked
    const existing = await prisma.classBooking.findFirst({
      where: {
        classId,
        memberId,
        bookingDate: dateStr,
        status: 'confirmed',
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already booked this class' });
    }

    // Create booking and increment seat count
    const [booking] = await prisma.$transaction([
      prisma.classBooking.create({
        data: {
          classId,
          memberId,
          gymId: gymId || gymClass.gymId,
          bookingDate: dateStr,
          status: 'confirmed',
        },
      }),
      prisma.gymClass.update({
        where: { id: classId },
        data: { bookedSeats: { increment: 1 } },
      }),
    ]);

    res.json({
      success: true,
      message: `Successfully booked spot for ${gymClass.title}!`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error booking class', error: error.message });
  }
};

// ── GET 7-DAY WORKOUT ROUTINE (BEGINNER 0-6M VS INTERMEDIATE 6M+ VS PRO) ──
exports.getWorkoutPlan = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.user?.id;
    const requestedLevel = req.query.level; // 'beginner' | 'intermediate'
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const workoutPlansCollection = db.collection('workout_plans');

    // 1. Check if trainer has assigned a custom personalized plan to this member
    let customPlan = null;
    if (memberId) {
      customPlan = await workoutPlansCollection.findOne({
        memberId: String(memberId),
        isActive: true,
      });
    }

    if (customPlan) {
      return res.status(200).json({
        success: true,
        isTrainerAssigned: true,
        planType: 'PRO_PERSONALIZED',
        level: 'Pro Custom',
        trainerName: customPlan.trainerName || 'Assigned Coach',
        data: customPlan,
      });
    }

    // 2. Determine member experience / duration (0-6 months vs 6+ months)
    let isBeginner = true;
    if (requestedLevel) {
      isBeginner = requestedLevel.toLowerCase() === 'beginner';
    } else if (memberId) {
      const membersCollection = db.collection('members');
      const member = await membersCollection.findOne({
        $or: [{ id: String(memberId) }, { userId: String(memberId) }, { _id: String(memberId) }],
      });
      if (member?.joinDate) {
        const joinDate = new Date(member.joinDate);
        const monthsSinceJoined = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4);
        isBeginner = monthsSinceJoined < 6;
      }
    }

    // ── 🟢 BEGINNER PLAN (0 to 6 Months: 1 Main Muscle Group Per Day) ──
    const beginnerPlan = {
      id: 'fitcore-beginner-7day',
      title: 'Beginner Plan (0–6 Months)',
      level: 'Beginner',
      goal: 'Foundational Strength & Muscle Habit',
      isTrainerAssigned: false,
      planType: 'BEGINNER',
      days: [
        {
          day: 'Monday',
          dayName: 'Monday: Chest Focus',
          focus: '💪 Chest',
          durationMin: 45,
          calories: 320,
          exercises: [
            { id: 'b-mon-1', name: 'Push-Ups', sets: 3, reps: '12', weight: 'Bodyweight', targetMuscle: 'Mid-Chest', restSec: 60 },
            { id: 'b-mon-2', name: 'Barbell Bench Press', sets: 3, reps: '10', weight: '40 kg', targetMuscle: 'Chest Overall', restSec: 75 },
            { id: 'b-mon-3', name: 'Incline Dumbbell Press', sets: 3, reps: '10', weight: '16 kg', targetMuscle: 'Upper Chest', restSec: 60 },
            { id: 'b-mon-4', name: 'Chest Fly Machine', sets: 3, reps: '12', weight: '25 kg', targetMuscle: 'Chest Inner', restSec: 45 },
            { id: 'b-mon-5', name: 'Cable Crossover', sets: 3, reps: '12', weight: '15 kg', targetMuscle: 'Lower Chest', restSec: 45 },
          ],
        },
        {
          day: 'Tuesday',
          dayName: 'Tuesday: Triceps Focus',
          focus: '💪 Triceps',
          durationMin: 40,
          calories: 280,
          exercises: [
            { id: 'b-tue-1', name: 'Tricep Rope Pushdowns', sets: 3, reps: '12', weight: '15 kg', targetMuscle: 'Triceps Lateral', restSec: 45 },
            { id: 'b-tue-2', name: 'Overhead Dumbbell Extension', sets: 3, reps: '10', weight: '14 kg', targetMuscle: 'Triceps Long Head', restSec: 60 },
            { id: 'b-tue-3', name: 'EZ-Bar Skull Crushers', sets: 3, reps: '10', weight: '18 kg', targetMuscle: 'Triceps Medial', restSec: 60 },
            { id: 'b-tue-4', name: 'Bench Dips', sets: 3, reps: '12', weight: 'Bodyweight', targetMuscle: 'Triceps & Shoulders', restSec: 45 },
          ],
        },
        {
          day: 'Wednesday',
          dayName: 'Wednesday: Back Focus',
          focus: '🧲 Back',
          durationMin: 45,
          calories: 340,
          exercises: [
            { id: 'b-wed-1', name: 'Lat Pulldowns', sets: 3, reps: '10', weight: '45 kg', targetMuscle: 'Lats Width', restSec: 60 },
            { id: 'b-wed-2', name: 'Seated Cable Rows', sets: 3, reps: '12', weight: '40 kg', targetMuscle: 'Mid-Back Thickness', restSec: 60 },
            { id: 'b-wed-3', name: 'T-Bar Row Machine', sets: 3, reps: '10', weight: '30 kg', targetMuscle: 'Upper Back', restSec: 60 },
            { id: 'b-wed-4', name: 'Rear Delt Face Pulls', sets: 3, reps: '15', weight: '18 kg', targetMuscle: 'Upper Traps & Rear Delts', restSec: 45 },
          ],
        },
        {
          day: 'Thursday',
          dayName: 'Thursday: Biceps Focus',
          focus: '💪 Biceps',
          durationMin: 40,
          calories: 270,
          exercises: [
            { id: 'b-thu-1', name: 'Standing Barbell Curls', sets: 3, reps: '10', weight: '20 kg', targetMuscle: 'Biceps Peak', restSec: 60 },
            { id: 'b-thu-2', name: 'Dumbbell Hammer Curls', sets: 3, reps: '12', weight: '12 kg', targetMuscle: 'Brachialis & Forearms', restSec: 45 },
            { id: 'b-thu-3', name: 'Preacher Bench Curls', sets: 3, reps: '10', weight: '18 kg', targetMuscle: 'Biceps Short Head', restSec: 60 },
            { id: 'b-thu-4', name: 'Concentration Curls', sets: 3, reps: '12', weight: '10 kg', targetMuscle: 'Biceps Isolation', restSec: 45 },
          ],
        },
        {
          day: 'Friday',
          dayName: 'Friday: Shoulders Focus',
          focus: '🏋️ Shoulders',
          durationMin: 45,
          calories: 310,
          exercises: [
            { id: 'b-fri-1', name: 'Overhead Dumbbell Press', sets: 3, reps: '10', weight: '14 kg', targetMuscle: 'Front Deltoids', restSec: 60 },
            { id: 'b-fri-2', name: 'Dumbbell Lateral Raises', sets: 3, reps: '12', weight: '8 kg', targetMuscle: 'Side Deltoids', restSec: 45 },
            { id: 'b-fri-3', name: 'Front Dumbbell Raises', sets: 3, reps: '12', weight: '8 kg', targetMuscle: 'Anterior Delts', restSec: 45 },
            { id: 'b-fri-4', name: 'Dumbbell Shrugs', sets: 3, reps: '15', weight: '20 kg', targetMuscle: 'Upper Traps', restSec: 45 },
          ],
        },
        {
          day: 'Saturday',
          dayName: 'Saturday: Legs Focus',
          focus: '🦵 Legs',
          durationMin: 50,
          calories: 380,
          exercises: [
            { id: 'b-sat-1', name: 'Goblet Squats', sets: 3, reps: '12', weight: '16 kg', targetMuscle: 'Quads & Glutes', restSec: 60 },
            { id: 'b-sat-2', name: 'Leg Press Machine', sets: 3, reps: '10', weight: '100 kg', targetMuscle: 'Quads Power', restSec: 75 },
            { id: 'b-sat-3', name: 'Lying Leg Curls', sets: 3, reps: '12', weight: '35 kg', targetMuscle: 'Hamstrings', restSec: 60 },
            { id: 'b-sat-4', name: 'Standing Calf Raises', sets: 4, reps: '15', weight: '40 kg', targetMuscle: 'Calves', restSec: 45 },
          ],
        },
        {
          day: 'Sunday',
          dayName: 'Sunday: Full Body Workout',
          focus: '🔥 Full Body Workout',
          durationMin: 35,
          calories: 250,
          exercises: [
            { id: 'b-sun-1', name: 'Bodyweight Air Squats', sets: 3, reps: '15', weight: 'Bodyweight', targetMuscle: 'Legs & Core', restSec: 45 },
            { id: 'b-sun-2', name: 'Standard Push-Ups', sets: 3, reps: '15', weight: 'Bodyweight', targetMuscle: 'Chest & Arms', restSec: 45 },
            { id: 'b-sun-3', name: 'Plank Hold', sets: 3, reps: '60 sec', weight: 'Bodyweight', targetMuscle: 'Core Stability', restSec: 45 },
            { id: 'b-sun-4', name: 'Jumping Jacks & Stretch', sets: 3, reps: '30 sec', weight: 'Bodyweight', targetMuscle: 'Full Body Conditioning', restSec: 30 },
          ],
        },
      ],
    };

    // ── 🔵 INTERMEDIATE PLAN (6+ Months: Advanced Split) ──
    const intermediatePlan = {
      id: 'fitcore-intermediate-7day',
      title: 'Intermediate Plan (6+ Months)',
      level: 'Intermediate',
      goal: 'Progressive Overload & Hypertrophy Split',
      isTrainerAssigned: false,
      planType: 'INTERMEDIATE',
      days: [
        {
          day: 'Monday',
          dayName: 'Monday: Push Day',
          focus: '💪 Push Day (Chest + Triceps)',
          durationMin: 55,
          calories: 390,
          exercises: [
            { id: 'i-mon-1', name: 'Barbell Flat Bench Press', sets: 4, reps: '8-10', weight: '65 kg', targetMuscle: 'Mid-Chest', restSec: 90 },
            { id: 'i-mon-2', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '24 kg', targetMuscle: 'Upper Chest', restSec: 60 },
            { id: 'i-mon-3', name: 'Dips / Weighted Dips', sets: 3, reps: '10-12', weight: 'Bodyweight', targetMuscle: 'Lower Chest & Triceps', restSec: 60 },
            { id: 'i-mon-4', name: 'Overhead Tricep Rope Extension', sets: 4, reps: '12-15', weight: '22 kg', targetMuscle: 'Triceps Long Head', restSec: 45 },
          ],
        },
        {
          day: 'Tuesday',
          dayName: 'Tuesday: Leg Day',
          focus: '🦵 Leg Day (Quads + Hamstrings + Calves)',
          durationMin: 55,
          calories: 430,
          exercises: [
            { id: 'i-tue-1', name: 'Barbell Back Squats', sets: 4, reps: '8-10', weight: '80 kg', targetMuscle: 'Quads & Glutes', restSec: 90 },
            { id: 'i-tue-2', name: 'Romanian Deadlifts', sets: 4, reps: '10-12', weight: '70 kg', targetMuscle: 'Hamstrings', restSec: 75 },
            { id: 'i-tue-3', name: 'Leg Extensions', sets: 3, reps: '15', weight: '50 kg', targetMuscle: 'Quads Isolation', restSec: 45 },
            { id: 'i-tue-4', name: 'Seated Calf Raises', sets: 4, reps: '15-20', weight: '45 kg', targetMuscle: 'Calves', restSec: 45 },
          ],
        },
        {
          day: 'Wednesday',
          dayName: 'Wednesday: Pull Day',
          focus: '🧲 Pull Day (Back + Biceps)',
          durationMin: 55,
          calories: 400,
          exercises: [
            { id: 'i-wed-1', name: 'Weighted Pull-Ups / Lat Pulldown', sets: 4, reps: '8-10', weight: '60 kg', targetMuscle: 'Lats Width', restSec: 75 },
            { id: 'i-wed-2', name: 'Barbell Bent-Over Rows', sets: 4, reps: '8-10', weight: '55 kg', targetMuscle: 'Mid-Back Thickness', restSec: 75 },
            { id: 'i-wed-3', name: 'Incline Dumbbell Bicep Curls', sets: 3, reps: '10-12', weight: '14 kg', targetMuscle: 'Biceps Long Head', restSec: 60 },
            { id: 'i-wed-4', name: 'Hammer Rope Curls', sets: 3, reps: '12-15', weight: '20 kg', targetMuscle: 'Brachialis', restSec: 45 },
          ],
        },
        {
          day: 'Thursday',
          dayName: 'Thursday: Core + Cardio',
          focus: '🔥 Core + Cardio (Abs + Conditioning)',
          durationMin: 45,
          calories: 320,
          exercises: [
            { id: 'i-thu-1', name: 'Hanging Leg Raises', sets: 4, reps: '15-20', weight: 'Bodyweight', targetMuscle: 'Lower Abs', restSec: 45 },
            { id: 'i-thu-2', name: 'Cable Woodchoppers', sets: 3, reps: '15/side', weight: '18 kg', targetMuscle: 'Obliques', restSec: 45 },
            { id: 'i-thu-3', name: 'Ab Wheel Rollouts', sets: 3, reps: '12', weight: 'Bodyweight', targetMuscle: 'Deep Core', restSec: 45 },
            { id: 'i-thu-4', name: 'HIIT Rowing Machine / Sprints', sets: 1, reps: '15 mins', weight: 'High Intensity', targetMuscle: 'Cardio Engine', restSec: 0 },
          ],
        },
        {
          day: 'Friday',
          dayName: 'Friday: Upper Body',
          focus: '🏋️ Upper Body (Chest + Back + Shoulders)',
          durationMin: 55,
          calories: 410,
          exercises: [
            { id: 'i-fri-1', name: 'Standing Barbell Overhead Press', sets: 4, reps: '8-10', weight: '45 kg', targetMuscle: 'Deltoids Power', restSec: 75 },
            { id: 'i-fri-2', name: 'Dumbbell Incline Bench Press', sets: 3, reps: '10-12', weight: '26 kg', targetMuscle: 'Upper Chest', restSec: 60 },
            { id: 'i-fri-3', name: 'Seated Cable Row', sets: 3, reps: '10-12', weight: '55 kg', targetMuscle: 'Upper Back', restSec: 60 },
            { id: 'i-fri-4', name: 'Lateral Raise Dropset', sets: 4, reps: '12-15', weight: '12 kg', targetMuscle: 'Lateral Deltoids', restSec: 45 },
          ],
        },
        {
          day: 'Saturday',
          dayName: 'Saturday: Lower Body',
          focus: '🍑 Lower Body (Glutes + Legs)',
          durationMin: 50,
          calories: 390,
          exercises: [
            { id: 'i-sat-1', name: 'Barbell Hip Thrusts', sets: 4, reps: '10-12', weight: '80 kg', targetMuscle: 'Glutes Maxima', restSec: 75 },
            { id: 'i-sat-2', name: 'Bulgarian Split Squats', sets: 3, reps: '10/leg', weight: '16 kg', targetMuscle: 'Quads & Unilateral Glutes', restSec: 60 },
            { id: 'i-sat-3', name: 'Lying Hamstring Curls', sets: 3, reps: '12', weight: '40 kg', targetMuscle: 'Hamstrings', restSec: 45 },
            { id: 'i-sat-4', name: 'Standing Calf Raise', sets: 4, reps: '20', weight: '50 kg', targetMuscle: 'Calves', restSec: 45 },
          ],
        },
        {
          day: 'Sunday',
          dayName: 'Sunday: Recovery',
          focus: '🧘 Recovery (Mobility + Recovery)',
          durationMin: 30,
          calories: 140,
          exercises: [
            { id: 'i-sun-1', name: 'Full Body Foam Rolling & Trigger Point', sets: 1, reps: '10 mins', weight: 'Bodyweight', targetMuscle: 'Fascial Release', restSec: 30 },
            { id: 'i-sun-2', name: 'Dynamic Hip Flexor & Thoracic Mobility', sets: 3, reps: '60 sec', weight: 'Bodyweight', targetMuscle: 'Mobility', restSec: 30 },
            { id: 'i-sun-3', name: 'Diaphragmatic Deep Breathing & Meditation', sets: 1, reps: '10 mins', weight: 'Bodyweight', targetMuscle: 'Central Nervous System', restSec: 0 },
          ],
        },
      ],
    };

    const activePlan = isBeginner ? beginnerPlan : intermediatePlan;

    return res.status(200).json({
      success: true,
      isTrainerAssigned: false,
      planType: isBeginner ? 'BEGINNER' : 'INTERMEDIATE',
      level: isBeginner ? 'Beginner (0–6 Mo)' : 'Intermediate (6+ Mo)',
      data: activePlan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching workout plan', error: error.message });
  }
};

// ── TRAINER ASSIGN CUSTOM WORKOUT PLAN TO PRO MEMBER ──────
exports.assignWorkoutPlan = async (req, res) => {
  try {
    const { memberId, trainerId, trainerName, title, level, goal, days } = req.body;
    if (!memberId || !days || !Array.isArray(days)) {
      return res.status(400).json({ success: false, message: 'Member ID and 7-day schedule array are required' });
    }

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const workoutPlansCollection = db.collection('workout_plans');

    const newPlan = {
      memberId: String(memberId),
      trainerId: String(trainerId || 'trainer_01'),
      trainerName: trainerName || 'Coach Rahul Verma',
      title: title || 'Custom Pro Training Split',
      level: level || 'Advanced Pro',
      goal: goal || 'Muscle Hypertrophy & Power',
      isTrainerAssigned: true,
      planType: 'PRO_PERSONALIZED',
      days,
      isActive: true,
      updatedAt: new Date(),
    };

    await workoutPlansCollection.updateOne(
      { memberId: String(memberId) },
      { $set: newPlan },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Personalized workout plan assigned successfully to member!`,
      data: newPlan,
    });
  } catch (error) {
    console.error('Error assigning workout plan:', error);
    return res.status(500).json({ success: false, message: 'Error assigning workout plan', error: error.message });
  }
};

// ── SAVE WORKOUT LOG ─────────────────────────────────────
exports.logWorkout = async (req, res) => {
  try {
    const { memberId, gymId, workoutName, durationMin, caloriesBurned, completedSets } = req.body;
    const log = await prisma.workoutLog.create({
      data: {
        memberId,
        gymId: gymId || '65123456789abcdef0123456',
        workoutName: workoutName || 'Daily Workout',
        date: new Date().toISOString().split('T')[0],
        durationMin: durationMin || 45,
        caloriesBurned: caloriesBurned || 320,
        completedSets: completedSets || {},
      },
    });

    res.json({ success: true, message: 'Workout logged successfully!', data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving workout log', error: error.message });
  }
};

// ── GET DIET & NUTRITION PLAN ────────────────────────────
exports.getDietPlan = async (req, res) => {
  try {
    const { memberId } = req.query;
    let diet = await prisma.dietPlan.findFirst({
      where: {
        ...(memberId ? { memberId } : {}),
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!diet) {
      diet = {
        id: 'default-diet',
        title: 'High Protein Clean Bulk',
        targetCalories: 2450,
        proteinGrams: 160,
        carbsGrams: 260,
        fatsGrams: 65,
        waterLiters: 3.5,
        meals: [
          {
            mealType: 'Breakfast',
            time: '08:00 AM',
            name: 'Oats & Egg Whites',
            calories: 550,
            protein: 38,
            carbs: 65,
            fats: 12,
            items: ['60g Rolled Oats with Almond Milk', '4 Egg Whites + 1 Whole Egg', '1 Banana'],
          },
          {
            mealType: 'Lunch',
            time: '01:30 PM',
            name: 'Grilled Chicken & Rice',
            calories: 720,
            protein: 52,
            carbs: 85,
            fats: 18,
            items: ['180g Chicken Breast / Tofu', '1.5 cups Brown Rice', 'Mixed Green Salad + Olive Oil'],
          },
          {
            mealType: 'Evening Snack',
            time: '05:30 PM',
            name: 'Pre-Workout Fuel',
            calories: 380,
            protein: 28,
            carbs: 45,
            fats: 8,
            items: ['1 Scoop FitCore Whey Isolate', '2 Brown Bread Slices with Peanut Butter'],
          },
          {
            mealType: 'Dinner',
            time: '09:00 PM',
            name: 'Paneer / Fish with Vegetables',
            calories: 580,
            protein: 42,
            carbs: 45,
            fats: 22,
            items: ['150g Low Fat Paneer / Grilled Fish', '2 Whole Wheat Rotis', 'Steamed Broccoli & Dal'],
          },
        ],
      };
    }

    res.json({ success: true, data: diet });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching diet plan', error: error.message });
  }
};

// ── CHECK-IN ATTENDANCE (1 PER CALENDAR DAY + ACTIVE SUBSCRIPTION) ──
exports.checkIn = async (req, res) => {
  try {
    const { memberId, gymId, method = 'qr_code' } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const attendanceCollection = db.collection('attendance');

    const todayStr = getLocalDateStr(new Date());

    // 1. Verify Member Subscription / Expiry
    const membersCollection = db.collection('members');
    let member = await membersCollection.findOne({
      $or: [{ userId: String(memberId) }, { id: String(memberId) }, { _id: String(memberId) }],
    });

    if (member && member.expiryDate) {
      const expiry = new Date(member.expiryDate);
      if (expiry < new Date()) {
        return res.status(403).json({
          success: false,
          isExpired: true,
          message: 'Membership has expired. Please renew your subscription to check in.',
        });
      }
    }

    // 2. Check if there is already an active open session
    const existingOpen = await attendanceCollection.findOne({
      memberId: String(memberId),
      date: todayStr,
      checkOutTime: null,
    });

    if (existingOpen) {
      const diffMs = Date.now() - new Date(existingOpen.checkInTime).getTime();
      const elapsedMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return res.status(200).json({
        success: true,
        message: 'You are already checked in for today!',
        isAlreadyCheckedIn: true,
        data: {
          id: existingOpen._id,
          checkInTime: existingOpen.checkInTime,
          elapsedMinutes: elapsedMins,
          date: todayStr,
        },
      });
    }

    // 4. Create new attendance check-in record for today
    const now = new Date();
    const hours = now.getHours();
    let sessionType = 'NIGHT';
    if (hours >= 5 && hours < 12) sessionType = 'MORNING';
    else if (hours >= 12 && hours < 17) sessionType = 'AFTERNOON';
    else if (hours >= 17 && hours < 21) sessionType = 'EVENING';

    const newRecord = {
      memberId: String(memberId),
      gymId: String(gymId || '65123456789abcdef0123456'),
      date: todayStr,
      visitDate: todayStr,
      sessionType,
      checkInTime: now,
      checkOutTime: null,
      durationMinutes: 0,
      method,
      status: 'CHECKED_IN',
      createdAt: now,
      updatedAt: now,
    };

    const result = await attendanceCollection.insertOne(newRecord);

    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return res.status(201).json({
      success: true,
      message: `Checked in successfully for ${sessionType} session at ${timeFormatted}! Welcome to the gym! 🏋️`,
      data: {
        id: result.insertedId,
        date: todayStr,
        visitDate: todayStr,
        sessionType,
        checkInTime: now,
        checkInFormatted: timeFormatted,
        status: 'in_gym',
      },
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-in', error: error.message });
  }
};

// ── CHECK-OUT ATTENDANCE & DURATION CALCULATION ───────────
exports.checkOut = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const attendanceCollection = db.collection('attendance');

    const todayStr = getLocalDateStr(new Date());

    // Find today's open session or most recent open session
    let openSession = await attendanceCollection.findOne({
      memberId: String(memberId),
      $or: [{ date: todayStr }, { visitDate: todayStr }],
      checkOutTime: null,
    });

    if (!openSession) {
      // Fallback: search most recent open session within last 24 hours
      openSession = await attendanceCollection.findOne({
        memberId: String(memberId),
        checkOutTime: null,
      });
    }

    if (!openSession) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found. Please scan/tap to check-in first.',
      });
    }

    const now = new Date();
    const checkInDate = new Date(openSession.checkInTime);
    const diffMs = now.getTime() - checkInDate.getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durationFormatted = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
    const caloriesBurned = Math.round(durationMinutes * 6.2);

    await attendanceCollection.updateOne(
      { _id: openSession._id },
      {
        $set: {
          checkOutTime: now,
          durationMinutes,
          durationMins: durationMinutes,
          caloriesBurned,
          status: 'CHECKED_OUT',
          updatedAt: now,
        },
      }
    );

    const checkOutFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return res.status(200).json({
      success: true,
      message: `Checked out successfully! You spent ${durationFormatted} in the gym today. 🔥 ${caloriesBurned} kcal burned!`,
      data: {
        id: openSession._id,
        date: openSession.date,
        checkInTime: openSession.checkInTime,
        checkOutTime: now,
        checkOutFormatted,
        durationMinutes,
        durationFormatted,
        caloriesBurned,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-out', error: error.message });
  }
};

// ── GET ATTENDANCE HISTORY & TIME SPENT ANALYTICS ─────────
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { memberId } = req.query;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const attendanceCollection = db.collection('attendance');

    let records = await attendanceCollection
      .find({ memberId: String(memberId) })
      .sort({ checkInTime: -1 })
      .toArray();

    // If zero records in DB for this member, seed realistic recent timeline history
    if (records.length === 0) {
      const now = new Date();
      const initialLogs = [];

      const pastDaysOffsets = [0, 1, 2, 3, 5, 6, 7, 8, 10, 12, 13, 14];
      const durations = [95, 80, 110, 75, 105, 85, 90, 120, 65, 95, 85, 100];

      for (let i = 0; i < pastDaysOffsets.length; i++) {
        const offset = pastDaysOffsets[i];
        const d = new Date(now);
        d.setDate(d.getDate() - offset);
        const dateStr = d.toISOString().split('T')[0];

        const inTime = new Date(d);
        inTime.setHours(6, 30 + (i % 20), 0, 0);

        const dur = durations[i];
        const outTime = new Date(inTime.getTime() + dur * 60 * 1000);

        initialLogs.push({
          memberId: String(memberId),
          gymId: '65123456789abcdef0123456',
          date: dateStr,
          checkInTime: inTime,
          checkOutTime: outTime,
          durationMinutes: dur,
          caloriesBurned: Math.round(dur * 6.2),
          method: 'qr_code',
          status: 'completed',
          createdAt: inTime,
          updatedAt: outTime,
        });
      }

      await attendanceCollection.insertMany(initialLogs);
      records = await attendanceCollection
        .find({ memberId: String(memberId) })
        .sort({ checkInTime: -1 })
        .toArray();
    }

    function getLocalDateStr(d = new Date()) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const todayStr = getLocalDateStr(new Date());

    let totalMinutes = 0;
    let completedSessionsCount = 0;
    let thisMonthCount = 0;
    let todayCompletedSeconds = 0;
    let activeTodayRecord = null;
    let todaySessionsCount = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const formattedRecords = records.map((rec) => {
      const inDate = new Date(rec.checkInTime);
      const outDate = rec.checkOutTime ? new Date(rec.checkOutTime) : null;

      const dateObj = new Date(rec.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const inFormatted = inDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      let outFormatted = 'Active In Gym';
      let durationMins = rec.durationMinutes || 0;
      let durationFormatted = 'In Progress';
      let isLiveActive = false;

      if (outDate) {
        outFormatted = outDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const hrs = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        totalMinutes += durationMins;
        completedSessionsCount++;

        if (rec.date === todayStr) {
          const diffSec = Math.max(0, Math.floor((outDate.getTime() - inDate.getTime()) / 1000));
          todayCompletedSeconds += diffSec;
          todaySessionsCount++;
        }
      } else {
        isLiveActive = true;
        const diffMs = Date.now() - inDate.getTime();
        const activeMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
        const hrs = Math.floor(activeMins / 60);
        const mins = activeMins % 60;
        durationFormatted = hrs > 0 ? `${hrs}h ${mins}m (Live)` : `${mins}m (Live)`;

        if (rec.date === todayStr) {
          activeTodayRecord = rec;
          todaySessionsCount++;
        }
      }

      if (inDate.getMonth() === currentMonth && inDate.getFullYear() === currentYear) {
        thisMonthCount++;
      }

      return {
        id: rec._id,
        date: rec.date,
        formattedDate,
        checkInTime: rec.checkInTime,
        checkOutTime: rec.checkOutTime,
        checkInFormatted: inFormatted,
        checkOutFormatted: outFormatted,
        durationMinutes: durationMins,
        durationFormatted,
        caloriesBurned: rec.caloriesBurned || Math.round(durationMins * 6.2),
        status: isLiveActive ? 'in_gym' : 'completed',
        method: rec.method || 'qr_code',
      };
    });

    let currentSessionSeconds = 0;
    if (activeTodayRecord) {
      currentSessionSeconds = Math.max(0, Math.floor((Date.now() - new Date(activeTodayRecord.checkInTime).getTime()) / 1000));
    }

    const todayTotalSeconds = todayCompletedSeconds + currentSessionSeconds;
    const todayTotalMinutes = Math.round(todayTotalSeconds / 60);
    const todayHrs = Math.floor(todayTotalMinutes / 60);
    const todayMins = todayTotalMinutes % 60;
    const todayDurationFormatted = todayHrs > 0 ? `${todayHrs}h ${todayMins}m` : `${todayMins}m`;

    const todaySession = {
      isCheckedIn: !!activeTodayRecord,
      isCheckedOut: !activeTodayRecord && todaySessionsCount > 0,
      todayTotalSeconds,
      todayCompletedSeconds,
      currentSessionSeconds,
      todayTotalMinutes,
      todayDurationFormatted,
      todaySessionsCount,
      activeCheckInTime: activeTodayRecord?.checkInTime || null,
    };

    // ── Calculate Live Week Overview (Monday to Sunday) ──
    const nowRef = new Date();
    const currentDay = nowRef.getDay();
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    const mondayDate = new Date(nowRef);
    mondayDate.setDate(nowRef.getDate() - distanceToMon);
    mondayDate.setHours(0, 0, 0, 0);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekDaysMap = {};
    daysOfWeek.forEach((day, idx) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      const dateStr = getLocalDateStr(d);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;

      weekDaysMap[dateStr] = {
        day,
        date: dateStr,
        attended: false,
        done: false,
        checkInCount: 0,
        durationMinutes: 0,
        isToday,
        isPast,
        isFuture,
      };
    });

    let weeklyTotalMinutes = 0;
    let weeklyCaloriesBurned = 0;

    records.forEach((rec) => {
      if (weekDaysMap[rec.date]) {
        weekDaysMap[rec.date].attended = true;
        weekDaysMap[rec.date].done = true;
        weekDaysMap[rec.date].checkInCount += 1;
        const mins = rec.durationMinutes || 0;
        weekDaysMap[rec.date].durationMinutes += mins;
        weeklyTotalMinutes += mins;
        weeklyCaloriesBurned += (rec.caloriesBurned || Math.round(mins * 6.2));
      }
    });

    // Add active ongoing live minutes if in gym right now
    if (activeTodayRecord && weekDaysMap[todayStr]) {
      const liveMins = Math.max(1, Math.round((Date.now() - new Date(activeTodayRecord.checkInTime).getTime()) / (1000 * 60)));
      weekDaysMap[todayStr].durationMinutes += liveMins;
      weeklyTotalMinutes += liveMins;
      weeklyCaloriesBurned += Math.round(liveMins * 6.2);
    }

    const weeklyDaysList = Object.values(weekDaysMap);
    const daysAttended = weeklyDaysList.filter((d) => d.attended).length;
    const weekHours = (weeklyTotalMinutes / 60).toFixed(1);

    const weekOverview = {
      daysAttended,
      targetDays: 6,
      weeklyTotalMinutes,
      weeklyTrainedHours: weekHours,
      weeklyTimeFormatted: `${weekHours} hrs`,
      weeklyCaloriesBurned: Math.round(weeklyCaloriesBurned || weeklyTotalMinutes * 6.2),
      days: weeklyDaysList,
    };

    const totalHoursSpent = (totalMinutes / 60).toFixed(1);
    const avgMinutes = completedSessionsCount > 0 ? Math.round(totalMinutes / completedSessionsCount) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMinsRem = avgMinutes % 60;
    const avgTimeFormatted = avgHours > 0 ? `${avgHours}h ${avgMinsRem}m` : `${avgMinsRem}m`;

    return res.status(200).json({
      success: true,
      data: {
        records: formattedRecords,
        todaySession,
        weekOverview,
        totalVisits: records.length,
        thisMonthVisits: thisMonthCount,
        totalMinutesSpent: totalMinutes,
        totalHoursSpent: `${totalHoursSpent} hrs`,
        avgTimePerSession: avgTimeFormatted,
        avgMinutesPerVisit: avgMinutes,
        currentStreakDays: Math.min(records.length, 6),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

// ── GET PAYMENT HISTORY & INVOICES ───────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const { memberId } = req.query;
    const payments = await prisma.paymentRecord.findMany({
      where: {
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
  }
};

// ── DEFAULT SEED DATA FOR BODY ANALYTICS ─────────────────
const DEFAULT_CHECKPOINTS = [
  { id: 'cp_1', date: 'Today', weight: 72.4, delta: '-0.6 kg', isLoss: true, isBest: true, createdAt: new Date().toISOString() },
  { id: 'cp_2', date: '15 Dec 2025', weight: 73.0, delta: '-0.9 kg', isLoss: true, createdAt: '2025-12-15T08:00:00.000Z' },
  { id: 'cp_3', date: '01 Dec 2025', weight: 73.9, delta: '-0.9 kg', isLoss: true, createdAt: '2025-12-01T08:00:00.000Z' },
  { id: 'cp_4', date: '15 Nov 2025', weight: 74.8, delta: '-0.7 kg', isLoss: true, createdAt: '2025-11-15T08:00:00.000Z' },
  { id: 'cp_5', date: '01 Nov 2025', weight: 75.5, delta: 'Start', isLoss: false, isStart: true, createdAt: '2025-11-01T08:00:00.000Z' },
];

const DEFAULT_MEASUREMENTS = [
  { id: 'waist', part: 'Waist', value: 80, startValue: 84, unit: 'cm' },
  { id: 'chest', part: 'Chest', value: 98, startValue: 96, unit: 'cm' },
  { id: 'arms', part: 'Arms / Biceps', value: 38, startValue: 36.5, unit: 'cm' },
  { id: 'shoulders', part: 'Shoulders', value: 118, startValue: 115, unit: 'cm' },
  { id: 'thighs', part: 'Thighs', value: 56, startValue: 55, unit: 'cm' },
  { id: 'calves', part: 'Calves', value: 37, startValue: 37, unit: 'cm' },
];

const DEFAULT_PRS = [
  { id: 'bench', exercise: 'Bench Press', category: 'Big 3 Compounds', weight: 95, startWeight: 90, unit: 'kg', reps: 'Chest • 1RM' },
  { id: 'squat', exercise: 'Back Squat', category: 'Big 3 Compounds', weight: 130, startWeight: 120, unit: 'kg', reps: 'Legs • 1RM' },
  { id: 'deadlift', exercise: 'Deadlift', category: 'Big 3 Compounds', weight: 160, startWeight: 145, unit: 'kg', reps: 'Back & Core • 1RM' },
  { id: 'ohp', exercise: 'Overhead Press', category: 'Upper Body', weight: 60, startWeight: 57.5, unit: 'kg', reps: 'Shoulders • 1RM' },
  { id: 'incline', exercise: 'Incline DB Press', category: 'Upper Body', weight: 36, startWeight: 32, unit: 'kg', reps: 'Upper Chest' },
  { id: 'row', exercise: 'Barbell Row', category: 'Upper Body', weight: 85, startWeight: 80, unit: 'kg', reps: 'Lats & Back' },
  { id: 'legpress', exercise: 'Leg Press', category: 'Lower Body', weight: 260, startWeight: 240, unit: 'kg', reps: 'Quads & Glutes' },
  { id: 'curl', exercise: 'Barbell Bicep Curl', category: 'Upper Body', weight: 42, startWeight: 38, unit: 'kg', reps: 'Arms • 1RM' },
];

function calculateAnalyticsDerived(record, member) {
  const checkpoints = record.checkpoints && record.checkpoints.length > 0 ? record.checkpoints : DEFAULT_CHECKPOINTS;
  const measurements = record.measurements && record.measurements.length > 0 ? record.measurements : DEFAULT_MEASUREMENTS;
  const strengthPRs = record.strengthPRs && record.strengthPRs.length > 0 ? record.strengthPRs : DEFAULT_PRS;

  const startWeight = record.startWeight !== undefined ? Number(record.startWeight) : 75.5;
  const goalWeight = record.goalWeight !== undefined ? Number(record.goalWeight) : 68.0;
  const currentWeight = checkpoints[0]?.weight ? Number(checkpoints[0].weight) : (record.currentWeight || member?.weight || 72.4);
  const height = record.height !== undefined ? Number(record.height) : (member?.height || 178);

  const totalLost = Number((startWeight - currentWeight).toFixed(1));
  const toGo = Number(Math.max(0, currentWeight - goalWeight).toFixed(1));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((startWeight - currentWeight) / (startWeight - goalWeight || 1)) * 100)));

  // Calculate BMI
  const heightM = height / 100;
  const bmi = heightM > 0 ? Number((currentWeight / (heightM * heightM)).toFixed(1)) : 22.8;

  // Measurements Ratios
  const waistVal = measurements.find((m) => m.id === 'waist')?.value || 80;
  const shoulderVal = measurements.find((m) => m.id === 'shoulders')?.value || 118;
  const chestVal = measurements.find((m) => m.id === 'chest')?.value || 98;
  const vTaperRatio = Number((shoulderVal / (waistVal || 1)).toFixed(2));
  const chestToWaistRatio = Number((chestVal / (waistVal || 1)).toFixed(2));

  // Strength PRs Total & Lifter Rank
  const benchWeight = strengthPRs.find((p) => p.id === 'bench')?.weight || 95;
  const squatWeight = strengthPRs.find((p) => p.id === 'squat')?.weight || 130;
  const deadliftWeight = strengthPRs.find((p) => p.id === 'deadlift')?.weight || 160;
  const totalPowerScore = benchWeight + squatWeight + deadliftWeight;

  const lifterRank = totalPowerScore >= 450
    ? '🏆 Elite Lifter'
    : totalPowerScore >= 350
      ? '⚡ Advanced Lifter'
      : totalPowerScore >= 250
        ? '🔥 Intermediate Lifter'
        : '🌱 Novice Lifter';

  return {
    startWeight,
    goalWeight,
    currentWeight,
    height,
    bmi,
    summary: {
      latestWeight: currentWeight,
      startWeight,
      goalWeight,
      totalLost: totalLost > 0 ? `-${totalLost} kg` : `+${Math.abs(totalLost)} kg`,
      totalLostNum: totalLost,
      toGo: `${toGo} kg`,
      toGoNum: toGo,
      progressPercent,
    },
    ratios: {
      vTaperRatio,
      chestToWaistRatio,
    },
    powerStats: {
      totalPowerScore,
      lifterRank,
      big3: {
        bench: benchWeight,
        squat: squatWeight,
        deadlift: deadliftWeight,
      },
    },
    checkpoints,
    measurements,
    strengthPRs,
  };
}

// ── GET BODY ANALYTICS DATA (GET API) ────────────────────
exports.getBodyAnalytics = async (req, res) => {
  try {
    const memberId = req.query.memberId || req.user?.id || 'm1';
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');
    const membersCollection = db.collection('members');

    const member = await membersCollection.findOne({
      $or: [{ userId: String(memberId) }, { id: String(memberId) }, { _id: String(memberId) }],
    });

    let record = await analyticsCollection.findOne({
      $or: [{ memberId: String(memberId) }, { userId: String(memberId) }],
    });

    if (!record) {
      // Create initial seed document
      record = {
        memberId: String(memberId),
        startWeight: 75.5,
        goalWeight: 68.0,
        currentWeight: member?.weight || 72.4,
        height: member?.height || 178,
        checkpoints: DEFAULT_CHECKPOINTS,
        measurements: DEFAULT_MEASUREMENTS,
        strengthPRs: DEFAULT_PRS,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      await analyticsCollection.insertOne(record);
    }

    const calculated = calculateAnalyticsDerived(record, member);

    return res.status(200).json({
      success: true,
      message: 'Body analytics loaded successfully',
      data: {
        memberId: String(memberId),
        ...calculated,
      },
    });
  } catch (error) {
    console.error('Error fetching body analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching body analytics', error: error.message });
  }
};

// ── LOG WEIGHT CHECKPOINT (POST API) ─────────────────────
exports.logWeightCheckpoint = async (req, res) => {
  try {
    const { memberId = 'm1', weight, date = 'Today', note } = req.body;
    if (weight === undefined || weight === null || isNaN(Number(weight))) {
      return res.status(400).json({ success: false, message: 'Valid body weight is required' });
    }

    const newWeight = Number(weight);
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');
    const membersCollection = db.collection('members');

    let record = await analyticsCollection.findOne({
      $or: [{ memberId: String(memberId) }, { userId: String(memberId) }],
    });

    const checkpoints = (record && record.checkpoints && record.checkpoints.length > 0)
      ? [...record.checkpoints]
      : [...DEFAULT_CHECKPOINTS];

    const prevWeight = checkpoints[0]?.weight || 72.4;
    const diff = Number((newWeight - prevWeight).toFixed(1));
    const isLoss = newWeight <= prevWeight;

    const newCheckpoint = {
      id: `cp_${Date.now()}`,
      date: date || 'Today',
      weight: newWeight,
      delta: diff <= 0 ? `-${Math.abs(diff)} kg` : `+${diff} kg`,
      isLoss,
      isBest: isLoss,
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    const updatedCheckpoints = [newCheckpoint, ...checkpoints];

    const updatedRecord = await analyticsCollection.findOneAndUpdate(
      { $or: [{ memberId: String(memberId) }, { userId: String(memberId) }] },
      {
        $set: {
          currentWeight: newWeight,
          checkpoints: updatedCheckpoints,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          startWeight: 75.5,
          goalWeight: 68.0,
          measurements: DEFAULT_MEASUREMENTS,
          strengthPRs: DEFAULT_PRS,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Also update member collection current weight & BMI
    const memberDoc = await membersCollection.findOne({
      $or: [{ userId: String(memberId) }, { id: String(memberId) }, { _id: String(memberId) }],
    });
    const heightM = ((memberDoc?.height || 178) / 100);
    const newBmi = Number((newWeight / (heightM * heightM)).toFixed(1));

    await membersCollection.updateOne(
      { $or: [{ userId: String(memberId) }, { id: String(memberId) }, { _id: String(memberId) }] },
      { $set: { weight: newWeight, bmi: newBmi, updatedAt: new Date() } }
    );

    const doc = updatedRecord.value || updatedRecord;
    const calculated = calculateAnalyticsDerived(doc || { checkpoints: updatedCheckpoints, currentWeight: newWeight }, memberDoc);

    return res.status(201).json({
      success: true,
      message: `Logged ${newWeight} kg successfully!`,
      data: {
        newCheckpoint,
        ...calculated,
      },
    });
  } catch (error) {
    console.error('Error logging weight checkpoint:', error);
    return res.status(500).json({ success: false, message: 'Error logging weight', error: error.message });
  }
};

// ── SAVE BODY MEASUREMENTS (POST API) ────────────────────
exports.saveMeasurements = async (req, res) => {
  try {
    const { memberId = 'm1', measurements, waist, chest, arms, shoulders, thighs, calves, unit = 'cm' } = req.body;
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');

    let newMeasurements = [];
    if (Array.isArray(measurements) && measurements.length > 0) {
      newMeasurements = measurements.map((m) => ({
        ...m,
        value: Number(m.value) || 0,
        startValue: Number(m.startValue) || Number(m.value) || 0,
        unit: m.unit || unit,
      }));
    } else {
      // Build from individual fields
      newMeasurements = [
        { id: 'waist', part: 'Waist', value: parseFloat(waist) || 80, startValue: 84, unit },
        { id: 'chest', part: 'Chest', value: parseFloat(chest) || 98, startValue: 96, unit },
        { id: 'arms', part: 'Arms / Biceps', value: parseFloat(arms) || 38, startValue: 36.5, unit },
        { id: 'shoulders', part: 'Shoulders', value: parseFloat(shoulders) || 118, startValue: 115, unit },
        { id: 'thighs', part: 'Thighs', value: parseFloat(thighs) || 56, startValue: 55, unit },
        { id: 'calves', part: 'Calves', value: parseFloat(calves) || 37, startValue: 37, unit },
      ];
    }

    const updatedRecord = await analyticsCollection.findOneAndUpdate(
      { $or: [{ memberId: String(memberId) }, { userId: String(memberId) }] },
      {
        $set: {
          measurements: newMeasurements,
          measurementUnit: unit,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          startWeight: 75.5,
          goalWeight: 68.0,
          currentWeight: 72.4,
          checkpoints: DEFAULT_CHECKPOINTS,
          strengthPRs: DEFAULT_PRS,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = updatedRecord.value || updatedRecord;
    const calculated = calculateAnalyticsDerived(doc || { measurements: newMeasurements });

    return res.status(200).json({
      success: true,
      message: 'Body measurements updated successfully!',
      data: {
        measurements: newMeasurements,
        ratios: calculated.ratios,
      },
    });
  } catch (error) {
    console.error('Error saving measurements:', error);
    return res.status(500).json({ success: false, message: 'Error saving measurements', error: error.message });
  }
};

// ── SAVE STRENGTH PRS & PERSONAL BESTS (POST API) ─────────
exports.saveStrengthPRs = async (req, res) => {
  try {
    const {
      memberId = 'm1',
      strengthPRs,
      bench,
      squat,
      deadlift,
      ohp,
      incline,
      row,
      legpress,
      curl,
    } = req.body;

    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');

    let newPRs = [];
    if (Array.isArray(strengthPRs) && strengthPRs.length > 0) {
      newPRs = strengthPRs.map((p) => ({
        ...p,
        weight: Number(p.weight) || 0,
        startWeight: Number(p.startWeight) || Number(p.weight) || 0,
      }));
    } else {
      newPRs = [
        { id: 'bench', exercise: 'Bench Press', category: 'Big 3 Compounds', weight: parseFloat(bench) || 95, startWeight: 90, unit: 'kg', reps: 'Chest • 1RM' },
        { id: 'squat', exercise: 'Back Squat', category: 'Big 3 Compounds', weight: parseFloat(squat) || 130, startWeight: 120, unit: 'kg', reps: 'Legs • 1RM' },
        { id: 'deadlift', exercise: 'Deadlift', category: 'Big 3 Compounds', weight: parseFloat(deadlift) || 160, startWeight: 145, unit: 'kg', reps: 'Back & Core • 1RM' },
        { id: 'ohp', exercise: 'Overhead Press', category: 'Upper Body', weight: parseFloat(ohp) || 60, startWeight: 57.5, unit: 'kg', reps: 'Shoulders • 1RM' },
        { id: 'incline', exercise: 'Incline DB Press', category: 'Upper Body', weight: parseFloat(incline) || 36, startWeight: 32, unit: 'kg', reps: 'Upper Chest' },
        { id: 'row', exercise: 'Barbell Row', category: 'Upper Body', weight: parseFloat(row) || 85, startWeight: 80, unit: 'kg', reps: 'Lats & Back' },
        { id: 'legpress', exercise: 'Leg Press', category: 'Lower Body', weight: parseFloat(legpress) || 260, startWeight: 240, unit: 'kg', reps: 'Quads & Glutes' },
        { id: 'curl', exercise: 'Barbell Bicep Curl', category: 'Upper Body', weight: parseFloat(curl) || 42, startWeight: 38, unit: 'kg', reps: 'Arms • 1RM' },
      ];
    }

    const updatedRecord = await analyticsCollection.findOneAndUpdate(
      { $or: [{ memberId: String(memberId) }, { userId: String(memberId) }] },
      {
        $set: {
          strengthPRs: newPRs,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          startWeight: 75.5,
          goalWeight: 68.0,
          currentWeight: 72.4,
          checkpoints: DEFAULT_CHECKPOINTS,
          measurements: DEFAULT_MEASUREMENTS,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = updatedRecord.value || updatedRecord;
    const calculated = calculateAnalyticsDerived(doc || { strengthPRs: newPRs });

    return res.status(200).json({
      success: true,
      message: 'Strength PRs updated successfully!',
      data: {
        strengthPRs: newPRs,
        powerStats: calculated.powerStats,
      },
    });
  } catch (error) {
    console.error('Error saving strength PRs:', error);
    return res.status(500).json({ success: false, message: 'Error saving strength PRs', error: error.message });
  }
};

// ── SAVE BODY GOALS (POST API) ───────────────────────────
exports.saveBodyGoals = async (req, res) => {
  try {
    const { memberId = 'm1', goalWeight, startWeight, height } = req.body;
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');

    const updateFields = { updatedAt: new Date() };
    if (goalWeight !== undefined) updateFields.goalWeight = Number(goalWeight);
    if (startWeight !== undefined) updateFields.startWeight = Number(startWeight);
    if (height !== undefined) updateFields.height = Number(height);

    const updatedRecord = await analyticsCollection.findOneAndUpdate(
      { $or: [{ memberId: String(memberId) }, { userId: String(memberId) }] },
      {
        $set: updateFields,
        $setOnInsert: {
          currentWeight: 72.4,
          checkpoints: DEFAULT_CHECKPOINTS,
          measurements: DEFAULT_MEASUREMENTS,
          strengthPRs: DEFAULT_PRS,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = updatedRecord.value || updatedRecord;
    const calculated = calculateAnalyticsDerived(doc || updateFields);

    return res.status(200).json({
      success: true,
      message: 'Body goals updated successfully!',
      data: calculated,
    });
  } catch (error) {
    console.error('Error saving body goals:', error);
    return res.status(500).json({ success: false, message: 'Error saving goals', error: error.message });
  }
};

// ── UNIFIED BODY ANALYTICS SAVE (POST API) ───────────────
exports.saveBodyAnalytics = async (req, res) => {
  try {
    const { memberId = 'm1', startWeight, goalWeight, height, currentWeight, checkpoints, measurements, strengthPRs } = req.body;
    const { getDb } = require('../config/mongoClient');
    const db = await getDb();
    const analyticsCollection = db.collection('body_analytics');

    const updateSet = { updatedAt: new Date() };
    if (startWeight !== undefined) updateSet.startWeight = Number(startWeight);
    if (goalWeight !== undefined) updateSet.goalWeight = Number(goalWeight);
    if (height !== undefined) updateSet.height = Number(height);
    if (currentWeight !== undefined) updateSet.currentWeight = Number(currentWeight);
    if (checkpoints !== undefined) updateSet.checkpoints = checkpoints;
    if (measurements !== undefined) updateSet.measurements = measurements;
    if (strengthPRs !== undefined) updateSet.strengthPRs = strengthPRs;

    const updatedRecord = await analyticsCollection.findOneAndUpdate(
      { $or: [{ memberId: String(memberId) }, { userId: String(memberId) }] },
      {
        $set: updateSet,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = updatedRecord.value || updatedRecord;
    const calculated = calculateAnalyticsDerived(doc || updateSet);

    return res.status(200).json({
      success: true,
      message: 'Body analytics saved successfully!',
      data: calculated,
    });
  } catch (error) {
    console.error('Error saving body analytics:', error);
    return res.status(500).json({ success: false, message: 'Error saving body analytics', error: error.message });
  }
};


