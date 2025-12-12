export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!login|api/auth|_next|favicon.ico|sitemap.xml).*)',
  ],
}
