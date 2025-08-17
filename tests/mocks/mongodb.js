// Mock MongoDB module for Jest tests
const { ObjectId } = require('./bson');

class MockMongoClient {
  constructor() {
    this.isConnected = false;
  }
  
  connect() {
    this.isConnected = true;
    return Promise.resolve(this);
  }
  
  close() {
    this.isConnected = false;
    return Promise.resolve();
  }
  
  db(name) {
    return new MockDb(name);
  }
}

class MockDb {
  constructor(name) {
    this.name = name;
  }
  
  collection(name) {
    return new MockCollection(name);
  }
}

class MockCollection {
  constructor(name) {
    this.name = name;
  }
  
  findOne = jest.fn(() => Promise.resolve(null));
  find = jest.fn(() => ({
    toArray: () => Promise.resolve([]),
    limit: () => ({ toArray: () => Promise.resolve([]) }),
    sort: () => ({ toArray: () => Promise.resolve([]) })
  }));
  insertOne = jest.fn(() => Promise.resolve({ insertedId: new ObjectId() }));
  insertMany = jest.fn(() => Promise.resolve({ insertedIds: [] }));
  updateOne = jest.fn(() => Promise.resolve({ modifiedCount: 1 }));
  updateMany = jest.fn(() => Promise.resolve({ modifiedCount: 0 }));
  deleteOne = jest.fn(() => Promise.resolve({ deletedCount: 1 }));
  deleteMany = jest.fn(() => Promise.resolve({ deletedCount: 0 }));
  countDocuments = jest.fn(() => Promise.resolve(0));
  createIndex = jest.fn(() => Promise.resolve('test_index'));
}

// Mock the main MongoDB exports
const mockMongoDB = {
  MongoClient: MockMongoClient,
  ObjectId,
  
  // Connection states
  ReadPreference: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary'
  }
};

module.exports = mockMongoDB;
module.exports.MongoClient = MockMongoClient;
module.exports.ObjectId = ObjectId;
module.exports.ReadPreference = mockMongoDB.ReadPreference;