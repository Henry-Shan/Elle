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

// ---------------------------------------------------------------------------
// Legal-aware structural chunking
// ---------------------------------------------------------------------------

/** Regex patterns for legal structural markers */
const LEGAL_SECTION_PATTERN =
  /^(?:Article\s+\d+|Section\s+\d+|§\s*\d+|Part\s+\d+|ARTICLE\s+[IVXLCDM\d]+|SECTION\s+\d+)/m;

const LEGAL_BOUNDARY_PATTERN =
  /(?=(?:^|\n)(?:Article\s+\d+|Section\s+\d+|§\s*\d+|Part\s+\d+|ARTICLE\s+[IVXLCDM\d]+|SECTION\s+\d+)[.\s:—–-])/;

const DEFINITIONS_PATTERN = /(?:^|\n)\s*(?:Definitions|DEFINITIONS|As used in|AS USED IN)/;

const CARVEOUT_PATTERNS = [
  /except\s+that/i,
  /provided,?\s+however/i,
  /notwithstanding/i,
  /subject\s+to/i,
];

const CLAUSE_MARKER_PATTERN = /^\s*\([a-z]\)\s/m;

type ChunkType = 'definition' | 'provision' | 'exception' | 'general';

function classifyChunkType(text: string): ChunkType {
  if (DEFINITIONS_PATTERN.test(text)) return 'definition';
  if (CARVEOUT_PATTERNS.some((p) => p.test(text))) return 'exception';
  if (CLAUSE_MARKER_PATTERN.test(text)) return 'provision';
  return 'general';
}

/**
 * Extract a section identifier from the beginning of a text block.
 * Returns e.g. "Section 12", "Article 3", "§ 164.502", "Part 2".
 */
function extractSectionId(text: string): string {
  const match = text.match(
    /(?:Article|Section|§|Part|ARTICLE|SECTION)\s*[\d.IVXLCDM]+/,
  );
  return match ? match[0].trim() : '';
}

/**
 * Structural clause-level chunker for legal text.
 *
 * Splits on Article/Section/Part boundaries, keeps definitions blocks
 * together with their carve-outs, and annotates each chunk with
 * section_id, parent_section, and chunk_type metadata.
 *
 * Falls back to generic `chunkText()` when no structural markers are found.
 */
export function chunkLegalText(
  text: string,
  baseMetadata: Record<string, string>,
  options?: { chunkSize?: number; chunkOverlap?: number },
): Chunk[] {
  const MAX_CHUNK_SIZE = options?.chunkSize ?? 4000;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  // If no legal structural markers, fall back to generic chunking
  if (!LEGAL_SECTION_PATTERN.test(text)) {
    return chunkText(text, baseMetadata, options);
  }

  // First-pass split on structural boundaries
  const sections = text.split(LEGAL_BOUNDARY_PATTERN).filter((s) => s.trim());

  // Second pass: merge definitions blocks with following carve-outs
  const mergedSections: string[] = [];
  let i = 0;
  while (i < sections.length) {
    let section = sections[i];

    // If this section contains definitions, extend to include carve-outs
    if (DEFINITIONS_PATTERN.test(section)) {
      let j = i + 1;
      while (j < sections.length) {
        const nextTrimmed = sections[j].trim();
        const isCarveout = CARVEOUT_PATTERNS.some((p) => p.test(nextTrimmed.slice(0, 200)));
        const isSubClause = CLAUSE_MARKER_PATTERN.test(nextTrimmed.slice(0, 20));
        if (!isCarveout && !isSubClause) break;
        section += '\n' + sections[j];
        j++;
      }
      i = j;
    } else {
      i++;
    }

    mergedSections.push(section);
  }

  // Build chunks with metadata
  const chunks: Chunk[] = [];
  let parentSection = '';

  for (const section of mergedSections) {
    const sectionId = extractSectionId(section);
    if (sectionId) parentSection = sectionId;
    const chunkType = classifyChunkType(section);

    if (section.length <= MAX_CHUNK_SIZE) {
      const trimmed = section.trim();
      if (trimmed.length > 50) {
        chunks.push({
          text: trimmed,
          metadata: {
            ...baseMetadata,
            chunk_index: String(chunks.length),
            section_id: sectionId,
            parent_section: parentSection,
            chunk_type: chunkType,
          },
        });
      }
    } else {
      // Oversized section: split recursively within this structural unit
      const subChunks = splitTextRecursive(
        section,
        MAX_CHUNK_SIZE,
        chunkOverlap,
        SEPARATORS,
      );
      for (const sub of subChunks) {
        const trimmed = sub.trim();
        if (trimmed.length > 50) {
          chunks.push({
            text: trimmed,
            metadata: {
              ...baseMetadata,
              chunk_index: String(chunks.length),
              section_id: sectionId,
              parent_section: parentSection,
              chunk_type: chunkType,
            },
          });
        }
      }
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Authority tier derivation (shared utility)
// ---------------------------------------------------------------------------

/**
 * Derives an authority tier from document metadata.
 *
 * Tier 1 (Primary): Statutes, regulations, case law, official government guidance.
 * Tier 2 (Secondary): Law firm advisories, whitepapers, verified industry standards.
 * Tier 3 (Tertiary): News articles, blogs, unclassified web content.
 */
export function deriveAuthorityTier(doc: {
  source?: string;
  document_type?: string;
  url?: string;
}): 1 | 2 | 3 {
  const src = (doc.source ?? '').toLowerCase();
  const dtype = (doc.document_type ?? '').toLowerCase();
  const url = (doc.url ?? '').toLowerCase();

  // Tier 1: Primary legal sources
  if (
    src.includes('ecfr') ||
    src.includes('federal_register') ||
    src.includes('usc') ||
    src.includes('scotus') ||
    dtype.includes('statute') ||
    dtype.includes('regulation') ||
    dtype.includes('case_law') ||
    dtype.includes('official_guidance') ||
    dtype.includes('final_rule') ||
    url.includes('ecfr.gov') ||
    url.includes('federalregister.gov') ||
    url.includes('law.cornell.edu') ||
    url.includes('supremecourt.gov') ||
    url.includes('congress.gov') ||
    (url.includes('.gov') && !url.includes('blog'))
  ) {
    return 1;
  }

  // Tier 2: Secondary authoritative sources
  if (
    dtype.includes('advisory') ||
    dtype.includes('whitepaper') ||
    dtype.includes('industry_standard') ||
    dtype.includes('template') ||
    dtype.includes('guidance') ||
    src.includes('aba') ||
    url.includes('americanbar.org') ||
    url.includes('nolo.com') ||
    url.includes('justia.com')
  ) {
    return 2;
  }

  // Tier 3: Tertiary (news, blogs, unclassified web research)
  return 3;
}
