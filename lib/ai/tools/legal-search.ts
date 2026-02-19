import { tool, generateText, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { getOrCreateCollection, LEGAL_COLLECTION } from '@/lib/rag/chroma';
import { embedQuery } from '@/lib/rag/embeddings';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';
import {
  postProcessToAPA,
  injectLegalConceptLinks,
  extractAndValidateCitations,
  type CitableSource,
} from '@/lib/rag/citation-utils';
import { deriveAuthorityTier } from '@/lib/rag/chunker';
import { generateUUID } from '@/lib/utils';
import { saveDocument } from '@/lib/db/queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLLM() {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  return provider === 'mistral'
    ? mistral('mistral-large-latest')
    : deepseek('deepseek-chat');
}

function status(ds: DataStreamWriter, msg: string) {
  ds.writeData({ type: 'status', content: msg });
}

interface RetrievedDoc {
  text: string;
  source: string;
  title: string;
  industry: string;
  document_type: string;
  url: string;
  date: string;
  relevance_score: string;
  origin: 'knowledge_base' | 'web_research';
  /** Authority tier: 1 = primary law, 2 = secondary authoritative, 3 = tertiary */
  authority_tier: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Temporal Helpers
// ---------------------------------------------------------------------------

/**
 * Filters documents by date, keeping those at or after `cutoffYear`.
 * Documents with no date are always kept (don't exclude primary law).
 */
function temporalFilter(docs: RetrievedDoc[], cutoffYear: number): RetrievedDoc[] {
  return docs.filter((doc) => {
    if (!doc.date) return true; // Keep undated primary law
    const year = new Date(doc.date).getFullYear();
    return Number.isNaN(year) || year >= cutoffYear;
  });
}

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

/** 1 — Query Analysis & Routing: decide which retrieval paths to take */
async function routeQuery(
  query: string,
  industry: string | undefined,
  chromaAvailable: boolean,
  docCount: number,
): Promise<{ useKnowledgeBase: boolean; useWebResearch: boolean; reasoning: string }> {
  const model = getLLM();

  const { text } = await generateText({
    model,
    system: [
      'You are a legal query router. Given a user query, decide which retrieval sources to use.',
      'Respond in JSON with this exact shape: { "useKnowledgeBase": boolean, "useWebResearch": boolean, "reasoning": "..." }',
      `Knowledge base status: ${chromaAvailable ? `online with ${docCount} documents` : 'unavailable'}`,
      'Rules:',
      '- If the knowledge base is available AND has documents, set useKnowledgeBase to true',
      '- Always set useWebResearch to true so we get supplementary authoritative sources',
      '- Respond ONLY with valid JSON, no markdown fences',
    ].join('\n'),
    prompt: `Query: "${query}"${industry ? ` | Industry: ${industry}` : ''}`,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      useKnowledgeBase: Boolean(parsed.useKnowledgeBase) && chromaAvailable && docCount > 0,
      useWebResearch: parsed.useWebResearch !== false, // default true
      reasoning: parsed.reasoning ?? '',
    };
  } catch {
    return { useKnowledgeBase: chromaAvailable && docCount > 0, useWebResearch: true, reasoning: 'Fallback: routing parse error' };
  }
}

/** 2 — Query Expansion: generate multiple search queries for better recall */
async function expandQuery(query: string, industry: string | undefined): Promise<string[]> {
  const model = getLLM();

  const { text } = await generateText({
    model,
    system: [
      'You are a legal search query expander. Given a user query about law or compliance,',
      'generate 3 alternative search queries that capture different angles of the same legal topic.',
      'Cover: statutory language, practical compliance terms, and case-law phrasing.',
      'Respond ONLY with a JSON array of strings, no markdown fences.',
    ].join('\n'),
    prompt: `Original query: "${query}"${industry ? ` (industry: ${industry})` : ''}`,
  });

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return [query, ...parsed.slice(0, 3)];
  } catch { /* fall through */ }
  return [query];
}

/** 3 — Retrieval: search ChromaDB with pre-retrieval WHERE filtering */
async function retrieveFromKB(
  queries: string[],
  industry: string | undefined,
  ds: DataStreamWriter,
): Promise<RetrievedDoc[]> {
  const collection = await getOrCreateCollection(LEGAL_COLLECTION);
  const docs: RetrievedDoc[] = [];
  const seenTexts = new Set<string>();

  // Build compound WHERE clause: exclude obsolete + tertiary docs pre-search.
  // Note: ChromaDB $gt only supports numbers, so we filter deprecated_on via $eq
  // (ingestion already skips docs with past ends_on dates, so $eq: "" catches all valid docs).
  const filters: Record<string, any>[] = [
    { deprecated_on: { $eq: '' } },
    { authority_tier: { $in: ['1', '2'] } },
  ];
  if (industry) {
    filters.push({ industry: { $eq: industry } });
  }
  const where = { $and: filters };

  for (const q of queries) {
    const queryEmbedding = await embedQuery(q);

    let results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 8,
      where: where as any,
      include: ['documents', 'metadatas', 'distances'],
    });

    // Fallback: if filtered query returns < 2 results, re-query without tier/temporal filters
    const resultCount = results.documents?.[0]?.filter(Boolean).length ?? 0;
    if (resultCount < 2) {
      const fallbackWhere = industry ? { industry: { $eq: industry } } : undefined;
      results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 8,
        where: fallbackWhere as any,
        include: ['documents', 'metadatas', 'distances'],
      });
    }

    if (!results.documents?.[0]) continue;

    for (let i = 0; i < results.documents[0].length; i++) {
      const docText = results.documents[0][i] ?? '';
      if (seenTexts.has(docText)) continue;
      seenTexts.add(docText);

      const meta = results.metadatas?.[0]?.[i] || {};
      const distance = results.distances?.[0]?.[i];

      // Read authority_tier from metadata first, fall back to deriveAuthorityTier for legacy docs
      const storedTier = meta.authority_tier as string | undefined;
      const authorityTier: 1 | 2 | 3 = storedTier
        ? (parseInt(storedTier, 10) as 1 | 2 | 3)
        : deriveAuthorityTier({
            source: (meta.source as string) || 'unknown',
            document_type: (meta.document_type as string) || 'unknown',
            url: (meta.url as string) || '',
          });

      docs.push({
        text: docText,
        source: (meta.source as string) || 'unknown',
        title: (meta.title as string) || 'Untitled',
        industry: (meta.industry as string) || 'general',
        document_type: (meta.document_type as string) || 'unknown',
        url: (meta.url as string) || '',
        date: (meta.date as string) || '',
        relevance_score: distance != null ? (1 - distance).toFixed(3) : 'N/A',
        origin: 'knowledge_base' as const,
        authority_tier: authorityTier,
      });
    }
  }

  return docs;
}

