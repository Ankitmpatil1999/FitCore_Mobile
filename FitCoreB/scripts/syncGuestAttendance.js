const { getDb } = require('../src/config/mongoClient');

async function syncAttendance() {
  const db = await getDb();
  const res = await db.collection('attendance').updateMany(
    { memberId: { $in: ['guest_9209202289', 'guest_9209282289', 'm1', 'FC-ATH-48740', '6a935208ca5419e4a3426fea'] } },
    {
      $set: {
        gymId: '6a934afd13a1b16c3767d90f',
        gym_id: '6a934afd13a1b16c3767d90f',
        memberName: 'Ankit Patil',
        memberPhone: '9209282289',
        memberId: '6a935208ca5419e4a3426fea',
        membershipId: 'Pro Studio Plan'
      }
    }
  );
  console.log('Attendance updated count:', res.modifiedCount);
  process.exit(0);
}

syncAttendance().catch(err => {
  console.error(err);
  process.exit(1);
});
