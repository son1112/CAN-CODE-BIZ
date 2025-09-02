# API Key Authentication System

## Overview
Rubber Ducky Live now supports API key authentication for service-to-service integration and external application access. This system enables secure, scalable API access without requiring browser-based authentication sessions.

## Features

### ✅ **Implemented Features**
- **Secure Key Generation**: Cryptographically secure keys with checksums
- **Scope-Based Authorization**: Granular permissions for different API operations
- **Rate Limiting**: Per-key request limits (configurable)
- **IP Whitelisting**: Restrict key usage to specific IP addresses
- **Usage Tracking**: Monitor key usage, last access times, and request counts
- **Key Expiration**: Configurable expiration dates for security
- **Dual Authentication**: Works alongside existing session-based auth

### 🔒 **Security Features**
- **SHA-256 Hashing**: Keys are hashed with SHA-256 before storage
- **Format Validation**: Keys use structured format with checksums
- **Scope Validation**: Each request checks required permissions
- **IP Restrictions**: Optional IP whitelisting for additional security
- **Automatic Expiration**: Keys can be set to expire automatically

## API Key Format

### Key Structure
```
rbl_live_[32_chars_base64url]_[4_chars_checksum]
```

**Example:**
```
rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d
```

### Key Components
- **`rbl_live_`**: Fixed prefix identifying Rubber Ducky Live keys
- **32 characters**: Base64URL-encoded random data (24 bytes)
- **4 characters**: SHA-256 checksum for integrity verification

## Available Scopes

| Scope | Description |
|-------|-------------|
| `chat:read` | Read chat messages and conversations |
| `chat:write` | Send messages and create conversations |
| `sessions:read` | Read session data and history |
| `sessions:write` | Create and modify sessions |
| `sessions:delete` | Delete sessions |
| `agents:read` | Read agent configurations |
| `agents:write` | Create and modify agents |
| `export:pdf` | Export conversations to PDF |
| `export:word` | Export conversations to Word documents |
| `tags:read` | Read message tags |
| `tags:write` | Create and modify tags |
| `stars:read` | Read starred messages |
| `stars:write` | Star and unstar messages |
| `admin:read` | Administrative read access |
| `admin:write` | Administrative write access (includes all scopes) |

## API Key Management

### Create API Key
```http
POST /api/api-keys
Content-Type: application/json
Authorization: [Session or existing API key]

{
  "name": "My Application Key",
  "description": "API key for external application integration",
  "scopes": ["chat:read", "sessions:read", "sessions:write"],
  "expiresInDays": 30,
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "ipWhitelist": ["192.168.1.100", "10.0.0.0/24"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "apiKey": {
    "keyId": "rbl_ff6c2cf117d84bab",
    "name": "My Application Key",
    "scopes": ["chat:read", "sessions:read", "sessions:write"],
    "expiresAt": "2025-09-30T21:01:55.422Z",
    "keyPreview": "rbl_live_NoXwba1K****",
    "rateLimit": {
      "requestsPerMinute": 60,
      "requestsPerHour": 1000,
      "requestsPerDay": 10000
    }
  },
  "rawKey": "rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d",
  "warning": "Store this API key securely. It will not be shown again."
}
```

### List API Keys
```http
GET /api/api-keys
Authorization: [Session or existing API key]
```

**Response:**
```json
{
  "success": true,
  "apiKeys": [
    {
      "keyId": "rbl_ff6c2cf117d84bab",
      "name": "My Application Key",
      "scopes": ["chat:read", "sessions:read"],
      "isActive": true,
      "expiresAt": "2025-09-30T21:01:55.422Z",
      "lastUsedAt": "2025-08-31T21:07:11.516Z",
      "usageCount": 42,
      "keyPreview": "rbl_live_NoXwba1K****",
      "createdAt": "2025-08-31T21:01:55.435Z"
    }
  ],
  "availableScopes": { /* scope definitions */ }
}
```

### Revoke API Key
```http
DELETE /api/api-keys/{keyId}
Authorization: [Session or existing API key]
```

## Using API Keys

### Authentication Methods

#### Option 1: X-API-Key Header (Recommended)
```http
GET /api/sessions
X-API-Key: rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d
Content-Type: application/json
```

#### Option 2: Authorization Bearer Header
```http
GET /api/sessions
Authorization: Bearer rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d
Content-Type: application/json
```

### Example Usage

#### JavaScript/Node.js
```javascript
const apiKey = 'rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d';

// Get user sessions
const response = await fetch('http://localhost:3000/api/sessions', {
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
});

const sessions = await response.json();

// Send chat message
const chatResponse = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello from API!' }
    ]
  })
});
```

