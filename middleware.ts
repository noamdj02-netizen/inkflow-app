/**
 * Vercel Edge Middleware
 * 
 * Security Headers & Route Protection
 * - Adds security headers to all responses
 * - Protects /dashboard routes (redirects to /login if not authenticated)
 * 
 * Note: This runs on Vercel Edge Runtime (not Next.js)
 */

// Security headers configuration
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const { pathname } = url;

  // Create response (fetch the original request)
  const response = new Response();

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Protect /dashboard routes
  // Note: In Vite/React Router, authentication is handled client-side via ProtectedRoute
  // This middleware adds an extra layer of protection at the edge
  if (pathname.startsWith('/dashboard')) {
    // Check for auth token in cookie or header
    const cookies = request.headers.get('cookie') || '';
    const authToken = 
      cookies.match(/sb-access-token=([^;]+)/)?.[1] ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      // Redirect to login if no token found
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return Response.redirect(loginUrl.toString(), 302);
    }
  }

  // For non-redirects, we need to fetch the original request and add headers
  // In Vercel Edge Middleware, we return a modified response
  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - static files (images, etc.)
     * - favicon.ico
     */
    '/((?!api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
