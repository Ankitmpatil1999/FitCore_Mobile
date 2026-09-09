const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve notifications matching the logged-in user's role/userId/gymId
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Send/broadcast an announcement alert
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - target
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               target:
 *                 type: string
 *               type:
 *                 type: string
 *               gymId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', notificationController.createNotification);

/**
 * @swagger
 * /api/notifications/clear:
 *   post:
 *     summary: Clear notifications for the logged-in user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications cleared
 */
router.post('/clear', notificationController.clearNotifications);

module.exports = router;
