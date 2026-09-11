const { MongoClient, ObjectId } = require('mongodb');

async function clean() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('fitcore');

  // Fetch registered members
  const members = await db.collection('members').find({}).toArray();
  const ankit = members.find(m => m.name && m.name.toLowerCase().includes('ankit'));
  const karan = members.find(m => m.name && m.name.toLowerCase().includes('karan'));

  console.log('Found Ankit:', ankit?._id, ankit?.name);
  console.log('Found Karan:', karan?._id, karan?.name);

  // 1. Map guest_1234567899 records to Karan
  if (karan) {
    const resKaran = await db.collection('attendance').updateMany(
      { memberId: 'guest_1234567899' },
      {
        $set: {
          memberId: karan._id.toString(),
          memberName: karan.name,
          membershipId: karan.plan || 'Standard Pass'
        }
      }
    );
    console.log('Updated guest_1234567899 records to Karan:', resKaran.modifiedCount);
  }

  // 2. Map guest_9209202289 and 9209282289 to Ankit
  if (ankit) {
    const resAnkit = await db.collection('attendance').updateMany(
      { $or: [{ memberId: 'guest_9209202289' }, { memberId: 'guest_9209282289' }, { memberId: '9209282289' }] },
      {
        $set: {
          memberId: ankit._id.toString(),
          memberName: ankit.name,
          membershipId: ankit.plan || 'Quarterly Pro Studio'
        }
      }
    );
    console.log('Updated guest_9209202289 records to Ankit:', resAnkit.modifiedCount);
  }

  // 3. Remove unknown ghost/fake test entries like guest_1234567890
  const delGhost = await db.collection('attendance').deleteMany({
    memberId: { $in: ['guest_1234567890', 'm1', 'guest_undefined'] }
  });
  console.log('Deleted ghost/fake records:', delGhost.deletedCount);

  // 4. Clean open sessions for Karan and Ankit (leave at most 1 active if needed, or close dangling)
  // Let Karan be Checked Out
  await db.collection('attendance').updateMany(
    { memberId: karan?._id.toString(), checkOutTime: null },
    {
      $set: {
        checkOutTime: new Date('2026-09-10T07:15:00.000Z').toISOString(),
        duration: '45m',
        durationMins: 45,
        durationMinutes: 45,
        status: 'CHECKED_OUT',
        updatedAt: new Date()
      }
    }
  );

  // Keep only the latest Ankit session active (if any)
  const ankitActive = await db.collection('attendance').find({ memberId: ankit?._id.toString(), checkOutTime: null }).sort({ checkInTime: -1 }).toArray();
  if (ankitActive.length > 1) {
    for (let i = 1; i < ankitActive.length; i++) {
      await db.collection('attendance').updateOne(
        { _id: ankitActive[i]._id },
        {
          $set: {
            checkOutTime: new Date(new Date(ankitActive[i].checkInTime).getTime() + 30 * 60000).toISOString(),
            duration: '30m',
            durationMins: 30,
            durationMinutes: 30,
            status: 'CHECKED_OUT',
            updatedAt: new Date()
          }
        }
      );
    }
  }

  console.log('Database cleanup completed!');
  await client.close();
}

clean().catch(console.error);
