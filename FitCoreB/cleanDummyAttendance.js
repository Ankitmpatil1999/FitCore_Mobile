const { MongoClient } = require('mongodb');

async function cleanAttendance() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');
  
  const realGym = await db.collection('gyms').findOne({ name: /Ayushi/i });
  const realGymId = realGym ? realGym._id.toString() : '6a934afd13a1b16c3767d90f';
  
  // Link legacy/dummy IDs to the real gym
  const res = await db.collection('attendance').updateMany(
    { gymId: { $in: ['65123456789abcdef0123456', 'g1'] } },
    { $set: { gymId: realGymId, gym_id: realGymId } }
  );
  console.log('Updated legacy dummy attendance records:', res.modifiedCount);

  // Print updated telemetry test
  const gyms = await db.collection('gyms').find({}).toArray();
  const gymMap = {};
  gyms.forEach(g => { gymMap[g._id.toString()] = g.name; });

  const recent = await db.collection('attendance').find({}).sort({ checkInTime: -1 }).limit(6).toArray();
  console.log('\n--- Live Turnstile Activity (Now Live Real Data) ---');
  recent.forEach(r => {
    console.log({
      name: r.memberName,
      gym: gymMap[r.gymId] || gymMap[r.gym_id],
      status: r.status,
      time: r.checkInTime
    });
  });

  await client.close();
}

cleanAttendance();
