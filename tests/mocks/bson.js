// Mock BSON module for Jest tests
// This resolves ES module import issues with the BSON package

class MockObjectId {
  constructor(id) {
    this._id = id || '507f1f77bcf86cd799439011';
  }

  toString() {
    return this._id;
  }

  toHexString() {
    return this._id;
  }

  static isValid(id) {
    return typeof id === 'string' && id.length === 24;
  }
}

class MockBinary {
  constructor(buffer) {
    this.buffer = buffer;
  }
}

class MockDecimal128 {
  constructor(value) {
    this.value = value;
  }
}

class MockLong {
  constructor(low, high) {
    this.low = low || 0;
    this.high = high || 0;
  }
}

class MockTimestamp {
  constructor(low, high) {
    this.low = low || 0;
    this.high = high || 0;
  }
}

class MockCode {
  constructor(code, scope) {
    this.code = code;
    this.scope = scope;
  }
}

class MockDBRef {
  constructor(collection, id, db) {
    this.collection = collection;
    this.id = id;
    this.db = db;
  }
}

// Mock the main BSON object and utilities
const mockBSON = {
  ObjectId: MockObjectId,
  Binary: MockBinary,
  Decimal128: MockDecimal128,
  Long: MockLong,
  Timestamp: MockTimestamp,
  Code: MockCode,
  DBRef: MockDBRef,

  // Utility functions
  serialize: jest.fn(() => Buffer.from('mock-serialized')),
  deserialize: jest.fn(() => ({ mocked: true })),
  calculateObjectSize: jest.fn(() => 100),

  // Type constants
  BSONType: {
    DOUBLE: 1,
    STRING: 2,
    OBJECT: 3,
    ARRAY: 4,
    BINARY: 5,
    UNDEFINED: 6,
    OBJECTID: 7,
    BOOLEAN: 8,
    DATE: 9,
    NULL: 10,
    REGEX: 11,
    DBPOINTER: 12,
    JAVASCRIPT: 13,
    SYMBOL: 14,
    JAVASCRIPT_WITH_SCOPE: 15,
    INT: 16,
    TIMESTAMP: 17,
    LONG: 18,
    DECIMAL128: 19,
    MIN_KEY: -1,
    MAX_KEY: 127
  }
};

// Export both named and default exports for compatibility
module.exports = mockBSON;
module.exports.BSON = mockBSON;
module.exports.ObjectId = MockObjectId;
module.exports.Binary = MockBinary;
module.exports.Decimal128 = MockDecimal128;
module.exports.Long = MockLong;
module.exports.Timestamp = MockTimestamp;
module.exports.Code = MockCode;
module.exports.DBRef = MockDBRef;
module.exports.serialize = mockBSON.serialize;
module.exports.deserialize = mockBSON.deserialize;
module.exports.calculateObjectSize = mockBSON.calculateObjectSize;
module.exports.BSONType = mockBSON.BSONType;

// Default export
module.exports.default = mockBSON;