const express = require('express');
const router = express.Router();
const {
  getExercises,
  getExerciseById,
  getCategories,
  seedExercises,
} = require('../controllers/exerciseController');

/**
 * @swagger
 * tags:
 *   name: Exercises
 *   description: Exercise library — browse by category, muscle group, and difficulty
 */

/**
 * @swagger
 * /api/exercises/categories:
 *   get:
 *     summary: Get all exercise categories and muscle groups
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Categories list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"]
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/exercises/seed:
 *   post:
 *     summary: Seed the exercise master database (admin use only)
 *     tags: [Exercises]
 *     responses:
 *       200:
 *         description: Exercises seeded successfully
 */
router.post('/seed', seedExercises);

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Get all exercises with optional filters
 *     tags: [Exercises]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by exercise name
 *         example: "bench press"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by muscle group/category
 *         example: "chest"
 *       - in: query
 *         name: muscle
 *         schema:
 *           type: string
 *         description: Filter by target muscle
 *         example: "pectorals"
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Filtered exercises list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 exercises:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                         example: "Barbell Bench Press"
 *                       category:
 *                         type: string
 *                         example: "chest"
 *                       muscle:
 *                         type: string
 *                         example: "pectorals"
 *                       difficulty:
 *                         type: string
 *                         example: "intermediate"
 *                       equipment:
 *                         type: string
 *                         example: "barbell"
 *                       instructions:
 *                         type: string
 */
router.get('/', getExercises);

/**
 * @swagger
 * /api/exercises/{id}:
 *   get:
 *     summary: Get a single exercise by ID or slug
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exercise MongoDB ID or URL slug
 *         example: "barbell-bench-press"
 *     responses:
 *       200:
 *         description: Exercise detail returned
 *       404:
 *         description: Exercise not found
 */
router.get('/:id', getExerciseById);

module.exports = router;
