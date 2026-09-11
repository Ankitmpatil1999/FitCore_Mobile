const { MongoClient } = require('mongodb');
async function check() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');
  const user = await db.collection('users').findOne({ phone: '7894561230' });
  console.log('User 7894561230:', user ? { id: user._id, name: user.name, phone: user.phone, role: user.role, email: user.email, hasPassword: !!user.password } : 'NOT_FOUND');
  
  const allUsers = await db.collection('users').find({}).toArray();
  console.log('All Users in DB:', allUsers.map(u => ({ id: u._id, name: u.name, phone: u.phone, email: u.email, role: u.role })));
  
  const allGyms = await db.collection('gyms').find({}).toArray();
  console.log('All Gyms in DB:', allGyms.map(g => ({ id: g._id, name: g.name, ownerName: g.ownerName, ownerPhone: g.ownerPhone, ownerId: g.ownerId })));

  await client.close();
}
check();
