const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * /api/analytics/vendor/{vendorId}:
 *   get:
 *     summary: Retrieve detailed seller dashboard metrics & buyer breakdowns
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/vendor/:vendorId', analyticsController.getVendorAnalytics);

module.exports = router;
