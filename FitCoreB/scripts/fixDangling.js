const { getDb } = require('../src/config/mongoClient');
const { ObjectId } = require('mongodb');

async function fixDanglingSessions() {
  const db = await getDb();
  const res = await db.collection('attendance').updateMany(
    {
      checkOutTime: null,
      sessionType: 'MORNING'
    },
    {
      $set: {
        checkOutTime: new Date('2026-09-10T07:15:00.000Z'),
        status: 'CHECKED_OUT',
        durationMinutes: 26,
        durationMins: 26
      }
    }
  );
  console.log('Fixed morning dangling checkins:', res.modifiedCount);
  process.exit(0);
}

fixDanglingSessions().catch(err => {
  console.error(err);
  process.exit(1);
});