#### Python
```python
import requests

api_key = 'rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d'
headers = {
    'X-API-Key': api_key,
    'Content-Type': 'application/json'
}

# Get sessions
response = requests.get('http://localhost:3000/api/sessions', headers=headers)
sessions = response.json()

# Send chat message
chat_data = {
    'messages': [
        {'role': 'user', 'content': 'Hello from Python!'}
    ]
}
response = requests.post('http://localhost:3000/api/chat', headers=headers, json=chat_data)
```

#### cURL
```bash
# Get sessions
curl -X GET http://localhost:3000/api/sessions \
  -H "X-API-Key: rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d" \
  -H "Content-Type: application/json"

# Send chat message
curl -X POST http://localhost:3000/api/chat \
  -H "X-API-Key: rbl_live_NoXwba1KXrA6J3Oh4CFBkwMfellJcFjb_RI1d" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello from cURL!"}]}'
```

## Rate Limiting

### Default Limits
- **Per Minute**: 60 requests
- **Per Hour**: 1,000 requests  
- **Per Day**: 10,000 requests

### Custom Limits
Rate limits can be configured per API key during creation:

```json
{
  "rateLimit": {
    "requestsPerMinute": 120,
    "requestsPerHour": 5000,
    "requestsPerDay": 50000
  }
}
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693516800
```

## Error Responses

### Invalid API Key
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid API key",
  "code": "UNAUTHORIZED"
}
```

### Insufficient Scope
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Insufficient scope: sessions:write required",
  "code": "FORBIDDEN"
}
```

### Rate Limit Exceeded
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Expired API Key
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "API key expired",
  "code": "UNAUTHORIZED"
}
```

## Security Best Practices

### For API Key Holders
1. **Store Securely**: Never commit API keys to version control
2. **Use Environment Variables**: Store keys in environment variables
3. **Rotate Regularly**: Create new keys and revoke old ones periodically
4. **Minimal Scopes**: Only request the minimum scopes needed
5. **IP Whitelisting**: Use IP restrictions when possible
6. **Monitor Usage**: Regularly check key usage and watch for anomalies

### For Applications
1. **HTTPS Only**: Always use HTTPS in production
2. **Error Handling**: Implement proper error handling for auth failures
3. **Retry Logic**: Implement exponential backoff for rate limit errors
4. **Key Management**: Build secure key storage and rotation systems
5. **Logging**: Log authentication attempts (but never log the keys themselves)

## Database Schema

### ApiKey Model
```typescript
interface IApiKey {
  keyId: string;           // Unique identifier
  name: string;            // Human-readable name
  description?: string;    // Optional description
  hashedKey: string;       // SHA-256 hash (never exposed)
  keyPreview: string;      // First 8 chars for identification
  userId: string;          // Owner user ID
  scopes: string[];        // Permissions array
  isActive: boolean;       // Active/revoked status
  expiresAt?: Date;        // Optional expiration
  lastUsedAt?: Date;       // Last usage timestamp
  usageCount: number;      // Request counter
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  ipWhitelist?: string[];  // Optional IP restrictions
  createdAt: Date;
  updatedAt: Date;
}
```

## Monitoring & Analytics

### Usage Tracking
- **Request Counts**: Total requests per key
- **Last Used**: Timestamp of most recent usage
- **IP Tracking**: Monitor usage patterns by IP
- **Scope Usage**: Track which scopes are used most frequently

### Health Metrics
- **Active Keys**: Number of non-revoked, non-expired keys
- **Key Age**: Distribution of key creation dates
- **Failed Attempts**: Invalid key usage attempts
- **Rate Limit Hits**: Keys hitting rate limits

## Migration Guide

### From Session-Only to API Keys

**Before:**
```javascript
// Only session-based authentication
const response = await fetch('/api/sessions', {
  credentials: 'include'  // Sends session cookie
});
```

**After:**
```javascript
// API key authentication (recommended for external apps)
const response = await fetch('/api/sessions', {
  headers: {
    'X-API-Key': 'rbl_live_your_key_here'
  }
});

// Session authentication still works for browser-based apps
const response = await fetch('/api/sessions', {
  credentials: 'include'
});
```

## Roadmap

### Planned Features
- [ ] **Rate Limit Headers**: Include rate limit info in response headers
- [ ] **Key Rotation**: Automatic key rotation functionality
- [ ] **Usage Analytics**: Detailed usage analytics dashboard
- [ ] **Webhook Support**: Webhook endpoints with API key authentication
- [ ] **Batch Operations**: Bulk key management operations
- [ ] **Audit Logging**: Comprehensive audit trail for key usage

### Future Enhancements
- [ ] **JWT Tokens**: Support for JWT-based authentication
- [ ] **OAuth2 Integration**: OAuth2 provider capabilities
- [ ] **Key Templates**: Pre-configured key templates for common use cases
- [ ] **Multi-Tenant Support**: Organization-level key management

---

**Status**: ✅ Production Ready  
**Last Updated**: August 31, 2025  
**API Version**: 1.0  
**Documentation Version**: 1.0