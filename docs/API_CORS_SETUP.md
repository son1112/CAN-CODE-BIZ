# CORS Configuration for External API Access

## Overview
Rubber Ducky Live API now supports cross-origin requests (CORS) to enable integration with external applications. This configuration allows other domains to make authenticated API calls to the Rubber Ducky Live platform.

## Configuration Details

### Allowed Origins
- **Development Mode**: `*` (all origins allowed for testing)
- **Production Mode**: `https://can.code` (restricted to CAN-CODE ecosystem)

### Supported Methods
- `GET` - Read operations (sessions, agents, etc.)
- `POST` - Create operations (new sessions, messages)
- `PUT` - Update operations (session names, preferences)
- `DELETE` - Delete operations (sessions, tags)
- `OPTIONS` - Preflight requests
- `PATCH` - Partial updates

### Allowed Headers
- `Content-Type` - Request content type (application/json)
- `Authorization` - Authentication tokens/session cookies
- `X-API-Key` - Future API key authentication (planned)
- `X-Requested-With` - AJAX request identification
- `Accept` - Response format specification
- `Origin` - Request origin domain
- `Cache-Control` - Cache directives
- `Pragma` - Legacy cache control

### Security Settings
- **Credentials**: `true` - Allows cookies/auth headers in cross-origin requests
- **Max Age**: `86400` seconds (24 hours) - Preflight cache duration

## Implementation Files

### 1. Next.js Headers Configuration
**File**: `next.config.js`
```javascript
{
  source: '/api/:path*',
  headers: [
    // ... existing headers
    {
      key: 'Access-Control-Allow-Origin',
      value: process.env.NODE_ENV === 'development' ? '*' : 'https://can.code'
    },
    {
      key: 'Access-Control-Allow-Methods',
      value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    },
    {
      key: 'Access-Control-Allow-Headers',
      value: 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, Cache-Control, Pragma'
    },
    {
      key: 'Access-Control-Allow-Credentials',
      value: 'true'
    },
    {
      key: 'Access-Control-Max-Age',
      value: '86400'
    }
  ]
}
```

### 2. OPTIONS Handler
**File**: `app/api/cors/route.ts`
- Handles preflight OPTIONS requests
- Dynamic origin validation based on environment
- Supports expanded ecosystem domains in production

## Testing CORS Configuration

### 1. Basic CORS Headers Test
```bash
curl -I http://localhost:3000/api/health -H "Origin: https://example.com"
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, ...
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### 2. Preflight Request Test
```bash
curl -X OPTIONS -I http://localhost:3000/api/sessions \
  -H "Origin: https://storytimestar.ai" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Expected Response:**
- Status: `204 No Content`
- All CORS headers present
- `Allow: GET, HEAD, OPTIONS, POST`

## JavaScript Client Example

### Making Cross-Origin API Calls
```javascript
// Example: Create a new session from external application
const response = await fetch('http://localhost:3000/api/sessions', {
  method: 'POST',
  credentials: 'include', // Important: Include cookies/auth
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://storytimestar.ai'
  },
  body: JSON.stringify({
    name: 'External Session',
    tags: ['external', 'api-integration']
  })
});

const data = await response.json();
console.log('Session created:', data.session);
```

### Handling CORS Errors
```javascript
fetch('http://localhost:3000/api/sessions', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.catch(error => {
  if (error.message.includes('CORS')) {
    console.error('CORS error - check origin configuration');
  }
  console.error('API request failed:', error);
});
```

## Production Environment

### Allowed Domains (Production)
When deployed to production, the following domains are allowed:
- `https://can.code` - Main CAN-CODE platform
- `https://www.can.code` - WWW subdomain
- `https://storytimestar.ai` - StoryTimeStar integration
- `https://www.storytimestar.ai` - StoryTimeStar WWW subdomain
- `https://replayready.com` - ReplayReady integration
- `https://www.replayready.com` - ReplayReady WWW subdomain

### Environment Variables
No additional environment variables are required. The CORS configuration automatically adapts based on `NODE_ENV`.

## Security Considerations

### Credential Handling
- `Access-Control-Allow-Credentials: true` enables cookie-based authentication
- External applications can use existing NextAuth.js sessions
- API keys (future implementation) will work with CORS

### Origin Validation
- Development: All origins allowed (`*`) for testing flexibility
- Production: Strict whitelist of trusted CAN-CODE ecosystem domains
- Invalid origins receive standard CORS rejection

### Headers Security
- Only necessary headers are allowed in cross-origin requests
- `X-API-Key` header prepared for future API key authentication
- Standard security headers (`X-Frame-Options`, etc.) remain enforced

## Troubleshooting

### Common Issues

1. **CORS Error: "Origin not allowed"**
   - Check if your domain is in the production whitelist
   - Ensure you're testing with correct environment (dev vs prod)

2. **Credentials Not Included**
   - Add `credentials: 'include'` to fetch requests
   - Verify `Access-Control-Allow-Credentials: true` in response

3. **Preflight Request Failing**
   - Check if all required headers are in `Access-Control-Request-Headers`
   - Verify method is in `Access-Control-Allow-Methods`

4. **Authentication Issues**
   - CORS doesn't bypass authentication requirements
   - External applications still need valid NextAuth.js sessions or API keys

### Debug Commands
```bash
# Test basic CORS
curl -I http://localhost:3000/api/health -H "Origin: https://your-domain.com"

# Test preflight
curl -X OPTIONS http://localhost:3000/api/sessions \
  -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST"

# Test authenticated endpoint
curl -X GET http://localhost:3000/api/sessions \
  -H "Origin: https://your-domain.com" \
  -H "Cookie: next-auth.session-token=your-session-token"
```

## Future Enhancements

1. **API Key Authentication**: Full API key system with CORS support
2. **Rate Limiting**: Per-origin rate limiting for production security
3. **Domain Management**: Dynamic domain whitelist via admin interface
4. **Monitoring**: CORS request logging and analytics

---

**Status**: ✅ Implemented and tested
**Last Updated**: August 31, 2025
**Environment**: Development and Production ready