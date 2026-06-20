import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionToken = request.cookies.get('session_token')?.value;

  let role: string | null = null;

  if (sessionToken) {
    const session = await verifySession(sessionToken);
    if (session && session.role) {
      role = (session.role as string).toLowerCase();
    }
  }

  function deny() {
    const resp = NextResponse.redirect(new URL('/login', request.url));
    resp.cookies.delete('session_token');
    resp.cookies.delete('user_role');
    return resp;
  }

  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') return deny();
  }

  if (path.startsWith('/hrd')) {
    if (role !== 'hrd' && role !== 'superadmin') return deny();
  }

  if (path.startsWith('/employee')) {
    if (!role || (role !== 'employee' && role !== 'hrd' && role !== 'superadmin')) return deny();
  }

  if (path.startsWith('/director')) {
    if (role !== 'director' && role !== 'superadmin') return deny();
  }

  if (path.startsWith('/department')) {
    if (role !== 'department_manager' && role !== 'superadmin') return deny();
  }

  if (path.startsWith('/applicant')) {
    if (role !== 'applicant') return deny();
  }

  if (path === '/login') {
    if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin', request.url));
    if (role === 'hrd') return NextResponse.redirect(new URL('/hrd', request.url));
    if (role === 'employee') return NextResponse.redirect(new URL('/employee', request.url));
    if (role === 'director') return NextResponse.redirect(new URL('/director', request.url));
    if (role === 'department_manager') return NextResponse.redirect(new URL('/department', request.url));
    if (role === 'applicant') return NextResponse.redirect(new URL('/applicant', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/superadmin/:path*', '/hrd/:path*', '/employee/:path*', '/director/:path*', '/department/:path*', '/applicant/:path*', '/login', '/api/:path*'],
};
