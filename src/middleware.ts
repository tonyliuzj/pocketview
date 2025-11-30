import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('pocketview_session');
  const { pathname } = request.nextUrl;

  // Check if user is trying to access admin page
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value);

      // Check if session is expired
      if (Date.now() > sessionData.expiresAt) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('pocketview_session');
        return response;
      }
    } catch {
      // Invalid session cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('pocketview_session');
      return response;
    }
  }

  // Redirect to admin if already logged in and trying to access login page
  if (pathname === '/login' && sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);

      if (Date.now() <= sessionData.expiresAt) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch {
      // Invalid session, continue to login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