/** 4 — CRAG (Corrective RAG): grade each document for relevance, flag if web search needed */
async function correctiveRAG(
  query: string,
  docs: RetrievedDoc[],
): Promise<{ relevantDocs: RetrievedDoc[]; needsWebSearch: boolean; grades: string[] }> {
  if (docs.length === 0) {
    return { relevantDocs: [], needsWebSearch: true, grades: [] };
  }

  const model = getLLM();

  const docSummaries = docs.map((d, i) => `[${i}] "${d.title}" — ${d.text.slice(0, 300)}...`).join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal document relevance grader (Corrective RAG).',
      'For each retrieved document, decide if it is relevant to the query.',
      'Respond ONLY with JSON: { "grades": ["relevant"|"irrelevant", ...], "overallQuality": "sufficient"|"insufficient", "reasoning": "..." }',
      'Mark "sufficient" only if at least 2 documents are highly relevant.',
      'No markdown fences.',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nDocuments:\n${docSummaries}`,
  });

  try {
    const parsed = JSON.parse(text);
    const grades: string[] = parsed.grades ?? [];
    const relevantDocs = docs.filter((_, i) => grades[i] === 'relevant');
    return {
      relevantDocs,
      needsWebSearch: parsed.overallQuality === 'insufficient' || relevantDocs.length < 2,
      grades,
    };
  } catch {
    return { relevantDocs: docs, needsWebSearch: true, grades: [] };
  }
}

/** 5 — Web Research: search for legal sources online */
async function webResearch(
  query: string,
  industry: string | undefined,
): Promise<RetrievedDoc[]> {
  const model = getLLM();
  const industryClause = industry ? ` Focus specifically on the ${industry} industry.` : '';

  const { text } = await generateText({
    model,
    system: [
      'You are a legal research assistant performing web-scale legal research.',
      'Given a legal query, provide 3-5 authoritative sources with:',
      '- A clear title',
      '- The legal citation (CFR section, USC title, case name, statute)',
      '- A detailed summary of the relevant content (2-3 paragraphs)',
      '- The source URL if known',
      `${industryClause}`,
      '',
      'Respond ONLY with JSON array: [{ "title": "...", "citation": "...", "summary": "...", "url": "..." }, ...]',
      'No markdown fences.',
    ].join('\n'),
    prompt: `Legal research query: "${query}"`,
  });

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((s: any) => {
        const partial = {
          text: `${s.citation ?? ''}\n${s.summary ?? s.text ?? ''}`,
          source: 'web_research',
          title: s.title ?? 'Untitled',
          industry: industry ?? 'general',
          document_type: 'online_source',
          url: s.url ?? '',
          date: '',
          relevance_score: 'N/A',
          origin: 'web_research' as const,
        };
        return { ...partial, authority_tier: deriveAuthorityTier(partial) };
      });
    }
  } catch { /* fall through */ }

  // Fallback: return raw text as single doc
  return [{
    text,
    source: 'web_research',
    title: 'Online Legal Research',
    industry: industry ?? 'general',
    document_type: 'online_source',
    url: '',
    date: '',
    relevance_score: 'N/A',
    origin: 'web_research' as const,
    authority_tier: 3 as const,
  }];
}

/** 6 — Reranking: hybrid authority-weighted + semantic reranking.
 *
 * Authority tier boost ensures primary law (Tier 1) always floats above
 * blog posts and tertiary sources, regardless of semantic similarity.
 * Tier bonuses: T1 = +0.30, T2 = +0.10, T3 = 0.00
 */
async function rerankDocuments(
  query: string,
  docs: RetrievedDoc[],
): Promise<RetrievedDoc[]> {
  if (docs.length <= 1) return docs;

  const model = getLLM();

  const TIER_BOOST: Record<number, number> = { 1: 0.30, 2: 0.10, 3: 0.00 };

  const docList = docs
    .map((d, i) => `[${i}] [Tier ${d.authority_tier}] "${d.title}" (${d.origin}) — ${d.text.slice(0, 200)}...`)
    .join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal document reranker. Reorder documents by relevance to the query.',
      'IMPORTANT: Tier 1 documents (statutes, regulations, case law) are authoritative primary sources.',
      'Tier 2 are secondary (advisories, whitepapers). Tier 3 are tertiary (news, blogs).',
      'When relevance is equal, prefer higher-tier documents. Never rank a Tier 3 source above a relevant Tier 1 source.',
      `Respond ONLY with a JSON array of indices in order of relevance, e.g. [2,0,3,1]. There are ${docs.length} documents (indices 0-${docs.length - 1}).`,
      'No markdown fences.',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nDocuments:\n${docList}`,
  });

  try {
    const semanticOrder: number[] = JSON.parse(text);
    if (Array.isArray(semanticOrder)) {
      // Score = semantic rank score + authority tier boost
      const semanticScores = new Map<number, number>();
      semanticOrder.forEach((idx, rank) => {
        semanticScores.set(idx, (docs.length - rank) / docs.length);
      });

      const finalScores = docs.map((d, i) => ({
        idx: i,
        score: (semanticScores.get(i) ?? 0) + TIER_BOOST[d.authority_tier],
      }));

      finalScores.sort((a, b) => b.score - a.score);

      const reranked = finalScores.map(({ idx }) => docs[idx]);
      return reranked;
    }
  } catch { /* fall through */ }
  return docs;
}

