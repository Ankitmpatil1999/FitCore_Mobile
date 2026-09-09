const { ObjectId } = require('mongodb');
const { getDb } = require('../config/mongoClient');
const { MASTER_EXERCISES } = require('../data/exercisesSeed');

/**
 * ── GET ALL EXERCISES (With Filters & Search) ──────────────
 */
async function getExercises(req, res) {
  try {
    const db = await getDb();
    const collection = db.collection('exercises');

    // Auto-seed if database is empty
    const totalExisting = await collection.countDocuments();
    if (totalExisting === 0) {
      console.log('⚡ Exercises collection is empty. Auto-seeding master exercises into MongoDB...');
      const ops = MASTER_EXERCISES.map((ex) => ({
        updateOne: {
          filter: { slug: ex.slug },
          update: { $set: { ...ex, updatedAt: new Date(), createdAt: new Date() } },
          upsert: true,
        },
      }));
      await collection.bulkWrite(ops);
    }

    const { category, primaryMuscle, difficulty, equipment, search, limit = 50, page = 1 } = req.query;

    const query = { isActive: { $ne: false } };

    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (primaryMuscle) {
      query.primaryMuscle = { $regex: new RegExp(primaryMuscle, 'i') };
    }

    if (difficulty) {
      query.difficulty = { $regex: new RegExp(difficulty, 'i') };
    }

    if (equipment) {
      query.equipment = { $in: [new RegExp(equipment, 'i')] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { primaryMuscle: { $regex: new RegExp(search, 'i') } },
        { category: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const exercises = await collection
      .find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(take)
      .toArray();

    const totalCount = await collection.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: exercises.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / take),
      data: exercises,
    });
  } catch (error) {
    console.error('Error in getExercises:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching exercises', error: error.message });
  }
}

/**
 * ── GET EXERCISE BY ID OR SLUG ─────────────────────────────
 */
async function getExerciseById(req, res) {
  try {
    const db = await getDb();
    const collection = db.collection('exercises');
    const { id } = req.params;

    let exercise = null;

    if (ObjectId.isValid(id)) {
      exercise = await collection.findOne({ _id: new ObjectId(id) });
    }

    if (!exercise) {
      exercise = await collection.findOne({
        $or: [
          { slug: id.toLowerCase() },
          { name: { $regex: new RegExp(`^${id}$`, 'i') } },
        ],
      });
    }

    // If still not in DB, fallback to seed template and upsert
    if (!exercise) {
      const match = MASTER_EXERCISES.find(
        (e) => e.slug === id.toLowerCase() || e.name.toLowerCase() === id.toLowerCase()
      );
      if (match) {
        const result = await collection.insertOne({ ...match, createdAt: new Date(), updatedAt: new Date() });
        exercise = { _id: result.insertedId, ...match };
      }
    }

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found in database' });
    }

    return res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error in getExerciseById:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching exercise detail', error: error.message });
  }
}

/**
 * ── GET ALL CATEGORIES & COUNTS ────────────────────────────
 */
async function getCategories(req, res) {
  try {
    const db = await getDb();
    const collection = db.collection('exercises');

    const categoriesList = [
      { name: 'Chest', icon: '⚡', color: '#6C5CE7' },
      { name: 'Back', icon: '🦅', color: '#00C48C' },
      { name: 'Shoulders', icon: '🛡️', color: '#FF9900' },
      { name: 'Biceps', icon: '💪', color: '#E17055' },
      { name: 'Triceps', icon: '🔥', color: '#D63031' },
      { name: 'Legs & Glutes', icon: '🦵', color: '#0984E3' },
      { name: 'Abs & Core', icon: '🎯', color: '#6C5CE7' },
      { name: 'Full Body', icon: '⚡', color: '#F39C12' },
      { name: 'Cardio', icon: '🏃', color: '#E74C3C' },
      { name: 'Stretching & Mobility', icon: '🧘', color: '#16A085' },
    ];

    const result = await Promise.all(
      categoriesList.map(async (cat) => {
        const count = await collection.countDocuments({
          category: { $regex: new RegExp(`^${cat.name}$`, 'i') },
        });
        return { ...cat, count: count || 0 };
      })
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching categories', error: error.message });
  }
}

/**
 * ── SEED / RE-SYNC MASTER EXERCISES ────────────────────────
 */
async function seedExercises(req, res) {
  try {
    const db = await getDb();
    const collection = db.collection('exercises');

    console.log(`Seeding ${MASTER_EXERCISES.length} master exercises into MongoDB...`);

    const ops = MASTER_EXERCISES.map((ex) => ({
      updateOne: {
        filter: { slug: ex.slug },
        update: {
          $set: {
            ...ex,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(ops);

    return res.status(200).json({
      success: true,
      message: `Master exercise library synchronized in MongoDB!`,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      totalExercises: MASTER_EXERCISES.length,
    });
  } catch (error) {
    console.error('Error in seedExercises:', error);
    return res.status(500).json({ success: false, message: 'Server error seeding exercises', error: error.message });
  }
}

module.exports = {
  getExercises,
  getExerciseById,
  getCategories,
  seedExercises,
};
