#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function findMigratedData() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();

    // List all databases
    console.log('\n📊 Available databases:');
    const databases = await client.db().admin().listDatabases();
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });

    // Check the main database
    const db = client.db(process.env.MONGODB_DB || 'rubber-ducky');
    console.log(`\n🔍 Checking main database: ${db.databaseName}`);

    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(coll => {
      console.log(`  - ${coll.name}`);
    });

    // Check for conversations collection (might be named differently)
    for (const collName of ['conversations', 'chats', 'sessions']) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        if (count > 0) {
          console.log(`\n📋 Found ${count} documents in ${collName} collection`);

          // Sample a few documents
          const samples = await coll.find({}).limit(3).toArray();
          samples.forEach((doc, i) => {
            console.log(`  Sample ${i + 1}:`);
            console.log(`    ID: ${doc._id}`);
            console.log(`    Created: ${doc.createdAt || doc.created_at || 'unknown'}`);
            console.log(`    User: ${doc.createdBy || doc.userId || doc.user_id || 'unknown'}`);
            console.log(`    Messages: ${doc.messages ? doc.messages.length : 'unknown'}`);
          });
        }
      } catch (err) {
        // Collection doesn't exist, continue
      }
    }

    // Check for different database names
    for (const dbName of ['rubber-ducky-live', 'rubberducky', 'chat']) {
      try {
        const altDb = client.db(dbName);
        const altCollections = await altDb.listCollections().toArray();
        if (altCollections.length > 0) {
          console.log(`\n🔍 Found alternative database: ${dbName}`);
          altCollections.forEach(coll => {
            console.log(`  - ${coll.name}`);
          });
        }
      } catch (err) {
        // Database doesn't exist, continue
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findMigratedData();