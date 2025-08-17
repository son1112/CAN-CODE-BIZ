// Mock Mongoose module for Jest tests
const { ObjectId } = require('./bson');

// Mock Schema constructor
class MockSchema {
  constructor(definition, options = {}) {
    this.definition = definition;
    this.options = options;
    this.indexes = [];
    this.methods = {};
    this.statics = {};
    this.virtuals = {};
  }
  
  index(fields, options = {}) {
    this.indexes.push({ fields, options });
    return this;
  }
  
  method(name, fn) {
    this.methods[name] = fn;
    return this;
  }
  
  static(name, fn) {
    this.statics[name] = fn;
    return this;
  }
  
  virtual(name) {
    return {
      get: jest.fn(),
      set: jest.fn()
    };
  }
  
  pre(hook, fn) {
    return this;
  }
  
  post(hook, fn) {
    return this;
  }
}

// Mock Document class
class MockDocument {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = this._id || new ObjectId();
    this.isNew = true;
  }
  
  save = jest.fn(() => Promise.resolve(this));
  remove = jest.fn(() => Promise.resolve(this));
  deleteOne = jest.fn(() => Promise.resolve({ deletedCount: 1 }));
  toObject = jest.fn(() => ({ ...this }));
  toJSON = jest.fn(() => ({ ...this }));
  isModified = jest.fn(() => false);
  markModified = jest.fn();
  validate = jest.fn(() => Promise.resolve());
}

// Mock Model class
class MockModel extends MockDocument {
  constructor(data) {
    super(data);
  }
  
  static find = jest.fn(() => ({
    exec: () => Promise.resolve([]),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: (resolve) => resolve([])
  }));
  
  static findOne = jest.fn(() => ({
    exec: () => Promise.resolve(null),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(null)
  }));
  
  static findById = jest.fn(() => ({
    exec: () => Promise.resolve(null),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(null)
  }));
  
  static findOneAndUpdate = jest.fn(() => ({
    exec: () => Promise.resolve(null),
    then: (resolve) => resolve(null)
  }));
  
  static findOneAndDelete = jest.fn(() => ({
    exec: () => Promise.resolve(null),
    then: (resolve) => resolve(null)
  }));
  
  static create = jest.fn(() => Promise.resolve(new MockModel()));
  static insertMany = jest.fn(() => Promise.resolve([]));
  static updateOne = jest.fn(() => Promise.resolve({ modifiedCount: 1 }));
  static updateMany = jest.fn(() => Promise.resolve({ modifiedCount: 0 }));
  static deleteOne = jest.fn(() => Promise.resolve({ deletedCount: 1 }));
  static deleteMany = jest.fn(() => Promise.resolve({ deletedCount: 0 }));
  static countDocuments = jest.fn(() => Promise.resolve(0));
  static aggregate = jest.fn(() => Promise.resolve([]));
}

// Mock connection
const mockConnection = {
  readyState: 1, // Connected
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  close: jest.fn(() => Promise.resolve()),
  db: {
    admin: () => ({
      ping: jest.fn(() => Promise.resolve())
    })
  }
};

// Main mongoose mock
const mockMongoose = {
  Schema: MockSchema,
  Document: MockDocument,
  Model: MockModel,
  connection: mockConnection,
  
  // Models registry
  models: {},
  
  // Connection methods
  connect: jest.fn(() => Promise.resolve(mockConnection)),
  disconnect: jest.fn(() => Promise.resolve()),
  
  // Model creation
  model: jest.fn((name, schema) => {
    if (!schema) {
      // If no schema provided, return existing model
      return mockMongoose.models[name];
    }
    
    const ModelClass = class extends MockModel {};
    ModelClass.modelName = name;
    ModelClass.schema = schema;
    
    // Register the model
    mockMongoose.models[name] = ModelClass;
    
    return ModelClass;
  }),
  
  // Types
  Types: {
    ObjectId: ObjectId
  },
  
  // Schema types
  SchemaTypes: {
    String: String,
    Number: Number,
    Date: Date,
    Buffer: Buffer,
    Boolean: Boolean,
    Mixed: Object,
    ObjectId: ObjectId,
    Array: Array
  }
};

// Add default export
mockMongoose.default = mockMongoose;

module.exports = mockMongoose;