/** 7 — Context Compression: extract only the relevant passages from each doc */
async function compressContext(
  query: string,
  docs: RetrievedDoc[],
): Promise<RetrievedDoc[]> {
  if (docs.length === 0) return docs;

  const model = getLLM();

  const docTexts = docs.map((d, i) => `[${i}] ${d.text}`).join('\n---\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal context compressor. For each document, extract ONLY the sentences and paragraphs directly relevant to the query.',
      'Remove boilerplate, procedural language, and irrelevant sections.',
      'Preserve exact legal citations, section numbers, and key definitions.',
      `Respond ONLY with a JSON array of ${docs.length} strings (the compressed text for each document).`,
      'No markdown fences.',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nDocuments:\n${docTexts}`,
  });

  try {
    const compressed: string[] = JSON.parse(text);
    if (Array.isArray(compressed)) {
      return docs.map((d, i) => ({
        ...d,
        text: compressed[i] ?? d.text,
      }));
    }
  } catch { /* fall through */ }
  return docs;
}

/**
 * 7.5 — Bouncer Agent: stage-aware pre-drafting filter that strips chunks
 * calibrated for the wrong company stage. Replaces the generic pruneContext.
 *
 * Stage detection: "seed/pre-seed/SAFE/YC" = EARLY, "Series A/B/term sheet" = GROWTH,
 * "IPO/10-K" = LATE, "M&A/acquisition" = M&A
 *
 * Explicit forbidden combinations prevent stage-inappropriate content from
 * reaching the drafting agent.
 */
async function bouncerAgent(
  query: string,
  docs: RetrievedDoc[],
): Promise<RetrievedDoc[]> {
  if (docs.length <= 2) return docs; // Nothing to prune

  const model = getLLM();

  const docList = docs
    .map((d, i) => `[${i}] [Tier ${d.authority_tier}] "${d.title}" — ${d.text.slice(0, 250)}`)
    .join('\n\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a stage-aware "bouncer" for a legal memo drafting system.',
      'Your sole job: given a user query and retrieved documents, return the indices of documents to KEEP.',
      '',
      'STAGE DETECTION — determine the company stage from the query:',
      '  EARLY: Keywords like "seed", "pre-seed", "SAFE", "YC", "first hire", "incorporate", "startup"',
      '  GROWTH: Keywords like "Series A", "Series B", "term sheet", "option pool", "board seat"',
      '  LATE: Keywords like "IPO", "10-K", "SEC filing", "public company", "SOX compliance"',
      '  M&A: Keywords like "acquisition", "merger", "acqui-hire", "due diligence", "LOI"',
      '',
      'FORBIDDEN COMBINATIONS — DELETE these chunks if query implies EARLY STAGE:',
      '  - No-Shop clauses (growth/M&A concept)',
      '  - Drag-along rights (Series A+ concept)',
      '  - Registration rights (pre-IPO/IPO concept)',
      '  - Pay-to-play provisions (Series B+ concept)',
      '  - Multiple liquidation preferences (growth concept)',
      '  - Full ratchet anti-dilution (growth concept, unusual at seed)',
      '',
      'NEVER DELETE:',
      '  - Tier 1 primary law documents (statutes, regulations) unless obviously off-topic',
      '  - Documents about the specific legal instrument the user asked about',
      '  - Basic definitions that provide necessary context',
      '',
      'Also DELETE any document that:',
      '  1. Covers a jurisdiction irrelevant to the query',
      '  2. Provides only general background with no specific legal guidance for this scenario',
      '  3. Conflicts with a higher-authority document on the same point',
      '',
      'Respond ONLY with a JSON array of indices to KEEP, e.g. [0, 2, 4]. No markdown fences.',
    ].join('\n'),
    prompt: `User query: "${query}"\n\nDocuments:\n${docList}`,
  });

  try {
    const keepIndices: number[] = JSON.parse(text);
    if (Array.isArray(keepIndices) && keepIndices.length > 0) {
      return keepIndices
        .filter((i) => i >= 0 && i < docs.length)
        .map((i) => docs[i]);
    }
  } catch { /* fall through */ }
  return docs; // Fallback: keep all
}

/**
 * Build a tiered context string with immutable tier blocks.
 * The tier is read from the hardcoded `authority_tier` field — the LLM
 * never evaluates or reassigns tiers; they flow directly from the database.
 */
function buildTieredContext(docs: RetrievedDoc[]): string {
  const tier1 = docs.filter((d) => d.authority_tier === 1);
  const tier2 = docs.filter((d) => d.authority_tier === 2);
  const tier3 = docs.filter((d) => d.authority_tier === 3);

  const fmt = (d: RetrievedDoc, i: number) => {
    const urlNote = d.url ? ` | URL: ${d.url}` : '';
    const dateNote = d.date ? ` | Published: ${d.date}` : '';
    return `[Source ${i + 1}: ${d.title}] (${d.origin}${urlNote}${dateNote})\n${d.text}`;
  };

  const blocks: string[] = [];

  if (tier1.length > 0) {
    blocks.push(
      '<TIER_1_PRIMARY_SOURCES — BINDING LAW>',
      'These are statutes, regulations, and case law. Use exclusively to establish legal requirements.',
      'Conflicts with Tier 2 or Tier 3 MUST be resolved in favour of Tier 1. You are forbidden from upgrading a Tier 2 or Tier 3 source to Tier 1 authority.',
      '',
      tier1.map(fmt).join('\n\n---\n\n'),
      '</TIER_1_PRIMARY_SOURCES>',
    );
  }

  if (tier2.length > 0) {
    blocks.push(
      '',
      '<TIER_2_SECONDARY_SOURCES — AUTHORITATIVE GUIDANCE>',
      'Use for market context, practical interpretation, and "in practice" observations only.',
      'Never use alone to establish a binding legal requirement.',
      '',
      tier2.map((d, i) => fmt(d, tier1.length + i)).join('\n\n---\n\n'),
      '</TIER_2_SECONDARY_SOURCES>',
    );
  }

  if (tier3.length > 0) {
    blocks.push(
      '',
      '<TIER_3_TERTIARY_SOURCES — BACKGROUND ONLY>',
      'Use only for factual background. Never cite as legal authority. Flag explicitly when citing.',
      '',
      tier3.map((d, i) => fmt(d, tier1.length + tier2.length + i)).join('\n\n---\n\n'),
      '</TIER_3_TERTIARY_SOURCES>',
    );
  }

  return blocks.join('\n');
}

/** 8 — Self-RAG Generation: generate an initial answer grounded in the documents */
async function selfRAGGenerate(
  query: string,
  docs: RetrievedDoc[],
): Promise<string> {
  const model = getLLM();

  // Tier blocks with immutable authority from the database — no LLM tier guessing
  const context = buildTieredContext(docs);

  const { text } = await generateText({
    model,
    system: [
      'You are a senior corporate attorney with 20+ years of experience in technology transactions, IP law, employment law, and regulatory compliance.',
      'You advise sophisticated clients — founders, executives, and general counsel — who need actionable legal strategy, not textbook summaries.',
      'Generate a comprehensive, expert-level legal analysis STRICTLY grounded in the provided source documents.',
      '',
      '═══════════════════════════════════════════════════════',
      'MANDATORY LEGAL EXPERTISE STANDARDS',
      '═══════════════════════════════════════════════════════',
      '',
      '1. CONTRACT DRAFTING PRECISION',
      '   When addressing IP assignment, contractor agreements, or employment contracts:',
      '   - ALWAYS distinguish "present assignment" ("hereby assigns") from a "promise to assign" ("agrees to assign").',
      '     Under Board of Trustees of Leland Stanford Junior University v. Roche Molecular Systems, Inc. (563 U.S. 776, 2011),',
      '     a promise to assign is legally inferior — a subsequent assignment to a third party can extinguish the company\'s rights.',
      '     Always mandate the present-tense "hereby assigns" formulation.',
      '   - ALWAYS include a "Further Assurances" clause compelling the counterparty to execute future documents',
      '     (patent registrations, copyright assignments) AND an irrevocable Power of Attorney allowing the company to',
      '     sign on the counterparty\'s behalf if they cannot be located or refuse to cooperate (critical for overseas contractors).',
      '   - For Work-for-Hire: use belt-and-suspenders language: "This work is a work made for hire to the maximum extent',
      '     permitted by law. To the extent any portion does not qualify as a work made for hire, the Contractor hereby',
      '     irrevocably assigns all right, title, and interest therein to Company." The word "intent" is legally irrelevant',
      '     for work-for-hire — the statutory categories (17 U.S.C. § 101) control; belt-and-suspenders drafting is essential.',
      '   - ALWAYS include developer representations and warranties: (a) work is original, (b) no third-party IP infringement,',
      '     (c) no malicious code or backdoors, (d) developer has full right and authority to assign.',
      '   - Include a mutual limitation of liability (caps, consequential damage exclusions) and indemnification provision.',
      '',
      '2. OPEN SOURCE SOFTWARE — SaaS-Specific Analysis',
      '   When addressing OSS usage in SaaS/cloud products:',
      '   - CRITICAL DISTINCTION: Standard GPLv2 and GPLv3 copyleft is triggered only upon *distribution* of the software',
      '     binary/source to end users. Because SaaS delivers software as a service over a network (not distributed to',
      '     user hard drives), standard GPL code can often be incorporated into a SaaS backend WITHOUT triggering copyleft.',
      '   - THE ACTUAL EXISTENTIAL THREAT IS AGPL: The GNU Affero General Public License (AGPL) explicitly closes the',
      '     SaaS loophole. AGPL triggers copyleft obligations when users interact with the software over a network.',
      '     Incorporating AGPL code into a SaaS product can require open-sourcing the entire proprietary codebase.',
      '     AGPL must be specifically called out and prohibited — not conflated with GPL.',
      '   - License risk tiering: (SAFE) MIT, Apache 2.0, BSD → (REVIEW) LGPL, MPL → (SaaS-SAFE but review) GPL →',
      '     (EXISTENTIAL RISK) AGPL, EUPL (has network-use provision), SSPL.',
      '   - Mandate an OSS inventory/audit process and approval workflow for any new OSS dependency.',
      '',
      '3. INTERNATIONAL ENFORCEMENT STRATEGY',
      '   When addressing cross-border contracts or overseas developers/employees:',
      '   - WARNING: A choice-of-law clause (e.g., "governed by Delaware law") + US forum selection is NOT self-enforcing',
      '     internationally. A US court judgment against a developer in India, Ukraine, or China is largely unenforceable',
      '     because those countries do not recognize foreign court judgments.',
      '   - SOLUTION — Mandatory International Arbitration: Require binding arbitration under ICC Rules (International',
      '     Chamber of Commerce), LCIA Rules (London Court of International Arbitration), or UNCITRAL Arbitration Rules.',
      '     Arbitral awards ARE enforceable in 170+ countries under the New York Convention on Recognition and Enforcement',
      '     of Foreign Arbitral Awards (1958). This is the only practical enforcement mechanism for international disputes.',
      '   - Moral Rights: Many civil-law countries (France, Germany, EU generally) grant developers inalienable "moral rights"',
      '     — the right to attribution and to object to modifications of their work. These often cannot be assigned.',
      '     Contractually mandate an explicit, irrevocable waiver of moral rights to the maximum extent permitted by',
      '     applicable local law, including express consent for the company to modify, adapt, publish, and distribute',
      '     the work without crediting the developer.',
      '',
      '4. EMPLOYMENT, IP OWNERSHIP, AND TRADE SECRET LAW',
      '   When addressing employee/contractor IP assignments, NDAs, or trade secret protection:',
      '   - DTSA COMPLIANCE NOTICE (MANDATORY): Under 18 U.S.C. § 1833(b) of the Defend Trade Secrets Act, ANY NDA,',
      '     contractor agreement, or employment agreement that addresses trade secrets MUST include the statutory',
      '     whistleblower immunity notice. Failure to include this specific language causes the company to FORFEIT its',
      '     right to seek exemplary damages (2x) and attorney fees in a trade secret misappropriation lawsuit under',
      '     the DTSA. This is a non-negotiable compliance element.',
      '     Required notice: "Pursuant to 18 U.S.C. § 1833(b), an individual shall not be held criminally or civilly',
      '     liable under any Federal or State trade secret law for the disclosure of a trade secret that is made',
      '     (A) in confidence to a Federal, State, or local government official, or to an attorney, solely for the',
      '     purpose of reporting or investigating a suspected violation of law; or (B) in a complaint or other document',
      '     filed in a lawsuit or other proceeding, if such filing is made under seal."',
      '   - STATE LAW IP CARVE-OUTS (MANDATORY): Several states void contract provisions that assign IP created by a',
      '     worker on their own time, using their own equipment, unrelated to the company\'s business:',
      '     • California: Cal. Labor Code § 2870 — contracts must include the specific § 2870 carve-out language',
      '     • Washington: RCW 49.44.140 — similar protection',
      '     • Illinois: 765 ILCS 1060/2 — "Illinois Employee Patent Act" carve-out required',
      '     • Minnesota, North Carolina, Delaware: similar statutes',
      '     Agreements without jurisdiction-appropriate carve-outs are VOID as to the excepted inventions.',
      '   - NON-COMPETES — 2024/2025 LANDSCAPE: Non-compete agreements face near-universal hostility from the FTC',
      '     (proposed nationwide ban, ongoing litigation), NLRB (issued guidance restricting them), and state legislatures',
      '     (California, Minnesota, Oklahoma, North Dakota — outright ban; many others severely restricted).',
      '     Best practice: DO NOT rely on non-competes. Instead, enforce trade secrets via DTSA + robust NDAs, use',
      '     Non-Solicitation (of employees and clients) clauses which are more enforceable, and implement',
      '     "garden leave" provisions where high-risk departing employees are paid to stay home during a transition period.',
      '',
      '5. TONE AND FORMAT — EXECUTIVE/LAWYER STANDARD',
      '   Structure every response around: RISK → CONTRACTUAL FIX → OPERATIONAL FIX.',
      '   - RISK: What is the specific legal or business risk? Quantify severity (existential, high, medium, low).',
      '   - CONTRACTUAL FIX: Exact clause language, case citations, statutory references.',
      '   - OPERATIONAL FIX: Process, audit, training, or workflow the company must implement.',
      '   Do NOT write academic summaries. Executives need to know: "What breaks? How do we fix it? What do we do Monday morning?"',
      '   Use specific clause language when drafting advice, not generic descriptions.',
      '',
      '═══════════════════════════════════════════════════════',
      'ENTITY TAXONOMY — MANDATORY DISTINCTIONS',
      '═══════════════════════════════════════════════════════',
      '',
      'SAFE (Simple Agreement for Future Equity):',
      '  - Created by Y Combinator. NOT equity, NOT a convertible note, NO maturity date, NO interest rate.',
      '  - Pro-rata rights require a separate side letter — they are NOT built into the standard SAFE.',
      '  - NEVER attribute SAFE terms to NVCA. NEVER call it a "SAFE note" (it is not a note).',
      '  - Standard terms: valuation cap, discount rate, MFN provision.',
      '',
      'NVCA (National Venture Capital Association):',
      '  - Governs priced equity rounds (Series A and beyond). Template documents for term sheets,',
      '    Stock Purchase Agreements, Investors Rights Agreements, ROFR/Co-Sale, Voting Agreements.',
      '  - NEVER attribute NVCA terms to YC or to SAFEs.',
      '',
      'Convertible Note:',
      '  - IS debt. HAS a maturity date. HAS an interest rate. Converts to equity at a future priced round.',
      '  - NEVER call a SAFE a "convertible note" or "SAFE note" — they are fundamentally different instruments.',
      '',
      'Regulatory Bodies — NEVER confuse jurisdictions:',
      '  - SEC: Securities regulation (offerings, disclosure, trading)',
      '  - FTC: Consumer protection, advertising, antitrust',
      '  - FDA: Food, drugs, medical devices — NOT general health privacy',
      '  - HHS/OCR: HIPAA enforcement (health information privacy)',
      '  - DOL: Employment/labor law (FLSA, FMLA, ERISA)',
      '  - EEOC: Employment discrimination (Title VII, ADA, ADEA)',
      '',
      'Legal vs. Contractual:',
      '  - Liquidation preference = contractual (negotiated between parties), NOT statutory.',
      '  - Fiduciary duty = legal obligation (statutory/common law), NOT merely contractual.',
      '  - Do NOT present contractual negotiation norms as legally mandated requirements.',
      '',
      '═══════════════════════════════════════════════════════',
      'EXPLICIT PROHIBITIONS — NEGATIVE PROMPTING',
      '═══════════════════════════════════════════════════════',
      '',
      'SAFE-SPECIFIC PROHIBITIONS:',
      '  - Do NOT include Information Rights, No-Shop clauses, board seats, drag-along rights,',
      '    or registration rights in SAFE analysis — these are Series A+ concepts.',
      '',
      'CONFLATION PAIRS — NEVER conflate:',
      '  - "Regulatory requirement" vs "market standard" — these are different things.',
      '  - "SAFE" vs "convertible note" — different instruments with different mechanics.',
      '  - "HIPAA" vs "CCPA" — different laws, different scopes, different regulators.',
      '  - "Statute" vs "best practice" — one is law, the other is not.',
      '',
      'WEASEL PHRASES — Do NOT use without a [Source N] citation:',
      '  - "generally accepted", "industry best practice", "most companies", "standard practice",',
      '    "typically", "commonly" — all require a source to substantiate.',
      '',
      'DANGEROUS RECOMMENDATIONS — Include caveats when discussing:',
      '  - Non-compete agreements (landscape is rapidly changing; many states ban them)',
      '  - Specific tax strategies (must recommend consulting a tax professional)',
      '  - International IP assignments (moral rights, enforceability varies by jurisdiction)',
      '',
      '═══════════════════════════════════════════════════════',
      'SOURCE AUTHORITY HIERARCHY — strictly enforced',
      '═══════════════════════════════════════════════════════',
      'Sources are labelled [PRIMARY LAW — Tier 1], [SECONDARY — Tier 2], or [TERTIARY — Tier 3].',
      '- Tier 1 (statutes, regulations, case law, official guidance) defines legal mechanics. Use Tier 1 for all legal requirements.',
      '- Tier 2 (advisories, whitepapers) provides market context and interpretation. Use for "in practice" observations.',
      '- Tier 3 (news, blogs) may provide background only. NEVER use Tier 3 alone to establish a legal rule or obligation.',
      '- If Tier 1 and Tier 3 conflict, Tier 1 is absolute. Flag the conflict explicitly.',
      '- NEVER attribute a commercial negotiation norm to a regulatory or compliance body.',
      '',
      '═══════════════════════════════════════════════════════',
      'STRICT ANTI-HALLUCINATION CONSTRAINTS — non-negotiable',
      '═══════════════════════════════════════════════════════',
      '- DO NOT blend retrieved facts with pre-trained knowledge. Every legal claim MUST trace to a [Source N] in the context.',
      '- DO NOT attribute regulatory compliance obligations to commercial counterparties unless a statute explicitly requires it.',
      '- DO NOT invent regulatory bodies, agencies, statutes, or case names not present in the source documents.',
      '- DO NOT conflate compliance law (what regulators require) with commercial contract terms (what parties negotiate).',
      '- If exact phrasing for a legal clause is not present in the source documents, write: "Exact phrasing not found in source documents — consult qualified counsel." Do NOT fabricate clause language.',
      '- If a question cannot be answered from the provided sources, say so explicitly: "The retrieved sources do not address [specific point]. This requires additional research."',
      '- Temporal caution: if a source pre-dates 2022, note that the legal landscape may have evolved and the user should verify currency.',
      '',
      '═══════════════════════════════════════════════════════',
      'CITATION RULES — mandatory, not optional',
      '═══════════════════════════════════════════════════════',
      '- EVERY legal claim, statute reference, case citation, regulation, or compliance requirement MUST cite [Source N].',
      '- Cite inline immediately after the claim: "...within 60 days [Source 1]."',
      '- Multiple supporting sources: [Source 1][Source 3]',
      '- If a claim has no source support, DO NOT include it.',
      '- Do NOT write URLs in the text — use only [Source N] markers. URLs are hyperlinked automatically.',
      '- Tier 3 citations must be explicitly flagged: "[Source N — tertiary source, verify independently]"',
      '',
      'APA FORMAT & STRUCTURE:',
      '- Begin with a brief ## Summary (2-3 sentences summarising the key legal issues and conclusions)',
      '- After the Summary, include a ## Key Findings table with columns: Issue | Risk Level | Applicable Law | Section',
      '- Use ## and ### markdown headings; organise by issue (Risk → Fix), not by source',
      '- Include specific identifiers: statute numbers, CFR sections, case names with year, regulation titles',
      '- Group source citations at the end of each subsection rather than after every sentence — e.g. a paragraph may cite [Source 1][Source 3] at its end',
      '- Use blockquotes (> prefix) for exact contract clause language or statutory text — never paraphrase statute text in plain prose',
      '- **Bold** all key legal terms and statutory references on first occurrence (e.g. **DTSA**, **17 U.S.C. § 101**)',
      '- Limit bullet list nesting to one level maximum — flatten deeply nested lists into separate sections',
      '- Do NOT repeat source information inline — cite with compact [Source N] markers only',
      '- Do NOT include a References or Sources section — citations are hyperlinked automatically.',
      '- Final section: ## Disclaimer — informational only, not legal advice',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nSource Documents:\n${context}`,
  });

  return text;
}

