import 'dotenv/config';
import { getOrCreateCollection, LEGAL_COLLECTION } from '../lib/rag/chroma';
import { embedTexts } from '../lib/rag/embeddings';
import { chunkLegalText } from '../lib/rag/chunker';

// CFR titles mapped to industry verticals
const CFR_MAPPINGS: {
  title: number;
  industry: string;
  description: string;
  searchTerms: string[];
}[] = [
  // Healthcare
  {
    title: 21,
    industry: 'healthcare',
    description: 'FDA - Food and Drugs',
    searchTerms: ['drug regulation', 'medical device', 'FDA approval'],
  },
  {
    title: 42,
    industry: 'healthcare',
    description: 'Public Health',
    searchTerms: ['public health', 'Medicare', 'Medicaid'],
  },
  {
    title: 45,
    industry: 'healthcare',
    description: 'HIPAA Privacy and Security',
    searchTerms: ['HIPAA', 'health information privacy', 'protected health information'],
  },
  // E-commerce
  {
    title: 16,
    industry: 'ecommerce',
    description: 'FTC - Commercial Practices',
    searchTerms: ['consumer protection', 'advertising regulation', 'FTC Act'],
  },
  {
    title: 15,
    industry: 'ecommerce',
    description: 'Commerce and Foreign Trade',
    searchTerms: ['electronic commerce', 'online consumer', 'digital trade'],
  },
  // SaaS
  {
    title: 47,
    industry: 'saas',
    description: 'Telecommunication (FCC)',
    searchTerms: ['data protection', 'telecommunications privacy', 'cybersecurity'],
  },
  // EdTech
  {
    title: 34,
    industry: 'edtech',
    description: 'Education',
    searchTerms: ['FERPA', 'student privacy', 'education records'],
  },
  // Real Estate
  {
    title: 12,
    industry: 'real_estate',
    description: 'Banks and Banking',
    searchTerms: ['RESPA', 'mortgage disclosure', 'real estate settlement'],
  },
  {
    title: 24,
    industry: 'real_estate',
    description: 'Housing and Urban Development',
    searchTerms: ['fair housing', 'HUD regulation', 'housing discrimination'],
  },
  // Travel
  {
    title: 14,
    industry: 'travel',
    description: 'Aeronautics and Space (DOT)',
    searchTerms: ['airline consumer protection', 'aviation regulation', 'passenger rights'],
  },
  {
    title: 46,
    industry: 'travel',
    description: 'Shipping',
    searchTerms: ['cruise regulation', 'maritime passenger', 'shipping consumer'],
  },
  // Esports
  {
    title: 31,
    industry: 'esports',
    description: 'Money and Finance (FinCEN)',
    searchTerms: ['gaming compliance', 'anti-money laundering', 'financial crimes'],
  },
  // General
  {
    title: 28,
    industry: 'general',
    description: 'Judicial Administration',
    searchTerms: ['judicial procedure', 'court rules', 'legal process'],
  },
  {
    title: 29,
    industry: 'general',
    description: 'Labor',
    searchTerms: ['employment law', 'labor standards', 'workplace regulation'],
  },
];

const ECFR_SEARCH_API = 'https://www.ecfr.gov/api/search/v1/results';
const BATCH_SIZE = 50;
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ECFRSearchResult {
  results: {
    starts_on: string;
    ends_on: string | null;
    type: string;
    hierarchy: {
      title: string;
      subtitle?: string;
      chapter?: string;
      subchapter?: string;
      part?: string;
      subpart?: string;
      section?: string;
    };
    hierarchy_headings: {
      title?: string;
      subtitle?: string;
      chapter?: string;
      subchapter?: string;
      part?: string;
      subpart?: string;
      section?: string;
    };
    headings: {
      title?: string;
      subtitle?: string;
      chapter?: string;
      subchapter?: string;
      part?: string;
      subpart?: string;
      section?: string;
    };
    full_text_excerpt: string;
    score: number;
    structure_index: string;
  }[];
  meta: {
    total_count: number;
    description?: string;
  };
}

