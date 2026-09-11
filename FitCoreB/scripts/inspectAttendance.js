const { MongoClient, ObjectId } = require('mongodb');

async function check() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('fitcore');

  const members = await db.collection('members').find({}).toArray();
  console.log('TOTAL MEMBERS IN DB:', members.length);
  members.forEach(m => console.log('Member:', m._id.toString(), m.userId, m.name, m.phone));

  const att = await db.collection('attendance').find({ date: '2026-09-10' }).toArray();
  console.log('TOTAL ATTENDANCE RECORDS TODAY:', att.length);
  att.forEach((a, i) => {
    console.log(`[${i}]`, a._id.toString(), 'memberId:', a.memberId, 'name:', a.memberName, 'shift:', a.sessionType, 'in:', a.checkInTime, 'out:', a.checkOutTime, 'status:', a.status);
  });

  await client.close();
}

check().catch(console.error);
