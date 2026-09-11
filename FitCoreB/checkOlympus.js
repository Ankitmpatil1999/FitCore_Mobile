const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function checkOlympus() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');

  const gym = await db.collection('gyms').findOne({ name: /Olympus/i });
  console.log('--- OLYMPUS GYM ---');
  console.log(gym);

  const users = await db.collection('users').find({
    $or: [
      { email: /olympus/i },
      { phone: '9988776655' },
      { gymId: gym ? gym._id : null },
      { gymId: gym ? String(gym._id) : null }
    ]
  }).toArray();

  console.log('\n--- OLYMPUS USERS ---');
  const commonPasswords = ['Hello@123', 'Admin@123', 'Olympus@123', '12345678', 'password', 'fitcore123', 'FitCore@123'];

  for (const u of users) {
    let matchedPass = 'UNKNOWN (custom hash)';
    if (u.password) {
      for (const pass of commonPasswords) {
        if (await bcrypt.compare(pass, u.password)) {
          matchedPass = pass;
          break;
        }
      }
    } else {
      matchedPass = 'NO PASSWORD SET';
    }
    console.log({
      id: u._id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      password: matchedPass,
      hasPassword: !!u.password
    });
  }

  const members = await db.collection('members').find({
    $or: [
      { gymId: gym ? gym._id : null },
      { gymId: gym ? String(gym._id) : null }
    ]
  }).toArray();
  console.log(`\n--- MEMBERS LINKED TO OLYMPUS: ${members.length} ---`);
  if (members.length > 0) {
    console.log(members.slice(0, 5));
  }

  await client.close();
}

checkOlympus();
