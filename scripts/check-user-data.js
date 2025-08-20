#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function checkUserData() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(process.env.MONGODB_DB || 'rubber-ducky');
    
    // Check sessions
    console.log('\n📋 Checking sessions...');
    const sessionsCollection = db.collection('sessions');
    const allSessions = await sessionsCollection.find({}).toArray();
    console.log(`Total sessions found: ${allSessions.length}`);
    
    // Group by createdBy
    const sessionsByUser = {};
    allSessions.forEach(session => {
      const userId = session.createdBy || 'null';
      if (!sessionsByUser[userId]) {
        sessionsByUser[userId] = 0;
      }
      sessionsByUser[userId]++;
    });
    
    console.log('Sessions by user ID:');
    Object.entries(sessionsByUser).forEach(([userId, count]) => {
      console.log(`  ${userId}: ${count} sessions`);
    });
    
    // Check users collection
    console.log('\n👤 Checking users...');
    const usersCollection = db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Total users found: ${allUsers.length}`);
    
    allUsers.forEach(user => {
      console.log(`  User ID: ${user._id}, Email: ${user.email}, Name: ${user.name}`);
    });
    
    // Check for specific user if USER_ID environment variable is provided
    if (process.env.USER_ID) {
      console.log(`\n🔐 Checking specific user ID: ${process.env.USER_ID}`);
      
      const currentUser = await usersCollection.findOne({ _id: process.env.USER_ID });
      if (currentUser) {
        console.log('✅ Specified user found in database');
        console.log(`   Email: ${currentUser.email}`);
        console.log(`   Name: ${currentUser.name}`);
      } else {
        console.log('❌ Specified user NOT found in database');
      }
    } else {
      console.log('\n💡 To check a specific user, set USER_ID environment variable');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserData();