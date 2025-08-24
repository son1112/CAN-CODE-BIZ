#!/usr/bin/env node

/**
 * Migration Script: Transfer demo-user data to real user account
 *
 * This script migrates all sessions, messages, stars, and other data
 * from 'demo-user' to the authenticated user account.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const TARGET_USER_ID = '68a33c99df2098d5e02a84e3'; // Your real user ID
const SOURCE_USER_ID = 'demo-user';

async function migrateData() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 Starting demo data migration...');
  console.log(`📋 Source: ${SOURCE_USER_ID}`);
  console.log(`🎯 Target: ${TARGET_USER_ID}`);

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Migration summary
    const summary = {
      sessions: 0,
      messages: 0,
      stars: 0,
      tags: 0,
      preferences: 0
    };

    // 1. Migrate Sessions
    console.log('\n📁 Migrating sessions...');
    const sessionsResult = await db.collection('sessions').updateMany(
      { createdBy: SOURCE_USER_ID },
      { $set: { createdBy: TARGET_USER_ID } }
    );
    summary.sessions = sessionsResult.modifiedCount;
    console.log(`   ✅ ${summary.sessions} sessions migrated`);

    // 2. Migrate Messages (if they exist in a separate collection)
    console.log('\n💬 Migrating messages...');
    const messagesResult = await db.collection('messages').updateMany(
      { userId: SOURCE_USER_ID },
      { $set: { userId: TARGET_USER_ID } }
    );
    summary.messages = messagesResult.modifiedCount;
    console.log(`   ✅ ${summary.messages} messages migrated`);

    // 3. Migrate Stars (handle duplicates)
    console.log('\n⭐ Migrating stars...');
    const demoStars = await db.collection('stars').find({ userId: SOURCE_USER_ID }).toArray();
    let starsMigrated = 0;
    let starsSkipped = 0;

    for (const star of demoStars) {
      try {
        // Check if star already exists for target user
        const existing = await db.collection('stars').findOne({
          userId: TARGET_USER_ID,
          itemId: star.itemId,
          itemType: star.itemType
        });

        if (!existing) {
          // Update the star to new user ID
          await db.collection('stars').updateOne(
            { _id: star._id },
            { $set: { userId: TARGET_USER_ID } }
          );
          starsMigrated++;
        } else {
          // Delete the duplicate demo star
          await db.collection('stars').deleteOne({ _id: star._id });
          starsSkipped++;
        }
      } catch (error) {
        console.log(`   ⚠️  Error with star ${star.itemType}:${star.itemId} - ${error.message}`);
        starsSkipped++;
      }
    }

    summary.stars = starsMigrated;
    console.log(`   ✅ ${starsMigrated} stars migrated, ${starsSkipped} duplicates removed`);

    // 4. Migrate Tags
    console.log('\n🏷️  Migrating tags...');
    const tagsResult = await db.collection('tags').updateMany(
      { userId: SOURCE_USER_ID },
      { $set: { userId: TARGET_USER_ID } }
    );
    summary.tags = tagsResult.modifiedCount;
    console.log(`   ✅ ${summary.tags} tags migrated`);

    // 5. Migrate User Preferences
    console.log('\n⚙️  Migrating preferences...');
    const preferencesResult = await db.collection('preferences').updateMany(
      { userId: SOURCE_USER_ID },
      { $set: { userId: TARGET_USER_ID } }
    );
    summary.preferences = preferencesResult.modifiedCount;
    console.log(`   ✅ ${summary.preferences} preferences migrated`);

    // 6. Check for any other collections that might have user data
    console.log('\n🔍 Checking for other collections...');
    const collections = await db.listCollections().toArray();
    const userCollections = collections.filter(col =>
      !['sessions', 'messages', 'stars', 'tags', 'preferences', 'accounts', 'sessions', 'users', 'verification_tokens'].includes(col.name)
    );

    for (const collection of userCollections) {
      console.log(`   🔍 Checking collection: ${collection.name}`);
      const sampleDoc = await db.collection(collection.name).findOne({
        $or: [
          { userId: SOURCE_USER_ID },
          { createdBy: SOURCE_USER_ID },
          { user: SOURCE_USER_ID }
        ]
      });

      if (sampleDoc) {
        console.log(`   ⚠️  Found potential user data in ${collection.name} - manual review needed`);
        console.log(`   📄 Sample: ${JSON.stringify(sampleDoc, null, 2)}`);
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('═══════════════════════');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`   ${key.padEnd(12)}: ${count} records`);
    });

    const totalMigrated = Object.values(summary).reduce((sum, count) => sum + count, 0);
    console.log(`   ${'TOTAL'.padEnd(12)}: ${totalMigrated} records`);

    if (totalMigrated > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log(`   All demo data has been transferred to user: ${TARGET_USER_ID}`);
    } else {
      console.log('\n📝 No data found to migrate - demo-user may be empty');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrateData().catch(console.error);