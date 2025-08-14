import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/api/auth',
    '/auth/signin',
    '/auth/error', 
    '/_next',
    '/favicon.ico'
  ]

  // Allow all NextAuth API routes to pass through
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For the root path, we'll rely on AuthGuard component instead of middleware
  // This prevents interference with OAuth callback processing
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}