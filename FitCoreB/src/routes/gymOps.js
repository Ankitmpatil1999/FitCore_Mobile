const express = require('express');
const router = express.Router();
const attendance = require('../controllers/attendanceController');
const ops = require('../controllers/gymOpsController');

/**
 * @swagger
 * tags:
 *   name: Gym Ops
 *   description: Gym operations — attendance, holidays, expenses, notices, and settings
 */

// ── ATTENDANCE ────────────────────────────────────────────

/**
 * @swagger
 * /api/gym-admin/attendance/check-in:
 *   post:
 *     summary: Record a member check-in at the gym
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *               gymId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [qr, manual, biometric]
 *                 example: qr
 *     responses:
 *       200:
 *         description: Check-in recorded
 */
router.post('/attendance/check-in', attendance.checkIn);

/**
 * @swagger
 * /api/gym-admin/attendance/check-out:
 *   post:
 *     summary: Record a member check-out from the gym
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *               gymId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out recorded
 */
router.post('/attendance/check-out', attendance.checkOut);

/**
 * @swagger
 * /api/gym-admin/attendance/today:
 *   get:
 *     summary: Get today's attendance log for the gym
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/attendance/today', attendance.getTodayAttendance);
router.get('/attendance/timeline', attendance.getMemberDailyTimeline);

/**
 * @swagger
 * /api/gym-admin/attendance/report:
 *   get:
 *     summary: Get monthly attendance report
 *     tags: [Gym Ops]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         example: "2026-08"
 *     responses:
 *       200:
 *         description: Monthly report
 */
router.get('/attendance/report', attendance.getMonthlyReport);

/**
 * @swagger
 * /api/gym-admin/attendance/stats:
 *   get:
 *     summary: Get attendance statistics (peak hours, avg visits)
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/attendance/stats', attendance.getAttendanceStats);

// ── HOLIDAYS ──────────────────────────────────────────────

/**
 * @swagger
 * /api/gym-admin/holidays:
 *   get:
 *     summary: Get all holidays and weekly off schedule
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/holidays', ops.getHolidays);

/**
 * @swagger
 * /api/gym-admin/holidays:
 *   post:
 *     summary: Add a new holiday to the gym calendar
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - name
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2026-10-02"
 *               name:
 *                 type: string
 *                 example: Gandhi Jayanti
 *     responses:
 *       201:
 *         description: Holiday added
 */
router.post('/holidays', ops.addHoliday);

/**
 * @swagger
 * /api/gym-admin/holidays/{id}:
 *   delete:
 *     summary: Remove a holiday from the calendar
 *     tags: [Gym Ops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Holiday deleted
 */
router.delete('/holidays/:id', ops.deleteHoliday);

/**
 * @swagger
 * /api/gym-admin/holidays/weekly-off:
 *   post:
 *     summary: Set the weekly off day(s) for the gym
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - days
 *             properties:
 *               days:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Sunday"]
 *     responses:
 *       200:
 *         description: Weekly off days updated
 */
router.post('/holidays/weekly-off', ops.setWeeklyOff);

// ── EXPENSES ──────────────────────────────────────────────

/**
 * @swagger
 * /api/gym-admin/expenses:
 *   get:
 *     summary: Get all recorded gym expenses
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/expenses', ops.getExpenses);

/**
 * @swagger
 * /api/gym-admin/expenses:
 *   post:
 *     summary: Record a new gym expense
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Equipment Repair
 *               amount:
 *                 type: number
 *                 example: 3500
 *               category:
 *                 type: string
 *                 enum: [rent, salary, equipment, utilities, marketing, other]
 *               date:
 *                 type: string
 *                 example: "2026-08-30"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense recorded
 */
router.post('/expenses', ops.addExpense);

/**
 * @swagger
 * /api/gym-admin/expenses/{id}:
 *   delete:
 *     summary: Delete an expense record
 *     tags: [Gym Ops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/expenses/:id', ops.deleteExpense);

// ── NOTICES ───────────────────────────────────────────────

/**
 * @swagger
 * /api/gym-admin/notices:
 *   get:
 *     summary: Get all gym notice board announcements
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/notices', ops.getNotices);

/**
 * @swagger
 * /api/gym-admin/notices:
 *   post:
 *     summary: Post a new notice to the gym notice board
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: Gym Maintenance Shutdown
 *               message:
 *                 type: string
 *                 example: "The gym will be closed on Sep 5 for annual maintenance."
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       201:
 *         description: Notice posted
 */
router.post('/notices', ops.addNotice);

/**
 * @swagger
 * /api/gym-admin/notices/{id}:
 *   delete:
 *     summary: Remove a notice from the board
 *     tags: [Gym Ops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notice deleted
 */
router.delete('/notices/:id', ops.deleteNotice);

// ── GYM SETTINGS ──────────────────────────────────────────

/**
 * @swagger
 * /api/gym-admin/settings:
 *   get:
 *     summary: Get gym configuration and settings
 *     tags: [Gym Ops]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/settings', ops.getGymSettings);

/**
 * @swagger
 * /api/gym-admin/settings:
 *   post:
 *     summary: Update gym settings (name, hours, contact, etc.)
 *     tags: [Gym Ops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gymName:
 *                 type: string
 *               openingTime:
 *                 type: string
 *                 example: "06:00"
 *               closingTime:
 *                 type: string
 *                 example: "22:00"
 *               maxCapacity:
 *                 type: integer
 *                 example: 150
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.post('/settings', ops.updateGymSettings);

// ── CLASSES & BATCHES ─────────────────────────────────────
router.get('/classes', ops.getClasses);
router.post('/classes', ops.addClass);
router.delete('/classes/:id', ops.deleteClass);

module.exports = router;
