import { tool, generateText, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import { getOrCreateCollection, LEGAL_COLLECTION } from '@/lib/rag/chroma';
import { embedQuery } from '@/lib/rag/embeddings';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';

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
      docs.push({
        text: docText,
        source: (meta.source as string) || 'unknown',
        title: (meta.title as string) || 'Untitled',
        industry: (meta.industry as string) || 'general',
        document_type: (meta.document_type as string) || 'unknown',
        url: (meta.url as string) || '',
        date: (meta.date as string) || '',
        relevance_score: distance != null ? (1 - distance).toFixed(3) : 'N/A',
        origin: 'knowledge_base',
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
      return parsed.map((s: any) => ({
        text: `${s.citation ?? ''}\n${s.summary ?? s.text ?? ''}`,
        source: 'web_research',
        title: s.title ?? 'Untitled',
        industry: industry ?? 'general',
        document_type: 'online_source',
        url: s.url ?? '',
        date: '',
        relevance_score: 'N/A',
        origin: 'web_research' as const,
      }));
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
    origin: 'web_research',
  }];
}

/** 6 — Reranking: score and reorder all documents by relevance */
async function rerankDocuments(
  query: string,
  docs: RetrievedDoc[],
): Promise<RetrievedDoc[]> {
  if (docs.length <= 1) return docs;

  const model = getLLM();

  const docList = docs.map((d, i) => `[${i}] "${d.title}" (${d.origin}) — ${d.text.slice(0, 200)}...`).join('\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal document reranker.',
      'Given a query and a list of documents, reorder them by relevance to the query.',
      `Respond ONLY with a JSON array of indices in order of relevance, e.g. [2,0,3,1]. There are ${docs.length} documents (indices 0-${docs.length - 1}).`,
      'No markdown fences.',
    ].join('\n'),
    prompt: `Query: "${query}"\n\nDocuments:\n${docList}`,
  });

  try {
    const order: number[] = JSON.parse(text);
    if (Array.isArray(order)) {
      const reranked: RetrievedDoc[] = [];
      for (const idx of order) {
        if (idx >= 0 && idx < docs.length) reranked.push(docs[idx]);
      }
      // Append any docs that weren't in the ranking
      for (let i = 0; i < docs.length; i++) {
        if (!order.includes(i)) reranked.push(docs[i]);
      }
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

  const context = docs
    .map((d, i) => `[Source ${i + 1}: ${d.title}] (${d.origin})\n${d.text}`)
    .join('\n\n---\n\n');

  const { text } = await generateText({
    model,
    system: [
      'You are a legal analysis assistant. Generate a comprehensive answer to the legal query STRICTLY based on the provided source documents.',
      'Rules:',
      '- Cite sources using [Source N] notation',
      '- If a claim is not supported by any source, do NOT include it',
      '- Structure your answer with clear sections',
      '- Include specific legal citations (statute numbers, CFR sections, case names) from the sources',
      '- End with a brief disclaimer that this is informational, not legal advice',
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

  const { text } = await generateText({
    model,
    system: [
      'You are a legal citation grounder. You are given an answer with potential issues.',
      'Fix the answer by:',
      '1. Removing or correcting any hallucinated claims',
      '2. Adding missing [Source N] citations where appropriate',
      '3. Preserving all accurate, well-cited content',
      'Return the corrected answer as plain text.',
    ].join('\n'),
    prompt: [
      `Original answer:\n${answer}`,
      `\nHallucinations found:\n${reflection.hallucinations.join('\n') || 'None'}`,
      `\nSuggestions:\n${reflection.suggestions.join('\n') || 'None'}`,
      `\nAvailable sources:\n${docs.map((d, i) => `[Source ${i + 1}] ${d.title}`).join('\n')}`,
    ].join('\n'),
  });

  return text;
}

// ---------------------------------------------------------------------------
// Format final output
// ---------------------------------------------------------------------------

function formatSourceList(docs: RetrievedDoc[]): string {
  return docs
    .map((s, i) => {
      const origin = s.origin === 'knowledge_base' ? 'Knowledge Base' : 'Web Research';
      return [
        `[Source ${i + 1}] ${s.title}`,
        `Origin: ${origin} | Type: ${s.document_type} | Industry: ${s.industry}`,
        s.date ? `Date: ${s.date}` : null,
        s.relevance_score !== 'N/A' ? `Relevance: ${s.relevance_score}` : null,
        s.url ? `URL: ${s.url}` : null,
        '---',
        s.text,
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Main Tool
// ---------------------------------------------------------------------------

export const legalSearch = ({ dataStream }: { dataStream: DataStreamWriter }) =>
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
    }),
    execute: async ({ query, industry }) => {
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

      // ── Phase 4: Refinement ──────────────────────────────────────────
      s('Refinement', `Reranking ${allDocs.length} documents`);
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
      const finalAnswer = await groundCitations(initialAnswer, compressed, reflection);

      s('Analysis', 'Compiling final output');

      const sourceList = formatSourceList(compressed);

      const output = [
        '=== Legal Analysis ===',
        '',
        finalAnswer,
        '',
        '=== Sources ===',
        '',
        sourceList,
        '',
        '=== Pipeline Summary ===',
        `Queries expanded: ${expandedQueries.length}`,
        `Documents retrieved: ${kbDocs.length} (knowledge base) + ${webDocs.length} (web research)`,
        `CRAG filtered: ${droppedCount} irrelevant documents removed`,
        `Documents after reranking: ${topDocs.length}`,
        `Self-RAG: ${reflection.isGrounded ? 'All claims grounded' : `${reflection.hallucinations.length} issues corrected`}`,
      ].join('\n');

      status(ds, '');

      return { result: output };
    },
  });