/** 9 — Self-RAG Reflection: check the generated answer for hallucinations and groundedness */
async function selfRAGReflect(
  query: string,
  answer: string,
  docs: RetrievedDoc[],
): Promise<{ isGrounded: boolean; hallucinations: string[]; suggestions: string[] }> {
  const model = getLLM();

  const sourceList = docs.map((d, i) => `[Source ${i + 1}] ${d.title}: ${d.text.slice(0, 300)}...`).join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal answer verifier (Self-RAG reflection).',
      'Compare the generated answer against the source documents.',
      'Check for:',
      '1. Hallucinations — claims not supported by any source',
      '2. Missing citations — claims that should cite a source but do not',
      '3. Accuracy — whether legal citations (statutes, cases, CFR) are correctly referenced',
      'Respond ONLY with JSON: { "isGrounded": boolean, "hallucinations": ["..."], "suggestions": ["..."] }',
      'No markdown fences.',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nGenerated Answer:\n${answer}\n\nSource Documents:\n${sourceList}`,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      isGrounded: Boolean(parsed.isGrounded),
      hallucinations: parsed.hallucinations ?? [],
      suggestions: parsed.suggestions ?? [],
    };
  } catch {
    return { isGrounded: true, hallucinations: [], suggestions: [] };
  }
}

/** 10 — Citation Grounding: verify and link every claim to a source */
async function groundCitations(
  answer: string,
  docs: RetrievedDoc[],
  reflection: { hallucinations: string[]; suggestions: string[] },
): Promise<string> {
  if (reflection.hallucinations.length === 0 && reflection.suggestions.length === 0) {
    return answer;
  }

  const model = getLLM();

  const sourceIndex = docs
    .map((d, i) => `[Source ${i + 1}] ${d.title}${d.url ? ` — ${d.url}` : ''}`)
    .join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal citation grounder. Fix the provided answer by:',
      '1. Removing or correcting any hallucinated claims (claims not grounded in any source)',
      '2. Adding missing [Source N] citations — every legal claim MUST cite a source',
      '3. Preserving all accurate, well-cited content unchanged',
      '4. Do NOT write URLs in the text — use only [Source N] markers (URLs are hyperlinked automatically)',
      'Return the corrected answer in markdown. Preserve the heading structure.',
    ].join('\n'),
    prompt: [
      `Original answer:\n${answer}`,
      `\nHallucinations found:\n${reflection.hallucinations.join('\n') || 'None'}`,
      `\nSuggestions:\n${reflection.suggestions.join('\n') || 'None'}`,
      `\nAvailable sources:\n${sourceIndex}`,
    ].join('\n'),
  });

  return text;
}

type CriticResult = { needsRevision: boolean; errorCodes: string[]; feedback: string[] };

/**
 * 11a — Critic A (The Commercial Pragmatist):
 * Exclusively checks for over-engineering, kitchen-sink inclusiveness, and
 * market-standard deviations. Knows nothing about regulatory compliance.
 */
async function pragmatistCritic(
  query: string,
  answer: string,
): Promise<CriticResult> {
  const model = getLLM();

  const { text } = await generateText({
    model,
    system: [
      'You are a commercially-minded senior partner reviewing a junior associate\'s draft memo.',
      'Your ONLY job: catch over-engineering and commercial naivety. Ignore all other issues.',
      'Flag these specific failure modes — ONLY these:',
      '  PRAGMATISM_FAILURE: Recommending enterprise-grade protections (full indemnity stack, dual-trigger acceleration, etc.) in a context where market standard is a simple, lightweight approach.',
      '  KITCHEN_SINK: Including clauses or protections that are academically valid but commercially unusual for this scenario — essentially drafting a Fortune 500 agreement for a startup.',
      '  STAGE_MISMATCH: Advice calibrated for a different company stage than the query implies (e.g., Series C-level structuring advice for a pre-seed founder).',
      '  COMPLEXITY_OVERKILL: Recommending a multi-step, multi-agent process where a single paragraph clause would suffice.',
      '  ADMIN_NIGHTMARE: Advice requires unsustainable administrative overhead for the company\'s size (quarterly compliance audits for a 3-person startup, formal WISP without a security team, annual board evaluations for a pre-revenue company).',
      '  MARKET_DISCONNECT: Advice contradicts widely-known market norms without acknowledging deviation (recommending 2x participating preferred as "standard" when 1x non-participating is seed market norm, suggesting 6-year vesting when 4-year is universal).',
      '',
      'DO NOT flag: citation issues, regulatory accuracy, formatting, or legal correctness. Those are handled elsewhere.',
      'Only flag what a venture-backed startup founder or commercial GC would consider tone-deaf or impractical.',
      '',
      'Respond ONLY with JSON (no markdown fences):',
      '{ "needsRevision": boolean, "errorCodes": ["PRAGMATISM_FAILURE"|"KITCHEN_SINK"|"STAGE_MISMATCH"|"COMPLEXITY_OVERKILL"|"ADMIN_NIGHTMARE"|"MARKET_DISCONNECT"], "feedback": ["specific section + fix"] }',
      'Set needsRevision=true only when the advice would cause a reasonable founder to distrust it as out-of-touch.',
    ].join('\n'),
    prompt: `Client Query: "${query}"\n\nDraft:\n${answer.slice(0, 3500)}`,
  });

  try {
    const p = JSON.parse(text);
    return {
      needsRevision: Boolean(p.needsRevision),
      errorCodes: Array.isArray(p.errorCodes) ? p.errorCodes : [],
      feedback: Array.isArray(p.feedback) ? p.feedback : [],
    };
  } catch {
    return { needsRevision: false, errorCodes: [], feedback: [] };
  }
}

/**
 * 11b — Critic B (The Compliance Officer):
 * Exclusively checks regulatory attribution accuracy and liability constraints.
 * Knows nothing about commercial pragmatism.
 */
async function complianceCritic(
  query: string,
  answer: string,
  docs: RetrievedDoc[],
): Promise<CriticResult> {
  const model = getLLM();

  const tier1Sources = docs
    .filter((d) => d.authority_tier === 1)
    .map((d, i) => `[Source ${i + 1}] ${d.title}`)
    .join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a regulatory compliance officer reviewing a legal memo strictly for accuracy.',
      'Your ONLY job: catch regulatory attribution errors and compliance inaccuracies. Ignore commercial advice and formatting.',
      'Flag these specific failure modes — ONLY these:',
      '  AGENCY_ATTRIBUTION_ERROR: A regulatory enforcement power or obligation is attributed to the wrong agency (e.g., claiming the FTC enforces HIPAA, or that the SEC regulates employment contracts).',
      '  SOURCE_CONFLATION: A commercial negotiation norm is presented as if it were a regulatory compliance requirement (e.g., "indemnification is required by GDPR").',
      '  COMPLIANCE_SCOPE_ERROR: A regulation\'s scope is overstated or understated (e.g., claiming CCPA applies to B2B companies with no California consumers).',
      '  REGULATORY_UPGRADE: A Tier 2 or Tier 3 source is being used to assert a binding legal requirement that should only come from a Tier 1 source.',
      '  REGULATORY_COMMERCIAL_BLEND: The draft mixes regulatory requirements with commercial contract mechanics in a way that implies commercial terms are legally required (e.g., "GDPR requires a limitation of liability clause", "HIPAA mandates indemnification provisions").',
      '',
      'DO NOT flag: commercial advice quality, over-engineering, formatting, or citation style.',
      '',
      'Respond ONLY with JSON (no markdown fences):',
      '{ "needsRevision": boolean, "errorCodes": ["AGENCY_ATTRIBUTION_ERROR"|"SOURCE_CONFLATION"|"COMPLIANCE_SCOPE_ERROR"|"REGULATORY_UPGRADE"|"REGULATORY_COMMERCIAL_BLEND"], "feedback": ["specific claim + correction"] }',
      'Set needsRevision=true only for errors that would expose the client to real legal or compliance risk.',
    ].join('\n'),
    prompt: [
      `Client Query: "${query}"`,
      `\nTier 1 (Binding) Sources:\n${tier1Sources || 'None'}`,
      `\nDraft:\n${answer.slice(0, 3500)}`,
    ].join('\n'),
  });

  try {
    const p = JSON.parse(text);
    return {
      needsRevision: Boolean(p.needsRevision),
      errorCodes: Array.isArray(p.errorCodes) ? p.errorCodes : [],
      feedback: Array.isArray(p.feedback) ? p.feedback : [],
    };
  } catch {
    return { needsRevision: false, errorCodes: [], feedback: [] };
  }
}

/**
 * 11c — Critic C (The Structural Auditor):
 * Exclusively audits tables, lists, footnotes, and comparison matrices for
 * hallucinated content. Only runs when the answer contains structured elements.
 */
async function structuralCritic(
  query: string,
  answer: string,
  docs: RetrievedDoc[],
): Promise<CriticResult> {
  // Pre-check: only run if answer contains tables, lists, or footnotes
  const hasTable = /\|.*---/.test(answer);
  const hasList = /^[\s]*[-*]\s|^\s*\d+\.\s/m.test(answer);
  const hasFootnote = /\[\^?\d+\]/.test(answer);

  if (!hasTable && !hasList && !hasFootnote) {
    return { needsRevision: false, errorCodes: [], feedback: [] };
  }

  const model = getLLM();

  const sourceList = docs
    .map((d, i) => `[Source ${i + 1}] ${d.title}: ${d.text.slice(0, 200)}`)
    .join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a structural content auditor. You ONLY review tables, footnotes, numbered lists, and comparison matrices.',
      'Your ONLY job: catch hallucinated or fabricated structured content. Ignore prose, formatting, and commercial advice.',
      'Flag these specific failure modes — ONLY these:',
      '  TABLE_HALLUCINATION: A table cell contains a fact, number, date, or comparison that is not supported by any source document.',
      '  LIST_FABRICATION: A bulleted or numbered list item presents a requirement, step, or fact not found in any source document.',
      '  FOOTNOTE_PHANTOM: A footnote reference [^N] or [N] points to content that does not exist in the sources.',
      '  COLUMN_MISALIGNMENT: A comparison table attributes a feature or property to the wrong column/entity (e.g., attributing an LLC feature to a C-Corp column).',
      '',
      'DO NOT flag: prose content, citation style, commercial advice, or regulatory accuracy outside of structured elements.',
      'ONLY audit structured elements (tables, lists, footnotes).',
      '',
      'Respond ONLY with JSON (no markdown fences):',
      '{ "needsRevision": boolean, "errorCodes": ["TABLE_HALLUCINATION"|"LIST_FABRICATION"|"FOOTNOTE_PHANTOM"|"COLUMN_MISALIGNMENT"], "feedback": ["specific element + correction"] }',
      'Set needsRevision=true only when a structured element contains verifiably wrong information.',
    ].join('\n'),
    prompt: [
      `Client Query: "${query}"`,
      `\nSource Documents:\n${sourceList}`,
      `\nDraft:\n${answer.slice(0, 4000)}`,
    ].join('\n'),
  });

  try {
    const p = JSON.parse(text);
    return {
      needsRevision: Boolean(p.needsRevision),
      errorCodes: Array.isArray(p.errorCodes) ? p.errorCodes : [],
      feedback: Array.isArray(p.feedback) ? p.feedback : [],
    };
  } catch {
    return { needsRevision: false, errorCodes: [], feedback: [] };
  }
}

/**
 * 12 — Triple Revision: incorporates feedback from all three critics in one targeted rewrite.
 * Only triggered when at least one critic flags a critical issue.
 */
async function applyTripleRevision(
  query: string,
  answer: string,
  pragmatistResult: CriticResult,
  complianceResult: CriticResult,
  structuralResult: CriticResult,
  docs: RetrievedDoc[],
): Promise<string> {
  const model = getLLM();

  const sourceIndex = docs
    .map((d, i) => {
      const tier = d.authority_tier === 1 ? 'PRIMARY LAW' : d.authority_tier === 2 ? 'SECONDARY' : 'TERTIARY';
      return `[Source ${i + 1}] [Tier ${d.authority_tier} — ${tier}] ${d.title}`;
    })
    .join('\n');

  const allFeedback = [
    ...pragmatistResult.feedback.map((f) => `[COMMERCIAL] ${f}`),
    ...complianceResult.feedback.map((f) => `[COMPLIANCE] ${f}`),
    ...structuralResult.feedback.map((f) => `[STRUCTURAL] ${f}`),
  ];

  const { text } = await generateText({
    model,
    system: [
      'You are a senior attorney making targeted revisions to a draft memo.',
      'You have received three types of peer review: commercial pragmatism, compliance accuracy, and structural content issues.',
      'Rules — strictly enforce:',
      '  [COMMERCIAL] feedback: Remove or simplify over-engineered clauses; calibrate advice to the user\'s actual company stage; cut "kitchen sink" inclusions.',
      '  [COMPLIANCE] feedback: Correct wrong agency attributions; remove claims that conflate commercial norms with regulatory requirements; fix compliance scope errors.',
      '  [STRUCTURAL] feedback: Correct any hallucinated table cells, fabricated list items, or phantom footnote references. Fix column misalignments in comparison tables.',
      '  Preserve ALL accurate, well-cited content that was not flagged.',
      '  Do NOT introduce new claims not in the source documents.',
      '  Preserve all valid [Source N] citation markers.',
      '  Preserve APA format: Summary → sections → Disclaimer.',
    ].join('\n'),
    prompt: [
      `Query: "${query}"`,
      `\nRevision Instructions:\n${allFeedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
      `\nSources:\n${sourceIndex}`,
      `\nOriginal Draft:\n${answer}`,
    ].join('\n'),
  });

  return text;
}

