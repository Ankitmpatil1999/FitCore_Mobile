const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all active products across all vendor stores
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/vendor/{vendorId}:
 *   get:
 *     summary: Get all products cataloged under a specific vendor
 *     tags: [Products]
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
router.get('/vendor/:vendorId', productController.getVendorProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product to catalogue with dual pricing & margins
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - name
 *               - brand
 *               - memberPrice
 *             properties:
 *               vendorId:
 *                 type: string
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: string
 *               nutritionFacts:
 *                 type: string
 *               weight:
 *                 type: string
 *               flavours:
 *                 type: array
 *                 items:
 *                   type: string
 *               mrp:
 *                 type: number
 *               price:
 *                 type: number
 *               ownerPrice:
 *                 type: number
 *               memberPrice:
 *                 type: number
 *               margin:
 *                 type: number
 *               stock:
 *                 type: integer
 *               lowStockThreshold:
 *                 type: integer
 *               expiryDate:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               emoji:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added successfully
 */
router.post('/', productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update existing product details
 *     tags: [Products]
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
 *         description: Product updated successfully
 */
router.put('/:id', productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}/toggle-active:
 *   patch:
 *     summary: Toggle active status (Disable/Enable product in storefront)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product status toggled successfully
 */
router.patch('/:id/toggle-active', productController.toggleActive);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product from catalogue
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
