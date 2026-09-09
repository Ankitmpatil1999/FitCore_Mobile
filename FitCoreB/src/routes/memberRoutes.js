const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Member self-service — profile, workouts, diet, attendance, body analytics, and payments
 */

/**
 * @swagger
 * /api/members/me:
 *   get:
 *     summary: Get the logged-in member's full profile
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         example: "9209282289"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member profile returned
 */
router.get('/me', memberController.getMemberProfile);

/**
 * @swagger
 * /api/members/personal-details:
 *   post:
 *     summary: Save or update member personal details and fitness experience
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               height:
 *                 type: number
 *                 example: 175
 *               weight:
 *                 type: number
 *                 example: 72
 *               age:
 *                 type: integer
 *                 example: 26
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               goal:
 *                 type: string
 *                 example: muscle_gain
 *               fitnessLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Personal details saved
 */
router.post('/personal-details', memberController.savePersonalDetails);
router.post('/experience', memberController.savePersonalDetails);

/**
 * @swagger
 * /api/members/qr-pass:
 *   get:
 *     summary: Get member's dynamic QR pass for gym entry
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         example: "9209282289"
 *     responses:
 *       200:
 *         description: QR pass data returned
 */
router.get('/qr-pass', memberController.getQRPass);

/**
 * @swagger
 * /api/members/classes:
 *   get:
 *     summary: Get all available gym classes and sessions
 *     tags: [Members]
 *     responses:
 *       200:
 *         description: Classes list returned
 */
router.get('/classes', memberController.getClasses);

/**
 * @swagger
 * /api/members/classes/{classId}/book:
 *   post:
 *     summary: Book a spot in a gym class
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Class booked successfully
 */
router.post('/classes/:classId/book', memberController.bookClass);

/**
 * @swagger
 * /api/members/workout:
 *   get:
 *     summary: Get member's assigned workout plan
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout plan returned
 */
router.get('/workout', memberController.getWorkoutPlan);

/**
 * @swagger
 * /api/members/workout/assign:
 *   post:
 *     summary: Assign a workout plan to a member (trainer or admin use)
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - plan
 *             properties:
 *               memberId:
 *                 type: string
 *               plan:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workout plan assigned
 */
router.post('/workout/assign', memberController.assignWorkoutPlan);

/**
 * @swagger
 * /api/members/workout/log:
 *   post:
 *     summary: Log a completed workout session
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - exercises
 *             properties:
 *               memberId:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exerciseId:
 *                       type: string
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *                     weight:
 *                       type: number
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workout logged
 */
router.post('/workout/log', memberController.logWorkout);

/**
 * @swagger
 * /api/members/diet:
 *   get:
 *     summary: Get member's assigned diet and nutrition plan
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Diet plan returned
 */
router.get('/diet', memberController.getDietPlan);

/**
 * @swagger
 * /api/members/attendance/check-in:
 *   post:
 *     summary: Member self check-in via QR scan
 *     tags: [Members]
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
 *         description: Check-in recorded
 */
router.post('/attendance/check-in', memberController.checkIn);

/**
 * @swagger
 * /api/members/attendance/check-out:
 *   post:
 *     summary: Member self check-out
 *     tags: [Members]
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
 *     responses:
 *       200:
 *         description: Check-out recorded
 */
router.post('/attendance/check-out', memberController.checkOut);

/**
 * @swagger
 * /api/members/attendance/history:
 *   get:
 *     summary: Get member's attendance history
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance history returned
 */
router.get('/attendance/history', memberController.getAttendanceHistory);

/**
 * @swagger
 * /api/members/body-analytics:
 *   get:
 *     summary: Get member's body analytics (weight, measurements, PRs, goals)
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Body analytics returned
 */
router.get('/body-analytics', memberController.getBodyAnalytics);

/**
 * @swagger
 * /api/members/body-analytics:
 *   post:
 *     summary: Save general body analytics data
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Body analytics saved
 */
router.post('/body-analytics', memberController.saveBodyAnalytics);

/**
 * @swagger
 * /api/members/body-analytics/weight:
 *   post:
 *     summary: Log a weight checkpoint entry
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - weight
 *             properties:
 *               memberId:
 *                 type: string
 *               weight:
 *                 type: number
 *                 example: 72.5
 *               date:
 *                 type: string
 *                 example: "2026-08-30"
 *     responses:
 *       200:
 *         description: Weight checkpoint logged
 */
router.post('/body-analytics/weight', memberController.logWeightCheckpoint);

/**
 * @swagger
 * /api/members/body-analytics/measurements:
 *   post:
 *     summary: Save body tape measurements (chest, waist, arms, etc.)
 *     tags: [Members]
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
 *               chest:
 *                 type: number
 *               waist:
 *                 type: number
 *               hips:
 *                 type: number
 *               arms:
 *                 type: number
 *               thighs:
 *                 type: number
 *     responses:
 *       200:
 *         description: Measurements saved
 */
router.post('/body-analytics/measurements', memberController.saveMeasurements);

/**
 * @swagger
 * /api/members/body-analytics/prs:
 *   post:
 *     summary: Save strength personal records (bench press, squat, deadlift, etc.)
 *     tags: [Members]
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
 *               benchPress:
 *                 type: number
 *                 example: 80
 *               squat:
 *                 type: number
 *                 example: 100
 *               deadlift:
 *                 type: number
 *                 example: 120
 *               overheadPress:
 *                 type: number
 *                 example: 60
 *     responses:
 *       200:
 *         description: Strength PRs saved
 */
router.post('/body-analytics/prs', memberController.saveStrengthPRs);

/**
 * @swagger
 * /api/members/body-analytics/goals:
 *   post:
 *     summary: Set member's fitness goals (target weight, body fat, etc.)
 *     tags: [Members]
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
 *               targetWeight:
 *                 type: number
 *                 example: 68
 *               targetBodyFat:
 *                 type: number
 *                 example: 12
 *               targetDate:
 *                 type: string
 *                 example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Goals saved
 */
router.post('/body-analytics/goals', memberController.saveBodyGoals);

/**
 * @swagger
 * /api/members/payments:
 *   get:
 *     summary: Get member's payment and invoice history
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment history returned
 */
router.get('/payments', memberController.getPaymentHistory);

module.exports = router;
