const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config();

const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://nikhilreddygurrala2_db_user:OMVUaEmyq8jAcJ5L@cluster0.yyfbprn.mongodb.net/financial_flow?retryWrites=true&w=majority&appName=Cluster0';

async function migrateData() {
  console.log('🔄 Starting full database migration to MongoDB Atlas...');
  
  // 1. Connect to local database
  const dbDir = path.resolve(__dirname, '../data/db');
  console.log(`📁 Loading local database from: ${dbDir}`);
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbPath: dbDir, storageEngine: 'wiredTiger' }
  });
  const localUri = mongoServer.getUri();
  
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('✅ Connected to local database');

  // 2. Connect to MongoDB Atlas
  console.log('☁️ Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('✅ Connected to MongoDB Atlas!');

  // 3. Migrate all collections
  const collections = await localConn.db.listCollections().toArray();
  console.log(`📦 Found ${collections.length} collections to sync.`);

  for (const col of collections) {
    const colName = col.name;
    const count = await localConn.db.collection(colName).countDocuments();
    if (count === 0) {
      console.log(`⏭️ Skipping empty collection: ${colName}`);
      continue;
    }

    console.log(`🚀 Migrating ${count} documents for '${colName}'...`);
    const docs = await localConn.db.collection(colName).find({}).toArray();

    // Clear and batch insert to Atlas
    await atlasConn.db.collection(colName).deleteMany({});
    await atlasConn.db.collection(colName).insertMany(docs);
    console.log(`✅ Successfully synced ${docs.length} documents into Atlas collection: '${colName}'`);
  }

  console.log('\n🎉 ALL LOCAL TRANSACTIONS, ACCOUNTS, USERS, AND DATA SYNCED TO MONGODB ATLAS SUCCESSFULLY!');
  
  await localConn.close();
  await atlasConn.close();
  await mongoServer.stop();
  process.exit(0);
}

migrateData().catch(err => {
  console.error('\n❌ Migration error:', err.message);
  process.exit(1);
});
