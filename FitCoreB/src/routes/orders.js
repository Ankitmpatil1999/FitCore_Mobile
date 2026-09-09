const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order (automatically deducts stock and applies correct role pricing)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - buyerId
 *               - buyerName
 *               - buyerPhone
 *               - buyerType
 *               - items
 *             properties:
 *               vendorId:
 *                 type: string
 *               buyerId:
 *                 type: string
 *               buyerName:
 *                 type: string
 *               buyerPhone:
 *                 type: string
 *               buyerType:
 *                 type: string
 *                 enum: [member, gym_owner]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - qty
 *                   properties:
 *                     productId:
 *                       type: string
 *                     qty:
 *                       type: integer
 *               deliveryMethod:
 *                 type: string
 *                 enum: [self, local, partner]
 *               deliveryAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [upi, cash_on_delivery, online]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/orders/vendor/{vendorId}:
 *   get:
 *     summary: Get all orders received by a specific vendor store
 *     tags: [Orders]
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
router.get('/vendor/:vendorId', orderController.getVendorOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get detailed view of an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (returns stock if cancelled)
 *     tags: [Orders]
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
 *                 enum: [new, accepted, packed, shipped, delivered, cancelled]
 *               trackingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
