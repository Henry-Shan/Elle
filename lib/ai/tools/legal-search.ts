import { tool, generateText, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { getOrCreateCollection, LEGAL_COLLECTION } from '@/lib/rag/chroma';
import { embedQuery } from '@/lib/rag/embeddings';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';
import {
  postProcessCitations,
  formatMarkdownSourceList,
  injectLegalConceptLinks,
  type CitableSource,
} from '@/lib/rag/citation-utils';
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
// Authority & Temporal Helpers
// ---------------------------------------------------------------------------

/**
 * Derives an authority tier from document metadata.
 *
 * Tier 1 (Primary): Statutes, regulations, case law, official government guidance.
 *   These are the authoritative sources that define legal mechanics.
 * Tier 2 (Secondary): Law firm advisories, whitepapers, verified industry standards.
 *   Useful for market context and practical interpretation.
 * Tier 3 (Tertiary): News articles, blogs, unclassified web content.
 *   Only used for background colour; never used to establish legal requirements.
 */
function deriveAuthorityTier(doc: Omit<RetrievedDoc, 'authority_tier'>): 1 | 2 | 3 {
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
    src.includes('aba') ||  // American Bar Association
    url.includes('americanbar.org') ||
    url.includes('nolo.com') ||
    url.includes('justia.com')
  ) {
    return 2;
  }

  // Tier 3: Tertiary (news, blogs, unclassified web research)
  return 3;
}

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