/** Generate a concise, professional document title from the user's query */
async function deriveDocumentTitle(query: string): Promise<string> {
  const model = getLLM();
  const { text } = await generateText({
    model,
    system: 'Generate a concise professional document title (4-8 words) for a legal memo answering the given query. Return ONLY the title text — no quotes, no punctuation at the end, no explanation.',
    prompt: query,
  });
  return text.trim().replace(/^["'`]|["'`]$/g, '') || query.slice(0, 60);
}

// ---------------------------------------------------------------------------
// Main Tool
// ---------------------------------------------------------------------------

export const legalSearch = ({
  dataStream,
  session,
}: {
  dataStream: DataStreamWriter;
  session?: Session;
}) =>
  tool({
    description:
      'Search the legal knowledge base for statutes, regulations, case law, and compliance guidance relevant to the user query. Uses a full RAG pipeline with query routing, corrective retrieval, reranking, and self-reflective generation.',
    parameters: z.object({
      query: z
        .string()
        .describe('The legal question or topic to search for'),
      industry: z
        .string()
        .optional()
        .describe(
          'Industry filter: healthcare, ecommerce, saas, edtech, real_estate, travel, esports',
        ),
      recentOnly: z
        .boolean()
        .optional()
        .describe(
          'If true, deprioritise documents older than 3 years to ensure temporal relevance (e.g. for rapidly-changing regulations)',
        ),
    }),
    execute: async ({ query, industry, recentOnly }) => {
      const ds = dataStream;
      const s = (phase: string, step: string) => status(ds, `${phase}::${step}`);

      // ── Phase 1: Query Analysis ──────────────────────────────────────
      s('Query Analysis', 'Analyzing query intent');

      let chromaAvailable = false;
      let docCount = 0;
      try {
        const collection = await getOrCreateCollection(LEGAL_COLLECTION);
        docCount = await collection.count();
        chromaAvailable = true;
      } catch (error) {
        console.error('ChromaDB connection error:', error);
      }

      s('Query Analysis', 'Routing to optimal sources');
      const route = await routeQuery(query, industry, chromaAvailable, docCount);

      s('Query Analysis', 'Expanding queries for recall');
      const expandedQueries = await expandQuery(query, industry);
      s('Query Analysis', `${expandedQueries.length} search queries generated`);

      // ── Phase 2: Retrieval ───────────────────────────────────────────
      let kbDocs: RetrievedDoc[] = [];

      if (route.useKnowledgeBase) {
        s('Retrieval', `Embedding ${expandedQueries.length} queries`);
        s('Retrieval', `Searching ${docCount.toLocaleString()} documents`);
        try {
          kbDocs = await retrieveFromKB(expandedQueries, industry, ds);
          s('Retrieval', `${kbDocs.length} unique documents retrieved`);
        } catch (error) {
          console.error('KB retrieval error:', error);
          s('Retrieval', 'Knowledge base unavailable');
        }
      } else {
        s('Retrieval', chromaAvailable ? 'Knowledge base empty' : 'Knowledge base unavailable');
      }

      // ── Phase 2b: Temporal Filtering ─────────────────────────────────
      // Always filter out documents older than 5 years (hard cutoff = stale law).
      // If recentOnly=true, apply a tighter 3-year cutoff.
      // Tier 1 (primary law) docs without a date are always kept.
      const hardCutoffYear = new Date().getFullYear() - 5;
      const softCutoffYear = new Date().getFullYear() - 3;
      const cutoffYear = recentOnly ? softCutoffYear : hardCutoffYear;

      const beforeFilter = kbDocs.length;
      kbDocs = temporalFilter(kbDocs, cutoffYear);
      const filteredByDate = beforeFilter - kbDocs.length;
      if (filteredByDate > 0) {
        s('Retrieval', `Temporal filter: ${filteredByDate} outdated document(s) excluded (cutoff: ${cutoffYear})`);
      }

      // ── Phase 3: Evaluation (CRAG + Web) ─────────────────────────────
      s('Evaluation', 'Grading document relevance (CRAG)');
      const crag = await correctiveRAG(query, kbDocs);
      const keptCount = crag.relevantDocs.length;
      const droppedCount = kbDocs.length - keptCount;

      if (kbDocs.length > 0) {
        s('Evaluation', `${keptCount} relevant, ${droppedCount} filtered`);
      }

      const needsWeb = route.useWebResearch || crag.needsWebSearch;
      let webDocs: RetrievedDoc[] = [];

      if (needsWeb) {
        s('Evaluation', 'Researching supplementary sources online');
        try {
          webDocs = await webResearch(query, industry);
          s('Evaluation', `${webDocs.length} online sources found`);
        } catch (error) {
          console.error('Web research error:', error);
          s('Evaluation', 'Online research unavailable');
        }
      }

      const allDocs = [...crag.relevantDocs, ...webDocs];

      if (allDocs.length === 0) {
        status(ds, '');
        return {
          result: [
            `No sources could be retrieved for "${query}".`,
            'Please answer using your general legal knowledge and clearly note that no verified sources were found.',
          ].join(' '),
        };
      }

      // ── Phase 4: Refinement (authority-weighted hybrid reranking) ─────
      const tier1Count = allDocs.filter((d) => d.authority_tier === 1).length;
      const tier2Count = allDocs.filter((d) => d.authority_tier === 2).length;
      const tier3Count = allDocs.filter((d) => d.authority_tier === 3).length;
      s('Refinement', `Authority tiers: ${tier1Count} primary, ${tier2Count} secondary, ${tier3Count} tertiary`);

      s('Refinement', `Reranking ${allDocs.length} documents (hybrid authority + semantic)`);
      const reranked = await rerankDocuments(query, allDocs);
      const topDocs = reranked.slice(0, 8);
      s('Refinement', `Top ${topDocs.length} selected`);

      s('Refinement', 'Compressing context');
      const compressed = await compressContext(query, topDocs);

      // ── Phase 4.5: Bouncer Agent (stage-aware context pruning) ────────
      s('Refinement', 'Bouncer agent filtering (stage alignment)');
      const pruned = await bouncerAgent(query, compressed);
      const prunedCount = compressed.length - pruned.length;
      if (prunedCount > 0) {
        s('Refinement', `Bouncer removed ${prunedCount} off-stage chunk(s)`);
      }

      // ── Phase 5: Analysis ────────────────────────────────────────────
      s('Analysis', 'Generating legal analysis (Self-RAG + tiered context)');
      const initialAnswer = await selfRAGGenerate(query, pruned);

      // Programmatic citation validation: extract structured citations and strip invalid ones
      const { cleanedText: citationValidated, invalidCount } =
        extractAndValidateCitations(initialAnswer, pruned as CitableSource[]);
      if (invalidCount > 0) {
        s('Analysis', `Stripped ${invalidCount} invalid citation(s)`);
      }

      s('Analysis', 'Verifying groundedness');
      const reflection = await selfRAGReflect(query, citationValidated, pruned);

      if (!reflection.isGrounded) {
        s('Analysis', 'Correcting ungrounded claims');
      }

      s('Analysis', 'Grounding citations');
      const groundedAnswer = await groundCitations(citationValidated, pruned, reflection);

      // ── Phase 6: Triple Critic Review ─────────────────────────────────
      s('Review', 'Critic A — Commercial Pragmatist');
      s('Review', 'Critic B — Compliance Officer');
      s('Review', 'Critic C — Structural Auditor');
      const [pragResult, compResult, structResult] = await Promise.all([
        pragmatistCritic(query, groundedAnswer),
        complianceCritic(query, groundedAnswer, pruned),
        structuralCritic(query, groundedAnswer, pruned),
      ]);

      const pragCodes = pragResult.errorCodes.join(', ') || 'none';
      const compCodes = compResult.errorCodes.join(', ') || 'none';
      const structCodes = structResult.errorCodes.join(', ') || 'none';
      s('Review', `Pragmatist: ${pragResult.needsRevision ? `⚠ ${pragCodes}` : 'Passed ✓'}`);
      s('Review', `Compliance: ${compResult.needsRevision ? `⚠ ${compCodes}` : 'Passed ✓'}`);
      s('Review', `Structural: ${structResult.needsRevision ? `⚠ ${structCodes}` : 'Passed ✓'}`);

      let finalAnswer = groundedAnswer;
      if (pragResult.needsRevision || compResult.needsRevision || structResult.needsRevision) {
        const totalIssues = pragResult.feedback.length + compResult.feedback.length + structResult.feedback.length;
        s('Review', `Revising: ${totalIssues} issue(s) flagged across three critics`);
        finalAnswer = await applyTripleRevision(query, groundedAnswer, pragResult, compResult, structResult, pruned);
      }

      // Post-process step A: convert [Source N] markers to APA-style citations
      s('Analysis', 'Linking citations to sources');
      const apaLinkedAnswer = postProcessToAPA(finalAnswer, pruned as CitableSource[]);

      // Post-process step B: auto-link any remaining unlinked legal concepts
      const linkedAnswer = injectLegalConceptLinks(apaLinkedAnswer);

      s('Analysis', 'Compiling final output');

      const docId = generateUUID();
      const docTitle = await deriveDocumentTitle(query);

      const output = [
        `# ${docTitle}`,
        '',
        linkedAnswer,
      ].join('\n');

      // ── Create the document directly — bypasses the model needing to call
      // createDocument as a second tool call (which Mistral/DeepSeek often
      // output as text instead of an actual function invocation).
      s('Analysis', 'Creating document');

      // Write the same dataStream events that createDocument tool sends
      ds.writeData({ type: 'kind', content: 'text' });
      ds.writeData({ type: 'id', content: docId });
      ds.writeData({ type: 'title', content: docTitle });
      ds.writeData({ type: 'clear', content: '' });
      ds.writeData({ type: 'text-delta', content: output });
      ds.writeData({ type: 'finish', content: '' });

      // Persist to database
      const userId = session?.user?.id;
      if (userId) {
        try {
          await saveDocument({
            id: docId,
            title: docTitle,
            content: output,
            kind: 'text',
            userId,
          });
        } catch (err) {
          console.error('[legalSearch] Failed to save document:', err);
        }
      }

      status(ds, '');

      return {
        result: `Document titled "${docTitle}" has been created and is now visible to the user on the right side of the screen. Do NOT call createDocument. Respond with ONLY this one sentence: "The full legal analysis is in the document above."`,
      };
    },
  });
