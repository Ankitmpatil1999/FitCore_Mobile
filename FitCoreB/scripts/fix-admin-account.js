/**
 * Admin Account Fix Script
 * - Promotes 7894561230 to admin role with correct password
 * - Removes junk test accounts created during security testing
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function fixAccounts() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('fitcore');
  const users = db.collection('users');

  // 1. Upgrade Ayushi (7894561230) to admin + set correct password
  const hash = await bcrypt.hash('Hello@123', 12);
  const result = await users.updateOne(
    { phone: '7894561230' },
    { $set: { role: 'admin', password: hash, updatedAt: new Date(), isActive: true } }
  );
  console.log('✅ Updated 7894561230 to admin:', result.modifiedCount, 'doc(s) updated');

  // 2. Delete junk accounts created during security penetration tests
  const junkPhones = ['9999999999', '8888888888', '7777777777'];
  const del = await users.deleteMany({ phone: { $in: junkPhones } });
  console.log('🗑️  Deleted junk test accounts:', del.deletedCount);

  // 3. Print final clean user list
  const finalUsers = await users.find({}, { projection: { name: 1, phone: 1, role: 1, email: 1 } }).toArray();
  console.log('\n=== FINAL CLEAN USER LIST ===');
  finalUsers.forEach(u =>
    console.log(`  [${u.role.padEnd(15)}]  ${u.phone.padEnd(15)}  ${u.name}`)
  );

  await client.close();
  console.log('\n✅ Done!');
}

fixAccounts().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
