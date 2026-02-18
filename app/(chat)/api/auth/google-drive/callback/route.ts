/**
 * GET /api/auth/google-drive/callback
 *
 * Handles the OAuth2 callback from Google after the user grants Drive / Docs
 * access.  Exchanges the authorization code for tokens, stores the access
 * token in a secure HTTP-only cookie, then redirects back to the original page.
 *
 * The cookie `google_drive_token` is read by /api/export/google-docs when the
 * user triggers a document export.  It expires after 55 minutes (Google access
 * tokens last 60 minutes; we use a slightly shorter TTL for safety).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { google } from 'googleapis';

const TOKEN_COOKIE = 'google_drive_token';
const COOKIE_MAX_AGE = 55 * 60; // 55 minutes in seconds

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Derive the app origin from the incoming request so this works on any
  // deployment without needing NEXTAUTH_URL to be configured.
  const origin = new URL(request.url).origin;
  const callbackUri = `${origin}/api/auth/google-drive/callback`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  // Decode state to recover returnUrl (also used in the error path)
  let returnUrl = '/';
  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
      returnUrl = decoded.returnUrl ?? '/';
    } catch {
      // Malformed state — fall back to home
    }
  }

  // Resolve the redirect target: support both absolute URLs (from window.location.href)
  // and relative paths.
  const resolveRedirect = (url: string) =>
    url.startsWith('http') ? new URL(url) : new URL(url, origin);

  // User denied access
  if (error) {
    console.warn('[Google Drive OAuth] User denied access:', error);
    return NextResponse.redirect(resolveRedirect(returnUrl));
  }

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUri,
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token returned by Google');
    }

    // Store the access token in a secure, HTTP-only cookie.
    // The export route reads this cookie — no DB changes needed.
    const response = NextResponse.redirect(resolveRedirect(returnUrl));

    response.cookies.set(TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Google Drive OAuth] Token exchange failed:', err);
    const errorUrl = resolveRedirect(returnUrl);
    errorUrl.searchParams.set('gdrive_error', 'token_exchange_failed');
    return NextResponse.redirect(errorUrl);
  }
}
