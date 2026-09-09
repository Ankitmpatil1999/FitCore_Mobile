const express = require('express');
const router = express.Router();
const gymAdminController = require('../controllers/gymAdminController');

/**
 * @swagger
 * tags:
 *   name: Gym Admin
 *   description: Gym franchise admin dashboard — manage trainers, members, packages and KYC
 */

/**
 * @swagger
 * /api/gym-admin/overview:
 *   get:
 *     summary: Get gym dashboard overview stats (members, revenue, attendance)
 *     tags: [Gym Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/overview', gymAdminController.getOverview);

/**
 * @swagger
 * /api/gym-admin/trainers:
 *   get:
 *     summary: Get all trainers registered under the gym
 *     tags: [Gym Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/trainers', gymAdminController.getTrainers);

/**
 * @swagger
 * /api/gym-admin/trainers:
 *   post:
 *     summary: Add a new trainer to the gym
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Patil
 *               phone:
 *                 type: string
 *                 example: "9820000001"
 *               specialization:
 *                 type: string
 *                 example: Strength & Conditioning
 *               salary:
 *                 type: number
 *                 example: 25000
 *     responses:
 *       201:
 *         description: Trainer added successfully
 */
router.post('/trainers', gymAdminController.createTrainer);

/**
 * @swagger
 * /api/gym-admin/trainers/{id}:
 *   put:
 *     summary: Update trainer details
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Trainer updated
 */
router.put('/trainers/:id', gymAdminController.updateTrainer);

/**
 * @swagger
 * /api/gym-admin/trainers/{id}:
 *   delete:
 *     summary: Remove a trainer from the gym
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer deleted
 */
router.delete('/trainers/:id', gymAdminController.deleteTrainer);

/**
 * @swagger
 * /api/gym-admin/trainers/assign:
 *   post:
 *     summary: Assign a trainer to a member
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainerId
 *               - memberId
 *             properties:
 *               trainerId:
 *                 type: string
 *               memberId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trainer assigned
 */
router.post('/trainers/assign', gymAdminController.assignTrainer);

/**
 * @swagger
 * /api/gym-admin/members:
 *   get:
 *     summary: Get all members registered at the gym
 *     tags: [Gym Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/members', gymAdminController.getMembers);

/**
 * @swagger
 * /api/gym-admin/members:
 *   post:
 *     summary: Register a new member at the gym
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Priya Desai
 *               phone:
 *                 type: string
 *                 example: "9870000002"
 *               email:
 *                 type: string
 *               packageId:
 *                 type: string
 *               gymName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member created successfully
 */
router.post('/members', gymAdminController.createMember);

/**
 * @swagger
 * /api/gym-admin/members/{id}:
 *   put:
 *     summary: Update member details
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Member updated
 */
router.put('/members/:id', gymAdminController.updateMember);

/**
 * @swagger
 * /api/gym-admin/members/{id}:
 *   delete:
 *     summary: Delete a member record
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member deleted
 */
router.delete('/members/:id', gymAdminController.deleteMember);

/**
 * @swagger
 * /api/gym-admin/members/aadhaar:
 *   post:
 *     summary: Upload Aadhaar KYC document for a member
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - aadhaarNumber
 *             properties:
 *               memberId:
 *                 type: string
 *               aadhaarNumber:
 *                 type: string
 *                 example: "1234 5678 9012"
 *               aadhaarImage:
 *                 type: string
 *                 description: Base64 encoded image or URL
 *     responses:
 *       200:
 *         description: Aadhaar KYC uploaded
 */
router.post('/members/aadhaar', gymAdminController.uploadMemberAadhaar);

/**
 * @swagger
 * /api/gym-admin/packages:
 *   get:
 *     summary: Get all membership packages offered by the gym
 *     tags: [Gym Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/packages', gymAdminController.getPackages);

/**
 * @swagger
 * /api/gym-admin/packages:
 *   post:
 *     summary: Create a new membership package
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - durationMonths
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gold Plan"
 *               price:
 *                 type: number
 *                 example: 2999
 *               durationMonths:
 *                 type: integer
 *                 example: 3
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Package created
 */
router.post('/packages', gymAdminController.createPackage);

/**
 * @swagger
 * /api/gym-admin/packages/{id}:
 *   put:
 *     summary: Update a membership package
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Package updated
 */
router.put('/packages/:id', gymAdminController.updatePackage);

/**
 * @swagger
 * /api/gym-admin/packages/{id}:
 *   delete:
 *     summary: Delete a membership package
 *     tags: [Gym Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Package deleted
 */
router.delete('/packages/:id', gymAdminController.deletePackage);

/**
 * @swagger
 * /api/gym-admin/packages/subscribe:
 *   post:
 *     summary: Subscribe a member to a package (creates payment record)
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - packageId
 *             properties:
 *               memberId:
 *                 type: string
 *               packageId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, upi, card]
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Member subscribed successfully
 */
router.post('/packages/subscribe', gymAdminController.subscribeMember);

/**
 * @swagger
 * /api/gym-admin/kyc:
 *   get:
 *     summary: Get KYC and Shop Act license status for the gym
 *     tags: [Gym Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/kyc', gymAdminController.getGymKyc);

/**
 * @swagger
 * /api/gym-admin/kyc/upload:
 *   post:
 *     summary: Upload gym KYC or Shop Act license document
 *     tags: [Gym Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shop_act, gst, pan, fssai]
 *               number:
 *                 type: string
 *               documentUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC document uploaded
 */
router.post('/kyc/upload', gymAdminController.uploadGymKyc);

module.exports = router;
