export interface Chunk {
  text: string;
  metadata: Record<string, string>;
}

const DEFAULT_CHUNK_SIZE = 2000; // ~500 tokens
const DEFAULT_CHUNK_OVERLAP = 400; // ~100 tokens
const SEPARATORS = ['\n\n', '\n', '. ', ' '];

function splitTextRecursive(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separators: string[],
): string[] {
  if (text.length <= chunkSize) {
    return [text.trim()].filter(Boolean);
  }

  const separator = separators[0];
  const remainingSeparators = separators.slice(1);
  const parts = text.split(separator);

  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;

    if (candidate.length > chunkSize && current) {
      chunks.push(current.trim());
      // Keep overlap from end of current chunk
      const overlapText = current.slice(-chunkOverlap);
      current = overlapText ? overlapText + separator + part : part;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // If any chunk is still too large and we have more separators, recurse
  if (remainingSeparators.length > 0) {
    const refined: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length > chunkSize) {
        refined.push(
          ...splitTextRecursive(
            chunk,
            chunkSize,
            chunkOverlap,
            remainingSeparators,
          ),
        );
      } else {
        refined.push(chunk);
      }
    }
    return refined;
  }

  return chunks;
}

export function chunkText(
  text: string,
  baseMetadata: Record<string, string>,
  options?: { chunkSize?: number; chunkOverlap?: number },
): Chunk[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const rawChunks = splitTextRecursive(
    text,
    chunkSize,
    chunkOverlap,
    SEPARATORS,
  );

  return rawChunks
    .filter((t) => t.length > 50) // Skip trivially small chunks
    .map((t, i) => ({
      text: t,
      metadata: {
        ...baseMetadata,
        chunk_index: String(i),
      },
    }));
}
