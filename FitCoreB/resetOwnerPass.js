const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function resetAndCheck() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');
  
  const hashedPassword = await bcrypt.hash('Hello@123', 10);
  
  // Set password for 1234567890 (Ayshi Singh) and 7894561230
  await db.collection('users').updateOne(
    { phone: '1234567890' },
    { $set: { password: hashedPassword, role: 'gym_owner', isActive: true, updatedAt: new Date() } }
  );

  // Also create/upsert 7894561230 as gym_owner just in case
  await db.collection('users').updateOne(
    { phone: '7894561230' },
    {
      $set: {
        name: 'Gym Owner',
        phone: '7894561230',
        email: 'owner789@fitcore.in',
        password: hashedPassword,
        role: 'gym_owner',
        isActive: true,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  const updatedUsers = await db.collection('users').find({ phone: { $in: ['1234567890', '7894561230'] } }).toArray();
  console.log('SUCCESS! Updated Users in DB:');
  for (const u of updatedUsers) {
    const match = await bcrypt.compare('Hello@123', u.password);
    console.log(`- Phone: ${u.phone} | Name: ${u.name} | Role: ${u.role} | Password 'Hello@123' Matches: ${match}`);
  }

  await client.close();
}

resetAndCheck();
