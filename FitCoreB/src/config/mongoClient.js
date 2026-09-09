const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/fitcore';
const client = new MongoClient(uri);

let db = null;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db('fitcore');
  }
  return db;
}

module.exports = { getDb, client };
