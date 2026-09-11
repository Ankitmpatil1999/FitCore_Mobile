const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function setAndVerify() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');

  const defaultPassword = 'Hello@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Set password for FitCore Olympus Club owner (Vikram Singhania)
  await db.collection('users').updateOne(
    { phone: '9988776655' },
    {
      $set: {
        password: hashedPassword,
        isActive: true,
        updatedAt: new Date()
      }
    }
  );

  const user = await db.collection('users').findOne({ phone: '9988776655' });
  const isMatch = await bcrypt.compare(defaultPassword, user.password);

  console.log('=== FitCore Olympus Club Credentials ===');
  console.log(`Gym Name: FitCore Olympus Club`);
  console.log(`Owner Name: ${user.name}`);
  console.log(`Phone (Login ID): ${user.phone}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Password: ${defaultPassword}`);
  console.log(`Password Match Test: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

  await client.close();
}

setAndVerify();