/** 3 — Retrieval: search ChromaDB with multiple queries */
async function retrieveFromKB(
  queries: string[],
  industry: string | undefined,
  ds: DataStreamWriter,
): Promise<RetrievedDoc[]> {
  const collection = await getOrCreateCollection(LEGAL_COLLECTION);
  const docs: RetrievedDoc[] = [];
  const seenTexts = new Set<string>();

  for (const q of queries) {
    const queryEmbedding = await embedQuery(q);
    const where = industry ? { industry: { $eq: industry } } : undefined;

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
      where: where as any,
      include: ['documents', 'metadatas', 'distances'],
    });

    if (!results.documents?.[0]) continue;

    for (let i = 0; i < results.documents[0].length; i++) {
      const docText = results.documents[0][i] ?? '';
      if (seenTexts.has(docText)) continue;
      seenTexts.add(docText);

      const meta = results.metadatas?.[0]?.[i] || {};
      const distance = results.distances?.[0]?.[i];
      const partial = {
        text: docText,
        source: (meta.source as string) || 'unknown',
        title: (meta.title as string) || 'Untitled',
        industry: (meta.industry as string) || 'general',
        document_type: (meta.document_type as string) || 'unknown',
        url: (meta.url as string) || '',
        date: (meta.date as string) || '',
        relevance_score: distance != null ? (1 - distance).toFixed(3) : 'N/A',
        origin: 'knowledge_base' as const,
      };
      docs.push({ ...partial, authority_tier: deriveAuthorityTier(partial) });
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

/** 8 — Self-RAG Generation: generate an initial answer grounded in the documents */
async function selfRAGGenerate(
  query: string,
  docs: RetrievedDoc[],
): Promise<string> {
  const model = getLLM();

  // Include authority tier, date, and URL so the model can weight sources correctly
  const context = docs
    .map((d, i) => {
      const urlNote = d.url ? ` | URL: ${d.url}` : '';
      const dateNote = d.date ? ` | Published: ${d.date}` : '';
      const tierLabel = d.authority_tier === 1 ? 'PRIMARY LAW' : d.authority_tier === 2 ? 'SECONDARY' : 'TERTIARY';
      return `[Source ${i + 1}: ${d.title}] [${tierLabel} — Tier ${d.authority_tier}] (${d.origin}${urlNote}${dateNote})\n${d.text}`;
    })
    .join('\n\n---\n\n');

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
      '- Begin with a brief Abstract (2-3 sentences summarising the key legal issues and conclusions)',
      '- Use ## and ### markdown headings; organise by issue (Risk → Fix), not by source',
      '- Include specific identifiers: statute numbers, CFR sections, case names with year, regulation titles',
      '- Every paragraph must have at least one [Source N] citation',
      '- End with a ## References section in APA format:',
      '  Statute example: Defend Trade Secrets Act, 18 U.S.C. § 1836 et seq. (2016).',
      '  Case example: Bd. of Trustees of Leland Stanford Junior Univ. v. Roche Molecular Sys., Inc., 563 U.S. 776 (2011).',
      '  Regulation example: Protection of Human Subjects, 45 C.F.R. § 46 (2018).',
      '  Web source example: Author, A. A. (Year, Month Day). Title. Publisher. URL',
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

/** 11 — Critic Review: a "senior partner" evaluates the draft for commercial realism and over-lawyering */
async function criticReview(
  query: string,
  answer: string,
): Promise<{ needsRevision: boolean; feedback: string[]; severity: string }> {
  const model = getLLM();

  const { text } = await generateText({
    model,
    system: [
      'You are a senior partner at a top-tier law firm reviewing a junior associate\'s draft memo.',
      'Your job is to identify critical problems — not style preferences — before the memo goes to the client.',
      'Check for:',
      '1. HALLUCINATION: Legal claims, agency names, statutes, or cases not grounded in retrieved sources.',
      '2. SOURCE CONFLATION: Mixing regulatory compliance obligations (what regulators require) with commercial terms (what parties negotiate).',
      '3. COMMERCIAL NAIVETY: Technically correct advice that is commercially absurd for the context (e.g., applying Fortune 500 M&A protections to a 2-person startup).',
      '4. OVER-LAWYERING: Recommending unnecessary complexity, redundant protections, or disproportionate risk aversion.',
      '5. REGULATORY ATTRIBUTION ERROR: Attributing regulatory enforcement powers to a wrong agency, or citing an agency for a power it does not have.',
      '6. TEMPORAL STALENESS: Presenting outdated law as current without noting potential changes.',
      '',
      'DO NOT flag stylistic issues, missing citations (handled elsewhere), or formatting preferences.',
      'Only flag issues that would make a sophisticated client distrust the advice or take wrong action.',
      '',
      'Respond ONLY with JSON (no markdown fences):',
      '{ "needsRevision": boolean, "severity": "critical" | "minor" | "none", "feedback": ["specific issue 1", ...] }',
      'Set needsRevision=true and severity="critical" ONLY for issues 1-5 above that would materially mislead the client.',
    ].join('\n'),
    prompt: `Client Query: "${query}"\n\nDraft Memo:\n${answer.slice(0, 4000)}`, // Limit to avoid token overflow
  });

  try {
    const parsed = JSON.parse(text);
    return {
      needsRevision: Boolean(parsed.needsRevision) && parsed.severity === 'critical',
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      severity: parsed.severity ?? 'none',
    };
  } catch {
    return { needsRevision: false, feedback: [], severity: 'none' };
  }
}

/** 12 — Revision: rewrite the answer incorporating the critic's feedback */
async function applyRevision(
  query: string,
  answer: string,
  feedback: string[],
  docs: RetrievedDoc[],
): Promise<string> {
  const model = getLLM();

  const sourceIndex = docs
    .map((d, i) => {
      const tier = d.authority_tier === 1 ? 'PRIMARY LAW' : d.authority_tier === 2 ? 'SECONDARY' : 'TERTIARY';
      return `[Source ${i + 1}] [Tier ${d.authority_tier} — ${tier}] ${d.title}${d.url ? ` — ${d.url}` : ''}`;
    })
    .join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a senior corporate attorney revising a draft memo based on peer review feedback.',
      'Make only the changes necessary to address the identified issues. Preserve all accurate content.',
      'Rules:',
      '- Do NOT introduce new claims not supported by the available sources.',
      '- Do NOT remove accurate, well-cited content.',
      '- If a claim is flagged as hallucination, remove it or add: "Note: [Source] not found in retrieved documents — verify independently."',
      '- If commercial naivety is flagged, add appropriate context about company stage or practical trade-offs.',
      '- Preserve [Source N] citation markers. Do NOT write raw URLs.',
      '- Preserve APA format structure (Abstract, headings, References, Disclaimer).',
    ].join('\n'),
    prompt: [
      `Query: "${query}"`,
      `\nCritic Feedback:\n${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
      `\nAvailable Sources:\n${sourceIndex}`,
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

      // ── Phase 5: Analysis ────────────────────────────────────────────
      s('Analysis', 'Generating legal analysis (Self-RAG)');
      const initialAnswer = await selfRAGGenerate(query, compressed);

      s('Analysis', 'Verifying groundedness');
      const reflection = await selfRAGReflect(query, initialAnswer, compressed);

      if (!reflection.isGrounded) {
        s('Analysis', 'Correcting ungrounded claims');
      }

      s('Analysis', 'Grounding citations');
      const groundedAnswer = await groundCitations(initialAnswer, compressed, reflection);

      // ── Phase 6: Critic Review ───────────────────────────────────────
      s('Review', 'Senior partner review (commercial realism check)');
      const critique = await criticReview(query, groundedAnswer);

      let finalAnswer = groundedAnswer;
      if (critique.needsRevision) {
        s('Review', `Revising: ${critique.feedback.length} critical issue(s) flagged`);
        finalAnswer = await applyRevision(query, groundedAnswer, critique.feedback, compressed);
      } else {
        s('Review', critique.severity === 'none' ? 'Review passed ✓' : `Minor notes (non-blocking)`);
      }

      // Post-process step A: convert [Source N] markers to RAG-sourced hyperlinks
      s('Analysis', 'Linking citations to sources');
      const ragLinkedAnswer = postProcessCitations(finalAnswer, compressed as CitableSource[]);

      // Post-process step B: auto-link any remaining unlinked legal concepts
      const linkedAnswer = injectLegalConceptLinks(ragLinkedAnswer);

      s('Analysis', 'Compiling final output');

      const sourceList = formatMarkdownSourceList(compressed as CitableSource[]);

      const output = [
        '## Legal Analysis',
        '',
        linkedAnswer,
        '',
        '## Sources',
        '',
        sourceList,
        '',
        '## Research Pipeline Summary',
        `- Queries expanded: ${expandedQueries.length}`,
        `- Documents retrieved: ${kbDocs.length + filteredByDate} → ${kbDocs.length} after temporal filter (cutoff: ${cutoffYear})`,
        `- Knowledge base: ${kbDocs.length} docs | Web research: ${webDocs.length} docs`,
        `- Authority tiers: ${tier1Count} primary law, ${tier2Count} secondary, ${tier3Count} tertiary`,
        `- CRAG filtered: ${droppedCount} irrelevant document(s) removed`,
        `- Documents after reranking: ${topDocs.length}`,
        `- Self-RAG: ${reflection.isGrounded ? 'All claims grounded ✓' : `${reflection.hallucinations.length} issue(s) corrected`}`,
        `- Critic review: ${critique.needsRevision ? `Revised (${critique.feedback.length} issue(s))` : critique.severity === 'none' ? 'Passed ✓' : 'Minor notes'}`,
      ].join('\n');

      // ── Create the document directly — bypasses the model needing to call
      // createDocument as a second tool call (which Mistral/DeepSeek often
      // output as text instead of an actual function invocation).
      s('Analysis', 'Creating document');

      const docId = generateUUID();
      const docTitle = await deriveDocumentTitle(query);

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
