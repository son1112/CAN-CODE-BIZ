/**
 * CORS preflight handler
 * Handles OPTIONS requests for cross-origin API calls
 */

import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin');
  
  // Allow origins based on environment
  const allowedOrigins = process.env.NODE_ENV === 'development' 
    ? ['*'] 
    : [
        'https://can.code',
        'https://www.can.code',
        'https://storytimestar.ai',
        'https://www.storytimestar.ai',
        'https://replayready.com',
        'https://www.replayready.com'
      ];

  const isOriginAllowed = process.env.NODE_ENV === 'development' || 
    (origin && allowedOrigins.includes(origin));

  const response = new NextResponse(null, { status: 200 });

  // Set CORS headers
  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}