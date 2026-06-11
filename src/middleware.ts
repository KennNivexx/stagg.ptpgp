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
      role = session.role;
    }
  }

  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') {
      const resp = NextResponse.redirect(new URL('/login', request.url));
      resp.cookies.delete('session_token');
      resp.cookies.delete('user_role');
      return resp;
    }
  }

  if (path.startsWith('/hrd')) {
    if (role !== 'hrd' && role !== 'superadmin') {
      const resp = NextResponse.redirect(new URL('/login', request.url));
      resp.cookies.delete('session_token');
      resp.cookies.delete('user_role');
      return resp;
    }
  }

  if (path.startsWith('/employee')) {
    if (!role || (role !== 'employee' && role !== 'hrd' && role !== 'superadmin')) {
      const resp = NextResponse.redirect(new URL('/login', request.url));
      resp.cookies.delete('session_token');
      resp.cookies.delete('user_role');
      return resp;
    }
  }

  if (path === '/login') {
    if (role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    } else if (role === 'hrd') {
      return NextResponse.redirect(new URL('/hrd', request.url));
    } else if (role === 'employee') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/superadmin/:path*', '/hrd/:path*', '/employee/:path*', '/login'],
};
