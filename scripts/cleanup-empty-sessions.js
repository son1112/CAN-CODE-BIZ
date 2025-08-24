#!/usr/bin/env node

/**
 * Cleanup script to remove sessions with 0 messages
 * This removes empty sessions created during testing
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanupEmptySessions() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db();
    const sessionsCollection = db.collection('sessions');

    // Find sessions with empty messages array or no messages field
    const emptySessionsQuery = {
      $or: [
        { messages: { $exists: false } },
        { messages: { $size: 0 } }
      ]
    };

    // Count empty sessions first
    const emptySessionsCount = await sessionsCollection.countDocuments(emptySessionsQuery);
    console.log(`📊 Found ${emptySessionsCount} empty sessions to remove`);

    if (emptySessionsCount === 0) {
      console.log('✅ No empty sessions found - database is clean');
      return;
    }

    // Remove empty sessions
    const result = await sessionsCollection.deleteMany(emptySessionsQuery);
    console.log(`🗑️ Removed ${result.deletedCount} empty sessions`);

    // Verify cleanup
    const remainingEmptyCount = await sessionsCollection.countDocuments(emptySessionsQuery);
    const totalSessionsCount = await sessionsCollection.countDocuments();

    console.log(`📈 Remaining sessions: ${totalSessionsCount}`);
    console.log(`🧹 Cleanup complete: ${remainingEmptyCount} empty sessions remaining`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupEmptySessions().catch(console.error);