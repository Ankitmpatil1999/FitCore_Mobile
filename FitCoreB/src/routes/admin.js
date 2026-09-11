const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     summary: Retrieve Super Admin dashboard metrics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/metrics', adminController.getMetrics);
router.get('/hub-telemetry', adminController.getHubTelemetry);

/**
 * @swagger
 * /api/admin/gyms:
 *   get:
 *     summary: Retrieve list of all gyms in the ecosystem
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/gyms', adminController.getGyms);

/**
 * @swagger
 * /api/admin/gyms:
 *   post:
 *     summary: Register a new gym and its owner
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - ownerName
 *               - ownerPhone
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               ownerPhone:
 *                 type: string
 *               ownerEmail:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gym created successfully
 */
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);
router.post('/gyms', adminController.createGym);

/**
 * @swagger
 * /api/admin/gyms/{id}/status:
 *   post:
 *     summary: Update gym status (approve/suspend)
 *     tags: [Admin]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: approved
 *     responses:
 *       200:
 *         description: Gym status updated
 */
router.post('/gyms/:id/status', adminController.updateGymStatus);
router.post('/gyms/:id/permissions', adminController.updateGymPermissions);
router.put('/gyms/:id/permissions', adminController.updateGymPermissions);
router.put('/gyms/:id', adminController.updateGym);
router.delete('/gyms/:id', adminController.deleteGym);

/**
 * @swagger
 * /api/admin/members:
 *   get:
 *     summary: Retrieve list of all registered members across gyms
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/members', adminController.getMembers);
router.post('/members/:id/status', adminController.updateMemberStatus);
router.get('/transactions', adminController.getTransactions);
router.post('/transactions', adminController.recordTransaction);

/**
 * @swagger
 * /api/admin/vendors:
 *   get:
 *     summary: Retrieve list of registered vendor store partners and payouts
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/vendors', adminController.getVendors);

/**
 * @swagger
 * /api/admin/vendors/{id}/status:
 *   post:
 *     summary: Update vendor status (approve/suspend)
 *     tags: [Admin]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: approved
 *     responses:
 *       200:
 *         description: Vendor status updated
 */
router.post('/vendors/:id/status', adminController.updateVendorStatus);

/**
 * @swagger
 * /api/admin/kyc/pending:
 *   get:
 *     summary: Retrieve list of partners with pending KYC document validation
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/kyc/pending', adminController.getPendingKyc);

/**
 * @swagger
 * /api/admin/kyc/{id}/approve:
 *   post:
 *     summary: Approve KYC documents for store/gym partner
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC Approved
 */
router.post('/kyc/:id/approve', adminController.approveKyc);

/**
 * @swagger
 * /api/admin/kyc/{id}/reject:
 *   post:
 *     summary: Reject KYC documents with feedback
 *     tags: [Admin]
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
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC Rejected
 */
router.post('/kyc/:id/reject', adminController.rejectKyc);
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);
router.post('/change-password', adminController.changePassword);

module.exports = router;
