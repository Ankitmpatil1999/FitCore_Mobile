const { MongoClient, ObjectId } = require('mongodb');

async function findGymAndOwner() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');

  const members = await db.collection('members').find({ phone: { $in: ['9209282289', '1234567899'] } }).toArray();
  console.log('--- MEMBERS DATA ---');
  for (const m of members) {
    console.log(`Member: ${m.name} | Phone: ${m.phone} | gymId: ${m.gymId} | gymName: ${m.gymName}`);
  }

  const gyms = await db.collection('gyms').find({}).toArray();
  console.log('\n--- GYMS IN DB ---');
  for (const g of gyms) {
    console.log(`Gym: ${g.name} | ID: ${g._id} | ownerId: ${g.ownerId} | ownerName: ${g.ownerName} | ownerPhone: ${g.ownerPhone}`);
  }

  const owners = await db.collection('users').find({ role: { $in: ['gym_owner', 'admin', 'super_admin'] } }).toArray();
  console.log('\n--- OWNERS / ADMINS IN DB ---');
  for (const o of owners) {
    console.log(`Owner: ${o.name} | Phone: ${o.phone} | Email: ${o.email} | Role: ${o.role} | gymId: ${o.gymId}`);
  }

  await client.close();
}

findGymAndOwner();
