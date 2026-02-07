import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, getIdentifierFromRequest } from '@/lib/rate-limit';

/** Routes réservées aux utilisateurs connectés (Sinon → redirect /login) */
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'] as const;

/** Routes interdites si déjà connecté (Sinon → redirect /dashboard) */
const GUEST_ONLY_PATHS = ['/login', '/register'] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isRateLimitedPath(pathname: string): boolean {
  if (pathname.startsWith('/api/bookings') || pathname.startsWith('/api/availability')) return true;
  if (pathname === '/api/creneaux' || pathname === '/login' || pathname === '/register') return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate limiting (avant auth) pour éviter abus sur réservation / login
  if (isRateLimitedPath(pathname)) {
    const identifier = getIdentifierFromRequest(request);
    const key = `rl:${pathname}:${identifier}`;
    const limit = pathname === '/login' || pathname === '/register' ? 15 : 30;
    const result = rateLimit(key, limit);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Trop de requêtes. Réessayez plus tard.',
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          },
        }
      );
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protéger /dashboard et /onboarding : accès réservé aux utilisateurs connectés
  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = new URL('/login', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
    return redirectResponse;
  }

  // 2. Login/Register : si déjà connecté, rediriger vers le dashboard
  if (isGuestOnlyPath(pathname) && user) {
    const redirectUrl = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
