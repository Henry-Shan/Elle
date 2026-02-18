/**
 * Short-lived in-memory cache that bridges legalSearch tool output to the
 * document creation handler.
 *
 * Problem it solves:
 *   legalSearch builds a fully-cited, hyperlinked document (## Legal Analysis …
 *   ## Sources …).  The chat model then calls createDocument, which internally
 *   runs the artifact-model with only the document title as input — discarding
 *   all the RAG-sourced citations.
 *
 * Solution:
 *   1. legalSearch stores its output here, keyed by userId.
 *   2. textDocumentHandler checks here before generating from scratch.
 *      If a fresh entry exists it streams that content directly, preserving
 *      every [Source N] hyperlink.
 *   3. The entry is consumed (deleted) on first read so it is used exactly once.
 */

interface CacheEntry {
  output: string;
  timestamp: number;
}

/** Key: userId  Value: most recent legalSearch output for that user */
const cache = new Map<string, CacheEntry>();

/** Entries older than this are treated as expired and discarded. */
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Store the hyperlinked legalSearch output for a user session.
 * Overwrites any previous entry (only the latest result is kept).
 */
export function cacheLegalSearchResult(userId: string, output: string): void {
  cache.set(userId, { output, timestamp: Date.now() });
}

/**
 * Retrieve and consume the cached legalSearch output for a user session.
 * Returns null if nothing is cached, or if the entry has expired.
 * The entry is deleted on read so it is consumed at most once.
 */
export function consumeLegalSearchResult(userId: string): string | null {
  const entry = cache.get(userId);
  cache.delete(userId); // always delete — consume once regardless of expiry

  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) return null; // expired

  return entry.output;
}
