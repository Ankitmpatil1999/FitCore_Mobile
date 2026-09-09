const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user (Member or Vendor)
 *     description: >
 *       Public endpoint — no token required.
 *       Note: super_admin and admin roles cannot be self-registered.
 *       Minimum password length is 8 characters.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Arjun Mehta
 *               phone:
 *                 type: string
 *                 example: "9209282289"
 *               email:
 *                 type: string
 *                 example: arjun@gmail.com
 *               password:
 *                 type: string
 *                 example: "StrongPass@123"
 *               role:
 *                 type: string
 *                 enum: [member, vendor, gym_owner]
 *                 example: member
 *               gymName:
 *                 type: string
 *                 example: FitCore Elite Gym
 *               storeName:
 *                 type: string
 *                 example: MuscleZone Nutrition
 *               category:
 *                 type: string
 *                 example: supplement_store
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error or phone already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Attempted to self-register as super_admin or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Mobile App Login (member, vendor, gym_owner)
 *     description: >
 *       Public endpoint — no token required.
 *       For the web admin portal use /api/auth/web-login instead.
 *       Rate limited to 10 attempts per 15 minutes.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 10-digit mobile number or email address
 *                 example: "9209282289"
 *               password:
 *                 type: string
 *                 example: "StrongPass@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded — too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/web-login:
 *   post:
 *     summary: Web Portal Login — only super_admin and admin roles permitted
 *     description: >
 *       Dedicated login endpoint for the FitCore web admin portal.
 *       Only super_admin and admin roles are permitted.
 *       Members, vendors, and gym owners will receive a 403 Access Denied.
 *       Rate limited to 10 attempts per 15 minutes.
 *       Admin session token expires in 8 hours (shorter than mobile 7-day tokens).
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Mobile number or email address
 *                 example: "8530292487"
 *               password:
 *                 type: string
 *                 example: "AdminPass@123"
 *     responses:
 *       200:
 *         description: Login successful — returns 8-hour JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid Mobile Number or Password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access Denied — role not permitted on web portal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/web-login', authController.webLogin);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request OTP for password reset
 *     description: >
 *       Generates a cryptographically random 6-digit OTP stored in DB with 10-minute expiry.
 *       OTP is NOT returned in the API response (sent via SMS in production; printed to server console in development).
 *       Always returns success even if phone not found — prevents user enumeration.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9209282289"
 *     responses:
 *       200:
 *         description: OTP sent (always returns success to prevent user enumeration)
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Verify OTP and reset account password
 *     description: >
 *       Verifies the 6-digit OTP from the database (one-time use, 10-minute expiry).
 *       OTP is deleted after successful use. Minimum 8 character password required.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9209282289"
 *               otp:
 *                 type: string
 *                 example: "847291"
 *               password:
 *                 type: string
 *                 example: "NewStrongPass@123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-password', authController.resetPassword);
router.get('/verify-activation', authController.verifyActivationToken);
router.post('/send-activation-otp', authController.sendActivationOtp);
router.post('/complete-activation', authController.completeActivation);

module.exports = router;
