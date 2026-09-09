require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/fitcore';

async function clearAllData() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB database:', uri);
    const db = client.db('fitcore');

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Existing collections:', collectionNames);

    for (const name of collectionNames) {
      if (name.toLowerCase() === 'users' || name.toLowerCase() === 'user') {
        const result = await db.collection(name).deleteMany({ role: { $ne: 'admin' } });
        console.log(`Cleared ${result.deletedCount} non-admin records from ${name}`);
      } else {
        const result = await db.collection(name).deleteMany({});
        console.log(`Cleared ${result.deletedCount} documents from ${name}`);
      }
    }

    // Ensure at least one clean Super Admin user exists
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.collection('users').insertOne({
        name: 'FitCore Super Admin',
        phone: '8530292487',
        email: 'admin@fitcore.in',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created default Super Admin user: phone=8530292487, password=admin123');
    } else {
      console.log('Super Admin user preserved:', adminUser.phone || adminUser.email);
    }

    console.log('✅ ALL DATABASE DATA HAS BEEN CLEARED SUCCESSFULLY.');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await client.close();
  }
}

clearAllData();