async function fetchECFRResults(
  query: string,
  cfrTitle: number,
  page = 1,
): Promise<ECFRSearchResult> {
  // eCFR API doesn't support cfr_title filter param — include title in query
  const fullQuery = `"title ${cfrTitle}" ${query}`;
  const params = new URLSearchParams({
    query: fullQuery,
    per_page: '20',
    page: String(page),
  });

  const url = `${ECFR_SEARCH_API}?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`eCFR API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<ECFRSearchResult>;
}

async function ingestECFR() {
  console.log('=== eCFR Ingestion Starting ===\n');
  const collection = await getOrCreateCollection(LEGAL_COLLECTION);

  let totalChunks = 0;

  for (const mapping of CFR_MAPPINGS) {
    console.log(
      `\nProcessing CFR Title ${mapping.title}: ${mapping.description} (${mapping.industry})`,
    );

    for (const searchTerm of mapping.searchTerms) {
      let page = 1;
      let fetched = 0;

      while (page <= 5) {
        // Max 5 pages per search term
        try {
          const data = await fetchECFRResults(searchTerm, mapping.title, page);

          if (!data.results || data.results.length === 0) break;

          const ids: string[] = [];
          const embeddings: number[][] = [];
          const metadatas: Record<string, string>[] = [];
          const documents: string[] = [];

          for (const result of data.results) {
            // Skip obsolete regulations (ends_on is set and in the past)
            if (result.ends_on) {
              const endsDate = new Date(result.ends_on);
              if (endsDate < new Date()) continue;
            }

            const sectionTitle = [
              result.headings?.title,
              result.headings?.part,
              result.headings?.section,
            ]
              .filter(Boolean)
              .join(' - ');

            const text = result.full_text_excerpt
              .replace(/<[^>]*>/g, '') // Strip HTML tags
              .replace(/&[a-z]+;/g, ' ') // Strip HTML entities
              .trim();

            if (!text || text.length < 100) continue;

            const baseMetadata: Record<string, string> = {
              source: 'ecfr',
              title: sectionTitle || `CFR Title ${mapping.title}`,
              jurisdiction: 'US-Federal',
              industry: mapping.industry,
              document_type: 'regulation',
              cfr_title: String(mapping.title),
              date: result.starts_on || new Date().toISOString().split('T')[0],
              url: `https://www.ecfr.gov/current/title-${mapping.title}`,
              authority_tier: '1',
              market_standard_from: result.starts_on || '',
              deprecated_on: result.ends_on || '',
            };

            const chunks = chunkLegalText(text, baseMetadata);

            for (const chunk of chunks) {
              const id = `ecfr-t${mapping.title}-${searchTerm.replace(/\s+/g, '_')}-p${page}-${ids.length}`;
              ids.push(id);
              metadatas.push(chunk.metadata);
              documents.push(chunk.text);
            }
          }

          if (ids.length > 0) {
            // Embed in batches
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
              const batchIds = ids.slice(i, i + BATCH_SIZE);
              const batchDocs = documents.slice(i, i + BATCH_SIZE);
              const batchMeta = metadatas.slice(i, i + BATCH_SIZE);
              const batchEmbeddings = await embedTexts(batchDocs);

              await collection.upsert({
                ids: batchIds,
                embeddings: batchEmbeddings,
                metadatas: batchMeta,
                documents: batchDocs,
              });
            }

            totalChunks += ids.length;
            console.log(
              `  [${searchTerm}] Page ${page}: Indexed ${ids.length} chunks`,
            );
          }

          fetched += data.results.length;
          if (fetched >= data.meta.total_count) break;

          page++;
          await sleep(DELAY_MS);
        } catch (error) {
          console.error(
            `  Error fetching ${searchTerm} page ${page}:`,
            error instanceof Error ? error.message : error,
          );
          break;
        }
      }
    }
  }

  console.log(`\n=== eCFR Ingestion Complete: ${totalChunks} total chunks ===`);
  return totalChunks;
}

export { ingestECFR };

// Run directly if this is the entry script
const isDirectRun =
  process.argv[1]?.endsWith('ingest-ecfr.ts') ||
  process.argv[1]?.endsWith('ingest-ecfr.js');

if (isDirectRun) {
  ingestECFR()
    .then((count) => {
      console.log(`\nDone. Total chunks indexed: ${count}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
