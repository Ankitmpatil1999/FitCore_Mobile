const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function setSuperAdmin() {
  const client = new MongoClient('mongodb://localhost:27017/fitcore?directConnection=true');
  await client.connect();
  const db = client.db('fitcore');
  
  const hashedPassword = await bcrypt.hash('Hello@123', 10);
  
  await db.collection('users').updateOne(
    { phone: '8530292487' },
    {
      $set: {
        name: 'FitCore Super Admin',
        phone: '8530292487',
        email: 'admin@fitcore.in',
        password: hashedPassword,
        role: 'super_admin',
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  
  const user = await db.collection('users').findOne({ phone: '8530292487' });
  console.log('✅ Super Admin Configured in MongoDB:', {
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role
  });
  await client.close();
}

setSuperAdmin();
