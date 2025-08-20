/**
 * Native MongoDB connection with connection pooling for high-performance operations
 * Used for operations that need raw MongoDB performance (like agent loading)
 */
import { MongoClient, Db } from 'mongodb';

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var mongoNative: MongoCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'rubber-ducky';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoNative;

if (!cached) {
  cached = global.mongoNative = { client: null, db: null, promise: null };
}

export async function getMongoDb(): Promise<Db> {
  if (cached!.db) {
    return cached!.db;
  }

  if (!cached!.promise) {
    const options = {
      maxPoolSize: 10, // Maximum connections in pool
      minPoolSize: 2,  // Minimum connections to maintain
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try to connect
      socketTimeoutMS: 45000 // How long to wait for network operations
      // Note: bufferMaxEntries is a Mongoose option, not available for native MongoDB driver
    };

    cached!.promise = MongoClient.connect(MONGODB_URI!, options);
  }

  try {
    if (!cached!.client) {
      cached!.client = await cached!.promise;
      cached!.db = cached!.client.db(MONGODB_DB);
    }
  } catch (e) {
    cached!.promise = null;
    cached!.client = null;
    cached!.db = null;
    throw e;
  }

  return cached!.db!;
}

// Cleanup function for graceful shutdown
export async function closeMongoConnection() {
  if (cached?.client) {
    await cached.client.close();
    cached.client = null;
    cached.db = null;
    cached.promise = null;
  }
}