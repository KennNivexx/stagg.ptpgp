import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/login/,
  /^\/career/,
  /^\/e-procurement/,
  /^\/api\//,
  /^\/_next\//,
  /^\/static\//,
  /^\/favicon/,
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => p.test(pathname));
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Resolve session first (needed for both login redirect and role checks)
  const sessionToken = request.cookies.get('session_token')?.value;

  let role: string | null = null;

  if (sessionToken) {
    const session = await verifySession(sessionToken);
    if (session && session.role) {
      role = session.role.toLowerCase();
    }
  }

  // Already logged in and visiting /login — redirect to dashboard
  if (path === '/login' && role) {
    if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin', request.url));
    if (role === 'hrd') return NextResponse.redirect(new URL('/hrd', request.url));
    if (role === 'employee') return NextResponse.redirect(new URL('/employee', request.url));
    if (role === 'director') return NextResponse.redirect(new URL('/director', request.url));
    if (role === 'department_manager') return NextResponse.redirect(new URL('/department', request.url));
    if (role === 'applicant') return NextResponse.redirect(new URL('/applicant', request.url));
  }

  // Public paths — allow through immediately (including /login for unauthenticated)
  if (isPublic(path)) return NextResponse.next();

  // No valid session — redirect to login
  if (!role) {
    const resp = NextResponse.redirect(new URL('/login', request.url));
    resp.cookies.delete('session_token');
    resp.cookies.delete('user_role');
    resp.cookies.delete('user_name');
    resp.cookies.delete('user_email');
    resp.cookies.delete('user_id');
    return resp;
  }

  // Role-based routing
  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') return deny(request);
  }

  if (path.startsWith('/hrd')) {
    if (role !== 'hrd' && role !== 'superadmin') return deny(request);
  }

  if (path.startsWith('/employee')) {
    if (role !== 'employee' && role !== 'hrd' && role !== 'superadmin') return deny(request);
  }

  if (path.startsWith('/director')) {
    if (role !== 'director' && role !== 'superadmin') return deny(request);
  }

  if (path.startsWith('/department')) {
    if (role !== 'department_manager' && role !== 'superadmin') return deny(request);
  }

  if (path.startsWith('/applicant')) {
    if (role !== 'applicant') return deny(request);
  }

  return NextResponse.next();
}

function deny(request: NextRequest) {
  const resp = NextResponse.redirect(new URL('/login', request.url));
  resp.cookies.delete('session_token');
  resp.cookies.delete('user_role');
  return resp;
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/hrd/:path*',
    '/employee/:path*',
    '/director/:path*',
    '/department/:path*',
    '/applicant/:path*',
    '/login',
    '/api/:path*',
  ],
};
