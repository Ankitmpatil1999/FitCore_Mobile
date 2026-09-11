const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

async function sync() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');

  const hashedPassword = await bcrypt.hash('Hello@123', 12);

  const gymId = '6a934afd13a1b16c3767d90f';

  // Ensure Ayushi GYM document exists and is accurate
  await db.collection('gyms').updateOne(
    { _id: new ObjectId(gymId) },
    {
      $set: {
        name: 'Ayushi GYM',
        tagline: "Premier Fitness & Health Center",
        rating: 4.9,
        address: 'Civil Lines, Nagpur',
        city: 'Nagpur, Maharashtra',
        phone: '7894561230',
        email: 'owner789@fitcore.in',
        openTime: '05:00 AM',
        closeTime: '10:00 PM',
        isOpen: true,
        ownerName: 'Ayushi Singh',
        ownerPhone: '7894561230',
        subscriptionPlan: 'premium',
        facilities: [
          { id: 'f1', icon: '🅿️', name: 'Parking' },
          { id: 'f3', icon: '🚴', name: 'Cardio' },
          { id: 'f4', icon: '🏋️', name: 'CrossFit' },
          { id: 'f6', icon: '🔒', name: 'Locker' },
        ],
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );

  // Ensure 7894561230 is registered as gym_owner (and has gymId)
  await db.collection('users').updateOne(
    { phone: '7894561230' },
    {
      $set: {
        name: 'Ayushi Gym Owner',
        phone: '7894561230',
        email: 'owner789@fitcore.in',
        password: hashedPassword,
        role: 'gym_owner',
        gymId: gymId,
        gym_id: gymId,
        avatar: 'AG',
        isActive: true,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );

  // Ensure 1234567890 also registered as gym_owner
  await db.collection('users').updateOne(
    { phone: '1234567890' },
    {
      $set: {
        name: 'Ayushi Singh',
        phone: '1234567890',
        email: 'ayushi@gmail.com',
        password: hashedPassword,
        role: 'gym_owner',
        gymId: gymId,
        gym_id: gymId,
        avatar: 'AS',
        isActive: true,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );

  console.log('✅ DB Synced successfully for Ayushi GYM and Owners (7894561230, 1234567890)');

  const users = await db.collection('users').find({ phone: { $in: ['7894561230', '1234567890'] } }).toArray();
  console.log('Updated Owners:', users.map(u => ({ id: u._id, name: u.name, phone: u.phone, role: u.role, gymId: u.gymId })));

  await client.close();
}

sync().catch(console.error);
