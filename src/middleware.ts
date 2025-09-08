import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration
 */
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://buying-selling-platform.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Content Security Policy configuration
 */
function getCSPHeader() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://res.cloudinary.com https://*.stripe.com https://www.google-analytics.com",
    "media-src 'self' https://res.cloudinary.com",
    "connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://res.cloudinary.com https://upload.cloudinary.com https://www.google-analytics.com https://region1.google-analytics.com ws: wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  return { cspPolicy, nonce };
}

/**
 * Security headers configuration
 */
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Middleware function to handle CORS globally, apply security headers, and protect routes that require authentication.
 */
export async function middleware(request: NextRequest) {
  // Generate CSP header with nonce
  const { cspPolicy, nonce } = getCSPHeader();

  // Gestion globale du CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Créer la réponse et ajouter tous les en-têtes de sécurité
  const response = NextResponse.next();

  // Ajouter les en-têtes CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Ajouter la Content Security Policy
  response.headers.set('Content-Security-Policy', cspPolicy);

  // Ajouter les autres en-têtes de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Ajouter le nonce dans les headers pour utilisation côté client si nécessaire
  response.headers.set('X-Nonce', nonce);

  // Définir les routes qui nécessitent une authentification
  const protectedRoutes = [
    '/auth/profile',
    '/auth/favorites',
    '/auth/messages',
    '/auth/publish',
    '/auth/profile/edit',
    '/admin',
  ];

  // Vérifier si la route actuelle nécessite une authentification
  const requiresAuth = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Gestion de l'authentification pour les routes protégées uniquement
  if (requiresAuth) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // For admin routes, check if user has admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Note: Role checking is done at the page level for now
      // since we need to access the session data which requires server-side rendering
      return response;
    }
  }

  return response;
}

// Configuration du middleware - appliqué à toutes les routes pour la sécurité
export const config = {
  matcher: [
    // Routes protégées nécessitant une authentification
    '/auth/profile',
    '/auth/favorites',
    '/auth/messages',
    '/auth/publish',
    '/auth/profile/edit',
    '/admin/:path*',
    // Routes publiques pour appliquer les en-têtes CSP et de sécurité
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
