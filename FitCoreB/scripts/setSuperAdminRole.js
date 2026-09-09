const { MongoClient } = require('mongodb');

async function updateAdminRole() {
  const client = new MongoClient('mongodb://localhost:27017/fitcore?directConnection=true');
  await client.connect();
  const db = client.db('fitcore');
  
  await db.collection('users').updateMany(
    { $or: [{ phone: '8530292487' }, { email: 'fitcore@gmail.com' }, { email: 'admin@fitcore.in' }, { role: 'admin' }] },
    { $set: { role: 'super_admin', name: 'FitCore Super Admin', updatedAt: new Date() } }
  );
  
  const users = await db.collection('users').find({ role: 'super_admin' }).toArray();
  console.log(' Super Admins in DB:', users.map(u => ({ id: u._id, name: u.name, phone: u.phone, email: u.email, role: u.role })));
  await client.close();
}

updateAdminRole();
