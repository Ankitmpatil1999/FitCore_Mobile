const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const vendorController = require('../controllers/vendorController');

// Multer Config for KYC File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * /api/vendors/{userId}:
 *   get:
 *     summary: Retrieve vendor store profile by User ID
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c72b2f9b1d8e2348a56f11"
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Store not found
 */
router.get('/:userId', vendorController.getStore);

/**
 * @swagger
 * /api/vendors/{id}:
 *   put:
 *     summary: Update store settings & preferences
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60c72b2f9b1d8e2348a56f12"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeName:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               upiId:
 *                 type: string
 *               bankAccount:
 *                 type: string
 *               ifsc:
 *                 type: string
 *               freeDeliveryAbove:
 *                 type: number
 *               deliveryCharges:
 *                 type: number
 *               shopImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store settings updated successfully
 */
router.put('/:id', vendorController.updateStore);

/**
 * @swagger
 * /api/vendors/{id}/kyc:
 *   post:
 *     summary: Upload and update KYC document
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - document
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [aadhaar, pan, electricity_bill, shop_license]
 *               number:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: KYC Document uploaded successfully
 */
router.post('/:id/kyc', upload.single('document'), vendorController.uploadKyc);

/**
 * @swagger
 * /api/vendors/{id}/approve:
 *   post:
 *     summary: Approve vendor store (Admin simulation)
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store approved
 */
router.post('/:id/approve', vendorController.simulateApprove);

module.exports = router;
