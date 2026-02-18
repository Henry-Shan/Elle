/**
 * GET /api/auth/google-drive/authorize
 *
 * Starts a standalone Google OAuth flow specifically for Google Drive / Docs
 * access.  Works for ALL login methods (credentials, GitHub, Google) — the
 * user does not need to sign out.
 *
 * Query params:
 *   returnUrl  (required) — URL to redirect back to after authorization.
 *
 * Flow:
 *   1. Verify the user has an active app session (any provider).
 *   2. Build a Google OAuth2 authorization URL requesting the Drive + Docs scopes.
 *   3. Encode returnUrl + userId in the `state` param so the callback can
 *      restore context after Google redirects back.
 *   4. Redirect the browser to Google's consent screen.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnUrl') ?? '/';

  // Derive the callback URI from the incoming request so it works on any
  // deployment (local dev, Vercel, custom domain) without needing NEXTAUTH_URL.
  // This exact URI must be registered in Google Cloud Console.
  const origin = new URL(request.url).origin;
  const callbackUri = `${origin}/api/auth/google-drive/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUri,
  );

  // Encode returnUrl + userId in state so the callback can restore context
  const state = Buffer.from(
    JSON.stringify({ returnUrl, userId: session.user.id }),
  ).toString('base64url');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent so we always get a refresh_token
    scope: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
    ],
    state,
  });

  return NextResponse.redirect(authUrl);
}
