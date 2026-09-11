const { MongoClient, ObjectId } = require('mongodb');

async function linkBothOwnersToGym() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');

  const gymId = '6a934afd13a1b16c3767d90f';

  // Update Gym details
  await db.collection('gyms').updateOne(
    { _id: new ObjectId(gymId) },
    {
      $set: {
        name: 'Ayushi GYM',
        ownerName: 'Ayushi Singh',
        ownerPhone: '1234567890',
        city: 'Nagpur',
        address: 'Civil Lines, Nagpur',
        updatedAt: new Date()
      }
    }
  );

  // Link both owners to this exact gymId
  await db.collection('users').updateOne(
    { phone: '1234567890' },
    { $set: { gymId: gymId, gym_id: gymId, name: 'Ayushi Singh' } }
  );

  await db.collection('users').updateOne(
    { phone: '7894561230' },
    { $set: { gymId: gymId, gym_id: gymId, name: 'Ayushi Gym Owner' } }
  );

  console.log('SUCCESS! Both 1234567890 & 7894561230 linked to Ayushi GYM (ID: ' + gymId + ')');
  await client.close();
}

linkBothOwnersToGym();
