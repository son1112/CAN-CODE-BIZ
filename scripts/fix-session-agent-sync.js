#!/usr/bin/env node

/**
 * Fix Session Agent Sync - Database Repair Script
 *
 * This script fixes the database inconsistency where session's lastAgentUsed field
 * doesn't match the most recent agent used in the message history.
 *
 * The script will:
 * 1. Find all sessions with messages
 * 2. For each session, find the most recent message with an agent
 * 3. Update the session's lastAgentUsed field to match
 *
 * Usage: node scripts/fix-session-agent-sync.js [--dry-run]
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'rubber-ducky';

async function fixSessionAgentSync(dryRun = false) {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔧 Starting Session Agent Sync Fix...');
  console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`🔗 Connected to MongoDB: ${MONGODB_URI}`);
    const db = client.db(DATABASE_NAME);
    console.log(`📚 Using database: ${DATABASE_NAME}`);

    const sessionsCollection = db.collection('sessions');

    // Debug: Check total session count first
    const totalSessions = await sessionsCollection.countDocuments();
    console.log(`📈 Total sessions in database: ${totalSessions}`);

    // Get all sessions that have messages
    const sessions = await sessionsCollection.find({
      "messages.0": { $exists: true }
    }).toArray();
    console.log(`📋 Found ${sessions.length} sessions with messages to check`);

    let updatedCount = 0;
    let inconsistentSessions = [];

    for (const session of sessions) {
      console.log(`\n🔍 Checking session: ${session._id}`);

      // Get messages from the session document and find the most recent one with an agent
      const messages = session.messages || [];

      // Filter messages that have agentUsed field and sort by timestamp (most recent first)
      const messagesWithAgents = messages
        .filter(msg => msg.agentUsed && msg.agentUsed !== null)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (messagesWithAgents.length === 0) {
        console.log('  ⚪ No messages with agents found');
        continue;
      }

      const mostRecentAgent = messagesWithAgents[0].agentUsed;
      const currentLastAgent = session.lastAgentUsed;

      console.log(`  📝 Current session.lastAgentUsed: ${currentLastAgent}`);
      console.log(`  🔄 Most recent message agent: ${mostRecentAgent}`);
      console.log(`  📊 Recent message agents:`);
      messagesWithAgents.slice(0, 5).forEach((msg, index) => {
        console.log(`    ${index}: ${msg.role} - ${msg.agentUsed} (${msg.timestamp})`);
      });

      // Check for inconsistency
      if (currentLastAgent !== mostRecentAgent) {
        console.log(`  ⚠️  INCONSISTENCY DETECTED!`);
        inconsistentSessions.push({
          sessionId: session._id.toString(),
          currentAgent: currentLastAgent,
          correctAgent: mostRecentAgent,
          messageCount: messagesWithAgents.length
        });

        if (!dryRun) {
          // Update the session record
          const updateResult = await sessionsCollection.updateOne(
            { _id: session._id },
            {
              $set: {
                lastAgentUsed: mostRecentAgent,
                updatedAt: new Date()
              }
            }
          );

          if (updateResult.modifiedCount > 0) {
            console.log(`  ✅ Updated session.lastAgentUsed from "${currentLastAgent}" to "${mostRecentAgent}"`);
            updatedCount++;
          } else {
            console.log(`  ❌ Failed to update session`);
          }
        } else {
          console.log(`  📝 Would update: "${currentLastAgent}" → "${mostRecentAgent}"`);
          updatedCount++;
        }
      } else {
        console.log(`  ✅ Session is consistent`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total sessions checked: ${sessions.length}`);
    console.log(`  Inconsistent sessions found: ${inconsistentSessions.length}`);
    console.log(`  Sessions ${dryRun ? 'that would be ' : ''}updated: ${updatedCount}`);

    if (inconsistentSessions.length > 0) {
      console.log('\n🔍 Inconsistent Sessions Details:');
      inconsistentSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Session ${session.sessionId}:`);
        console.log(`     Current: ${session.currentAgent}`);
        console.log(`     Correct: ${session.correctAgent}`);
        console.log(`     Messages: ${session.messageCount}`);
      });
    }

    if (dryRun) {
      console.log('\n💡 To apply these changes, run: node scripts/fix-session-agent-sync.js');
    } else {
      console.log('\n🎉 Session agent sync repair completed!');
    }

  } catch (error) {
    console.error('❌ Error during session agent sync fix:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run the fix
fixSessionAgentSync(dryRun).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});