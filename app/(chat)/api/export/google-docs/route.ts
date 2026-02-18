/**
 * POST /api/export/google-docs
 *
 * Converts a saved document to Google Docs format and creates it in the
 * authenticated user's Google Drive.
 *
 * Flow:
 *  1. Verify the user's session and retrieve their stored Google access token.
 *  2. Load the document content from the database.
 *  3. Convert the markdown content to styled HTML using `marked`.
 *  4. Upload the HTML to Google Drive specifying mimeType = Google Docs — the
 *     Drive API automatically converts the HTML to a native Google Doc.
 *  5. Return the Google Docs URL so the client can open it in a new tab.
 *
 * Authentication requirement:
 *  The user must have signed in with Google OAuth.  Users authenticated via
 *  credentials or GitHub will receive a 403 response with instructions to
 *  sign in with Google.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById } from '@/lib/db/queries';
import { google } from 'googleapis';
import { marked } from 'marked';
import { Readable } from 'stream';

const DRIVE_TOKEN_COOKIE = 'google_drive_token';

// ---------------------------------------------------------------------------
// Markdown → styled HTML
// ---------------------------------------------------------------------------

/**
 * Converts markdown to a full HTML document that Google Docs can import
 * and preserve formatting for (headings, links, bold, lists, blockquotes).
 */
async function markdownToHtml(markdown: string): Promise<string> {
  // Configure marked for safe, clean output
  marked.setOptions({ gfm: true, breaks: false });

  const body = await marked.parse(markdown);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #202124; }
  h1 { font-size: 20pt; font-weight: bold; margin-top: 24px; margin-bottom: 8px; color: #1a1a2e; }
  h2 { font-size: 16pt; font-weight: bold; margin-top: 20px; margin-bottom: 6px; color: #1a1a2e; }
  h3 { font-size: 13pt; font-weight: bold; margin-top: 16px; margin-bottom: 4px; }
  h4 { font-size: 11pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px; }
  a { color: #1a73e8; text-decoration: underline; }
  code { background: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-size: 10pt; font-family: monospace; }
  pre { background: #f1f3f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
  blockquote { border-left: 4px solid #dadce0; margin: 8px 0; padding: 8px 16px; color: #5f6368; font-style: italic; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #dadce0; margin: 16px 0; }
  strong { font-weight: bold; }
  em { font-style: italic; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the Google access token.
    // Priority 1: dedicated Drive cookie (set by /api/auth/google-drive/callback)
    // Priority 2: token stored in the NextAuth session (Google sign-in users)
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(DRIVE_TOKEN_COOKIE)?.value ?? null;
    const sessionToken = (session as any).googleAccessToken as string | null;
    const googleAccessToken = cookieToken ?? sessionToken;

    if (!googleAccessToken) {
      return NextResponse.json(
        {
          error: 'google_auth_required',
          message: 'Google Drive access not authorised.',
        },
        { status: 403 },
      );
    }

    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Load document from database
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify the document belongs to this user
    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Convert markdown → styled HTML
    const html = await markdownToHtml(document.content ?? '');

    // Initialise the Google OAuth2 client with the user's stored token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({ access_token: googleAccessToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Upload HTML to Drive; specifying mimeType triggers automatic conversion
    // to a native Google Docs document.
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: document.title ?? 'Legal Document',
        mimeType: 'application/vnd.google-apps.document',
      },
      media: {
        mimeType: 'text/html',
        body: Readable.from(Buffer.from(html, 'utf-8')),
      },
      fields: 'id,webViewLink',
    });

    const fileId = uploadResponse.data.id;
    const webViewLink = uploadResponse.data.webViewLink;

    if (!fileId || !webViewLink) {
      throw new Error('Google Drive did not return a file ID or URL');
    }

    return NextResponse.json({ url: webViewLink, fileId });
  } catch (error: unknown) {
    console.error('[Google Docs export] Error:', error);

    // Surface actionable error messages for common OAuth failures
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('invalid_grant') || msg.includes('Token has been expired')) {
      return NextResponse.json(
        {
          error: 'token_expired',
          message:
            'Your Google session has expired. Please sign out and sign back in with Google to re-authorise.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: 'export_failed', message: msg },
      { status: 500 },
    );
  }
}
