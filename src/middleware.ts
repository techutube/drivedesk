import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Protect all API routes except auth
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = decodeJwt(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Check Admin routes
    if (request.nextUrl.pathname.startsWith('/api/users')) {
      if (!['Super Admin', 'Admin'].includes((decoded as any).role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token || !decodeJwt(token)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
