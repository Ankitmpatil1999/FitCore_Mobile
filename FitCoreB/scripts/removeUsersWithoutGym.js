const { MongoClient, ObjectId } = require('mongodb');

async function removeUnassignedUsers() {
  const uri = "mongodb://localhost:27017/fitcore?directConnection=true";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('fitcore');

    const gyms = await db.collection('gyms').find().toArray();
    const validGymIds = new Set(gyms.map(g => g._id.toString()));

    console.log(`Available Gyms:`, gyms.map(g => ({ id: g._id.toString(), name: g.name })));

    // 1. Members without gym
    const membersToDelete = await db.collection('members').find({
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: "" }
      ]
    }).toArray();

    console.log(`\nFound ${membersToDelete.length} member(s) without gym:`);
    for (const m of membersToDelete) {
      console.log(`- Deleting Member: ID=${m._id} Name="${m.name}" Phone="${m.phone}"`);
      await db.collection('members').deleteOne({ _id: m._id });
    }

    // 2. Users (excluding super_admin) without gym
    const usersToDelete = await db.collection('users').find({
      role: { $ne: 'super_admin' },
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: "" }
      ]
    }).toArray();

    console.log(`\nFound ${usersToDelete.length} user(s) (non-super-admin) without gym:`);
    for (const u of usersToDelete) {
      console.log(`- Deleting User: ID=${u._id} Name="${u.name}" Phone="${u.phone}" Role="${u.role}"`);
      await db.collection('users').deleteOne({ _id: u._id });
    }

    console.log('\n--- Final Verification ---');
    const remainingUsers = await db.collection('users').find().toArray();
    console.log('Remaining Users:');
    remainingUsers.forEach(u => console.log(`  [${u.role}] ${u.name} (${u.phone}) - gymId: ${u.gymId || 'PLATFORM_SUPER_ADMIN'}`));

    const remainingMembers = await db.collection('members').find().toArray();
    console.log('\nRemaining Members:');
    remainingMembers.forEach(m => console.log(`  ${m.name} (${m.phone}) - gymId: ${m.gymId}`));

  } catch (err) {
    console.error('Error removing users:', err);
  } finally {
    await client.close();
  }
}

removeUnassignedUsers();
